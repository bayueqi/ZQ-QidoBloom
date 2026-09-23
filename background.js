// 琪窦初开 · 扩展后台脚本（MV3 service worker）
//
// 职责：把「右键菜单收藏」这个入口接上。
//
// 一个关键限制：service worker 里没有 window / localStorage，
// 所以这里**不能**直接写起始页的 startpage-data。做法是：
//   1. 起始页（index.html）和弹窗（popup.html）都属于 chrome-extension://<id> 同一源，
//      它们共用同一个 localStorage，数据仍以 localStorage['startpage-data'] 为准。
//   2. 起始页 / 弹窗把「分组列表」镜像到 chrome.storage.local['groups-mirror']，
//      后台据此拼出右键菜单的分组子项。
//   3. 右键点击后，后台把要收藏的网站写进 chrome.storage.local['pending-sites'] 队列，
//      起始页 / 弹窗在读取时会把队列合并进 startpage-data 并清空队列。

const ROOTS = [
    { key: 'page', title: '把当前页面添加到「琪窦初开」', contexts: ['page'] },
    { key: 'link', title: '把这个链接添加到「琪窦初开」', contexts: ['link'] }
];

const KEY_GROUPS_MIRROR = 'groups-mirror';
const KEY_PENDING = 'pending-sites';
const INBOX_GROUP_NAME = '待分组';

// ---------- chrome.* 回调式 API 的 Promise 包装（兼容旧版 Chrome） ----------

function storageGet(key, fallback) {
    return new Promise(resolve => {
        try {
            chrome.storage.local.get(key, res => {
                void chrome.runtime.lastError;
                const value = res ? res[key] : undefined;
                resolve(value === undefined ? fallback : value);
            });
        } catch (error) {
            console.error('[琪窦初开] 读取桥接数据失败:', key, error);
            resolve(fallback);
        }
    });
}

function storageSet(obj) {
    return new Promise(resolve => {
        try {
            chrome.storage.local.set(obj, () => {
                void chrome.runtime.lastError;
                resolve();
            });
        } catch (error) {
            console.error('[琪窦初开] 写入桥接数据失败:', error);
            resolve();
        }
    });
}

function removeAllMenus() {
    return new Promise(resolve => {
        try {
            chrome.contextMenus.removeAll(() => {
                void chrome.runtime.lastError;
                resolve();
            });
        } catch (error) {
            console.error('[琪窦初开] 清理右键菜单失败:', error);
            resolve();
        }
    });
}

// ---------- 右键菜单 ----------

async function rebuildMenus() {
    await removeAllMenus();

    const groups = await storageGet(KEY_GROUPS_MIRROR, []);
    const list = Array.isArray(groups) ? groups : [];

    ROOTS.forEach(root => {
        chrome.contextMenus.create({
            id: `qdb-${root.key}`,
            title: root.title,
            contexts: root.contexts
        });

        list.forEach(group => {
            if (!group || !group.id) return;
            chrome.contextMenus.create({
                id: `qdb-${root.key}:group:${group.id}`,
                parentId: `qdb-${root.key}`,
                title: group.name || '未命名分组',
                contexts: root.contexts
            });
        });

        if (list.length) {
            chrome.contextMenus.create({
                id: `qdb-${root.key}:sep`,
                parentId: `qdb-${root.key}`,
                type: 'separator',
                contexts: root.contexts
            });
        }

        // 分组还没建过 / 拿不准放哪儿时的兜底入口
        chrome.contextMenus.create({
            id: `qdb-${root.key}:__inbox__`,
            parentId: `qdb-${root.key}`,
            title: `先收进「${INBOX_GROUP_NAME}」`,
            contexts: root.contexts
        });
    });
}

function hostOf(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
        return url || '';
    }
}

function parseMenuId(menuId) {
    const matched = /^qdb-(page|link)(?::(?:group:(.+)|(__inbox__)))?$/.exec(String(menuId || ''));
    if (!matched) return null;
    return {
        context: matched[1],
        groupId: matched[2] || null,
        inbox: Boolean(matched[3])
    };
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const parsed = parseMenuId(info.menuItemId);
    if (!parsed) return;

    let url = '';
    let name = '';

    if (parsed.context === 'link') {
        url = info.linkUrl || '';
        name = (info.selectionText || '').trim() || hostOf(url);
    } else {
        url = (tab && tab.url) || info.pageUrl || '';
        name = (tab && tab.title) || hostOf(url);
    }

    // 只收藏普通网页；chrome:// 等内部页面浏览器不会注入，这里再兜一层
    if (!/^https?:\/\//i.test(url)) {
        console.warn('[琪窦初开] 该地址不支持收藏:', url);
        return;
    }

    const pending = await storageGet(KEY_PENDING, []);
    const queue = Array.isArray(pending) ? pending : [];
    queue.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        groupId: parsed.inbox ? null : parsed.groupId,
        name: String(name).slice(0, 60),
        url,
        createdAt: Date.now()
    });
    await storageSet({ [KEY_PENDING]: queue });
});

// ---------- 角标：待归类数量 ----------

function updateBadge(list) {
    try {
        const count = Array.isArray(list) ? list.length : 0;
        chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#000000' });
    } catch (error) {
        console.error('[琪窦初开] 更新角标失败:', error);
    }
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    // 起始页 / 弹窗改了分组结构 → 菜单要跟着变
    if (changes[KEY_GROUPS_MIRROR]) {
        rebuildMenus();
    }
    if (changes[KEY_PENDING]) {
        updateBadge(changes[KEY_PENDING].newValue);
    }
});

chrome.runtime.onInstalled.addListener(() => {
    rebuildMenus();
    updateBadge(null);
});

chrome.runtime.onStartup.addListener(() => {
    rebuildMenus();
});

// service worker 冷启动时补一次角标（菜单本身由浏览器持久保存）
storageGet(KEY_PENDING, []).then(updateBadge);

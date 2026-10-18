// 琪窦初开 · 扩展弹窗脚本
//
// 弹窗和起始页同属 chrome-extension://<id> 同一源，共用同一个 localStorage，
// 所以这里直接读写 startpage-data，不需要 background 中转。

const KEY_FAVICON_API = 'startpage-faviconapi';
const DEFAULT_FAVICON_API = 'https://toolb.cn/favicon/{domain}';

const el = {
    subtitle: document.getElementById('pp-subtitle'),
    alert: document.getElementById('pp-alert'),
    card: document.getElementById('pp-card'),
    favicon: document.getElementById('pp-favicon'),
    fallback: document.getElementById('pp-fallback'),
    name: document.getElementById('pp-name'),
    url: document.getElementById('pp-url'),
    group: document.getElementById('pp-group'),
    newGroupBox: document.getElementById('pp-newgroup'),
    newGroupName: document.getElementById('pp-newgroup-name'),
    newGroupSave: document.getElementById('pp-newgroup-save'),
    save: document.getElementById('pp-save'),
    toggleNewGroup: document.getElementById('pp-toggle-newgroup')
};

let currentTab = null;
let data = { groups: [] };

// ---------- 图标地址 ----------

function iconUrlFor(url) {
    let template = DEFAULT_FAVICON_API;
    try {
        const saved = localStorage.getItem(KEY_FAVICON_API);
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings && settings.iconApiUrl) template = settings.iconApiUrl;
        }
    } catch (error) {
        console.error('读取图标 API 设置失败:', error);
    }
    if (template.includes('{domain}')) {
        return template.replace('{domain}', QDB.hostOf(url));
    }
    return template;
}

// ---------- 界面 ----------

function showAlert(message, kind) {
    if (!message) {
        el.alert.hidden = true;
        el.alert.textContent = '';
        return;
    }
    el.alert.textContent = message;
    el.alert.className = 'pp-alert' + (kind ? ` is-${kind}` : '');
    el.alert.hidden = false;
}

function renderGroups(preferGroupId) {
    const groups = data.groups || [];
    el.group.innerHTML = '';

    if (!groups.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '还没有分组，请先新建';
        el.group.appendChild(option);
        el.group.disabled = true;
        el.save.disabled = true;
        return;
    }

    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = `${group.name}（${(group.sites || []).length}）`;
        el.group.appendChild(option);
    });

    if (preferGroupId && groups.some(g => g.id === preferGroupId)) {
        el.group.value = preferGroupId;
    }
    el.group.disabled = false;
    el.save.disabled = false;
}

function renderPage() {
    el.name.value = currentTab.title;
    el.url.textContent = currentTab.url;
    el.subtitle.textContent = currentTab.title;
    el.subtitle.title = currentTab.title;

    const fallbackChar = (currentTab.title || currentTab.url || '?').trim().charAt(0).toUpperCase() || '?';
    el.fallback.textContent = fallbackChar;

    if (!currentTab.supported) {
        el.card.classList.add('is-disabled');
        el.name.disabled = true;
        el.favicon.hidden = true;
        el.fallback.hidden = false;
        el.group.disabled = true;
        el.save.disabled = true;
        showAlert('当前页面不支持收藏。浏览器内部页面（如 chrome:// 、扩展商店）不允许扩展读取，换个普通网页再试。', 'warn');
        return;
    }

    const iconSrc = iconUrlFor(currentTab.url);
    // 图标慢的时候先显示首字母，加载完成再显示图标 —— 和起始页一致，
    // 别在图标还没回来的那几秒留一个空白格。
    el.fallback.hidden = false;
    el.favicon.hidden = true;
    el.favicon.addEventListener('load', () => {
        el.favicon.hidden = false;
        el.fallback.hidden = true;
    });
    el.favicon.addEventListener('error', () => {
        el.favicon.hidden = true;
        el.fallback.hidden = false;
    });
    el.favicon.src = iconSrc;
}

// ---------- 当前标签页 ----------

function getCurrentTab() {
    return new Promise(resolve => {
        if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
            // 扩展环境外（例如直接打开页面预览）时的兜底，保证界面仍可用
            resolve({
                title: '示例页面 · 琪窦初开',
                url: 'https://github.com/BAYUEQI/ZQ-QidoBloom',
                supported: true
            });
            return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const tab = (tabs && tabs[0]) || {};
            const url = tab.url || '';
            resolve({
                title: (tab.title || '').trim() || QDB.hostOf(url) || '未命名页面',
                url,
                supported: /^https?:\/\//i.test(url)
            });
        });
    });
}

// ---------- 交互 ----------

function handleSave() {
    if (!currentTab || !currentTab.supported) {
        showAlert('当前页面不支持收藏。', 'error');
        return;
    }

    const groupId = el.group.value;
    const group = data.groups.find(g => g.id === groupId);
    if (!group) {
        showAlert('请先选择一个分组。', 'error');
        return;
    }

    const name = el.name.value.trim() || QDB.hostOf(currentTab.url) || '未命名网站';
    if (!Array.isArray(group.sites)) group.sites = [];

    const target = QDB.normalizeUrl(currentTab.url);
    if (group.sites.some(site => QDB.normalizeUrl(site.url) === target)) {
        showAlert(`「${group.name}」里已经有这个网站了。`, 'warn');
        return;
    }

    group.sites.push({
        id: `${group.id}-${Date.now()}`,
        name,
        url: currentTab.url
    });

    try {
        QDB.writeData(data);
    } catch (error) {
        console.error('保存失败:', error);
        showAlert('保存失败，可能是本地存储空间已满。', 'error');
        return;
    }

    QDB.syncGroupsMirror(data.groups).then(() => {
        setTimeout(() => window.close(), 260);
    });
    el.save.disabled = true;
    showAlert(`已添加到「${group.name}」`, undefined);
}

function handleCreateGroup() {
    const name = el.newGroupName.value.trim();
    if (!name) {
        showAlert('请填写分组名称。', 'error');
        el.newGroupName.focus();
        return;
    }
    if (data.groups.some(group => group.name === name)) {
        showAlert(`分组「${name}」已存在。`, 'warn');
        return;
    }

    const id = Date.now().toString();
    data.groups.push({ id, name, sites: [] });
    try {
        QDB.writeData(data);
    } catch (error) {
        console.error('新建分组失败:', error);
        showAlert('新建分组失败。', 'error');
        return;
    }

    QDB.syncGroupsMirror(data.groups);
    el.newGroupName.value = '';
    el.newGroupBox.hidden = true;
    el.toggleNewGroup.textContent = '新建分组';
    renderGroups(id);
    showAlert(`分组「${name}」已创建，可以直接保存了。`);
}

function toggleNewGroup() {
    const nextHidden = !el.newGroupBox.hidden;
    el.newGroupBox.hidden = nextHidden;
    el.toggleNewGroup.textContent = nextHidden ? '新建分组' : '收起';
    if (!nextHidden) el.newGroupName.focus();
}

// ---------- 启动 ----------

async function init() {
    // 先结算右键菜单攒下的队列，再取数据：队列写入可能已经改过 localStorage，
    // 反过来先 read 会拿到旧对象，后面 save 会把队列结果覆盖掉。
    const syncedCount = await QDB.drainPendingSites();
    data = QDB.readData();

    currentTab = await getCurrentTab();

    // 顺序要紧：renderGroups 会按「有没有分组」开关保存按钮，
    // 必须在它之后跑 renderPage，由 renderPage 决定「这个页面能不能收藏」，
    // 否则内部页面会被重新启用保存按钮。
    renderGroups();
    renderPage();

    if (syncedCount > 0) {
        showAlert(`已同步 ${syncedCount} 个通过右键菜单收藏的网站。`);
    }
}

el.save.addEventListener('click', handleSave);
el.newGroupSave.addEventListener('click', handleCreateGroup);
el.toggleNewGroup.addEventListener('click', toggleNewGroup);
el.newGroupName.addEventListener('keydown', event => {
    if (event.key === 'Enter') handleCreateGroup();
});
el.name.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !el.save.disabled) handleSave();
});

init();

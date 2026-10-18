// 数据管理类
class PopupDataManager {
    constructor() {
        this.data = {
            groups: []
        };
    }

    // 加载 / 保存统一走 QDB（shared.js），和起始页共用同一份读写，
    // 避免「起始页一套、管理面板一套」改一处忘一处。
    async loadData() {
        this.data = QDB.readData();
    }

    // 保存数据
    async saveData() {
        QDB.writeData(this.data);
    }

    // 获取所有分组
    getGroups() {
        return this.data.groups;
    }

    // 添加分组
    async addGroup(name) {
        const id = Date.now().toString();
        const newGroup = {
            id,
            name,
            sites: []
        };
        this.data.groups.push(newGroup);
        await this.saveData();
        return newGroup;
    }

    // 删除分组
    async deleteGroup(id) {
        this.data.groups = this.data.groups.filter(group => group.id !== id);
        await this.saveData();
    }

    // 添加网站到分组
    async addSite(groupId, siteData) {
        const group = this.data.groups.find(g => g.id === groupId);
        if (group) {
            const id = `${groupId}-${Date.now()}`;
            const newSite = {
                id,
                ...siteData
            };
            // 图标地址统一规范化（补协议），没填就不带这个字段
            const icon = normalizeIconUrl(siteData.icon);
            if (icon) newSite.icon = icon;
            else delete newSite.icon;
            group.sites.push(newSite);
            await this.saveData();
            return newSite;
        }
        return null;
    }

    // 删除网站
    async deleteSite(groupId, siteId) {
        const group = this.data.groups.find(g => g.id === groupId);
        if (group) {
            group.sites = group.sites.filter(site => site.id !== siteId);
            await this.saveData();
        }
    }

    // 更新网站
    async updateSite(groupId, siteId, siteData) {
        const group = this.data.groups.find(g => g.id === groupId);
        if (group) {
            const site = group.sites.find(s => s.id === siteId);
            if (site) {
                // 传了 icon 才动这个字段；传空字符串就是「清掉图标」
                if ('icon' in siteData) {
                    const icon = normalizeIconUrl(siteData.icon);
                    if (icon) site.icon = icon;
                    else delete site.icon;
                }
                // 更新其他字段
                delete siteData.icon; // 避免直接覆盖
                Object.assign(site, siteData);
                await this.saveData();
            }
        }
    }

    // 更新分组
    async updateGroup(groupId, groupData) {
        const group = this.data.groups.find(g => g.id === groupId);
        if (group) {
            Object.assign(group, groupData);
            await this.saveData();
        }
    }
}

// 搜索引擎管理类
class SearchEnginesManager {
    constructor() {
        this.engines = [];
    }

    // 加载数据：直接复用 loadSearchEngines()（已带解析缓存），
    // 这里只做一份浅拷贝，避免后续 push/filter 污染共享的缓存数组。
    async loadData() {
        this.engines = [...(await loadSearchEngines())];
    }

    // 保存数据
    async saveData() {
        try {
            localStorage.setItem('searchEngines', JSON.stringify(this.engines));
        } catch (error) {
            console.error('Save engines error:', error);
        }
    }

    // 获取所有搜索引擎
    getEngines() {
        return this.engines;
    }

    // 添加搜索引擎
    async addEngine(engineData) {
        const newEngine = {
            id: 'custom_' + Date.now(),
            name: engineData.name,
            url: engineData.url
        };
        this.engines.push(newEngine);
        await this.saveData();
        return newEngine;
    }

    // 删除搜索引擎
    async deleteEngine(engineId) {
        this.engines = this.engines.filter(e => e.id !== engineId);
        await this.saveData();
    }

    // 更新搜索引擎
    async updateEngine(engineId, engineData) {
        const engine = this.engines.find(e => e.id === engineId);
        if (engine) {
            engine.name = engineData.name;
            engine.url = engineData.url;
            await this.saveData();
        }
    }
}

// 壁纸管理类
class PopupWallpaperManager {
    constructor() {
        this.currentWallpaper = 'white';
        this.uploadedWallpapers = [];
    }

    // 加载壁纸设置。currentWallpaper 和已上传列表本来就存在同一个键里，
    // 一次读完即可（原来分两个方法各读一遍同一个大 JSON）。
    async loadAll() {
        const store = readWallpaperStore();
        this.currentWallpaper = store.current;
        this.uploadedWallpapers = store.uploaded;
    }

    // 保存壁纸设置
    async saveWallpaper(wallpaper) {
        this.currentWallpaper = wallpaper;
        return writeWallpaperStore({
            current: wallpaper,
            uploaded: this.uploadedWallpapers
        });
    }

    // 保存所有已上传的壁纸
    async saveUploadedWallpapers(wallpapers) {
        this.uploadedWallpapers = wallpapers;
        return writeWallpaperStore({
            current: this.currentWallpaper,
            uploaded: wallpapers
        });
    }

    // 添加上传的壁纸到列表
    async addUploadedWallpaper(wallpaper) {
        if (!this.uploadedWallpapers.includes(wallpaper)) {
            this.uploadedWallpapers.push(wallpaper);
            await this.saveUploadedWallpapers(this.uploadedWallpapers);
        }
    }

    // 删除上传的壁纸
    async removeUploadedWallpaper(wallpaper) {
        this.uploadedWallpapers = this.uploadedWallpapers.filter(w => w !== wallpaper);
        await this.saveUploadedWallpapers(this.uploadedWallpapers);
    }

    // 应用壁纸：具体规则只有一份，就是全局的 applyWallpaperValue()
    applyWallpaper(wallpaper) {
        applyWallpaperValue(wallpaper);
    }

    // 处理图片上传
    async handleImageUpload(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                resolve(base64Image);
            };
            reader.onerror = function() {
                resolve(null);
            };
            reader.readAsDataURL(file);
        });
    }
}

// 获取图标 API URL
// renderShortcuts 里每个站点都会问一次，所以缓存解析结果；
// 缓存以原始字符串为凭据，设置页写入后会自动失效。
const DEFAULT_ICON_API = 'https://toolb.cn/favicon/{domain}';
let iconApiRawCache;
let iconApiValueCache = DEFAULT_ICON_API;
let iconApiCached = false;

function getIconApiUrl() {
    const raw = localStorage.getItem('startpage-faviconapi');
    if (iconApiCached && iconApiRawCache === raw) {
        return iconApiValueCache;
    }
    let value = DEFAULT_ICON_API;
    try {
        if (raw) {
            const settings = JSON.parse(raw);
            if (settings && settings.iconApiUrl) value = settings.iconApiUrl;
        }
    } catch (error) {
        console.error('Get icon API URL error:', error);
    }
    iconApiRawCache = raw;
    iconApiValueCache = value;
    iconApiCached = true;
    return value;
}

// 安全取域名：站点 URL 可能是手填的、不带协议的，new URL 会直接抛错并中断整页渲染
function siteHostname(url) {
    return QDB.siteHostname(url);
}

// 站点名 / 网址是直接拼进 innerHTML 的：名字里带 < > " 会把整块结构顶坏，
// 一个手滑的名字就能让后面所有快捷方式错位，所以统一转义。
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

// 把 URL 安全地放进 CSS url('...')：转义反斜杠和单引号。
// URL 里带 ' 会提前截断 CSS 字符串，壁纸缩略图就显示不出来。
function cssUrl(value) {
    return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// 图标垫底 + 淡入：首字母仍然是原来那套「没有就建一个」的兜底，只是不再等 error 事件。
// 拿不到图的站请求会挂很久，等 error 这段时间格子就是空的 —— 所以渲染完先把字母建好垫着，
// 图标是盖在它上面的一层，加载完才淡入；图挂了就退回去，露出的还是那个字母。
//
// <img> 始终不删 —— 换个 src 就能换回来。
//
// 监听方式：容器级 + 捕获阶段一个监听器统管 load / error，
// 不必再给每个图标各挂一个（原来每次渲染 72 个）。
const iconFallbackBound = new WeakSet();
const ICON_SELECTOR = 'img.site-icon, img.popup-site-icon-img';

function isIconImg(node) {
    return !!(node && node.matches && node.matches(ICON_SELECTOR));
}

// 给格子补上垫底的首字母（已经有了就不动）
function ensureFallbackText(img) {
    const parent = img.parentElement;
    const siteName = img.dataset.siteName;
    if (!parent || !siteName) return;
    if (parent.querySelector('.icon-fallback-text')) return;
    const fallback = document.createElement('span');
    fallback.className = 'icon-fallback-text';
    fallback.textContent = siteName.charAt(0).toUpperCase();
    parent.appendChild(fallback);
}

// 切图的状态：loaded = 图淡入、字母退场；未加载 = 图退场、字母露出来
function setIconLoaded(img, loaded) {
    if (loaded && img.__iconTimer) { clearTimeout(img.__iconTimer); img.__iconTimer = null; }
    img.classList.toggle('is-loaded', loaded);
    if (img.parentElement) img.parentElement.classList.toggle('has-icon', loaded);
}

// 图标请求可能一直挂着不回，浏览器自己判超时是几十秒 —— 这段时间它占着并发槽，
// 后面本来能秒回的图标也跟着排队。所以自己掐：4 秒还没出图就撤掉地址、中断这次请求。
// 只是终止这一轮的尝试，不代表「以后不再试」，下次开标签页照样重新试。
const ICON_WAIT_MS = 4000;

function watchIconTimeout(img) {
    if (img.__iconTimer) return;
    const startedSrc = img.getAttribute('src') || '';
    if (!startedSrc) return;
    img.__iconTimer = setTimeout(function() {
        img.__iconTimer = null;
        if (img.classList.contains('is-loaded')) return;
        // 这期间已经换成别的图（缓存抓到了）就别插手
        if ((img.getAttribute('src') || '') !== startedSrc) return;
        if (startedSrc.indexOf('http') === 0) img.removeAttribute('src');
    }, ICON_WAIT_MS);
}

function bindIconFallback(container) {
    if (!container || iconFallbackBound.has(container)) return;
    iconFallbackBound.add(container);

    container.addEventListener('load', function(e) {
        if (isIconImg(e.target)) setIconLoaded(e.target, true);
    }, true);

    container.addEventListener('error', function(e) {
        const img = e.target;
        if (!isIconImg(img)) return;
        if (img.__iconTimer) { clearTimeout(img.__iconTimer); img.__iconTimer = null; }
        setIconLoaded(img, false);
        ensureFallbackText(img);
        // 连域名都没有的图换不回来，留着也没用
        if (!img.dataset.iconHost) img.remove();
    }, true);
}

// 给这一批图标垫字母。
// 必须每次渲染都调：容器只绑一次监听（bindIconFallback 会早退），
// 但每次重渲染 innerHTML 都会造一批全新的 <img>，它们没垫过字母。
// 放在 bindIconFallback 里的话第二次渲染就再也垫不上了 —— 只有 error 才会补，
// 而「请求挂着不回」恰恰等不到 error，格子就一直空着。
function padIconFallback(container) {
    if (!container) return;
    container.querySelectorAll(ICON_SELECTOR).forEach(function(img) {
        ensureFallbackText(img);
        // 本地缓存的图可能已经加载完了（load 事件已错过），这里补标一次，
        // 否则这些图会永远停在透明状态，只剩字母。
        if (img.complete && img.naturalWidth > 0) { setIconLoaded(img, true); return; }
        // 只盯图标源直链；本地 blob 不用超时
        if ((img.getAttribute('src') || '').indexOf('http') === 0) watchIconTimeout(img);
    });
}

// 实时更新时间和日期
// 缓存元素引用与上一次的日期字符串：每秒只写一次时钟，
// 日期没变就不重算、不写 DOM。
let timeElement = null;
let dateElement = null;
let lastDateString = '';
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function updateDateTime() {
    const now = new Date();

    if (!timeElement) timeElement = document.getElementById('time');
    if (!dateElement) dateElement = document.getElementById('date');

    if (timeElement) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    if (dateElement) {
        const dateString = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
        if (dateString !== lastDateString) {
            lastDateString = dateString;
            dateElement.textContent = dateString;
        }
    }
}

// 初始化时间更新
updateDateTime();
setInterval(updateDateTime, 1000);

// 默认搜索引擎列表
const DEFAULT_SEARCH_ENGINES = [
    { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q={q}' },
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}' },
    { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={q}' },
];

// 获取搜索引擎URL
async function getSearchUrl(query, engineId) {
    const engines = await loadSearchEngines();
    const engine = engines.find(e => e.id === engineId) || engines[0];
    if (engine) {
        return engine.url.replace('{q}', encodeURIComponent(query));
    }
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// 组装一份完整导出配置（分组 + 引擎 + 壁纸 + 引擎/图标源设置）。
// 导出成文件、上传到 GitHub 同步都用这一份，避免两处逻辑漂移。
async function buildExportConfig() {
    const config = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        data: {
            groups: [],
            searchEngines: [],
            uploadedWallpapers: []
        }
    };

    // 获取分组数据
    const groupsData = await loadShortcutsData();
    config.data.groups = groupsData.groups || [];

    // 获取搜索引擎数据
    config.data.searchEngines = await loadSearchEngines();

    // 获取壁纸数据（只导出 URL 壁纸；base64 上传图太大，不适合塞进配置文件）
    const wallpaperStore = readWallpaperStore();
    config.data.uploadedWallpapers = wallpaperStore.uploaded.filter(w =>
        typeof w === 'string' && (w.startsWith('http://') || w.startsWith('https://'))
    );
    // 正在用的那张壁纸也记下来，导入后直接切回同一张。base64 上传图不导出（同上，体积）
    if (typeof wallpaperStore.current === 'string' && wallpaperStore.current.indexOf('data:') !== 0) {
        config.data.currentWallpaper = wallpaperStore.current;
    }

    // 当前选中的搜索引擎，导入后继续用它；没手动选过（用默认第一个）也要记下来，
    // 否则换台机器拉取后「当前引擎」会保持对方本地的旧值，而不是回到云端的第一个。
    try {
        const savedEngine = localStorage.getItem('startpage-engine');
        if (savedEngine) {
            config.data.currentEngine = savedEngine;
        } else if (Array.isArray(config.data.searchEngines) && config.data.searchEngines.length) {
            config.data.currentEngine = config.data.searchEngines[0].id;
        }
    } catch (error) { /* 读不到就按第一个引擎 */ }

    // 获取图标来源 API 设置
    const savedSettings = localStorage.getItem('startpage-faviconapi');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            if (settings.iconApiUrl) {
                config.data.iconApiUrl = settings.iconApiUrl;
            }
        } catch (error) {
            console.error('Failed to parse saved settings:', error);
        }
    }

    // 注意：token 绝不能写进配置/Gist。GitHub 的 Secret Scanning 一旦发现 gist 里
    // 出现 ghp_... 这串 token，会自动吊销它（表现为「token 突然没了」）。

    return config;
}

// 导出配置到本地 JSON 文件
async function exportConfig() {
    try {
        const config = await buildExportConfig();

        // 创建下载链接
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QidoBloom-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('配置导出成功！');
    } catch (error) {
        console.error('Export config error:', error);
        showMessage('配置导出失败：' + error.message, 'error');
    }
}

// 显示自定义提示消息
function showMessage(text, type = 'success') {
    // 移除旧的消息
    const oldMessage = document.getElementById('auth-message');
    if (oldMessage) {
        oldMessage.remove();
    }

    // 创建新的消息元素
    const message = document.createElement('div');
    message.id = 'auth-message';
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 38px;
        right: 164px;
        padding: 10px 15px;
        border-radius: 6px;
        color: rgba(0, 0, 0, 0.8);
        font-weight: 400;
        font-size: 14px;
        z-index: 10000;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
    `;

    document.body.appendChild(message);

    // 3秒后自动移除
    setTimeout(() => message.remove(), 3000);
}

// 显示自定义确认对话框
function showConfirmDialog(title, message, onConfirm, onCancel) {
    // 移除旧的对话框
    const oldDialog = document.getElementById('custom-dialog');
    if (oldDialog) {
        oldDialog.remove();
    }

    // 创建对话框容器
    const dialog = document.createElement('div');
    dialog.id = 'custom-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    // 创建对话框内容
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = `
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 32px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        transform: translateY(50px) scale(0.98);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    content.innerHTML = `
        <h3 style="margin: 0 0 24px 0; font-size: 1.3rem; font-weight: 600; color: #000000; text-align: center;">${title}</h3>
        <p style="margin: 0 0 24px 0; color: #000000;">${message}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
            <button id="dialog-cancel" style="
                padding: 8px 16px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.8);
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            ">取消</button>
            <button id="dialog-confirm" style="
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            ">确定</button>
        </div>
    `;

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    // 添加动画效果
    setTimeout(() => {
        content.style.transform = 'translateY(0) scale(1)';
        content.style.opacity = '1';
    }, 10);

    // 绑定事件
    document.getElementById('dialog-cancel').addEventListener('click', () => {
        content.style.transform = 'translateY(50px) scale(0.98)';
        content.style.opacity = '0';
        setTimeout(() => dialog.remove(), 300);
        if (onCancel) onCancel();
    });

    document.getElementById('dialog-confirm').addEventListener('click', () => {
        content.style.transform = 'translateY(50px) scale(0.98)';
        content.style.opacity = '0';
        setTimeout(() => dialog.remove(), 300);
        if (onConfirm) onConfirm();
    });

    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            content.style.transform = 'translateY(50px) scale(0.98)';
            content.style.opacity = '0';
            setTimeout(() => dialog.remove(), 300);
            if (onCancel) onCancel();
        }
    });
}

// 把一份配置写进本地。导入文件、从 GitHub 拉取，都走这一份，避免两套覆盖逻辑漂移。
async function applyImportedConfig(config) {
    if (!config || !config.data) {
        throw new Error('配置文件格式不正确');
    }

    // 导入分组数据
    if (config.data.groups && config.data.groups.length > 0) {
        const currentData = await loadShortcutsData();
        writeStartpageData({ ...currentData, groups: config.data.groups });
    }

    // 导入搜索引擎数据
    if (config.data.searchEngines && config.data.searchEngines.length > 0) {
        localStorage.setItem('searchEngines', JSON.stringify(config.data.searchEngines));
    }

    // 导入壁纸数据：URL 列表照旧覆盖；配置里带了「正在用的壁纸」就一并切过去
    if (Array.isArray(config.data.uploadedWallpapers) || config.data.currentWallpaper) {
        const wallpaperStore = readWallpaperStore();
        const uploaded = Array.isArray(config.data.uploadedWallpapers)
            ? config.data.uploadedWallpapers.slice()
            : wallpaperStore.uploaded;
        let current = wallpaperStore.current;
        const wanted = config.data.currentWallpaper;
        if (typeof wanted === 'string' && wanted) {
            current = wanted;
            // 是网址却不在列表里，补进去，否则壁纸面板里找不到它
            if (/^https?:\/\//i.test(wanted) && !uploaded.includes(wanted)) {
                uploaded.unshift(wanted);
            }
        }
        writeWallpaperStore({ current: current, uploaded: uploaded });
    }

    // 导入后继续用配置里记的搜索引擎；那个引擎不存在就退回第一个
    if (config.data.currentEngine) {
        // 上面已把新列表写进 localStorage，这里读到的是导入后的结果
        const engines = await loadSearchEngines();
        try {
            if (engines.some(engine => engine.id === config.data.currentEngine)) {
                localStorage.setItem('startpage-engine', config.data.currentEngine);
            } else {
                localStorage.removeItem('startpage-engine');
            }
        } catch (error) { /* 存不进就按第一个引擎 */ }
    }

    // 导入图标来源 API 设置
    if (config.data.iconApiUrl) {
        localStorage.setItem('startpage-faviconapi', JSON.stringify({ iconApiUrl: config.data.iconApiUrl }));
    }
}

// 导入配置（从本地文件）
function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const config = JSON.parse(text);

            showConfirmDialog('导入配置', '导入配置将覆盖当前设置，确定要继续吗？', async () => {
                try {
                    await applyImportedConfig(config);
                    showMessage('配置导入成功！页面将自动刷新。');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } catch (error) {
                    console.error('Import config error:', error);
                    showMessage('配置导入失败：' + error.message, 'error');
                }
            });
        } catch (error) {
            console.error('Import config error:', error);
            showMessage('配置导入失败：' + error.message, 'error');
        }
    };

    input.click();
}

// ============================================================
// GitHub 同步：用私有 Gist 存配置，跨设备拉取
// ------------------------------------------------------------
// 存储 startpage-github-sync = { token }。
// token 明文存在 localStorage（扩展私有源，别的网页读不到），只自己用可接受。
// ============================================================
const GITHUB_SYNC_KEY = 'startpage-github-sync';
const GITHUB_GIST_FILE = 'QidoBloom-config.json';
const GITHUB_API = 'https://api.github.com';

function readGithubSync() {
    try {
        const raw = localStorage.getItem(GITHUB_SYNC_KEY);
        if (!raw) return { token: '' };
        const parsed = JSON.parse(raw);
        return { token: typeof parsed.token === 'string' ? parsed.token : '' };
    } catch (error) {
        return { token: '' };
    }
}

function writeGithubSync(settings) {
    try {
        localStorage.setItem(GITHUB_SYNC_KEY, JSON.stringify(settings));
        return true;
    } catch (error) {
        return false;
    }
}

// 统一带 token 的 GitHub 请求，15 秒超时
async function githubRequest(method, path, body) {
    const headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const settings = readGithubSync();
    if (settings.token) headers['Authorization'] = 'Bearer ' + settings.token;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(GITHUB_API + path, {
            method: method,
            headers: headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal
        });
        if (!res.ok) {
            let detail = '';
            try {
                const err = await res.json();
                detail = err && err.message ? '：' + err.message : '';
            } catch (error) { /* 拿不到 body 就用状态码 */ }
            throw new Error('GitHub ' + res.status + detail);
        }
        return res.status === 204 ? null : res.json();
    } finally {
        clearTimeout(timer);
    }
}

// 用 token 列出自己的 Gist，找到存配置的那个（没有则返回 null）
async function findConfigGistId() {
    const gists = await githubRequest('GET', '/gists?per_page=100');
    if (!Array.isArray(gists)) return null;
    const match = gists.find(g => g.files && g.files[GITHUB_GIST_FILE]);
    return match ? match.id : null;
}

// 把本地配置上传到 Gist；云端已有配置 Gist 就覆盖，没有才新建。Gist ID 后台自动管，不暴露给前端。
async function githubUpload() {
    const settings = readGithubSync();
    if (!settings.token) throw new Error('请先填写 GitHub Token');
    const content = JSON.stringify(await buildExportConfig(), null, 2);

    let gistId = await findConfigGistId();
    if (gistId) {
        await githubRequest('PATCH', '/gists/' + encodeURIComponent(gistId), {
            files: { [GITHUB_GIST_FILE]: { content: content } }
        });
    } else {
        const created = await githubRequest('POST', '/gists', {
            description: '琪窦初开 配置同步',
            public: false,
            files: { [GITHUB_GIST_FILE]: { content: content } }
        });
        gistId = created.id;
    }
    writeGithubSync({ token: settings.token });
    return gistId;
}

// 从 Gist 读回配置（不应用）。Gist 靠 token 自动定位，不用手动填 id。
async function fetchRemoteConfig() {
    const settings = readGithubSync();
    if (!settings.token) throw new Error('请先填写 GitHub Token');
    const gistId = await findConfigGistId();
    if (!gistId) throw new Error('云端还没有配置，请先点一次「上传」');
    const gist = await githubRequest('GET', '/gists/' + encodeURIComponent(gistId));
    const file = gist.files && gist.files[GITHUB_GIST_FILE];
    if (!file || typeof file.content !== 'string') {
        throw new Error('Gist 里没有配置文件');
    }
    return JSON.parse(file.content);
}

// 拉取并应用到本地
async function githubDownload() {
    await applyImportedConfig(await fetchRemoteConfig());
}

// 同步设置面板
function initPopupSyncManagement(popupContent) {
    const settings = readGithubSync();
    const tokenInput = popupContent.querySelector('#github-token');
    const saveBtn = popupContent.querySelector('#github-save');
    const uploadBtn = popupContent.querySelector('#github-upload');
    const downloadBtn = popupContent.querySelector('#github-download');
    const hint = popupContent.querySelector('#github-hint');

    tokenInput.value = settings.token;

    // 点「保存」才写盘，不再输入一个字存一次
    function persist() {
        writeGithubSync({ token: tokenInput.value.trim() });
    }
    saveBtn.addEventListener('click', () => {
        persist();
        hint.textContent = 'Token 已保存';
        hint.style.color = 'rgba(0,0,0,0.7)';
    });

    function setBusy(busy) {
        uploadBtn.disabled = busy;
        downloadBtn.disabled = busy;
    }

    uploadBtn.addEventListener('click', async () => {
        persist();
        setBusy(true);
        try {
            await githubUpload();
            hint.textContent = '已同步到 GitHub';
            hint.style.color = 'rgba(0,0,0,0.7)';
            showMessage('已同步到 GitHub');
        } catch (error) {
            hint.textContent = '上传失败：' + error.message;
            hint.style.color = 'rgba(0,0,0,0.7)';
            showMessage('上传失败：' + error.message, 'error');
        } finally {
            setBusy(false);
        }
    });

    downloadBtn.addEventListener('click', async () => {
        persist();
        setBusy(true);
        try {
            await githubDownload();
            hint.textContent = '已从 GitHub 拉取并应用';
            hint.style.color = 'rgba(0,0,0,0.7)';
            applyWallpaper();
            await initNewSearch();
            await renderShortcuts();
            showMessage('已从 GitHub 拉取配置');
        } catch (error) {
            hint.textContent = '下载失败：' + error.message;
            hint.style.color = 'rgba(0,0,0,0.7)';
            showMessage('下载失败：' + error.message, 'error');
        } finally {
            setBusy(false);
        }
    });
}

// 加载搜索引擎数据。搜索结果页、导出配置会反复读，所以按「原始字符串」缓存：
// 管理面板保存时直接写 localStorage，字符串变了缓存自动失效。
let enginesRawCache;
let enginesDataCache = [...DEFAULT_SEARCH_ENGINES];

async function loadSearchEngines() {
    try {
        const localData = localStorage.getItem('searchEngines');
        if (enginesRawCache === localData) return enginesDataCache;
        let engines = localData ? JSON.parse(localData) : [...DEFAULT_SEARCH_ENGINES];
        if (!Array.isArray(engines) || !engines.length) engines = [...DEFAULT_SEARCH_ENGINES];
        enginesRawCache = localData;
        enginesDataCache = engines;
        return engines;
    } catch (error) {
        console.error('Load search engines error:', error);
        return [...DEFAULT_SEARCH_ENGINES];
    }
}

// 新搜索功能
async function initNewSearch() {
    const searchForm = document.getElementById('new-search-form');
    const searchInput = document.getElementById('new-search-input');
    const searchEngineSelector = document.querySelector('.search-engine-selector');
    const selectedEngine = document.querySelector('.selected-engine');
    const currentEngine = document.getElementById('current-engine');
    const engineDropdown = document.querySelector('.engine-dropdown');
    if (!searchForm || !searchInput || !engineDropdown || !searchEngineSelector) return;

    // 加载搜索引擎
    const engines = await loadSearchEngines();

    // 当前引擎只记 id。原来是「读回按钮上的文字再反查 id」，
    // 引擎重名或那个引擎刚被删掉时 find() 会返回 undefined，搜索直接抛错。
    let currentEngineId = '';

    function selectEngine(engine) {
        currentEngineId = engine.id;
        currentEngine.textContent = engine.name;
        searchEngineSelector.classList.remove('open');
        try { localStorage.setItem('startpage-engine', engine.id); } catch (error) { /* 存不进就算了 */ }
    }

    // 清空并重新生成引擎选项
    engineDropdown.innerHTML = '';
    engines.forEach(engine => {
        const option = document.createElement('div');
        option.className = 'engine-option';
        option.dataset.engine = engine.id;
        option.textContent = engine.name;
        engineDropdown.appendChild(option);
    });

    // 记住上次用的引擎；没有记录 / 那个引擎已被删掉时退回第一个
    let savedEngineId = '';
    try { savedEngineId = localStorage.getItem('startpage-engine') || ''; } catch (error) { /* ignore */ }
    const initial = engines.find(engine => engine.id === savedEngineId) || engines[0];
    if (initial) selectEngine(initial);

    // 引擎选择器点击事件
    selectedEngine.onclick = function(e) {
        e.stopPropagation();
        searchEngineSelector.classList.toggle('open');
    };

    // 选项点击走一个委托：引擎增删后重新渲染选项，不必再逐个绑（原来每次重建 N 个监听器）
    engineDropdown.onclick = function(e) {
        const option = e.target.closest ? e.target.closest('.engine-option') : null;
        if (!option) return;
        e.stopPropagation();
        selectEngine({ id: option.dataset.engine, name: option.textContent });
    };

    async function submitSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        const searchUrl = await getSearchUrl(query, currentEngineId);
        window.open(searchUrl, '_blank');
        searchInput.value = '';
    }

    // 回车交给表单提交处理。原来另外挂了 keypress，一次回车两个处理器都跑，
    // 靠「先清空输入框」让后一个跳过，属于撞上了才不出错。
    searchForm.onsubmit = function(e) {
        e.preventDefault();
        submitSearch();
    };

    // 点击外部关闭下拉菜单（管理菜单的关闭在 initManageDropdown 里，这里不再重复写一份）
    document.onclick = function(e) {
        if (!searchEngineSelector.contains(e.target)) {
            searchEngineSelector.classList.remove('open');
        }
    };
}

// 快捷方式区域的拖拽：改成挂在容器上的事件委托，只绑一次。
// 原来是给每个图标挂 7 个监听器、每次重渲染全部重绑（一次渲染产生 N×7 个新闭包），
// 现在只留一套容器级处理器，hover 位移交回 CSS，重渲染不再有任何绑定开销。
let shortcutsDragBound = false;

function bindShortcutsDragOnce() {
    if (shortcutsDragBound) return;
    const container = document.querySelector('.shortcuts');
    if (!container) return;
    shortcutsDragBound = true;

    // 拖拽状态：null 表示没在拖。moved 区分「点击打开」和「拖动排序」。
    // 不用浏览器原生拖拽（HTML5 DnD）——它自带的虚线 ghost、禁止光标、
    // 「source 元素不能在拖拽中移动」的约束正是之前拖不动/闪烁/重影的根源。
    // 改成 pointer 事件自己接管：克隆影子跟手，原图标透明占位，其余图标让位。
    let drag = null;
    let suppressClick = false;

    // 让位动画用 JS 每帧驱动（偏移向 0 指数衰减，天然缓出），不用 CSS transition：
    // transition 在高频下每帧被重置，图标永远停在动画开头，表现为抖动/重影。
    const animOffset = new Map(); // el -> {x, y}：相对布局位置的当前偏移
    let animRaf = null;

    function tickAnim() {
        animRaf = null;
        let alive = false;
        animOffset.forEach((st, el) => {
            st.x *= 0.72;
            st.y *= 0.72;
            if (Math.abs(st.x) < 0.5 && Math.abs(st.y) < 0.5) {
                animOffset.delete(el);
                el.style.transform = '';
                el.style.transition = '';
            } else {
                el.style.transform = `translate(${st.x}px, ${st.y}px)`;
                alive = true;
            }
        });
        if (alive) animRaf = requestAnimationFrame(tickAnim);
    }

    function settleAnims() {
        animOffset.clear();
        if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
        container.querySelectorAll('.shortcut-item').forEach(el => {
            el.style.transform = '';
            el.style.transition = '';
        });
    }

    // 判定插到目标前/后：鼠标相对目标中心的主轴偏移
    function dropSide(item, clientX, clientY) {
        const r = item.getBoundingClientRect();
        const dx = clientX - (r.left + r.width / 2);
        const dy = clientY - (r.top + r.height / 2);
        return Math.abs(dx) > Math.abs(dy) ? dx < 0 : dy < 0;
    }

    // FLIP 让位：把被拖元素（透明占位）插到目标位置，其余图标 transform 从旧位滑到新位
    function shiftItemTo(dragged, target, before, targetContainerOverride) {
        const targetContainer = targetContainerOverride || (target ? target.parentElement : null);
        if (!targetContainer) return;
        const sourceContainer = dragged.parentElement;
        const anchor = target ? (before ? target : target.nextSibling) : null;
        if (sourceContainer === targetContainer) {
            if (anchor ? dragged.nextSibling === anchor : !dragged.nextSibling) return;
        }
        const siblings = [];
        new Set([sourceContainer, targetContainer].filter(Boolean)).forEach(c => {
            Array.from(c.children).forEach(el => { if (el !== dragged) siblings.push(el); });
        });
        const first = new Map();
        siblings.forEach(el => first.set(el, el.getBoundingClientRect()));
        if (anchor) targetContainer.insertBefore(dragged, anchor);
        else targetContainer.appendChild(dragged);
        siblings.forEach(el => {
            const prev = first.get(el);
            if (!prev) return;
            el.style.transition = 'none';
            el.style.transform = '';
            const now = el.getBoundingClientRect();
            const dx = prev.left - now.left;
            const dy = prev.top - now.top;
            if (!dx && !dy) { el.style.transition = ''; return; }
            animOffset.set(el, { x: dx, y: dy });
            el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        if (animOffset.size && !animRaf) animRaf = requestAnimationFrame(tickAnim);
    }

    // 分组换位（分组少、不频繁，直接换 + 靠 CSS transition 平滑）
    function shiftGroupTo(dragged, target, before) {
        const parent = target.parentElement;
        if (!parent || parent !== dragged.parentElement || dragged === target) return;
        const anchor = before ? target : target.nextSibling;
        if (dragged.nextSibling === anchor) return;
        parent.insertBefore(dragged, anchor);
    }

    // 克隆一个影子图标跟手；原图标 opacity 0 透明占位（占住网格不塌）
    function createGhost(clientX, clientY) {
        const el = drag.el;
        const rect = el.getBoundingClientRect();
        const ghost = el.cloneNode(true);
        ghost.removeAttribute('href');
        ghost.removeAttribute('draggable');
        ghost.classList.remove('dragging'); // 克隆发生在加 dragging 类之后，不带掉 opacity:0
        ghost.classList.add('drag-ghost');
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        document.body.appendChild(ghost);
        drag.grabX = clientX - rect.left;
        drag.grabY = clientY - rect.top;
        moveGhost(clientX, clientY);
        drag.ghost = ghost;
    }

    function moveGhost(clientX, clientY) {
        const g = drag.ghost;
        if (!g) return;
        g.style.left = (clientX - drag.grabX) + 'px';
        g.style.top = (clientY - drag.grabY) + 'px';
    }

    // 找指针下方的目标（ghost 和被拖元素都是 pointer-events:none，会被穿透）
    function hit(clientX, clientY, selector) {
        const node = document.elementFromPoint(clientX, clientY);
        if (!node || typeof node.closest !== 'function') return null;
        const found = node.closest(selector);
        if (!found || found === drag.el || drag.el.contains(found)) return null;
        return found;
    }

    // 第一次越过阈值：进入拖拽态
    function startDrag(e) {
        drag.moved = true;
        suppressClick = true;
        settleAnims(); // 清掉上一次拖拽可能残留的让位动画，从干净状态开始
        container.classList.add('sorting');
        drag.el.classList.add('dragging');
        if (drag.type === 'item') createGhost(e.clientX, e.clientY);
    }

    function onMove(e) {
        if (!drag) return;
        if (!drag.moved) {
            if (Math.abs(e.clientX - drag.startX) < 5 && Math.abs(e.clientY - drag.startY) < 5) return;
            startDrag(e);
        }
        if (drag.type === 'item') {
            moveGhost(e.clientX, e.clientY);
            const target = hit(e.clientX, e.clientY, '.shortcut-item');
            if (target) shiftItemTo(drag.el, target, dropSide(target, e.clientX, e.clientY));
        } else {
            const target = hit(e.clientX, e.clientY, '.shortcut-group');
            if (target) shiftGroupTo(drag.el, target, dropSide(target, e.clientX, e.clientY));
        }
    }

    function finishDrag(e) {
        const el = drag.el;
        const ghost = drag.ghost;
        const type = drag.type;

        if (type === 'item') {
            const target = hit(e.clientX, e.clientY, '.shortcut-item');
            if (target) shiftItemTo(el, target, dropSide(target, e.clientX, e.clientY));
            if (ghost) {
                const landing = el.getBoundingClientRect();
                ghost.style.transition = 'left .18s cubic-bezier(.22,.61,.36,1), top .18s cubic-bezier(.22,.61,.36,1), transform .18s cubic-bezier(.22,.61,.36,1)';
                ghost.style.left = landing.left + 'px';
                ghost.style.top = landing.top + 'px';
                ghost.style.transform = 'scale(1)';
                const done = () => {
                    if (ghost.parentElement) ghost.remove();
                    el.classList.remove('dragging');
                };
                ghost.addEventListener('transitionend', done, { once: true });
                setTimeout(done, 240);
            } else {
                el.classList.remove('dragging');
            }
            saveSiteLayout();
        } else {
            const target = hit(e.clientX, e.clientY, '.shortcut-group');
            if (target) shiftGroupTo(el, target, dropSide(target, e.clientX, e.clientY));
            el.classList.remove('dragging');
            saveNewGroupOrder();
        }

        container.classList.remove('sorting');
        // 不清让位动画：让 tickAnim 自然衰减到 0，其余图标平滑滑到最终位，不瞬移
        drag = null;
    }

    function onUp(e) {
        if (!drag) return;
        if (!drag.moved) { drag = null; return; } // 没拖动过 = 点击，交给浏览器打开
        finishDrag(e);
    }

    // 拖拽结束后浏览器若仍触发 click，拦掉，避免误开链接
    container.addEventListener('click', function (e) {
        if (suppressClick) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick = false;
        }
    }, true);

    container.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        suppressClick = false;
        const item = e.target.closest('.shortcut-item');
        const group = e.target.closest('.shortcut-group');
        if (item) {
            drag = { type: 'item', el: item, startX: e.clientX, startY: e.clientY, moved: false, ghost: null, grabX: 0, grabY: 0 };
        } else if (group) {
            drag = { type: 'group', el: group, startX: e.clientX, startY: e.clientY, moved: false, ghost: null, grabX: 0, grabY: 0 };
        }
    });

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);

    // 保存图标的落位：同组换位置、跨组移动都走这里。
    // 以 DOM 为准重建每个分组的 sites 顺序 —— 跨组移动会同时动到两个分组，
    // 只重算一个分组会把「移出去的那个」留在原分组里。站点对象本身仍从原数据取，不丢字段。
    async function saveSiteLayout() {
        try {
            const data = readStartpageData();

            const siteById = new Map();
            data.groups.forEach(group => {
                (group.sites || []).forEach(site => {
                    if (site && site.id) siteById.set(site.id, site);
                });
            });

            // 先统计「这一轮页面上真正渲染出来的站点 id 全集」。
            // 兜底不能按单个分组判断：跨组移动后，被拖的站点恰好满足
            //「不在原分组的 DOM 里、却还在原分组的 sites 里」，会被原分组又补回一份，
            // 两个分组各留一个 —— 当次 DOM 是对的不易察觉，刷新后才暴露。
            const rendered = new Set();
            container.querySelectorAll('.shortcut-item').forEach(el => {
                if (el.dataset.siteId) rendered.add(el.dataset.siteId);
            });

            container.querySelectorAll('.shortcut-group').forEach(groupElement => {
                const group = data.groups.find(g => g.id === groupElement.dataset.groupId);
                const itemsContainer = groupElement.querySelector('.shortcut-items');
                if (!group || !itemsContainer) return;

                const placed = new Set();
                const next = [];
                itemsContainer.querySelectorAll('.shortcut-item').forEach(itemElement => {
                    const id = itemElement.dataset.siteId;
                    const site = id ? siteById.get(id) : null;
                    if (!site || placed.has(id)) return;
                    placed.add(id);
                    next.push(site);
                });
                // 真正没在任何分组露面的站点接在后面，别丢数据
                (group.sites || []).forEach(site => {
                    if (site && site.id && !placed.has(site.id) && !rendered.has(site.id)) {
                        placed.add(site.id);
                        next.push(site);
                    }
                });

                group.sites = next;
            });

            writeStartpageData(data);
        } catch (error) {
            console.error('Save site layout error:', error);
        }
    }

    // 保存新的分组顺序
    async function saveNewGroupOrder() {
        try {
            const groupsContainer = document.querySelector('.shortcuts');
            const groupIds = Array.from(groupsContainer.children).map(group => group.dataset.groupId);

            const data = readStartpageData();
            data.groups = groupIds.map(id => data.groups.find(g => g.id === id)).filter(Boolean);
            writeStartpageData(data);
        } catch (error) {
            console.error('Save group order error:', error);
        }
    }
}

// ---------------- 起始页数据读写 ----------------
// 实现统一在 shared.js（起始页与扩展弹窗共用同一份），这里保留原函数名给本文件内部调用。
function readStartpageData() {
    return QDB.readData();
}

function writeStartpageData(data) {
    QDB.writeData(data);
}

/* ------------------------------------------------------------------
 * 壁纸存储层：startpage-wallpaper
 *
 * 为什么单独拆一个键：壁纸（特别是上传图的 base64）可能有几 MB，
 * 以前和分组数据挤在同一个 startpage-data JSON 里，导致每次读写分组
 * 都要连带把这几 MB 序列化 / 解析一遍。拆开后 startpage-data 只剩
 * 纯文本结构（几 KB），分组相关的热路径彻底不再碰壁纸。
 *
 * 结构：{ current: string, uploaded: string[] }
 * ------------------------------------------------------------------ */

const WALLPAPER_KEY = 'startpage-wallpaper';
const WALLPAPER_DEFAULT = 'white';

// 一次性迁移：把 startpage-data 里的 wallpaper / uploadedWallpapers 搬到独立键。
// 幂等（独立键已存在就直接跳过）、失败安全（先写新键成功，才动手删旧字段；
// 任何一步出错都保留旧数据原样，读取端有回退路径兜底）。
function migrateWallpaperStorage() {
    try {
        if (localStorage.getItem(WALLPAPER_KEY) !== null) return false;

        const raw = localStorage.getItem('startpage-data');
        if (!raw) return false;

        let legacy;
        try {
            legacy = JSON.parse(raw);
        } catch (error) {
            return false;
        }
        if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return false;

        const hasCurrent = typeof legacy.wallpaper === 'string';
        const hasUploaded = Array.isArray(legacy.uploadedWallpapers);
        // 老数据里本来就没有壁纸字段，不必凭空空建一个键
        if (!hasCurrent && !hasUploaded) return false;

        // 先写新键 —— 这一步失败就直接放弃，旧字段一个都不动，不会丢壁纸
        localStorage.setItem(WALLPAPER_KEY, JSON.stringify({
            current: hasCurrent ? legacy.wallpaper : WALLPAPER_DEFAULT,
            uploaded: hasUploaded ? legacy.uploadedWallpapers : []
        }));

        // 新键确认落盘后再摘旧字段。即使这一步失败（比如配额不足），
        // 也只是多留一份冗余，读取端优先读新键，结果仍然正确。
        delete legacy.wallpaper;
        delete legacy.uploadedWallpapers;
        localStorage.setItem('startpage-data', JSON.stringify(legacy));
        return true;
    } catch (error) {
        console.error('Migrate wallpaper storage error:', error);
        return false;
    }
}

// 读壁纸。独立键优先；没有独立键则回退到 startpage-data 的旧字段
// （兼容迁移失败、或用户导入的是旧版导出配置这两种情况）。
function readWallpaperStore() {
    const raw = localStorage.getItem(WALLPAPER_KEY);
    if (raw !== null) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return {
                    current: typeof parsed.current === 'string' ? parsed.current : WALLPAPER_DEFAULT,
                    uploaded: Array.isArray(parsed.uploaded) ? parsed.uploaded : []
                };
            }
        } catch (error) {
            console.error('Failed to parse wallpaper store:', error);
        }
    }

    const legacy = readStartpageData();
    return {
        current: typeof legacy.wallpaper === 'string' ? legacy.wallpaper : WALLPAPER_DEFAULT,
        uploaded: Array.isArray(legacy.uploadedWallpapers) ? legacy.uploadedWallpapers : []
    };
}

// 写壁纸。只回写独立键，绝不碰 startpage-data —— 这是这次拆分收益的来源。
function writeWallpaperStore(store) {
    try {
        localStorage.setItem(WALLPAPER_KEY, JSON.stringify({
            current: typeof store.current === 'string' ? store.current : WALLPAPER_DEFAULT,
            uploaded: Array.isArray(store.uploaded) ? store.uploaded : []
        }));
        return true;
    } catch (error) {
        console.error('Save wallpaper store error:', error);
        return false;
    }
}

// 从localStorage读取数据
async function loadShortcutsData() {
    return readStartpageData();
}

// ---- 图标缓存接入 ----
// 渲染时（同步）能拿到的优先级：站点自带图标 > 本地抽屉里存的图 > 图标 API 直链（老办法）
//
// 注意抽屉里那张图**未必是当前图标源抓的**。这里先用它把格子填上（有图总比字母强），
// 随后 warmIconCache 会拿当前源去抓一次：抓到了就换掉这张图并覆盖缓存记录，
// 抓不到就保持原样。也就是「当前源优先，旧图兜底」。
// 规范化用户手填的图标地址：允许「www.xx.com/a.png」这种不带协议的写法，
// 统一补成 https://；空值返回空串（表示没填 / 要清掉）。
function normalizeIconUrl(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^(https?:\/\/|data:)/i.test(text)) return text;
    if (text.indexOf('//') === 0) return 'https:' + text;
    return 'https://' + text;
}

// 站点自己填了图标（http / data）就用它，优先级高于缓存和图标源
function hasCustomIcon(site) {
    return !!(site && site.icon && (site.icon.startsWith('http') || site.icon.startsWith('data:')));
}

function resolveIconSrc(site, host, iconApi) {
    if (hasCustomIcon(site)) {
        return site.icon;
    }
    const cache = (typeof iconCache !== 'undefined' && iconCache) ? iconCache : null;
    const cached = cache ? cache.get(host) : null;
    // 有本地图就用本地的；没有就每次都填图标源地址、每次重新试一遍。
    // 试不出来也没关系 —— 格子里的字母早就垫着了，图什么时候回来什么时候盖上去。
    return cached || iconApi.replace('{domain}', host);
}

// 图标源只有一个：用户在设置里填的那个。
//
// 这里原先有条「当前源 → 历史用过的源 → 内置默认源」的兜底链，是个坑：
// 用户换了图标源之后，旧源（内置的 toolb.cn，以及历史里攒下的旧地址）照样会被请求，
// 新源拿不到的站就回头去问旧源，控制台一屏 404 —— 等于把「我不用这个源了」当没发生。
// 现在源拿不到图就退回字母图标，不再去问任何别的源。
function getIconApiCandidates() {
    const current = getIconApiUrl();

    // 不在扩展可访问名单里的源直接跳过：fetch 必然被拦，试了也是白试，还刷一屏报错。
    //（<img> 本身照样能显示，只是这类图存不进本地抽屉。）
    if (typeof iconCache !== 'undefined' && iconCache) {
        const allowed = iconCache.isUrlAllowed(current.replace('{domain}', 'example.com'));
        if (allowed === false) return [];
    }

    return [current];
}

// 把抽屉读进内存。读不出来/读太慢都当空抽屉，页面照常跑。
//
// 这里必须带超时：图标缓存只是「加速」，绝不能反过来把整页拖住。
// 启动流程是 await loadIconCache() → renderShortcuts()，IndexedDB 只要不回调
// （数据库被别的连接占着、库损坏、异常环境下 open 不返回……），
// 这一个 await 就会让 renderShortcuts 永远跑不到 —— 页面一个快捷方式都不显示。
// 超时后放弃本轮缓存，照常用图标 API 渲染，功能与加缓存之前完全一致。
const ICON_CACHE_LOAD_TIMEOUT = 300;

function loadIconCache() {
    if (typeof iconCache === 'undefined' || !iconCache) return Promise.resolve(false);

    let timer = null;
    const timeout = new Promise(resolve => {
        timer = setTimeout(() => resolve(false), ICON_CACHE_LOAD_TIMEOUT);
    });

    return Promise.race([
        iconCache.loadAll().then(() => true, () => false),
        timeout
    ]).then(ready => {
        if (timer !== null) clearTimeout(timer);
        return ready;
    });
}

// host → 该容器里对应的 <img> 列表。渲染后建一次，图标回填时直接查表，
// 不用每回来一张图就把整个文档扫一遍。
const iconHostIndex = new WeakMap();

function indexIconHosts(container) {
    if (!container) return;
    const map = new Map();
    container.querySelectorAll(ICON_SELECTOR).forEach(img => {
        const host = img.dataset.iconHost;
        if (!host) return;
        let list = map.get(host);
        if (!list) { list = []; map.set(host, list); }
        list.push(img);
    });
    iconHostIndex.set(container, map);
}

// 把刚拿到的图标塞进对应的格子。可能有多个格子（首页 + 管理面板）用同一个域名。
// 注意 <img> 加载失败时只是被藏起来、没被删掉 —— 所以这里能直接换 src 换回来。
function applyCachedIcon(host, blobUrl, container) {
    let nodes = iconHostIndex.get(container) && iconHostIndex.get(container).get(host);
    if (!nodes) {
        // 索引里没有（动态插入的节点等）就走一次兜底查询
        try {
            nodes = container.querySelectorAll('[data-icon-host="' + CSS.escape(host) + '"]');
        } catch (error) {
            return; // 域名里出现无法转义的字符就跳过这一张，不影响其他图标
        }
    }
    nodes.forEach(node => {
        if (node.tagName !== 'IMG') return;
        // 站点自己填了图标的，不能被同域名抓回来的图顶掉
        if (node.dataset.iconCustom) return;
        // 换 src 前先让旧的那层退场，新图 load 完再淡入；中间这段继续由字母垫着
        setIconLoaded(node, false);
        node.src = blobUrl;
    });
}

// 渲染完之后，把本地还没存的图标悄悄抓回来。
// 抓到一张就只换那一张 <img>，不整页重渲染 —— 用户看不到任何闪动。
function warmIconCache(hosts, container) {
    if (typeof iconCache === 'undefined' || !iconCache || !container) return;
    const unique = [...new Set((hosts || []).filter(Boolean))];
    if (!unique.length) return;
    // 候选源按优先级排好交给缓存层；末尾把「当前源」的标识一起带上，缓存层据此判断
    // 手里那张图要不要重抓（旧源抓的 / 已过期 → 抓；当前源抓的且没过期 → 跳过）。
    const urlFors = getIconApiCandidates().map(template => host => template.replace('{domain}', host));
    iconCache.schedule(unique, urlFors, (host, blobUrl) => applyCachedIcon(host, blobUrl, container), getIconApiUrl());
}

// 每个分组上次渲染时的内容签名：签名没变就不重建，现有的 <img> 原样留着。
// 图标源也算进签名 —— 换了源，即使站点数据没变，也要按新源重算图标地址。
const groupSignatures = new Map();

function buildGroupElement(group, iconApi, iconHosts) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
        <div class="shortcut-group" data-group-id="${escapeHtml(group.id)}">
            <h3 class="group-title">${escapeHtml(group.name)}</h3>
            <div class="shortcut-items">
                ${(group.sites || []).map(site => {
                    const host = siteHostname(site.url);
                    // 自己填了图标的站不交给图标源，否则抓回来的图会把它覆盖掉
                    if (!hasCustomIcon(site)) iconHosts.push(host);
                    const src = resolveIconSrc(site, host, iconApi);
                    // 标记自定义图标：抓到同域名的图时，applyCachedIcon 要跳过它
                    const customAttr = hasCustomIcon(site) ? ' data-icon-custom="1"' : '';
                    return `
                    <a href="${escapeHtml(site.url)}" class="shortcut-item" draggable="false" target="_blank" data-site-id="${escapeHtml(site.id)}">
                        <div class="shortcut-icon">
                            <img src="${escapeHtml(src)}" alt="${escapeHtml(site.name)} icon" class="site-icon" draggable="false" data-site-name="${escapeHtml(site.name)}" data-icon-host="${escapeHtml(host)}"${customAttr}>
                        </div>
                        <span class="shortcut-name">${escapeHtml(site.name)}</span>
                    </a>`;
                }).join('')}
            </div>
        </div>`;
    return wrap.firstElementChild;
}

// 渲染快捷方式。force = true 时全部重建（清空图标缓存后要用：内存里的 blob 地址已失效，
// 留着旧 <img> 只会显示破图）；平时只重建内容变了的那个分组。
async function renderShortcuts(force) {
    const shortcutsContainer = document.querySelector('.shortcuts');
    if (!shortcutsContainer) return;
    try {
        const data = await loadShortcutsData();
        const groups = data.groups || [];

        // 把分组镜像给后台，右键菜单靠它拼子项
        QDB.syncGroupsMirror(groups);

        // 图标 API 只取一次（原来在 map 里每个站点都读一遍 localStorage + JSON.parse）
        const iconApi = getIconApiUrl();
        const iconHosts = [];
        const rebuilt = [];

        if (force) {
            groupSignatures.clear();
            shortcutsContainer.textContent = '';
        }

        // 现有分组节点按 groupId 索引
        const existing = new Map();
        Array.from(shortcutsContainer.children).forEach(el => {
            if (el.classList.contains('shortcut-group') && el.dataset.groupId) {
                existing.set(el.dataset.groupId, el);
            }
        });

        const wanted = new Set();
        const ordered = [];

        groups.forEach(group => {
            const signature = iconApi + '|' + JSON.stringify(group);
            wanted.add(group.id);

            let el = existing.get(group.id);
            if (!el || groupSignatures.get(group.id) !== signature) {
                const fresh = buildGroupElement(group, iconApi, iconHosts);
                if (el) el.replaceWith(fresh);
                el = fresh;
                rebuilt.push(fresh);
            }
            // 内容没变的分组走这里：节点和内部 <img> 原样保留，不重新加载图标

            groupSignatures.set(group.id, signature);
            ordered.push(el);
        });

        // 按数据顺序摆好：只移动错位的节点，不重建
        let ref = shortcutsContainer.firstElementChild;
        ordered.forEach(el => {
            if (el !== ref) shortcutsContainer.insertBefore(el, ref);
            ref = el.nextElementSibling;
        });

        // 数据里已经没有的分组，节点和签名一起清掉
        existing.forEach((el, id) => {
            if (wanted.has(id)) return;
            groupSignatures.delete(id);
            el.remove();
        });

        bindIconFallback(shortcutsContainer);
        // 只给新建 / 重建的分组垫字母，没变的不动
        rebuilt.forEach(node => padIconFallback(node));
        indexIconHosts(shortcutsContainer);
        bindShortcutsDragOnce();
        // 本地抽屉里还没有的图标，趁这会儿悄悄补上
        warmIconCache(iconHosts, shortcutsContainer);
    } catch (error) {
        console.error('Render shortcuts error:', error);
    }
}

// 壁纸落地的唯一实现：首页启动和壁纸面板都调它。
// 原来类里和这里各写了一份，规则还不完全一样（面板那份不会在图片失效时退回默认背景）。
const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';

function applyWallpaperValue(wallpaper) {
    const body = document.body;
    if (!wallpaper || wallpaper === 'white') {
        body.style.background = DEFAULT_BACKGROUND;
        body.style.backgroundColor = '#ffffff';
        body.style.backgroundSize = '';
        return;
    }

    body.style.background = `url('${cssUrl(wallpaper)}') no-repeat center center fixed`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundColor = '#ffffff';

    // 图挂了（链接失效 / 上传的数据坏了）就退回默认背景，别留一块空白
    const probe = new Image();
    probe.onerror = function() {
        body.style.background = DEFAULT_BACKGROUND;
        body.style.backgroundColor = '#ffffff';
        body.style.backgroundSize = '';
    };
    probe.src = wallpaper;
}

// 应用壁纸
async function applyWallpaper() {
    try {
        // 壁纸已独立成 startpage-wallpaper 键：这里既不解析分组数据，
        // 也不再需要任何回写 —— 开新标签页的壁纸处理现在是「纯读 + 0 次写盘」
        applyWallpaperValue(readWallpaperStore().current);
    } catch (error) {
        console.error('Apply wallpaper error:', error);
    }
}

// 首屏的图标全都要去图标源拿，先把 DNS / TLS 握手提前做掉，别等渲染完才连
function preconnectIconApi() {
    let origin;
    try {
        origin = new URL(getIconApiUrl().replace('{domain}', 'example.com')).origin;
    } catch (error) {
        return; // 图标源填得不是合法地址，跳过
    }
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = '';
    document.head.appendChild(link);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async function() {
    // 先把壁纸数据从 startpage-data 里迁到独立键（一次性、幂等、失败安全）
    migrateWallpaperStorage();

    // 壁纸最先上：它是整页背景，没必要排在图标缓存后面
    applyWallpaper();
    preconnectIconApi();

    // 图标缓存必须等（渲染时要同步查表），但它和搜索框初始化互不依赖，并行跑
    await Promise.all([loadIconCache(), initNewSearch()]);

    await renderShortcuts();
    // 处理右键菜单 / 弹窗攒下的收藏（不影响首屏，放最后）
    await qdbInitBridge();
});

// 添加键盘快捷键
window.addEventListener('keydown', function(e) {
    // 按Ctrl+K或Ctrl+F聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        document.getElementById('new-search-input').focus();
    }
    
    // 按Escape键清除搜索框
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('new-search-input');
        if (searchInput) {
            searchInput.blur();
            searchInput.value = '';
        }
    }
});

// 初始化管理下拉菜单
function initManageDropdown() {
    const manageButton = document.querySelector('.manage-button');
    const dropdownMenu = document.querySelector('.manage-dropdown-menu');
    
    if (!manageButton || !dropdownMenu) return;
    
    // 切换下拉菜单
    manageButton.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!manageButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // 处理菜单项点击
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action;
            handleDropdownAction(action);
            dropdownMenu.classList.remove('show');
        });
    });
}

// 处理下拉菜单项点击
function handleDropdownAction(action) {
    switch (action) {
        case 'groups':
            showPopup('groups');
            break;
        case 'wallpaper':
            showPopup('wallpaper');
            break;
        case 'search-engines':
            showPopup('search-engines');
            break;
        case 'config':
            showPopup('config');
            break;
        case 'settings':
            showPopup('settings');
            break;
        default:
            break;
    }
}

// 显示弹出界面
function showPopup(type) {
    // 这里将实现纸张抽取动画的弹出界面
    
    // 创建弹出界面容器
    let popupContainer = document.getElementById('popup-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-container';
        popupContainer.className = 'popup-container';
        document.body.appendChild(popupContainer);
    }
    
    // 清空容器
    popupContainer.innerHTML = '';
    
    // 创建弹出内容
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    popupContent.dataset.type = type;
    
    // 根据类型设置内容
    let content = '';
    switch (type) {

        case 'groups':
            content = `
                <div class="popup-header">
                    <h3>分组管理</h3>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <!-- 分组管理界面 -->
                    <div class="groups-management">
                        <div class="section-header">
                            <h4>我的分组</h4>
                            <button id="popup-add-group-button" class="btn btn-primary">添加分组</button>
                        </div>
                        <div id="popup-groups-container" class="popup-groups-container">
                            <!-- 分组将通过JavaScript动态添加 -->
                        </div>
                    </div>
                </div>
                
                <!-- 添加分组模态框 -->
                <div id="popup-add-group-modal" class="modal">
                    <div class="modal-content">
                        <h3>添加新分组</h3>
                        <form id="popup-add-group-form">
                            <div class="form-group">
                                <label for="popup-group-name">分组名称</label>
                                <input type="text" id="popup-group-name" class="form-control" required>
                            </div>
                            <div class="modal-buttons">
                                <button type="button" id="popup-cancel-add-group" class="btn btn-secondary">取消</button>
                                <button type="submit" class="btn btn-primary">添加</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- 添加网站模态框 -->
                <div id="popup-add-site-modal" class="modal">
                    <div class="modal-content">
                        <h3>添加新网站</h3>
                        <form id="popup-add-site-form">
                            <input type="hidden" id="popup-current-group-id">
                            <div class="form-group">
                                <label for="popup-site-name">网站名称</label>
                                <input type="text" id="popup-site-name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="popup-site-url">网站地址</label>
                                <input type="url" id="popup-site-url" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="popup-site-icon">网站图标 (可选)</label>
                                <input type="text" id="popup-site-icon" class="form-control" placeholder="请输入图标URL">
                            </div>
                            <div class="modal-buttons">
                                <button type="button" id="popup-cancel-add-site" class="btn btn-secondary">取消</button>
                                <button type="submit" class="btn btn-primary">添加</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- 编辑网站模态框 -->
                <div id="popup-edit-site-modal" class="modal">
                    <div class="modal-content">
                        <h3>编辑网站</h3>
                        <form id="popup-edit-site-form">
                            <input type="hidden" id="popup-edit-group-id">
                            <input type="hidden" id="popup-edit-site-id">
                            <div class="form-group">
                                <label for="popup-edit-site-name">网站名称</label>
                                <input type="text" id="popup-edit-site-name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="popup-edit-site-url">网站地址</label>
                                <input type="url" id="popup-edit-site-url" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="popup-edit-site-icon">网站图标 (可选)</label>
                                <input type="text" id="popup-edit-site-icon" class="form-control" placeholder="请输入图标URL">
                            </div>
                            <div class="modal-buttons">
                                <button type="button" id="popup-cancel-edit-site" class="btn btn-secondary">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- 编辑分组模态框 -->
                <div id="popup-edit-group-modal" class="modal">
                    <div class="modal-content">
                        <h3>编辑分组</h3>
                        <form id="popup-edit-group-form">
                            <input type="hidden" id="popup-edit-group-form-id">
                            <div class="form-group">
                                <label for="popup-edit-group-name">分组名称</label>
                                <input type="text" id="popup-edit-group-name" class="form-control" required>
                            </div>
                            <div class="modal-buttons">
                                <button type="button" id="popup-cancel-edit-group" class="btn btn-secondary">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            break;
        case 'wallpaper':
            content = `
                <div class="popup-header">
                    <h3>壁纸设置</h3>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <!-- 壁纸设置界面 -->
                    <div class="wallpaper-management">
                        <!-- 已有壁纸 -->
                        <div class="wallpaper-section">
                            <h4>已有壁纸</h4>
                            <div class="wallpaper-previews">
                                <div class="wallpaper-preview" data-wallpaper="white">
                                    <div class="wallpaper-thumbnail white"></div>
                                </div>
                                <div class="wallpaper-preview" data-wallpaper="img/1.png">
                                    <div class="wallpaper-thumbnail" style="background-image: url('img/1.png'); background-size: cover; background-position: center;"></div>
                                </div>
                                <div class="wallpaper-preview" data-wallpaper="img/2.png">
                                    <div class="wallpaper-thumbnail" style="background-image: url('img/2.png'); background-size: cover; background-position: center;"></div>
                                </div>
                                <div class="wallpaper-preview" data-wallpaper="img/3.png">
                                    <div class="wallpaper-thumbnail" style="background-image: url('img/3.png'); background-size: cover; background-position: center;"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 上传壁纸 -->
                        <div class="wallpaper-section">
                            <h4>上传壁纸</h4>
                            
                            <!-- 本地上传 -->
                            <div class="upload-option">
                                <h5>本地上传</h5>
                                <div class="upload-section">
                                    <input type="file" id="wallpaper-upload" class="wallpaper-upload" accept="image/*">
                                    <label for="wallpaper-upload" class="btn btn-secondary">选择图片</label>
                                    <p class="upload-hint">支持 JPG、PNG、GIF 格式</p>
                                </div>
                            </div>
                            
                            <!-- URL设置壁纸 -->
                            <div class="upload-option">
                                <h5>URL设置</h5>
                                <div class="url-section">
                                    <input type="text" id="wallpaper-url" class="form-control" placeholder="请输入图片URL">
                                    <button id="set-wallpaper-url" class="btn btn-primary">添加</button>
                                </div>
                                <div id="url-wallpapers-list" class="url-wallpapers-list">
                                    <!-- URL壁纸列表将在这里动态生成 -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'search-engines':
            content = `
                <div class="popup-header">
                    <h3>搜索引擎管理</h3>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="search-engines-management">
                        <div class="engines-list">
                            <h4>搜索引擎列表</h4>
                            <div id="engines-container"></div>
                        </div>
                        <button class="btn btn-primary add-engine-btn">添加搜索引擎</button>
                    </div>
                    
                    <!-- 添加搜索引擎模态框 -->
                    <div id="popup-add-engine-modal" class="modal">
                        <div class="modal-content">
                            <h3>添加搜索引擎</h3>
                            <form id="popup-add-engine-form">
                                <div class="form-group">
                                    <label for="engine-name">搜索引擎名称</label>
                                    <input type="text" id="engine-name" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label for="engine-url">搜索URL</label>
                                    <input type="url" id="engine-url" class="form-control" placeholder="例如: https://www.baidu.com/s?wd={q}" required>
                                    <small style="color: #666; font-size: 0.8rem;">使用 {q} 作为搜索关键词的占位符</small>
                                </div>
                                <div class="modal-buttons">
                                    <button type="button" id="popup-cancel-add-engine" class="btn btn-secondary">取消</button>
                                    <button type="submit" class="btn btn-primary">添加</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- 编辑搜索引擎模态框 -->
                    <div id="popup-edit-engine-modal" class="modal">
                        <div class="modal-content">
                            <h3>编辑搜索引擎</h3>
                            <form id="popup-edit-engine-form">
                                <input type="hidden" id="edit-engine-id">
                                <div class="form-group">
                                    <label for="edit-engine-name">搜索引擎名称</label>
                                    <input type="text" id="edit-engine-name" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-engine-url">搜索URL</label>
                                    <input type="url" id="edit-engine-url" class="form-control" placeholder="例如: https://www.baidu.com/s?wd={q}" required>
                                    <small style="color: #666; font-size: 0.8rem;">使用 {q} 作为搜索关键词的占位符</small>
                                </div>
                                <div class="modal-buttons">
                                    <button type="button" id="popup-cancel-edit-engine" class="btn btn-secondary">取消</button>
                                    <button type="submit" class="btn btn-primary">保存</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'settings':
            content = `
                <div class="popup-header">
                    <h3>图标来源</h3>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="settings-management">
                        <div class="form-group">
                            <label for="icon-api-url">图标 API URL</label>
                            <input type="url" id="icon-api-url" class="form-control" placeholder="例如: https://toolb.cn/favicon/{domain}">
                            <small style="color: #666; font-size: 0.8rem;">使用 {domain} 作为域名的占位符</small>
                            <small id="icon-cache-hint" style="display: block; margin-top: 6px; font-size: 0.8rem;"></small>
                        </div>
                        <div class="form-group">
                            <button id="save-settings" class="btn btn-primary">保存设置</button>
                        </div>
                        <div class="form-group divider-block">
                            <label>本地图标缓存</label>
                            <div id="icon-cache-status" style="color: #666; font-size: 0.85rem; margin-bottom: 8px;"></div>
                            <button id="clear-icon-cache" class="btn btn-secondary">清空缓存</button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'config':
            content = `
                <div class="popup-header">
                    <h3>配置同步</h3>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="settings-management">
                        <div class="form-group">
                            <div class="section-title">本地配置</div>
                            <div class="btn-row">
                                <button id="local-export" class="btn btn-primary">导出配置</button>
                                <button id="local-import" class="btn btn-secondary">导入配置</button>
                            </div>
                        </div>
                        <div class="form-group divider-block">
                            <div class="section-title">云端配置</div>
                            <label for="github-token" style="color: #666;">GitHub Token <a href="https://github.com/settings/tokens/new?scopes=gist&description=QidoBloom" target="_blank" style="color: #666; text-decoration: none;" title="生成 token">↗</a></label>
                            <div style="display: flex; gap: 8px;">
                                <input type="password" id="github-token" class="form-control" placeholder="ghp_..." style="flex: 1;">
                                <button id="github-save" class="btn btn-primary">保存</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="btn-row">
                                <button id="github-upload" class="btn btn-primary">上传配置</button>
                                <button id="github-download" class="btn btn-secondary">下载配置</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <small id="github-hint" style="color: #666; font-size: 0.8rem;"></small>
                        </div>
                    </div>
                </div>
            `;
            break;
        default:
            content = `
                <div class="popup-header">
                    <h3>功能</h3>
                    <button class="popup-close">&times;</button>
                </div>
                <div class="popup-body">
                    <p>功能开发中...</p>
                </div>
            `;
    }
    
    popupContent.innerHTML = content;
    popupContainer.appendChild(popupContent);
    
    // 显示弹出界面
    popupContainer.classList.add('show');
    popupContent.classList.add('show');
    
    // 绑定关闭事件
    const closeButton = popupContent.querySelector('.popup-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closePopup();
        });
    }
    
    // 绑定功能按钮点击事件
    if (type === 'groups') {
        // 初始化分组管理功能
        initPopupGroupsManagement(popupContent);
    } else if (type === 'wallpaper') {
        // 初始化壁纸设置功能
        initPopupWallpaperManagement(popupContent);
    } else if (type === 'search-engines') {
        // 初始化搜索引擎管理功能
        initPopupSearchEnginesManagement(popupContent);
    } else if (type === 'settings') {
        // 初始化设置功能
        initPopupSettingsManagement(popupContent);
    } else if (type === 'config') {
        // 配置：本地导出/导入 + 云端同步
        popupContent.querySelector('#local-export').addEventListener('click', exportConfig);
        popupContent.querySelector('#local-import').addEventListener('click', importConfig);
        initPopupSyncManagement(popupContent);
    }
}

// 关闭弹出界面
function closePopup() {
    const popupContainer = document.getElementById('popup-container');
    if (!popupContainer) return;
    const popupContent = popupContainer.querySelector('.popup-content');

    popupContainer.classList.remove('show');

    // 等动画结束再清内容。只清「关掉的那一块」：
    // 300ms 内又打开新面板的话，旧元素已经不在文档里了，不能把新面板一起抹掉。
    if (!popupContent) return;
    setTimeout(() => {
        if (popupContent.isConnected) popupContent.remove();
    }, 300);
}

// 弹出面板里的模态框显示/隐藏（分组管理、搜索引擎管理共用同一套）
function bindModalOutside(popupContent, modalId) {
    const modal = popupContent.querySelector('#' + modalId);
    if (!modal || modal.dataset.outsideBound) return;
    modal.dataset.outsideBound = '1';
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModalIn(popupContent, modalId);
    });
}

function showModalIn(popupContent, modalId) {
    bindModalOutside(popupContent, modalId);
    const modal = popupContent.querySelector('#' + modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    modal.offsetHeight; // 强制重绘，动画从初始态开始
    modal.classList.add('modal-show');
}

function hideModalIn(popupContent, modalId) {
    const modal = popupContent.querySelector('#' + modalId);
    if (!modal) return;
    modal.classList.remove('modal-show');
    modal.classList.add('modal-hide');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('modal-hide');
    }, 400);
}

// 初始化管理下拉菜单
initManageDropdown();

// 初始化弹出界面中的分组管理功能
async function initPopupGroupsManagement(popupContent) {
    // 初始化数据管理器
    const dataManager = new PopupDataManager();
    await dataManager.loadData();

    // 渲染分组
    function renderGroups() {
        const groupsContainer = popupContent.querySelector('#popup-groups-container');
        const groups = dataManager.getGroups();
        // 图标 API 只取一次，避免在下面的 map 里每个站点都读一遍 localStorage
        const iconApi = getIconApiUrl();
        const iconHosts = [];

        if (groups.length === 0) {
            groupsContainer.innerHTML = `
                <div class="empty-state">
                    <h5>暂无分组</h5>
                    <p>点击"添加分组"按钮创建第一个分组</p>
                </div>
            `;
            return;
        }

        groupsContainer.innerHTML = groups.map(group => `
            <div class="popup-group-card">
                <div class="popup-group-header">
                    <h5>${escapeHtml(group.name)}</h5>
                    <div class="popup-group-actions">
                        <button class="btn btn-secondary btn-sm popup-add-site-btn" data-group-id="${escapeHtml(group.id)}">添加</button>
                        <button class="btn btn-secondary btn-sm popup-edit-group-btn" data-group-id="${escapeHtml(group.id)}">编辑</button>
                        <button class="btn btn-danger btn-sm popup-delete-group-btn" data-group-id="${escapeHtml(group.id)}">删除</button>
                    </div>
                </div>
                <div class="popup-sites-list">
                    ${group.sites && group.sites.length > 0 ? group.sites.map(site => {
                        const host = siteHostname(site.url);
                        // 自己填了图标的站不交给图标源，否则抓回来的图会把它覆盖掉
                        if (!hasCustomIcon(site)) iconHosts.push(host);
                        const src = resolveIconSrc(site, host, iconApi);
                        const customAttr = hasCustomIcon(site) ? ' data-icon-custom="1"' : '';
                        return `
                        <div class="popup-site-item">
                            <div class="popup-site-info">
                                <div class="popup-site-icon">
                                    <img src="${escapeHtml(src)}" alt="${escapeHtml(site.name)} icon" class="popup-site-icon-img" data-site-name="${escapeHtml(site.name)}" data-icon-host="${escapeHtml(host)}"${customAttr}>
                                </div>
                                <div class="popup-site-details">
                                    <div class="popup-site-name">${escapeHtml(site.name)}</div>
                                    <div class="popup-site-url">${escapeHtml(site.url)}</div>
                                </div>
                            </div>
                            <div class="popup-site-actions">
                                <button class="btn btn-secondary btn-sm popup-edit-site-btn" data-group-id="${escapeHtml(group.id)}" data-site-id="${escapeHtml(site.id)}">编辑</button>
                                <button class="btn btn-danger btn-sm popup-delete-site-btn" data-group-id="${escapeHtml(group.id)}" data-site-id="${escapeHtml(site.id)}">删除</button>
                            </div>
                        </div>
                    `;}).join('') : `
                        <div class="empty-state">
                            <p>暂无网站，点击"添加网站"按钮添加</p>
                        </div>
                    `}
                </div>
            </div>
        `).join('');

        // 绑定分组相关事件
        bindGroupEvents();

        // 图标加载失败兜底：容器级捕获监听，一个就够
        bindIconFallback(groupsContainer);
        // 先垫字母，理由同首页
        padIconFallback(groupsContainer);
        indexIconHosts(groupsContainer);
        // 本地抽屉里还没有的图标，趁这会儿悄悄补上
        warmIconCache(iconHosts, groupsContainer);
    }

    // 绑定分组相关事件（容器是常驻的，只能绑一次，否则每次渲染都会叠加一个监听器）
    let groupEventsBound = false;
    function bindGroupEvents() {
        if (groupEventsBound) return;
        // 使用事件委托处理所有按钮点击
        const groupsContainer = popupContent.querySelector('#popup-groups-container');
        if (groupsContainer) {
            groupEventsBound = true;
            groupsContainer.addEventListener('click', async (e) => {
                const target = e.target;
                
                // 添加网站按钮
                if (target.classList.contains('popup-add-site-btn')) {
                    const groupId = target.dataset.groupId;
                    popupContent.querySelector('#popup-current-group-id').value = groupId;
                    showModal('popup-add-site-modal');
                }
                
                // 删除分组按钮
                else if (target.classList.contains('popup-delete-group-btn')) {
                    const groupId = target.dataset.groupId;
                    showConfirmDialog('删除分组', '确定要删除这个分组吗？所有网站也会被删除。', async () => {
                        await dataManager.deleteGroup(groupId);
                        renderGroups();
                        showMessage('分组已删除');
                        renderShortcuts();
                    });
                }
                
                // 删除网站按钮
                else if (target.classList.contains('popup-delete-site-btn')) {
                    const groupId = target.dataset.groupId;
                    const siteId = target.dataset.siteId;
                    showConfirmDialog('删除网站', '确定要删除这个网站吗？', async () => {
                        await dataManager.deleteSite(groupId, siteId);
                        renderGroups();
                        showMessage('网站已删除');
                        renderShortcuts();
                    });
                }
                
                // 编辑网站按钮
                else if (target.classList.contains('popup-edit-site-btn')) {
                    const groupId = target.dataset.groupId;
                    const siteId = target.dataset.siteId;
                    
                    // 找到对应的网站数据
                    const group = dataManager.getGroups().find(g => g.id === groupId);
                    if (group) {
                        const site = group.sites.find(s => s.id === siteId);
                        if (site) {
                            // 填充表单
                            popupContent.querySelector('#popup-edit-group-id').value = groupId;
                            popupContent.querySelector('#popup-edit-site-id').value = siteId;
                            popupContent.querySelector('#popup-edit-site-name').value = site.name;
                            popupContent.querySelector('#popup-edit-site-url').value = site.url;
                            popupContent.querySelector('#popup-edit-site-icon').value = site.icon || '';
                            
                            showModal('popup-edit-site-modal');
                        }
                    }
                }
                
                // 编辑分组按钮
                else if (target.classList.contains('popup-edit-group-btn')) {
                    const groupId = target.dataset.groupId;
                    
                    // 找到对应的分组数据
                    const group = dataManager.getGroups().find(g => g.id === groupId);
                    if (group) {
                        // 填充表单（用本表单自己的 hidden 字段：两个表单原来共用一个 id，
                        // querySelector 只会命中排在前面的那个，编辑分组因此永远拿到空 id）
                        popupContent.querySelector('#popup-edit-group-form-id').value = groupId;
                        popupContent.querySelector('#popup-edit-group-name').value = group.name;
                        
                        showModal('popup-edit-group-modal');
                    }
                }
            });
        }
    }

    // 模态框显示/隐藏走全局 showModalIn / hideModalIn（和搜索引擎管理共用）
    function showModal(modalId) { showModalIn(popupContent, modalId); }
    function hideModal(modalId) { hideModalIn(popupContent, modalId); }

    // 绑定添加分组按钮
    const addGroupButton = popupContent.querySelector('#popup-add-group-button');
    if (addGroupButton) {
        addGroupButton.addEventListener('click', () => {
            showModal('popup-add-group-modal');
        });
    }

    // 绑定取消添加分组
    const cancelAddGroupButton = popupContent.querySelector('#popup-cancel-add-group');
    if (cancelAddGroupButton) {
        cancelAddGroupButton.addEventListener('click', () => {
            hideModal('popup-add-group-modal');
        });
    }

    // 绑定添加分组表单提交
    const addGroupForm = popupContent.querySelector('#popup-add-group-form');
    if (addGroupForm) {
        addGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupName = popupContent.querySelector('#popup-group-name').value.trim();
            if (groupName) {
                await dataManager.addGroup(groupName);
                renderGroups();
                hideModal('popup-add-group-modal');
                addGroupForm.reset();
                showMessage('分组已添加');
                renderShortcuts();
            }
        });
    }

    // 绑定取消添加网站
    const cancelAddSiteButton = popupContent.querySelector('#popup-cancel-add-site');
    if (cancelAddSiteButton) {
        cancelAddSiteButton.addEventListener('click', () => {
            hideModal('popup-add-site-modal');
        });
    }

    // 绑定添加网站表单提交
    const addSiteForm = popupContent.querySelector('#popup-add-site-form');
    if (addSiteForm) {
        addSiteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = popupContent.querySelector('#popup-current-group-id').value;
            const siteName = popupContent.querySelector('#popup-site-name').value.trim();
            const siteUrl = popupContent.querySelector('#popup-site-url').value.trim();
            const siteIcon = popupContent.querySelector('#popup-site-icon').value.trim();

            if (siteName && siteUrl) {
                // 图标原样交给数据层去规范化，避免「填了但不符合 http 开头就静默丢掉」
                const siteData = {
                    name: siteName,
                    url: siteUrl,
                    icon: siteIcon
                };
                await dataManager.addSite(groupId, siteData);
                renderGroups();
                hideModal('popup-add-site-modal');
                addSiteForm.reset();
                showMessage('网站已添加');
                renderShortcuts();
            }
        });
    }

    // 绑定取消编辑网站
    const cancelEditSiteButton = popupContent.querySelector('#popup-cancel-edit-site');
    if (cancelEditSiteButton) {
        cancelEditSiteButton.addEventListener('click', () => {
            hideModal('popup-edit-site-modal');
        });
    }

    // 绑定编辑网站表单提交
    const editSiteForm = popupContent.querySelector('#popup-edit-site-form');
    if (editSiteForm) {
        editSiteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = popupContent.querySelector('#popup-edit-group-id').value;
            const siteId = popupContent.querySelector('#popup-edit-site-id').value;
            const siteName = popupContent.querySelector('#popup-edit-site-name').value.trim();
            const siteUrl = popupContent.querySelector('#popup-edit-site-url').value.trim();
            const siteIcon = popupContent.querySelector('#popup-edit-site-icon').value.trim();

            if (siteName && siteUrl) {
                // 始终带上 icon：清空输入框 = 删掉这个站点的自定义图标
                const siteData = {
                    name: siteName,
                    url: siteUrl,
                    icon: siteIcon
                };
                await dataManager.updateSite(groupId, siteId, siteData);
                renderGroups();
                hideModal('popup-edit-site-modal');
                editSiteForm.reset();
                showMessage('网站已更新');
                renderShortcuts();
            }
        });
    }

    // 绑定取消编辑分组
    const cancelEditGroupButton = popupContent.querySelector('#popup-cancel-edit-group');
    if (cancelEditGroupButton) {
        cancelEditGroupButton.addEventListener('click', () => {
            hideModal('popup-edit-group-modal');
        });
    }

    // 绑定编辑分组表单提交
    const editGroupForm = popupContent.querySelector('#popup-edit-group-form');
    if (editGroupForm) {
        editGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = popupContent.querySelector('#popup-edit-group-form-id').value;
            const groupName = popupContent.querySelector('#popup-edit-group-name').value.trim();

            if (groupName) {
                const groupData = {
                    name: groupName
                };
                await dataManager.updateGroup(groupId, groupData);
                renderGroups();
                hideModal('popup-edit-group-modal');
                editGroupForm.reset();
                showMessage('分组已更新');
                renderShortcuts();
            }
        });
    }

    // 初始渲染分组
    renderGroups();
}

// 初始化弹出界面中的搜索引擎管理功能
async function initPopupSearchEnginesManagement(popupContent) {
    // 初始化数据管理器
    const enginesManager = new SearchEnginesManager();
    await enginesManager.loadData();

    // 渲染搜索引擎列表
    function renderEngines() {
        const container = popupContent.querySelector('#engines-container');
        const engines = enginesManager.getEngines();

        container.innerHTML = engines.map(engine => `
            <div class="engine-item">
                <div class="engine-info">
                    <div class="engine-name">${escapeHtml(engine.name)}</div>
                    <div class="engine-url">${escapeHtml(engine.url)}</div>
                </div>
                <div class="engine-actions">
                    <button class="btn btn-secondary btn-sm edit-engine-btn" data-id="${escapeHtml(engine.id)}">编辑</button>
                    <button class="btn btn-danger btn-sm delete-engine-btn" data-id="${escapeHtml(engine.id)}">删除</button>
                </div>
            </div>
        `).join('');

        // 绑定编辑和删除按钮
        container.querySelectorAll('.edit-engine-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const engineId = btn.dataset.id;
                const engine = engines.find(e => e.id === engineId);
                if (engine) {
                    popupContent.querySelector('#edit-engine-id').value = engine.id;
                    popupContent.querySelector('#edit-engine-name').value = engine.name;
                    popupContent.querySelector('#edit-engine-url').value = engine.url;
                    showModal('popup-edit-engine-modal');
                }
            });
        });

        container.querySelectorAll('.delete-engine-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const engineId = btn.dataset.id;
                showConfirmDialog('删除搜索引擎', '确定要删除这个搜索引擎吗？', async () => {
                    await enginesManager.deleteEngine(engineId);
                    renderEngines();
                    showMessage('搜索引擎已删除');
                    // 删的若正是当前选中的引擎，initNewSearch 会按 id 找不到、自动回退第一个
                    initNewSearch();
                });
            });
        });
    }

    // 模态框显示/隐藏走全局 showModalIn / hideModalIn（和分组管理共用）
    function showModal(modalId) { showModalIn(popupContent, modalId); }
    function hideModal(modalId) { hideModalIn(popupContent, modalId); }

    // 绑定添加搜索引擎按钮
    const addEngineBtn = popupContent.querySelector('.add-engine-btn');
    if (addEngineBtn) {
        addEngineBtn.addEventListener('click', () => {
            showModal('popup-add-engine-modal');
        });
    }

    // 绑定取消添加
    const cancelAddEngineBtn = popupContent.querySelector('#popup-cancel-add-engine');
    if (cancelAddEngineBtn) {
        cancelAddEngineBtn.addEventListener('click', () => {
            hideModal('popup-add-engine-modal');
        });
    }

    // 绑定添加搜索引擎表单提交
    const addEngineForm = popupContent.querySelector('#popup-add-engine-form');
    if (addEngineForm) {
        addEngineForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = popupContent.querySelector('#engine-name').value.trim();
            const url = popupContent.querySelector('#engine-url').value.trim();

            if (name && url) {
                await enginesManager.addEngine({ name, url });
                renderEngines();
                hideModal('popup-add-engine-modal');
                addEngineForm.reset();
                showMessage('搜索引擎已添加');
                initNewSearch();
            }
        });
    }

    // 绑定取消编辑
    const cancelEditEngineBtn = popupContent.querySelector('#popup-cancel-edit-engine');
    if (cancelEditEngineBtn) {
        cancelEditEngineBtn.addEventListener('click', () => {
            hideModal('popup-edit-engine-modal');
        });
    }

    // 绑定编辑搜索引擎表单提交
    const editEngineForm = popupContent.querySelector('#popup-edit-engine-form');
    if (editEngineForm) {
        editEngineForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const engineId = popupContent.querySelector('#edit-engine-id').value;
            const name = popupContent.querySelector('#edit-engine-name').value.trim();
            const url = popupContent.querySelector('#edit-engine-url').value.trim();

            if (name && url) {
                await enginesManager.updateEngine(engineId, { name, url });
                renderEngines();
                hideModal('popup-edit-engine-modal');
                editEngineForm.reset();
                showMessage('搜索引擎已更新');
                initNewSearch();
            }
        });
    }

    // 初始渲染
    renderEngines();
}

// 初始化弹出界面中的壁纸设置功能
async function initPopupWallpaperManagement(popupContent) {
    const wallpaperManager = new PopupWallpaperManager();
    await wallpaperManager.loadAll();

    const previewsBox = popupContent.querySelector('.wallpaper-previews');
    const urlList = popupContent.querySelector('#url-wallpapers-list');

    function markSelected(wallpaper) {
        popupContent.querySelectorAll('.wallpaper-preview').forEach(preview => {
            preview.classList.toggle('selected', preview.dataset.wallpaper === wallpaper);
        });
    }

    async function useWallpaper(wallpaper) {
        if (!await wallpaperManager.saveWallpaper(wallpaper)) return;
        wallpaperManager.applyWallpaper(wallpaper);
        markSelected(wallpaper);
        showMessage('壁纸已设置');
    }

    function previewExists(wallpaper) {
        if (!previewsBox) return true;
        return Array.from(previewsBox.children).some(preview => preview.dataset.wallpaper === wallpaper);
    }

    // 删除壁纸：确认后从列表里摘掉；删的如果正是当前壁纸就退回默认，
    // 否则背景会继续挂着一张已经不存在的图。
    function confirmRemove(wallpaper, previewElement) {
        showConfirmDialog('删除壁纸', '确定要删除这个壁纸吗？', async () => {
            await wallpaperManager.removeUploadedWallpaper(wallpaper);
            if (wallpaperManager.currentWallpaper === wallpaper) {
                await wallpaperManager.saveWallpaper('white');
                wallpaperManager.applyWallpaper('white');
                markSelected('white');
            }
            if (previewElement) previewElement.remove();
            renderUrlList();
            showMessage('壁纸已删除');
        });
    }

    // 已上传 / URL 壁纸的预览卡：点选应用，右上角删除。
    // 缩略图用 style 赋值，不拼进 innerHTML —— base64 动辄几 MB，拼进去等于白造一个大字符串。
    function createPreview(wallpaper) {
        const preview = document.createElement('div');
        preview.className = 'wallpaper-preview';
        preview.dataset.wallpaper = wallpaper;

        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumbnail';
        thumb.style.backgroundImage = `url('${cssUrl(wallpaper)}')`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.backgroundPosition = 'center';

        const removeButton = document.createElement('button');
        removeButton.className = 'wallpaper-delete-btn';
        removeButton.innerHTML = '&times;';

        preview.appendChild(thumb);
        preview.appendChild(removeButton);

        preview.addEventListener('click', function() {
            useWallpaper(wallpaper);
        });
        removeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            confirmRemove(wallpaper, preview);
        });
        return preview;
    }

    // 内置壁纸（默认渐变 + img/1~3）：只有「点选应用」，没有删除按钮。
    // 只在这一处绑，后面新加的预览卡自带处理器 —— 原来两处都绑，上传的壁纸点了会执行两遍。
    popupContent.querySelectorAll('.wallpaper-preview').forEach(preview => {
        const wallpaper = preview.dataset.wallpaper;
        if (!wallpaper) return;
        preview.addEventListener('click', function() {
            useWallpaper(wallpaper);
        });
    });

    // 已保存的壁纸（base64 与 URL）补上预览卡
    function addUploadedPreviews() {
        if (!previewsBox) return;
        wallpaperManager.uploadedWallpapers.forEach(wallpaper => {
            if (previewExists(wallpaper)) return;
            previewsBox.appendChild(createPreview(wallpaper));
        });
    }

    function renderUrlList() {
        if (!urlList) return;
        const urls = wallpaperManager.uploadedWallpapers.filter(item => item.startsWith('http'));
        urlList.innerHTML = '';
        if (!urls.length) {
            urlList.innerHTML = '<p style="font-size: 0.8rem; color: rgba(0, 0, 0, 0.6); text-align: center; padding: 12px;">暂无URL壁纸</p>';
            return;
        }
        // 用 DOM 节点而不是 innerHTML：URL 是用户手填的，拼字符串既要转义、又怕
        // 单引号截断 CSS url()。直接建节点，dataset / textContent 都不需要转义。
        urls.forEach(url => {
            const item = document.createElement('div');
            item.className = 'url-wallpaper-item';
            item.dataset.url = url;

            const thumb = document.createElement('div');
            thumb.className = 'url-wallpaper-thumbnail';
            thumb.style.backgroundImage = `url('${cssUrl(url)}')`;

            const info = document.createElement('div');
            info.className = 'url-wallpaper-info';
            const urlText = document.createElement('div');
            urlText.className = 'url-wallpaper-url';
            urlText.textContent = url;
            info.appendChild(urlText);

            const actions = document.createElement('div');
            actions.className = 'url-wallpaper-actions';
            const applyBtn = document.createElement('button');
            applyBtn.className = 'url-wallpaper-btn apply';
            applyBtn.dataset.action = 'apply';
            applyBtn.textContent = '应用';
            const delBtn = document.createElement('button');
            delBtn.className = 'url-wallpaper-btn delete';
            delBtn.dataset.action = 'delete';
            delBtn.textContent = '删除';
            actions.appendChild(applyBtn);
            actions.appendChild(delBtn);

            item.appendChild(thumb);
            item.appendChild(info);
            item.appendChild(actions);
            urlList.appendChild(item);
        });
    }

    // URL 列表的按钮走一个委托：每次重渲染不必再重新绑一遍（原来每项两个监听器）
    if (urlList) {
        urlList.addEventListener('click', function(e) {
            const button = e.target.closest ? e.target.closest('.url-wallpaper-btn') : null;
            if (!button) return;
            const item = button.closest('.url-wallpaper-item');
            const url = item && item.dataset.url;
            if (!url) return;
            if (button.dataset.action === 'apply') {
                useWallpaper(url);
                return;
            }
            const previewElement = previewsBox
                ? Array.from(previewsBox.children).find(preview => preview.dataset.wallpaper === url)
                : null;
            confirmRemove(url, previewElement);
        });
    }

    // 本地上传
    const fileInput = popupContent.querySelector('#wallpaper-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async function() {
            const file = fileInput.files[0];
            if (!file) return;
            const base64Image = await wallpaperManager.handleImageUpload(file);
            if (!base64Image) {
                showMessage('上传失败，请重试', 'error');
                return;
            }
            await wallpaperManager.addUploadedWallpaper(base64Image);
            if (await wallpaperManager.saveWallpaper(base64Image)) {
                wallpaperManager.applyWallpaper(base64Image);
                if (!previewExists(base64Image)) previewsBox.appendChild(createPreview(base64Image));
                markSelected(base64Image);
                showMessage('壁纸已上传并设置');
            }
            // 清空选择，否则再选同一张图不会触发 change
            fileInput.value = '';
        });
    }

    // URL 添加
    const urlInput = popupContent.querySelector('#wallpaper-url');
    const setUrlButton = popupContent.querySelector('#set-wallpaper-url');
    if (urlInput && setUrlButton) {
        setUrlButton.addEventListener('click', async function() {
            const url = urlInput.value.trim();
            if (!url) return;
            await wallpaperManager.addUploadedWallpaper(url);
            if (!previewExists(url)) previewsBox.appendChild(createPreview(url));
            renderUrlList();
            urlInput.value = '';
            showMessage('URL壁纸已添加');
        });
    }

    addUploadedPreviews();
    renderUrlList();
    // 初始选中状态
    markSelected(wallpaperManager.currentWallpaper);
}

// 初始化设置界面
async function initPopupSettingsManagement(popupContent) {
    // 加载保存的设置
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('startpage-faviconapi');
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error('Load settings error:', error);
        }
        return {
            iconApiUrl: ''
        };
    }

    // 保存设置
    function saveSettings(settings) {
        try {
            localStorage.setItem('startpage-faviconapi', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Save settings error:', error);
            return false;
        }
    }

    // 加载设置并填充表单
    const settings = loadSettings();
    const iconApiUrlInput = popupContent.querySelector('#icon-api-url');
    if (iconApiUrlInput) {
        iconApiUrlInput.value = settings.iconApiUrl;
    }

    // 图标缓存：提示当前图标源能不能被缓存，并给出清空入口
    const iconCacheApi = (typeof iconCache !== 'undefined' && iconCache) ? iconCache : null;
    const cacheHint = popupContent.querySelector('#icon-cache-hint');
    const cacheStatus = popupContent.querySelector('#icon-cache-status');

    function currentApiTemplate() {
        return (iconApiUrlInput && iconApiUrlInput.value.trim()) || DEFAULT_ICON_API;
    }

    function refreshCacheHint() {
        if (!cacheHint) return;
        if (!iconCacheApi) { cacheHint.textContent = ''; return; }
        // 名单直接问浏览器要，保证和 manifest 永远一致
        const allowed = iconCacheApi.isUrlAllowed(currentApiTemplate().replace('{domain}', 'example.com'));
        if (allowed === null) {
            cacheHint.textContent = ''; // 不在扩展环境里（本地预览），不误报
        } else if (allowed) {
            // 一切正常时不显示任何提示，只在图标源不在名单里时才给出警告
            cacheHint.textContent = '';
        } else {
            cacheHint.textContent = '这个图标源不在扩展的可访问名单里：图标照常显示，但不会被缓存。';
            cacheHint.style.color = '#666';
        }
    }

    function refreshCacheStatus() {
        if (!cacheStatus || !iconCacheApi) return;
        cacheStatus.textContent = '已缓存 ' + iconCacheApi.count() + ' 个图标，' +
            iconCacheApi.TTL_DAYS + ' 天后自动重新抓取。';
    }

    refreshCacheHint();
    refreshCacheStatus();
    if (iconApiUrlInput) iconApiUrlInput.addEventListener('input', refreshCacheHint);

    const clearCacheButton = popupContent.querySelector('#clear-icon-cache');
    if (clearCacheButton) {
        clearCacheButton.addEventListener('click', async () => {
            if (!iconCacheApi) return;
            clearCacheButton.disabled = true;
            await iconCacheApi.clearAll();
            clearCacheButton.disabled = false;
            refreshCacheStatus();
            // 清空后内存里的 blob 地址已经失效，必须整块重建，别让页面继续挂着旧引用
            renderShortcuts(true);
            showMessage('图标缓存已清空，下次打开会重新抓取');
        });
    }

    // 绑定保存设置按钮
    const saveSettingsButton = popupContent.querySelector('#save-settings');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            const newSettings = {
                iconApiUrl: iconApiUrlInput.value.trim()
            };
            if (saveSettings(newSettings)) {
                // 换了图标源也**不清缓存**：抽屉是按域名存的，跟这张图是哪个源抓来的无关。
                // 清掉的话换一次源全部图标都要重抓，当前源拿不到的那几个就集体退回字母。
                showMessage('设置已保存');
                refreshCacheHint();
                refreshCacheStatus();
                // 重新渲染快捷方式以应用新的图标 API
                renderShortcuts();
            } else {
                showMessage('保存设置失败', 'error');
            }
        });
    }
}

// ============================================================
// 扩展桥接：支持「点扩展图标收藏」和「右键菜单收藏」
// ------------------------------------------------------------
// 读写、队列合并、分组镜像都在 shared.js（起始页与弹窗共用同一份）。
// 这里只负责启动时结算积压队列，并挂上后续同步监听。
// ============================================================

// 初始化桥接：先结算积压的收藏，再挂上后续的同步监听
async function qdbInitBridge() {
    if (!QDB.hasBridge()) return;

    try {
        const added = await QDB.drainPendingSites();
        if (added > 0) {
            await renderShortcuts();
            showMessage(`已从右键菜单添加 ${added} 个网站`);
        }
    } catch (error) {
        console.error('Bridge init error:', error);
    }

    // 后台写入待归类队列时（起始页正开着）实时同步
    try {
        chrome.storage.onChanged.addListener(async function(changes, areaName) {
            if (areaName !== 'local' || !changes[QDB.PENDING_KEY]) return;
            const added = await QDB.drainPendingSites();
            if (added > 0) {
                await renderShortcuts();
                showMessage(`已从右键菜单添加 ${added} 个网站`);
            }
        });
    } catch (error) {
        console.error('Bridge listener error:', error);
    }

    // 弹窗写的是同一个 localStorage，靠 storage 事件同步；
    // 写入方自己不会收到该事件，所以这里不会自激成循环
    window.addEventListener('storage', function(event) {
        if (event.key === QDB.DATA_KEY) {
            renderShortcuts();
        }
    });
}

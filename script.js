// 数据管理类
class PopupDataManager {
    constructor() {
        this.data = {
            groups: []
        };
    }

    // 从localStorage加载数据
    async loadData() {
        try {
            const savedData = localStorage.getItem('startpage-data');
            if (savedData) {
                try {
                    this.data = JSON.parse(savedData);
                } catch (error) {
                    console.error('Failed to parse saved data:', error);
                    this.initDefaultData();
                }
            } else {
                this.initDefaultData();
            }
        } catch (error) {
            console.error('Load data error:', error);
            this.initDefaultData();
        }
    }

    // 初始化默认数据
    // 注意：壁纸不在这里 —— 它已拆到独立的 startpage-wallpaper 键，
    // 见 readWallpaperStore / writeWallpaperStore。
    initDefaultData() {
        this.data = {
            groups: []
        };
        this.saveData();
    }

    // 保存数据
    async saveData() {
        try {
            localStorage.setItem('startpage-data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Save data error:', error);
        }
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
            // 只在用户提供了自定义图标时才保存icon值
            const newSite = {
                id,
                ...siteData
            };
            // 只有当用户明确提供了图标时才保存icon字段
            if (siteData.icon && (siteData.icon.startsWith('http') || siteData.icon.startsWith('data:'))) {
                newSite.icon = siteData.icon;
            }
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
                // 只在用户提供了自定义图标时才更新icon值
                if (siteData.icon) {
                    if (siteData.icon && (siteData.icon.startsWith('http') || siteData.icon.startsWith('data:'))) {
                        site.icon = siteData.icon;
                    } else {
                        // 如果用户清空了图标输入框，删除icon字段
                        delete site.icon;
                    }
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
        this.defaultEngines = [
            { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q={q}' },
            { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}' },
            { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={q}' },
        ];
    }

    // 加载数据
    async loadData() {
        try {
            const localData = localStorage.getItem('searchEngines');
            if (localData) {
                try {
                    this.engines = JSON.parse(localData);
                } catch (error) {
                    console.error('Failed to parse saved engines:', error);
                    this.engines = [...this.defaultEngines];
                    this.saveData();
                }
            } else {
                this.engines = [...this.defaultEngines];
                this.saveData();
            }
        } catch (error) {
            console.error('Load engines error:', error);
            this.engines = [...this.defaultEngines];
            this.saveData();
        }
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

    // 设置默认搜索引擎
    async setDefaultEngine(id) {
        this.engines.forEach(engine => {
            engine.default = engine.id === id;
        });
        await this.saveData();
    }

    // 获取默认搜索引擎
    getDefaultEngine() {
        return this.engines.find(engine => engine.default) || this.engines[0];
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

    // 应用壁纸
    applyWallpaper(wallpaper) {
        const body = document.body;
        
        if (wallpaper === 'white') {
            body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        } else if (wallpaper.startsWith('img/')) {
            // 处理本地图片
            body.style.background = `url('${wallpaper}') no-repeat center center fixed`;
            body.style.backgroundSize = 'cover';
        } else if (wallpaper.startsWith('data:')) {
            // 处理base64图片
            body.style.background = `url('${wallpaper}') no-repeat center center fixed`;
            body.style.backgroundSize = 'cover';
        } else if (wallpaper.startsWith('http')) {
            // 处理URL图片
            body.style.background = `url('${wallpaper}') no-repeat center center fixed`;
            body.style.backgroundSize = 'cover';
        }
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
    try {
        return new URL(url).hostname;
    } catch (error) {
        return String(url || '').replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
    }
}

// 图标加载失败时的兜底：显示站点名首字母。
// 注意 <img> 只藏起来、不删掉 —— 这个图标很可能马上就从另一个图标源拿到了，
// 到时候直接换个 src 就能换回来；删掉的话本次会话就只能一直看字母。
//
// 尺寸不再由这里逐个写内联样式（原来每渲染一次就是 72 × 3 次样式写入），
// 已交给 style.css 的 .site-icon / .popup-site-icon-img 规则。
//
// 监听方式也改成「容器级 + 捕获阶段」一个监听器统管：error 事件不冒泡，
// 但捕获阶段能拿到，所以不必再给每个图标各挂一个（原来每次渲染 72 个）。
const iconFallbackBound = new WeakSet();

function bindIconFallback(container) {
    if (!container || iconFallbackBound.has(container)) return;
    iconFallbackBound.add(container);
    container.addEventListener('error', function(e) {
        const img = e.target;
        if (!img || !img.classList) return;
        if (!img.classList.contains('site-icon') && !img.classList.contains('popup-site-icon-img')) return;
        const parent = img.parentElement;
        const siteName = img.dataset.siteName;
        if (!parent || !siteName) { img.remove(); return; }
        img.style.display = 'none';
        if (parent.querySelector('.icon-fallback-text')) return; // 已经有字母了，别再加一个
        const fallback = document.createElement('span');
        fallback.className = 'icon-fallback-text';
        fallback.textContent = siteName.charAt(0).toUpperCase();
        parent.appendChild(fallback);
    }, true);
}

// 实时更新时间和日期
// 缓存元素引用与上一次的日期字符串：每秒只写一次时钟，
// 日期没变就不重算、不写 DOM。
let timeElement = null;
let dateElement = null;
let lastDateString = '';

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
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dateString = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
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
    const engine = engines.find(e => e.id === engineId);
    if (engine) {
        return engine.url.replace('{q}', encodeURIComponent(query));
    }
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// 导出配置
async function exportConfig() {
    try {
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
        const engines = await loadSearchEngines();
        config.data.searchEngines = engines;

        // 获取壁纸数据（只导出 URL 壁纸；base64 上传图太大，不适合塞进配置文件）
        config.data.uploadedWallpapers = readWallpaperStore().uploaded.filter(w =>
            typeof w === 'string' && (w.startsWith('http://') || w.startsWith('https://'))
        );

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
        color: ${type === 'error' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)'};
        font-weight: 400;
        font-size: 14px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
    `;

    document.body.appendChild(message);

    // 3秒后自动移除
    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => message.remove(), 300);
    }, 3000);
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

// 导入配置
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

            if (!config.data) {
                throw new Error('配置文件格式不正确');
            }

            showConfirmDialog('导入配置', '导入配置将覆盖当前设置，确定要继续吗？', async () => {
                // 导入分组数据
                if (config.data.groups && config.data.groups.length > 0) {
                    const currentData = await loadShortcutsData();
                    const mergedData = {
                        ...currentData,
                        groups: config.data.groups
                    };
                    writeStartpageData(mergedData);
                }

                // 导入搜索引擎数据
                if (config.data.searchEngines && config.data.searchEngines.length > 0) {
                    localStorage.setItem('searchEngines', JSON.stringify(config.data.searchEngines));
                }

                // 导入壁纸数据（只覆盖 URL 壁纸列表，当前壁纸与本地已上传的图保持不动）
                if (Array.isArray(config.data.uploadedWallpapers)) {
                    const wallpaperStore = readWallpaperStore();
                    writeWallpaperStore({
                        current: wallpaperStore.current,
                        uploaded: config.data.uploadedWallpapers
                    });
                }

                // 导入图标来源 API 设置
                if (config.data.iconApiUrl) {
                    const settings = {
                        iconApiUrl: config.data.iconApiUrl
                    };
                    localStorage.setItem('startpage-faviconapi', JSON.stringify(settings));
                }

                showMessage('配置导入成功！页面将自动刷新。');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
        } catch (error) {
            console.error('Import config error:', error);
            showMessage('配置导入失败：' + error.message, 'error');
        }
    };

    input.click();
}

// 加载搜索引擎数据
async function loadSearchEngines() {
    try {
        const localData = localStorage.getItem('searchEngines');
        if (localData) {
            return JSON.parse(localData);
        }

        return DEFAULT_SEARCH_ENGINES;
    } catch (error) {
        console.error('Load search engines error:', error);
        return DEFAULT_SEARCH_ENGINES;
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

    // 加载搜索引擎
    const engines = await loadSearchEngines();
    
    // 清空并重新生成引擎选项
    engineDropdown.innerHTML = '';
    engines.forEach(engine => {
        const option = document.createElement('div');
        option.className = 'engine-option';
        option.dataset.engine = engine.id;
        option.textContent = engine.name;
        engineDropdown.appendChild(option);
    });
    
    // 引擎选择器点击事件
    selectedEngine.onclick = function(e) {
        e.stopPropagation();
        searchEngineSelector.classList.toggle('open');
    };

    // 为引擎选项添加点击事件
    const engineOptions = document.querySelectorAll('.engine-option');
    engineOptions.forEach(option => {
        option.onclick = function(e) {
            e.stopPropagation();
            const engineId = this.dataset.engine;
            const engineName = this.textContent;
            currentEngine.textContent = engineName;
            searchEngineSelector.classList.remove('open');
        };
    });

    // 搜索表单提交事件
    searchForm.onsubmit = async function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            const currentEngineName = currentEngine.textContent;
            const engineId = Array.from(engineOptions).find(option => 
                option.textContent === currentEngineName
            ).dataset.engine;
            const searchUrl = await getSearchUrl(query, engineId);
            window.open(searchUrl, '_blank');
            searchInput.value = '';
        }
    };

    // 回车键搜索
    searchInput.onkeypress = async function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                const currentEngineName = currentEngine.textContent;
                const engineId = Array.from(engineOptions).find(option => 
                    option.textContent === currentEngineName
                ).dataset.engine;
                const searchUrl = await getSearchUrl(query, engineId);
                window.open(searchUrl, '_blank');
                this.value = '';
            }
        }
    };

    // 点击外部关闭下拉菜单
    document.onclick = function(e) {
        // 关闭搜索引擎下拉框
        if (!searchEngineSelector.contains(e.target)) {
            searchEngineSelector.classList.remove('open');
        }
        
        // 关闭管理下拉菜单
        const manageDropdown = document.querySelector('.manage-dropdown-menu');
        const manageButton = document.querySelector('.manage-button');
        if (manageDropdown && !manageDropdown.contains(e.target) && manageButton && !manageButton.contains(e.target)) {
            manageDropdown.classList.remove('show');
        }
    };
}

// 快捷方式区域的拖拽：改成挂在容器上的事件委托，只绑一次。
// 原来是给每个图标挂 7 个监听器、每次重渲染全部重绑（一次渲染产生 N×7 个新闭包），
// 现在只留一套容器级处理器，hover 位移交回 CSS，重渲染不再有任何绑定开销。
let shortcutsDragBound = false;
let draggedItem = null;
let draggedGroup = null;

function bindShortcutsDragOnce() {
    if (shortcutsDragBound) return;
    const container = document.querySelector('.shortcuts');
    if (!container) return;
    shortcutsDragBound = true;

    function clearDragOver() {
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    // 同一个图标内部（图标图 -> 文字）移动不算离开，避免 drag-over 闪烁
    function enteredOther(target, selector, current) {
        if (!target || typeof target.closest !== 'function') return true;
        return target.closest(selector) !== current;
    }

    container.addEventListener('dragstart', function (event) {
        const item = event.target.closest('.shortcut-item');
        const group = event.target.closest('.shortcut-group');
        if (item) {
            draggedItem = item;
            draggedGroup = null;
            item.classList.add('dragging');
        } else if (group) {
            draggedGroup = group;
            draggedItem = null;
            group.classList.add('dragging');
        } else {
            return;
        }
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', '');
        }
    });

    container.addEventListener('dragover', function (event) {
        const item = event.target.closest('.shortcut-item');
        const group = event.target.closest('.shortcut-group');
        if (!item && !group) return;
        event.preventDefault();
        // 拖网站：同组换位、跨组移动都允许；拖分组：允许换序
        if (event.dataTransfer && (draggedItem || (group && draggedGroup))) {
            event.dataTransfer.dropEffect = 'move';
        }
    });

    container.addEventListener('dragenter', function (event) {
        const item = event.target.closest('.shortcut-item');
        if (item) {
            if (draggedItem && draggedItem !== item) item.classList.add('drag-over');
            return;
        }
        const group = event.target.closest('.shortcut-group');
        if (group && draggedGroup && draggedGroup !== group) group.classList.add('drag-over');
    });

    container.addEventListener('dragleave', function (event) {
        const item = event.target.closest('.shortcut-item');
        if (item) {
            if (enteredOther(event.relatedTarget, '.shortcut-item', item)) item.classList.remove('drag-over');
            return;
        }
        const group = event.target.closest('.shortcut-group');
        if (group && enteredOther(event.relatedTarget, '.shortcut-group', group)) {
            group.classList.remove('drag-over');
        }
    });

    container.addEventListener('drop', async function (event) {
        const item = event.target.closest('.shortcut-item');
        const group = event.target.closest('.shortcut-group');
        if (!item && !group) return;
        event.preventDefault();

        // ---- 拖网站：落到图标上就插到它前/后，落到分组空白处就移到该分组末尾 ----
        if (draggedItem) {
            let reference = null;
            let targetContainer;
            if (item) {
                item.classList.remove('drag-over');
                if (draggedItem === item) return;
                reference = item;
                targetContainer = item.closest('.shortcut-items');
            } else {
                targetContainer = group.querySelector('.shortcut-items');
            }
            if (!targetContainer) return;

            if (reference) {
                const siblings = Array.from(targetContainer.children);
                const from = siblings.indexOf(draggedItem);
                const to = siblings.indexOf(reference);
                if (to === -1) return;
                // 同组内按拖动方向决定插到目标前还是后；跨组时 from 为 -1，插到目标前
                targetContainer.insertBefore(
                    draggedItem,
                    from !== -1 && from < to ? reference.nextSibling : reference
                );
            } else if (targetContainer !== draggedItem.parentElement) {
                targetContainer.appendChild(draggedItem);
            }
            await saveSiteLayout();
            return;
        }

        // ---- 拖分组 ----
        if (!group || !draggedGroup || draggedGroup === group) return;
        group.classList.remove('drag-over');

        const groupsContainer = group.parentElement;
        const groupsArray = Array.from(groupsContainer.children);
        const draggedIndex = groupsArray.indexOf(draggedGroup);
        const dropIndex = groupsArray.indexOf(group);
        if (draggedIndex === -1 || dropIndex === -1) return;

        groupsContainer.insertBefore(draggedGroup, draggedIndex < dropIndex ? group.nextSibling : group);
        await saveNewGroupOrder();
    });

    container.addEventListener('dragend', function () {
        if (draggedItem) draggedItem.classList.remove('dragging');
        if (draggedGroup) draggedGroup.classList.remove('dragging');
        draggedItem = null;
        draggedGroup = null;
        clearDragOver();
    });

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

// ---------------- 起始页数据读写（带解析缓存） ----------------
// startpage-data 里同时装着分组、当前壁纸和「已上传壁纸」（上传的是 base64，可能好几 MB），
// 而 renderShortcuts / 拖拽排序这些热路径会反复读它。缓存以「原始字符串」为凭据：
// 任何一处直接写 localStorage 都会让字符串变掉，缓存自动失效，
// 所以不需要在各处手工清缓存，也不会读到脏数据。
let startpageRawCache;
let startpageDataCache;
let startpageCached = false;

function readStartpageData() {
    const raw = localStorage.getItem('startpage-data');
    if (startpageCached && startpageRawCache === raw) {
        return startpageDataCache;
    }

    let data;
    try {
        data = raw ? JSON.parse(raw) : getDefaultShortcutsData();
    } catch (error) {
        console.error('Failed to parse saved data:', error);
        data = getDefaultShortcutsData();
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        data = getDefaultShortcutsData();
    }
    if (!Array.isArray(data.groups)) data.groups = [];

    startpageRawCache = raw;
    startpageDataCache = data;
    startpageCached = true;
    return data;
}

function writeStartpageData(data) {
    const raw = JSON.stringify(data);
    localStorage.setItem('startpage-data', raw);
    startpageRawCache = raw;
    startpageDataCache = data;
    startpageCached = true;
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

// 获取默认快捷方式数据
function getDefaultShortcutsData() {
    return {
        groups: []
    };
}

// ---- 图标缓存接入 ----
// 图标地址优先级：站点自带图标 > 本地抽屉里存的 > 图标 API（老办法）
function resolveIconSrc(site, host, iconApi) {
    if (site.icon && (site.icon.startsWith('http') || site.icon.startsWith('data:'))) {
        return site.icon;
    }
    const cached = typeof iconCache !== 'undefined' && iconCache ? iconCache.get(host) : null;
    return cached || iconApi.replace('{domain}', host);
}

// 用过的图标源记一份，作为「这个源拿不到就换那个源」的兜底候选。
// 只记模板字符串（一百来字节），不记图。
const ICON_API_HISTORY_KEY = 'startpage-faviconapi-history';
const ICON_API_HISTORY_MAX = 5;

function readIconApiHistory() {
    try {
        const raw = localStorage.getItem(ICON_API_HISTORY_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list.filter(t => typeof t === 'string' && t) : [];
    } catch (error) {
        return [];
    }
}

function rememberIconApi(template) {
    const value = String(template || '').trim();
    if (!value) return;
    try {
        const list = readIconApiHistory();
        if (list[0] === value) return; // 没变就别白写一次盘
        const next = [value, ...list.filter(t => t !== value)].slice(0, ICON_API_HISTORY_MAX);
        localStorage.setItem(ICON_API_HISTORY_KEY, JSON.stringify(next));
    } catch (error) {
        /* 记不下就算了，只是少一个兜底候选，不影响图标显示 */
    }
}

// 候选图标源，按优先级：当前源 → 历史用过的源 → 内置默认源。
// 不在扩展可访问名单里的会直接跳过：fetch 必然被拦，试了也是白试，还刷一屏报错。
function getIconApiCandidates() {
    const current = getIconApiUrl();
    const ordered = [current, ...readIconApiHistory(), DEFAULT_ICON_API];
    const seen = new Set();
    const candidates = [];

    ordered.forEach(template => {
        if (!template || seen.has(template)) return;
        seen.add(template);
        if (typeof iconCache !== 'undefined' && iconCache) {
            const allowed = iconCache.isUrlAllowed(template.replace('{domain}', 'example.com'));
            if (allowed === false) return; // 明确不在名单里
        }
        candidates.push(template);
    });

    return candidates.length ? candidates : [current];
}

// 把抽屉读进内存。读不出来就当作空抽屉，页面照常跑。
// 把图标抽屉读进内存。读不出来/读太慢都当空抽屉，页面照常跑。
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

// 把刚拿到的图标塞进对应的格子。可能有多个格子（首页 + 管理面板）用同一个域名。
// 注意 <img> 加载失败时只是被藏起来、没被删掉 —— 所以这里能直接换 src 换回来。
function applyCachedIcon(host, blobUrl, container) {
    let nodes;
    try {
        nodes = container.querySelectorAll('[data-icon-host="' + CSS.escape(host) + '"]');
    } catch (error) {
        return; // 域名里出现无法转义的字符就跳过这一张，不影响其他图标
    }
    nodes.forEach(node => {
        if (node.tagName !== 'IMG') return;
        node.style.display = '';
        node.src = blobUrl;
        const parent = node.parentElement;
        const fallback = parent && parent.querySelector('.icon-fallback-text');
        if (fallback) fallback.remove();
    });
}

// 渲染完之后，把本地还没存的图标悄悄抓回来。
// 抓到一张就只换那一张 <img>，不整页重渲染 —— 用户看不到任何闪动。
function warmIconCache(hosts, container) {
    if (typeof iconCache === 'undefined' || !iconCache || !container) return;
    const unique = [...new Set((hosts || []).filter(Boolean))];
    if (!unique.length) return;
    // 候选源按优先级排好交给缓存层：当前源失败会自动换下一个源再试
    const urlFors = getIconApiCandidates().map(template => host => template.replace('{domain}', host));
    iconCache.schedule(unique, urlFors, (host, blobUrl) => applyCachedIcon(host, blobUrl, container));
}

// 渲染快捷方式
async function renderShortcuts() {
    const shortcutsContainer = document.querySelector('.shortcuts');
    if (!shortcutsContainer) return;
    try {
        const data = await loadShortcutsData();
        const groups = data.groups || [];

        // 把分组镜像给后台，右键菜单靠它拼子项
        qdbSyncGroupsMirror(groups);

        // 图标 API 只取一次（原来在 map 里每个站点都读一遍 localStorage + JSON.parse）
        const iconApi = getIconApiUrl();
        const iconHosts = [];

        shortcutsContainer.innerHTML = groups.map(group => `
            <div class="shortcut-group" draggable="true" data-group-id="${group.id}">
                <h3 class="group-title">${group.name}</h3>
                <div class="shortcut-items">
                    ${(group.sites || []).map(site => {
                        const host = siteHostname(site.url);
                        iconHosts.push(host);
                        const src = resolveIconSrc(site, host, iconApi);
                        return `
                        <a href="${site.url}" class="shortcut-item" draggable="true" target="_blank" data-site-id="${site.id}">
                            <div class="shortcut-icon">
                                <img src="${src}" alt="${site.name} icon" class="site-icon" data-site-name="${site.name}" data-icon-host="${host}">
                            </div>
                            <span class="shortcut-name">${site.name}</span>
                        </a>`;
                    }).join('')}
                </div>
            </div>
        `).join('');

        // 只在快捷方式区域内找图标；拖拽走容器级事件委托，这里只需确认已绑定
        // 图标加载失败兜底：容器级捕获监听，一个就够
        bindIconFallback(shortcutsContainer);
        bindShortcutsDragOnce();
        // 本地抽屉里还没有的图标，趁这会儿悄悄补上
        warmIconCache(iconHosts, shortcutsContainer);
    } catch (error) {
        console.error('Render shortcuts error:', error);
    }
}

// 应用壁纸
async function applyWallpaper() {
    try {
        // 壁纸已独立成 startpage-wallpaper 键：这里既不解析分组数据，
        // 也不再需要任何回写 —— 开新标签页的壁纸处理现在是「纯读 + 0 次写盘」
        const wallpaper = readWallpaperStore().current;
        
        // 应用壁纸
        if (wallpaper === 'white') {
            document.body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
            document.body.style.backgroundColor = '#ffffff';
        } else if (wallpaper.startsWith('img/') || wallpaper.startsWith('http') || wallpaper.startsWith('data:')) {
            document.body.style.background = `url('${wallpaper}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundColor = '#ffffff';
            
            // 检查图片是否加载成功
            const img = new Image();
            img.onload = function() {
                // 图片加载成功，保持背景
            };
            img.onerror = function() {
                // 图片加载失败，恢复默认背景
                document.body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
                document.body.style.backgroundColor = '#ffffff';
            };
            img.src = wallpaper;
        }
    } catch (error) {
        console.error('Apply wallpaper error:', error);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async function() {
    // 先把壁纸数据从 startpage-data 里迁到独立键（一次性、幂等、失败安全）
    migrateWallpaperStorage();
    // 把当前用的图标源记进历史，作为「这个源拿不到就换那个源」的兜底候选
    rememberIconApi(getIconApiUrl());
    // 把本地图标抽屉读进内存：渲染时才能同步命中，不必把渲染改成异步
    await loadIconCache();
    await initNewSearch();
    await renderShortcuts();
    await applyWallpaper();
    // 处理右键菜单 / 弹窗攒下的收藏
    await qdbInitBridge();
    
    // 页面淡入动画已移到 style.css 的 page-fade-in。
    // 原来这三行是在渲染「完成之后」才执行的，效果是内容先露一下、再被隐掉、然后淡回来，
    // 既是可见的闪动，又白等一个 100ms 定时器。
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

// 添加搜索框自动完成功能
function initAutocomplete() {
    const searchInput = document.getElementById('new-search-input');
    if (!searchInput) return;
    
    const suggestions = [
        'Google',
        '百度',
        'GitHub',
        'YouTube',
        'Notion',
        'Figma',
        'CodePen',
        'Stack Overflow'
    ];
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        // 这里可以添加更复杂的自动完成逻辑
        // 例如显示建议列表等
    });
}

// 初始化自动完成
initAutocomplete();

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
        case 'export-config':
            exportConfig();
            break;
        case 'import-config':
            importConfig();
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
                                <input type="url" id="popup-site-icon" class="form-control" placeholder="请输入图标URL">
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
                                <input type="url" id="popup-edit-site-icon" class="form-control" placeholder="请输入图标URL">
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
                            <input type="hidden" id="popup-edit-group-id">
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
                        <div class="form-group">
                            <label>本地图标缓存</label>
                            <div id="icon-cache-status" style="color: #666; font-size: 0.85rem; margin-bottom: 8px;"></div>
                            <button id="clear-icon-cache" class="btn btn-secondary">清空图标缓存</button>
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
    }
    
    // 点击外部关闭
    popupContainer.addEventListener('click', function(e) {
        if (e.target === popupContainer) {
            closePopup();
        }
    });
}

// 关闭弹出界面
function closePopup() {
    const popupContainer = document.getElementById('popup-container');
    if (popupContainer) {
        const popupContent = popupContainer.querySelector('.popup-content');
        const popupType = popupContent ? popupContent.dataset.type : null;
        
        popupContainer.classList.remove('show');
        
        // 等待动画完成后清空内容
        setTimeout(() => {
            popupContainer.innerHTML = '';
        }, 300);
    }
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
                    <h5>${group.name}</h5>
                    <div class="popup-group-actions">
                        <button class="btn btn-secondary btn-sm popup-add-site-btn" data-group-id="${group.id}">添加</button>
                        <button class="btn btn-secondary btn-sm popup-edit-group-btn" data-group-id="${group.id}">编辑</button>
                        <button class="btn btn-danger btn-sm popup-delete-group-btn" data-group-id="${group.id}">删除</button>
                    </div>
                </div>
                <div class="popup-sites-list">
                    ${group.sites && group.sites.length > 0 ? group.sites.map(site => {
                        const host = siteHostname(site.url);
                        iconHosts.push(host);
                        const src = resolveIconSrc(site, host, iconApi);
                        return `
                        <div class="popup-site-item">
                            <div class="popup-site-info">
                                <div class="popup-site-icon">
                                    <img src="${src}" alt="${site.name} icon" class="popup-site-icon-img" data-site-name="${site.name}" data-icon-host="${host}">
                                </div>
                                <div class="popup-site-details">
                                    <div class="popup-site-name">${site.name}</div>
                                    <div class="popup-site-url">${site.url}</div>
                                </div>
                            </div>
                            <div class="popup-site-actions">
                                <button class="btn btn-secondary btn-sm popup-edit-site-btn" data-group-id="${group.id}" data-site-id="${site.id}">编辑</button>
                                <button class="btn btn-danger btn-sm popup-delete-site-btn" data-group-id="${group.id}" data-site-id="${site.id}">删除</button>
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
                        // 填充表单
                        popupContent.querySelector('#popup-edit-group-id').value = groupId;
                        popupContent.querySelector('#popup-edit-group-name').value = group.name;
                        
                        showModal('popup-edit-group-modal');
                    }
                }
            });
        }
    }

    // 显示模态框
    function showModal(modalId) {
        const modal = popupContent.querySelector(`#${modalId}`);
        if (modal) {
            modal.style.display = 'flex';
            // 强制重绘以触发动画
            modal.offsetHeight;
            modal.classList.add('modal-show');
            // 添加点击外部关闭功能
            setTimeout(() => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        hideModal(modalId);
                    }
                });
            }, 100);
        }
    }

    // 隐藏模态框
    function hideModal(modalId) {
        const modal = popupContent.querySelector(`#${modalId}`);
        if (modal) {
            modal.classList.remove('modal-show');
            modal.classList.add('modal-hide');
            // 等待动画完成
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('modal-hide');
            }, 400);
        }
    }

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
                const siteData = {
                    name: siteName,
                    url: siteUrl
                };
                // 只有当用户明确提供了图标时才添加icon字段
                if (siteIcon && (siteIcon.startsWith('http') || siteIcon.startsWith('data:'))) {
                    siteData.icon = siteIcon;
                }
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
                const siteData = {
                    name: siteName,
                    url: siteUrl
                };
                // 只有当用户明确提供了图标时才添加icon字段
                if (siteIcon && (siteIcon.startsWith('http') || siteIcon.startsWith('data:'))) {
                    siteData.icon = siteIcon;
                }
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
            const groupId = popupContent.querySelector('#popup-edit-group-id').value;
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
                    <div class="engine-name">${engine.name}</div>
                    <div class="engine-url">${engine.url}</div>
                </div>
                <div class="engine-actions">
                    <button class="btn btn-secondary btn-sm edit-engine-btn" data-id="${engine.id}">编辑</button>
                    <button class="btn btn-danger btn-sm delete-engine-btn" data-id="${engine.id}">删除</button>
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
                    const currentEngineElement = document.getElementById('current-engine');
                    const currentEngineName = currentEngineElement ? currentEngineElement.textContent : '';
                    const engineToDelete = engines.find(e => e.id === engineId);
                    
                    await enginesManager.deleteEngine(engineId);
                    renderEngines();
                    showMessage('搜索引擎已删除');
                    
                    if (engineToDelete && engineToDelete.name === currentEngineName) {
                        const currentEngineElement = document.getElementById('current-engine');
                        if (currentEngineElement) {
                            currentEngineElement.textContent = '必应';
                        }
                    }
                    
                    initNewSearch();
                });
            });
        });
    }

    // 显示模态框
    function showModal(modalId) {
        const modal = popupContent.querySelector(`#${modalId}`);
        if (modal) {
            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.classList.add('modal-show');
            setTimeout(() => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        hideModal(modalId);
                    }
                });
            }, 100);
        }
    }

    // 隐藏模态框
    function hideModal(modalId) {
        const modal = popupContent.querySelector(`#${modalId}`);
        if (modal) {
            modal.classList.remove('modal-show');
            modal.classList.add('modal-hide');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('modal-hide');
            }, 400);
        }
    }

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
    // 初始化壁纸管理器
    const wallpaperManager = new PopupWallpaperManager();
    await wallpaperManager.loadAll();



    // 将已上传的壁纸添加到预览列表
    function addUploadedWallpapersToPreviews() {
        const wallpaperPreviews = popupContent.querySelector('.wallpaper-previews');
        if (!wallpaperPreviews) return;

        wallpaperManager.uploadedWallpapers.forEach(wallpaper => {
            // 检查是否已存在相同的壁纸
            const existingPreview = Array.from(wallpaperPreviews.children).find(p => p.dataset.wallpaper === wallpaper);
            if (!existingPreview) {
                const newPreview = document.createElement('div');
                newPreview.className = 'wallpaper-preview';
                newPreview.dataset.wallpaper = wallpaper;
                newPreview.innerHTML = `
                    <div class="wallpaper-thumbnail" style="background-image: url('${wallpaper}'); background-size: cover; background-position: center;"></div>
                    <button class="wallpaper-delete-btn" data-wallpaper="${wallpaper}">&times;</button>
                `;
                
                // 绑定点击事件
                newPreview.addEventListener('click', async function() {
                    const wallpaper = this.dataset.wallpaper;
                    if (await wallpaperManager.saveWallpaper(wallpaper)) {
                        wallpaperManager.applyWallpaper(wallpaper);
                        
                        // 更新选中状态
                        const previews = popupContent.querySelectorAll('.wallpaper-preview');
                        previews.forEach(p => p.classList.remove('selected'));
                        this.classList.add('selected');
                    }
                });
                
                // 绑定删除按钮事件
                const deleteBtn = newPreview.querySelector('.wallpaper-delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async function(e) {
                        e.stopPropagation();
                        const wallpaper = this.dataset.wallpaper;
                        
                        showConfirmDialog('删除壁纸', '确定要删除这个壁纸吗？', async () => {
                            await wallpaperManager.removeUploadedWallpaper(wallpaper);
                            
                            // 如果删除的是当前壁纸，重置为默认壁纸
                            // 如果删除的正是当前壁纸，重置为默认
                            if (wallpaperManager.currentWallpaper === wallpaper) {
                                await wallpaperManager.saveWallpaper('white');
                                wallpaperManager.applyWallpaper('white');

                                const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                previews.forEach(p => p.classList.remove('selected'));
                                const whitePreview = Array.from(previews).find(p => p.dataset.wallpaper === 'white');
                                if (whitePreview) {
                                    whitePreview.classList.add('selected');
                                }
                            }
                            
                            // 移除预览项
                            newPreview.remove();
                            
                            showMessage('壁纸已删除');
                        });
                    });
                }
                
                // 添加到预览列表
                wallpaperPreviews.appendChild(newPreview);
            }
        });
    }

    // 初始化时添加已上传的壁纸
    addUploadedWallpapersToPreviews();

    // 绑定默认壁纸选择
    const wallpaperPreviews = popupContent.querySelectorAll('.wallpaper-preview');
    wallpaperPreviews.forEach(preview => {
        preview.addEventListener('click', async function() {
            const wallpaper = this.dataset.wallpaper;
            if (await wallpaperManager.saveWallpaper(wallpaper)) {
                wallpaperManager.applyWallpaper(wallpaper);
                showMessage('壁纸已设置');
                
                // 更新选中状态
                wallpaperPreviews.forEach(p => p.classList.remove('selected'));
                this.classList.add('selected');
            }
        });
    });

    // 绑定删除按钮
    const deleteButtons = popupContent.querySelectorAll('.wallpaper-delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const wallpaper = this.dataset.wallpaper;
            
            showConfirmDialog('删除壁纸', '确定要删除这个壁纸吗？', async () => {
                await wallpaperManager.removeUploadedWallpaper(wallpaper);
                
                // 如果删除的是当前壁纸，重置为默认壁纸
                if (wallpaperManager.currentWallpaper === wallpaper) {
                    await wallpaperManager.saveWallpaper('white');
                    wallpaperManager.applyWallpaper('white');
                    
                    // 更新预览列表的选中状态
                    const previews = popupContent.querySelectorAll('.wallpaper-preview');
                    previews.forEach(p => p.classList.remove('selected'));
                    const whitePreview = Array.from(previews).find(p => p.dataset.wallpaper === 'white');
                    if (whitePreview) {
                        whitePreview.classList.add('selected');
                    }
                }
                
                // 移除预览项
                const previewItem = this.closest('.wallpaper-preview');
                if (previewItem) {
                    previewItem.remove();
                }
                
                // 更新URL壁纸列表
                renderUrlWallpapersList();
                
                showMessage('壁纸已删除');
            });
        });
    });

    // 绑定上传壁纸
    const fileInput = popupContent.querySelector('#wallpaper-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const base64Image = await wallpaperManager.handleImageUpload(file);
                if (base64Image) {
                    // 保存到已上传壁纸列表
                    await wallpaperManager.addUploadedWallpaper(base64Image);
                    
                    if (await wallpaperManager.saveWallpaper(base64Image)) {
                        wallpaperManager.applyWallpaper(base64Image);
                        
                        // 将新壁纸添加到已有壁纸列表
                        const wallpaperPreviews = popupContent.querySelector('.wallpaper-previews');
                        if (wallpaperPreviews) {
                            // 检查是否已存在相同的壁纸
                            const existingPreview = Array.from(wallpaperPreviews.children).find(p => p.dataset.wallpaper === base64Image);
                            if (!existingPreview) {
                                const newPreview = document.createElement('div');
                                newPreview.className = 'wallpaper-preview selected';
                                newPreview.dataset.wallpaper = base64Image;
                                newPreview.innerHTML = `
                                    <div class="wallpaper-thumbnail" style="background-image: url('${base64Image}'); background-size: cover; background-position: center;"></div>
                                    <button class="wallpaper-delete-btn" data-wallpaper="${base64Image}">&times;</button>
                                `;
                                
                                // 绑定点击事件
                                newPreview.addEventListener('click', async function() {
                                    const wallpaper = this.dataset.wallpaper;
                                    if (await wallpaperManager.saveWallpaper(wallpaper)) {
                                        wallpaperManager.applyWallpaper(wallpaper);
                                        
                                        // 更新选中状态
                                        const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                        previews.forEach(p => p.classList.remove('selected'));
                                        this.classList.add('selected');
                                    }
                                });
                                
                                // 绑定删除按钮事件
                                const deleteBtn = newPreview.querySelector('.wallpaper-delete-btn');
                                if (deleteBtn) {
                                    deleteBtn.addEventListener('click', async function(e) {
                                        e.stopPropagation();
                                        const wallpaper = this.dataset.wallpaper;
                                        
                                        showConfirmDialog('删除壁纸', '确定要删除这个壁纸吗？', async () => {
                                            await wallpaperManager.removeUploadedWallpaper(wallpaper);
                                            
                                            // 如果删除的是当前壁纸，重置为默认壁纸
                                            if (wallpaperManager.currentWallpaper === wallpaper) {
                                                await wallpaperManager.saveWallpaper('white');
                                                wallpaperManager.applyWallpaper('white');
                                                
                                                // 更新预览列表的选中状态
                                                const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                                previews.forEach(p => p.classList.remove('selected'));
                                                const whitePreview = Array.from(previews).find(p => p.dataset.wallpaper === 'white');
                                                if (whitePreview) {
                                                    whitePreview.classList.add('selected');
                                                }
                                            }
                                            
                                            // 移除预览项
                                            const previewItem = this.closest('.wallpaper-preview');
                                            if (previewItem) {
                                                previewItem.remove();
                                            }
                                            
                                            // 更新URL壁纸列表
                                            renderUrlWallpapersList();
                                            
                                            showMessage('壁纸已删除');
                                        });
                                    });
                                }
                                
                                // 添加到预览列表
                                wallpaperPreviews.appendChild(newPreview);
                                
                                // 移除其他预览项的选中状态
                                const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                previews.forEach(p => {
                                    if (p !== newPreview) {
                                        p.classList.remove('selected');
                                    }
                                });
                            } else {
                                // 如果已存在，更新选中状态
                                const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                previews.forEach(p => p.classList.remove('selected'));
                                existingPreview.classList.add('selected');
                            }
                        }
                        
                        showMessage('壁纸已上传并设置');
                    }
                } else {
                    showMessage('上传失败，请重试');
                }
            }
        });
    }

    // 绑定URL设置壁纸
    const urlInput = popupContent.querySelector('#wallpaper-url');
    const setUrlButton = popupContent.querySelector('#set-wallpaper-url');
    if (urlInput && setUrlButton) {
        setUrlButton.addEventListener('click', async function() {
            const url = urlInput.value.trim();
            if (url) {
                // 保存到已上传壁纸列表
                await wallpaperManager.addUploadedWallpaper(url);
                
                // 将新壁纸添加到已有壁纸列表
                const wallpaperPreviews = popupContent.querySelector('.wallpaper-previews');
                if (wallpaperPreviews) {
                    // 检查是否已存在相同的壁纸
                    const existingPreview = Array.from(wallpaperPreviews.children).find(p => p.dataset.wallpaper === url);
                    if (!existingPreview) {
                        const newPreview = document.createElement('div');
                        newPreview.className = 'wallpaper-preview';
                        newPreview.dataset.wallpaper = url;
                        newPreview.innerHTML = `
                            <div class="wallpaper-thumbnail" style="background-image: url('${url}'); background-size: cover; background-position: center;"></div>
                            <button class="wallpaper-delete-btn" data-wallpaper="${url}">&times;</button>
                        `;
                        
                        // 绑定点击事件
                        newPreview.addEventListener('click', async function() {
                            const wallpaper = this.dataset.wallpaper;
                            if (await wallpaperManager.saveWallpaper(wallpaper)) {
                                wallpaperManager.applyWallpaper(wallpaper);
                                
                                // 更新选中状态
                                const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                previews.forEach(p => p.classList.remove('selected'));
                                this.classList.add('selected');
                            }
                        });
                        
                        // 绑定删除按钮事件
                        const deleteBtn = newPreview.querySelector('.wallpaper-delete-btn');
                        if (deleteBtn) {
                            deleteBtn.addEventListener('click', async function(e) {
                                e.stopPropagation();
                                const wallpaper = this.dataset.wallpaper;
                                
                                showConfirmDialog('删除壁纸', '确定要删除这个壁纸吗？', async () => {
                                    await wallpaperManager.removeUploadedWallpaper(wallpaper);
                                    
                                    // 如果删除的是当前壁纸，重置为默认壁纸
                                    // 如果删除的正是当前壁纸，重置为默认
                                    if (wallpaperManager.currentWallpaper === wallpaper) {
                                        await wallpaperManager.saveWallpaper('white');
                                        wallpaperManager.applyWallpaper('white');

                                        const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                        previews.forEach(p => p.classList.remove('selected'));
                                        const whitePreview = Array.from(previews).find(p => p.dataset.wallpaper === 'white');
                                        if (whitePreview) {
                                            whitePreview.classList.add('selected');
                                        }
                                    }
                                    
                                    // 移除预览项
                                    newPreview.remove();
                                    
                                    // 更新URL壁纸列表
                                    renderUrlWallpapersList();
                                    
                                    showMessage('壁纸已删除');
                                });
                            });
                        }
                        
                        // 添加到预览列表
                        wallpaperPreviews.appendChild(newPreview);
                    }
                }
                
                // 更新URL壁纸列表
                renderUrlWallpapersList();
                
                urlInput.value = '';
                showMessage('URL壁纸已添加');
            }
        });

        // 渲染URL壁纸列表
        function renderUrlWallpapersList() {
            const urlWallpapersList = popupContent.querySelector('#url-wallpapers-list');
            if (!urlWallpapersList) return;
            
            // 过滤出所有URL类型的壁纸
            const urlWallpapers = wallpaperManager.uploadedWallpapers.filter(w => w.startsWith('http'));
            
            if (urlWallpapers.length === 0) {
                urlWallpapersList.innerHTML = '<p style="font-size: 0.8rem; color: rgba(0, 0, 0, 0.6); text-align: center; padding: 12px;">暂无URL壁纸</p>';
                return;
            }
            
            urlWallpapersList.innerHTML = urlWallpapers.map(url => `
                <div class="url-wallpaper-item" data-url="${url}">
                    <div class="url-wallpaper-thumbnail" style="background-image: url('${url}');"></div>
                    <div class="url-wallpaper-info">
                        <div class="url-wallpaper-url">${url}</div>
                    </div>
                    <div class="url-wallpaper-actions">
                        <button class="url-wallpaper-btn apply" data-action="apply">应用</button>
                        <button class="url-wallpaper-btn delete" data-action="delete">删除</button>
                    </div>
                </div>
            `).join('');
            
            // 绑定按钮事件
            urlWallpapersList.querySelectorAll('.url-wallpaper-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const action = this.dataset.action;
                    const item = this.closest('.url-wallpaper-item');
                    const url = item.dataset.url;
                    
                    if (action === 'apply') {
                        if (await wallpaperManager.saveWallpaper(url)) {
                            wallpaperManager.applyWallpaper(url);
                            
                            // 更新预览列表的选中状态
                            const previews = popupContent.querySelectorAll('.wallpaper-preview');
                            previews.forEach(p => p.classList.remove('selected'));
                            const matchingPreview = Array.from(previews).find(p => p.dataset.wallpaper === url);
                            if (matchingPreview) {
                                matchingPreview.classList.add('selected');
                            }
                            
                            showMessage('壁纸已应用');
                        }
                    } else if (action === 'delete') {
                        showConfirmDialog('删除壁纸', '确定要删除这个壁纸吗？', async () => {
                            // 从列表中删除
                            await wallpaperManager.removeUploadedWallpaper(url);
                            
                            // 从预览列表中删除
                            const wallpaperPreviews = popupContent.querySelector('.wallpaper-previews');
                            if (wallpaperPreviews) {
                                const previewToRemove = Array.from(wallpaperPreviews.children).find(p => p.dataset.wallpaper === url);
                                if (previewToRemove) {
                                    previewToRemove.remove();
                                }
                            }
                            
                            // 如果删除的是当前壁纸，重置为默认
                            if (wallpaperManager.currentWallpaper === url) {
                                await wallpaperManager.saveWallpaper('white');
                                wallpaperManager.applyWallpaper('white');
                                
                                // 更新预览列表的选中状态
                                const previews = popupContent.querySelectorAll('.wallpaper-preview');
                                previews.forEach(p => p.classList.remove('selected'));
                                const whitePreview = Array.from(previews).find(p => p.dataset.wallpaper === 'white');
                                if (whitePreview) {
                                    whitePreview.classList.add('selected');
                                }
                            }
                            
                            // 重新渲染URL列表
                            renderUrlWallpapersList();
                            
                            showMessage('URL壁纸已删除');
                        });
                    }
                });
            });
        }

        // 初始化时渲染URL壁纸列表
        renderUrlWallpapersList();
    }

    // 初始化选中状态
    const currentWallpaper = wallpaperManager.currentWallpaper;
    const allWallpaperPreviews = popupContent.querySelectorAll('.wallpaper-preview');
    allWallpaperPreviews.forEach(preview => {
        if (preview.dataset.wallpaper === currentWallpaper) {
            preview.classList.add('selected');
        }
    });
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
            cacheHint.style.color = '#c62828';
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
                // 只把新源记进历史，供「这个源拿不到就换那个源」兜底。
                rememberIconApi(newSettings.iconApiUrl || DEFAULT_ICON_API);
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
// 起始页与弹窗（popup.html）同属 chrome-extension://<id> 同一源，直接共用同一个
// localStorage，所以弹窗能直接读写 startpage-data。
// 但 background service worker 里没有 localStorage，它只能往 chrome.storage.local 写，
// 因此约定两个桥接键：
//   - groups-mirror：分组列表镜像，供右键菜单拼出分组子项
//   - pending-sites：待归类队列，由起始页 / 弹窗在读取时合并进 startpage-data
// 数据仍然以 localStorage['startpage-data'] 为唯一权威来源。
// ============================================================

const QDB_MIRROR_KEY = 'groups-mirror';
const QDB_PENDING_KEY = 'pending-sites';
const QDB_INBOX_GROUP_NAME = '待分组';

function qdbHasBridge() {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
}

function qdbBridgeGet(key) {
    return new Promise(resolve => {
        if (!qdbHasBridge()) return resolve(undefined);
        try {
            chrome.storage.local.get(key, function(result) {
                resolve(result ? result[key] : undefined);
            });
        } catch (error) {
            console.error('Bridge read error:', error);
            resolve(undefined);
        }
    });
}

function qdbBridgeSet(payload) {
    return new Promise(resolve => {
        if (!qdbHasBridge()) return resolve(false);
        try {
            chrome.storage.local.set(payload, function() {
                // 顺带把「写成功了没」告诉调用方，分组镜像靠它决定要不要记指纹
                resolve(!chrome.runtime.lastError);
            });
        } catch (error) {
            console.error('Bridge write error:', error);
            resolve(false);
        }
    });
}

// 归一化 URL，用于判重（忽略锚点和结尾斜杠）
function qdbNormalizeUrl(url) {
    try {
        const parsed = new URL(url);
        parsed.hash = '';
        return parsed.href.replace(/\/$/, '');
    } catch (error) {
        return String(url || '');
    }
}

// 把分组列表镜像给后台，右键菜单靠它拼子项。
// 内容没变就**不写盘**：这个函数每次 renderShortcuts() 都会调，
// 而原来开一个新标签页会往 chrome.storage 写两次完全相同的分组列表
// （renderShortcuts 一次、qdbInitBridge 一次），纯属白跑 IPC + 落盘。
let qdbMirrorFingerprint = null;

function qdbSyncGroupsMirror(groups) {
    if (!qdbHasBridge()) return Promise.resolve();
    const list = (Array.isArray(groups) ? groups : []).map(function(group) {
        return { id: group.id, name: group.name };
    });
    const fingerprint = JSON.stringify(list);
    if (fingerprint === qdbMirrorFingerprint) return Promise.resolve();

    return qdbBridgeSet({ [QDB_MIRROR_KEY]: list }).then(function(ok) {
        // 只在真的写成功后才记指纹；写失败就不记，下次开新标签页会自己重试
        if (ok) qdbMirrorFingerprint = fingerprint;
    });
}

// 把右键菜单攒下的网站合并进 startpage-data，然后清空队列
async function qdbDrainPendingSites() {
    if (!qdbHasBridge()) return 0;
    const pending = await qdbBridgeGet(QDB_PENDING_KEY);
    if (!Array.isArray(pending) || pending.length === 0) return 0;

    const data = await loadShortcutsData();
    if (!Array.isArray(data.groups)) data.groups = [];

    let added = 0;
    pending.forEach(function(item, index) {
        if (!item || !item.url) return;

        // 指定的分组可能已经被删掉了，这种情况落到「待分组」里，不丢数据
        let group = item.groupId ? data.groups.find(g => g.id === item.groupId) : null;
        if (!group) {
            group = data.groups.find(g => g.name === QDB_INBOX_GROUP_NAME);
            if (!group) {
                group = { id: `${Date.now()}-${index}`, name: QDB_INBOX_GROUP_NAME, sites: [] };
                data.groups.push(group);
            }
        }
        if (!Array.isArray(group.sites)) group.sites = [];

        const target = qdbNormalizeUrl(item.url);
        if (group.sites.some(site => qdbNormalizeUrl(site.url) === target)) return;

        group.sites.push({
            id: `${group.id}-${Date.now()}-${index}`,
            name: item.name || target,
            url: item.url
        });
        added++;
    });

    writeStartpageData(data);
    await qdbBridgeSet({ [QDB_PENDING_KEY]: [] });
    return added;
}

// 初始化桥接：先结算积压的收藏，再挂上后续的同步监听
async function qdbInitBridge() {
    if (!qdbHasBridge()) return;

    try {
        const added = await qdbDrainPendingSites();
        if (added > 0) {
            await renderShortcuts();
            showMessage(`已从右键菜单添加 ${added} 个网站`);
        }
        // 队列为空时不用再同步分组镜像：renderShortcuts() 已经同步过，
        // 而且 qdbSyncGroupsMirror() 现在内容没变就不写盘
    } catch (error) {
        console.error('Bridge init error:', error);
    }

    // 后台写入待归类队列时（起始页正开着）实时同步
    try {
        chrome.storage.onChanged.addListener(async function(changes, areaName) {
            if (areaName !== 'local' || !changes[QDB_PENDING_KEY]) return;
            const added = await qdbDrainPendingSites();
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
        if (event.key === 'startpage-data') {
            renderShortcuts();
        }
    });
}

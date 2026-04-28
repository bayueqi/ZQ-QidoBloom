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
    initDefaultData() {
        this.data = {
            groups: [],
            wallpaper: 'white'
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

    // 加载当前壁纸
    async loadCurrentWallpaper() {
        try {
            const savedData = localStorage.getItem('startpage-data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.currentWallpaper = data.wallpaper || 'white';
            }
        } catch (error) {
            console.error('Load wallpaper error:', error);
            this.currentWallpaper = 'white';
        }
    }

    // 加载所有已上传的壁纸
    async loadUploadedWallpapers() {
        try {
            const savedData = localStorage.getItem('startpage-data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.uploadedWallpapers = data.uploadedWallpapers || [];
            }
        } catch (error) {
            console.error('Load uploaded wallpapers error:', error);
            this.uploadedWallpapers = [];
        }
    }

    // 保存壁纸设置
    async saveWallpaper(wallpaper) {
        try {
            const savedData = localStorage.getItem('startpage-data');
            let data = savedData ? JSON.parse(savedData) : { groups: [] };
            data.wallpaper = wallpaper;
            this.currentWallpaper = wallpaper;
            localStorage.setItem('startpage-data', JSON.stringify(data));

            return true;
        } catch (error) {
            console.error('Save wallpaper error:', error);
            return false;
        }
    }

    // 保存所有已上传的壁纸
    async saveUploadedWallpapers(wallpapers) {
        try {
            const savedData = localStorage.getItem('startpage-data');
            let data = savedData ? JSON.parse(savedData) : { groups: [] };
            data.uploadedWallpapers = wallpapers;
            this.uploadedWallpapers = wallpapers;
            localStorage.setItem('startpage-data', JSON.stringify(data));

            return true;
        } catch (error) {
            console.error('Save uploaded wallpapers error:', error);
            return false;
        }
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
function getIconApiUrl() {
    try {
        const savedSettings = localStorage.getItem('startpage-faviconapi');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            return settings.iconApiUrl || 'https://toolb.cn/favicon/{domain}';
        }
    } catch (error) {
        console.error('Get icon API URL error:', error);
    }
    return 'https://toolb.cn/favicon/{domain}';
}

// 图标错误处理函数
function handleIconError(img) {
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.addEventListener('error', function() {
        this.onerror = null;
        const parent = this.parentElement;
        const siteName = this.dataset.siteName;
        this.remove();
        if (parent && siteName) {
            parent.innerHTML = siteName.charAt(0).toUpperCase();
        }
    });
}

// 实时更新时间和日期
function updateDateTime() {
    const now = new Date();
    
    // 更新时间
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    document.getElementById('time').textContent = timeString;
    
    // 更新日期
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    const dateString = `${year}年${month}月${day}日 ${weekday}`;
    document.getElementById('date').textContent = dateString;
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

        // 获取壁纸数据
        const savedData = localStorage.getItem('startpage-data');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.uploadedWallpapers && Array.isArray(data.uploadedWallpapers)) {
                    config.data.uploadedWallpapers = data.uploadedWallpapers.filter(w => 
                        w.startsWith('http://') || w.startsWith('https://')
                    );
                }
            } catch (error) {
                console.error('Failed to parse saved data:', error);
            }
        }

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
                    localStorage.setItem('startpage-data', JSON.stringify(mergedData));
                }

                // 导入搜索引擎数据
                if (config.data.searchEngines && config.data.searchEngines.length > 0) {
                    localStorage.setItem('searchEngines', JSON.stringify(config.data.searchEngines));
                }

                // 导入壁纸数据
                const savedData = localStorage.getItem('startpage-data');
                let data = savedData ? JSON.parse(savedData) : { groups: [] };
                
                // 导入URL壁纸列表
                if (config.data.uploadedWallpapers && Array.isArray(config.data.uploadedWallpapers)) {
                    data.uploadedWallpapers = config.data.uploadedWallpapers;
                }
                
                localStorage.setItem('startpage-data', JSON.stringify(data));

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

// 添加快捷方式悬停效果和拖拽功能
function initShortcuts() {
    const shortcutItems = document.querySelectorAll('.shortcut-item');
    
    shortcutItems.forEach(item => {
        // 添加悬停效果
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // 设置可拖拽
        item.setAttribute('draggable', 'true');
    });
    
    // 添加网站拖拽功能
    let draggedItem = null;
    
    shortcutItems.forEach(item => {
        // 拖拽开始事件
        item.addEventListener('dragstart', function(e) {
            e.stopPropagation();
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        });
        
        // 拖拽经过事件
        item.addEventListener('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (draggedItem) {
                const draggedContainer = draggedItem.closest('.shortcut-items');
                const targetContainer = this.closest('.shortcut-items');
                if (draggedContainer === targetContainer) {
                    e.dataTransfer.dropEffect = 'move';
                } else {
                    e.dataTransfer.dropEffect = 'none';
                }
            }
        });
        
        // 拖拽进入事件
        item.addEventListener('dragenter', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (draggedItem && this !== draggedItem) {
                const draggedContainer = draggedItem.closest('.shortcut-items');
                const targetContainer = this.closest('.shortcut-items');
                if (draggedContainer === targetContainer) {
                    this.classList.add('drag-over');
                }
            }
        });
        
        // 拖拽离开事件
        item.addEventListener('dragleave', function(e) {
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        // 放置事件
        item.addEventListener('drop', async function(e) {
            e.stopPropagation();
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedItem && draggedItem !== this) {
                const parentContainer = this.closest('.shortcut-items');
                const draggedContainer = draggedItem.closest('.shortcut-items');
                
                // 只允许在同一个分组内拖拽
                if (parentContainer === draggedContainer) {
                    const itemsArray = Array.from(parentContainer.children);
                    const draggedIndex = itemsArray.indexOf(draggedItem);
                    const dropIndex = itemsArray.indexOf(this);
                    
                    // 重新排序网站
                    if (draggedIndex < dropIndex) {
                        parentContainer.insertBefore(draggedItem, this.nextSibling);
                    } else {
                        parentContainer.insertBefore(draggedItem, this);
                    }
                    
                    // 保存新的网站排序
                    await saveNewSiteOrder(parentContainer);
                }
            }
        });
        
        // 拖拽结束事件
        item.addEventListener('dragend', function(e) {
            e.stopPropagation();
            this.classList.remove('dragging');
            shortcutItems.forEach(i => i.classList.remove('drag-over'));
            draggedItem = null;
        });
    });
    
    // 保存新的网站排序
    async function saveNewSiteOrder(container) {
        try {
            const group = container.closest('.shortcut-group');
            const groupId = group.dataset.groupId;
            const siteItems = container.querySelectorAll('.shortcut-item');
            const siteIds = Array.from(siteItems).map(item => {
                return item.dataset.siteId || '';
            }).filter(Boolean);
            
            // 加载当前数据
            const savedData = localStorage.getItem('startpage-data');
            let data = savedData ? JSON.parse(savedData) : { groups: [] };
            
            // 找到对应的分组并重新排序网站
            const groupIndex = data.groups.findIndex(g => g.id === groupId);
            if (groupIndex !== -1) {
                const originalSites = data.groups[groupIndex].sites;
                data.groups[groupIndex].sites = siteIds.map(id => 
                    originalSites.find(site => site.id === id)
                ).filter(Boolean);
                
                // 保存到localStorage
                localStorage.setItem('startpage-data', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Save site order error:', error);
        }
    }
    
    // 添加分组拖拽功能
    const groups = document.querySelectorAll('.shortcut-group');
    let draggedGroup = null;
    
    groups.forEach(group => {
        // 拖拽开始事件
        group.addEventListener('dragstart', function(e) {
            e.stopPropagation();
            draggedGroup = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        // 拖拽经过事件
        group.addEventListener('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        // 拖拽进入事件
        group.addEventListener('dragenter', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (draggedGroup && this !== draggedGroup && !draggedItem) {
                this.classList.add('drag-over');
            }
        });
        
        // 拖拽离开事件
        group.addEventListener('dragleave', function(e) {
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        // 放置事件
        group.addEventListener('drop', async function(e) {
            e.stopPropagation();
            e.preventDefault();
            this.classList.remove('drag-over');
            
            // 如果正在拖拽网站，则不允许放置到分组上
            if (draggedItem) {
                return;
            }
            
            if (draggedGroup && draggedGroup !== this) {
                const shortcutsContainer = document.querySelector('.shortcuts');
                const groupsArray = Array.from(shortcutsContainer.children);
                const draggedIndex = groupsArray.indexOf(draggedGroup);
                const dropIndex = groupsArray.indexOf(this);
                
                // 重新排序分组
                if (draggedIndex < dropIndex) {
                    shortcutsContainer.insertBefore(draggedGroup, this.nextSibling);
                } else {
                    shortcutsContainer.insertBefore(draggedGroup, this);
                }
                
                // 保存新的分组顺序
                await saveNewGroupOrder();
            }
        });
        
        // 拖拽结束事件
        group.addEventListener('dragend', function(e) {
            e.stopPropagation();
            this.classList.remove('dragging');
            groups.forEach(g => g.classList.remove('drag-over'));
            draggedGroup = null;
        });
    });
    
    // 保存新的分组顺序
    async function saveNewGroupOrder() {
        try {
            const groups = document.querySelectorAll('.shortcut-group');
            const groupIds = Array.from(groups).map(group => group.dataset.groupId);
            
            // 加载当前数据
            const savedData = localStorage.getItem('startpage-data');
            let data = savedData ? JSON.parse(savedData) : { groups: [] };
            
            // 重新排序分组
            const originalGroups = data.groups;
            data.groups = groupIds.map(id => originalGroups.find(group => group.id === id)).filter(Boolean);
            
            // 保存到localStorage
            localStorage.setItem('startpage-data', JSON.stringify(data));
        } catch (error) {
            console.error('Save group order error:', error);
        }
    }
}

// 从localStorage读取数据
async function loadShortcutsData() {
    try {
        // 从localStorage加载数据
        const savedData = localStorage.getItem('startpage-data');
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (error) {
                console.error('Failed to parse saved data:', error);
                return getDefaultShortcutsData();
            }
        } else {
            return getDefaultShortcutsData();
        }
    } catch (error) {
        console.error('Load shortcuts data error:', error);
        return getDefaultShortcutsData();
    }
}

// 获取默认快捷方式数据
function getDefaultShortcutsData() {
    return {
        groups: []
    };
}

// 渲染快捷方式
async function renderShortcuts() {
    const shortcutsContainer = document.querySelector('.shortcuts');
    try {
        const data = await loadShortcutsData();
        const groups = data.groups;

        shortcutsContainer.innerHTML = groups.map(group => `
            <div class="shortcut-group" draggable="true" data-group-id="${group.id}">
                <h3 class="group-title">${group.name}</h3>
                <div class="shortcut-items">
                    ${group.sites.map(site => `
                        <a href="${site.url}" class="shortcut-item" target="_blank" data-site-id="${site.id}">
                            <div class="shortcut-icon">
                                ${site.icon && (site.icon.startsWith('http') || site.icon.startsWith('data:')) ? `
                                    <img src="${site.icon}" alt="${site.name} icon" class="site-icon" data-site-name="${site.name}" data-hostname="${new URL(site.url).hostname}">
                                ` : `
                                    <img src="${getIconApiUrl().replace('{domain}', new URL(site.url).hostname)}" alt="${site.name} icon" class="site-icon" data-site-name="${site.name}" data-hostname="${new URL(site.url).hostname}">
                                `}
                            </div>
                            <span class="shortcut-name">${site.name}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.site-icon').forEach(handleIconError);

        // 重新初始化快捷方式事件
        initShortcuts();
    } catch (error) {
        console.error('Render shortcuts error:', error);
    }
}

// 应用壁纸
async function applyWallpaper() {
    try {
        let wallpaper = 'white';
        
        // 从localStorage加载数据
        const savedData = localStorage.getItem('startpage-data');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.wallpaper) {
                    wallpaper = data.wallpaper;
                }
            } catch (error) {
                console.error('Failed to parse saved data:', error);
            }
        }
        
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
        
        // 保存壁纸到localStorage
        const savedWallpaperData = localStorage.getItem('startpage-data');
        let data = savedWallpaperData ? JSON.parse(savedWallpaperData) : { groups: [] };
        data.wallpaper = wallpaper;
        localStorage.setItem('startpage-data', JSON.stringify(data));
    } catch (error) {
        console.error('Apply wallpaper error:', error);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async function() {
    await initNewSearch();
    await renderShortcuts();
    await applyWallpaper();
    
    setTimeout(() => {
        initEnhancedFeatures();
    }, 200);
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
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
                        </div>
                        <div class="form-group">
                            <button id="save-settings" class="btn btn-primary">保存设置</button>
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
                        <button class="btn btn-secondary btn-sm popup-add-site-btn" data-group-id="${group.id}">添加网站</button>
                        <button class="btn btn-secondary btn-sm popup-edit-group-btn" data-group-id="${group.id}">编辑</button>
                        <button class="btn btn-danger btn-sm popup-delete-group-btn" data-group-id="${group.id}">删除</button>
                    </div>
                </div>
                <div class="popup-sites-list">
                    ${group.sites.length > 0 ? group.sites.map(site => `
                        <div class="popup-site-item">
                            <div class="popup-site-info">
                                <div class="popup-site-icon">
                                    ${site.icon && (site.icon.startsWith('http') || site.icon.startsWith('data:')) ? `
                                        <img src="${site.icon}" alt="${site.name} icon" class="popup-site-icon-img" data-site-name="${site.name}" data-hostname="${new URL(site.url).hostname}">
                                    ` : `
                                        <img src="${getIconApiUrl().replace('{domain}', new URL(site.url).hostname)}" alt="${site.name} icon" class="popup-site-icon-img" data-site-name="${site.name}" data-hostname="${new URL(site.url).hostname}">
                                    `}
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
                    `).join('') : `
                        <div class="empty-state">
                            <p>暂无网站，点击"添加网站"按钮添加</p>
                        </div>
                    `}
                </div>
            </div>
        `).join('');

        // 绑定分组相关事件
        bindGroupEvents();
        
        // 添加图标错误处理
        document.querySelectorAll('.popup-site-icon-img').forEach(handleIconError);
    }

    // 绑定分组相关事件
    function bindGroupEvents() {
        // 使用事件委托处理所有按钮点击
        const groupsContainer = popupContent.querySelector('#popup-groups-container');
        if (groupsContainer) {
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
    await wallpaperManager.loadCurrentWallpaper();
    await wallpaperManager.loadUploadedWallpapers();



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
                            const savedData = localStorage.getItem('startpage-data');
                            if (savedData) {
                                try {
                                    const data = JSON.parse(savedData);
                                    if (data.wallpaper === wallpaper) {
                                        data.wallpaper = 'white';
                                        localStorage.setItem('startpage-data', JSON.stringify(data));
                                        wallpaperManager.applyWallpaper('white');
                                    }
                                } catch (error) {
                                    console.error('Failed to parse saved data:', error);
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
                                    const savedData = localStorage.getItem('startpage-data');
                                    if (savedData) {
                                        try {
                                            const data = JSON.parse(savedData);
                                            if (data.wallpaper === wallpaper) {
                                                data.wallpaper = 'white';
                                                localStorage.setItem('startpage-data', JSON.stringify(data));
                                                wallpaperManager.applyWallpaper('white');
                                            }
                                        } catch (error) {
                                            console.error('Failed to parse saved data:', error);
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

// 为弹出界面添加样式
const style = document.createElement('style');
style.textContent = `
    /* 分组管理弹出界面样式 */
    .groups-management {
        width: 100%;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .section-header h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #000000;
    }
    
    .popup-groups-container {
        max-height: 400px;
        min-height: 220px;
        overflow-y: auto;
    }
    
    .empty-state {
        text-align: center;
        padding: 24px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
        margin: 8px 0;
    }
    
    .empty-state h5 {
        margin: 0 0 8px 0;
        font-size: 0.9rem;
        color: #000000;
    }
    
    .empty-state p {
        margin: 0;
        font-size: 0.8rem;
        color: rgba(0, 0, 0, 0.6);
    }
    
    .popup-group-card {
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
    }
    
    .popup-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .popup-group-header h5 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #000000;
    }
    
    .popup-group-actions {
        display: flex;
        gap: 8px;
    }
    
    .btn-sm {
        padding: 6px 12px;
        font-size: 0.8rem;
    }
    
    .popup-sites-list {
        margin-top: 12px;
    }
    
    .popup-site-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        margin-bottom: 8px;
    }
    
    .popup-site-actions {
        display: flex;
        gap: 8px;
    }
    
    .popup-site-info {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .popup-site-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .popup-site-details {
        flex: 1;
        min-width: 0;
    }
    
    .popup-site-name {
        font-size: 0.8rem;
        font-weight: 500;
        color: #000000;
        margin-bottom: 2px;
    }
    
    .popup-site-url {
        font-size: 0.7rem;
        color: rgba(0, 0, 0, 0.6);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    /* 搜索引擎管理样式 */
    .search-engines-management {
        width: 100%;
    }
    
    .engines-list {
        margin-bottom: 20px;
    }
    
    .engines-list h4 {
        margin: 0 0 12px 0;
        font-size: 1rem;
        font-weight: 600;
        color: #000000;
    }
    
    .engine-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        margin-bottom: 8px;
    }
    
    .engine-info {
        flex: 1;
        min-width: 0;
    }
    
    .engine-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: #000000;
        margin-bottom: 4px;
    }
    
    .engine-url {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.6);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .engine-actions {
        display: flex;
        gap: 8px;
    }
    
    /* 壁纸设置样式 */
    .wallpaper-management {
        width: 100%;
    }
    
    .wallpaper-section {
        margin-bottom: 32px;
    }
    
    .wallpaper-section h4 {
        margin: 0 0 16px 0;
        font-size: 1rem;
        font-weight: 600;
        color: #000000;
    }
    
    .wallpaper-section h5 {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #000000;
    }
    
    .upload-option {
        margin-bottom: 20px;
        padding: 16px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
    }
    
    .wallpaper-previews {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px;
        scroll-behavior: smooth;
    }
    
    .wallpaper-previews::-webkit-scrollbar {
        height: 6px;
    }
    
    .wallpaper-previews::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 3px;
    }
    
    .wallpaper-previews::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
    }
    
    .wallpaper-previews::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
    }
    
    .wallpaper-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        flex-shrink: 0;
        min-width: 100px;
    }
    
    .wallpaper-preview:hover {
        background: rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
    }
    
    .wallpaper-preview.selected {
        background: rgba(0, 0, 0, 0.1);
        border: 2px solid rgba(0, 0, 0, 0.2);
    }
    
    .wallpaper-thumbnail {
        width: 80px;
        height: 60px;
        border-radius: 6px;
        margin-bottom: 8px;
        transition: all 0.2s ease;
    }
    
    .wallpaper-thumbnail.white {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    .wallpaper-thumbnail.blue {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .wallpaper-thumbnail.green {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .wallpaper-thumbnail.purple {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    }
    
    .wallpaper-preview span {
        font-size: 0.8rem;
        color: #000000;
        text-align: center;
    }
    
    .upload-section {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }
    
    .wallpaper-upload {
        display: none;
    }
    
    .upload-hint {
        margin: 0;
        font-size: 0.8rem;
        color: rgba(0, 0, 0, 0.6);
    }
    
    .url-section {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }
    
    .url-section .form-control {
        flex: 1;
        min-width: 200px;
    }
    
    .url-wallpapers-list {
        margin-top: 16px;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .url-wallpaper-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 6px;
        margin-bottom: 8px;
    }
    
    .url-wallpaper-item:last-child {
        margin-bottom: 0;
    }
    
    .url-wallpaper-thumbnail {
        width: 60px;
        height: 45px;
        border-radius: 4px;
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
    }
    
    .url-wallpaper-info {
        flex: 1;
        min-width: 0;
    }
    
    .url-wallpaper-url {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .url-wallpaper-actions {
        display: flex;
        gap: 8px;
    }
    
    .url-wallpaper-btn {
        padding: 4px 8px;
        font-size: 0.75rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .url-wallpaper-btn.apply {
        background: rgba(0, 0, 0, 0.1);
        color: #000000;
    }
    
    .url-wallpaper-btn.apply:hover {
        background: rgba(0, 0, 0, 0.2);
    }
    
    .url-wallpaper-btn.delete {
        background: rgba(255, 0, 0, 0.1);
        color: #ff0000;
    }
    
    .url-wallpaper-btn.delete:hover {
        background: rgba(255, 0, 0, 0.2);
    }
    
    /* 模态框样式 */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        z-index: 2100;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 10px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        transform: translateY(50px) scale(0.98);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .modal-show .modal-content {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    
    .modal-hide .modal-content {
        transform: translateY(50px) scale(0.98);
        opacity: 0;
    }
    
    .modal-content h3 {
        margin: 0 0 24px 0;
        font-size: 1.3rem;
        font-weight: 600;
        color: #000000;
        text-align: center;
    }
    
    .modal-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
    }
    
    /* 消息样式 */
    .popup-message {
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.8rem;
        z-index: 2200;
        display: none;
    }
    
    .wallpaper-delete-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        color: #ffffff;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s ease;
        z-index: 10;
    }
    
    .wallpaper-preview:hover .wallpaper-delete-btn {
        opacity: 1;
    }
    
    .wallpaper-delete-btn:hover {
        background: rgba(220, 38, 38, 0.8);
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

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

    // 绑定保存设置按钮
    const saveSettingsButton = popupContent.querySelector('#save-settings');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            const newSettings = {
                iconApiUrl: iconApiUrlInput.value.trim()
            };
            if (saveSettings(newSettings)) {
                showMessage('设置已保存');
                // 重新渲染快捷方式以应用新的图标 API
                renderShortcuts();
            } else {
                showMessage('保存设置失败', 'error');
            }
        });
    }
}

// ============================================
// 视觉交互增强模块
// ============================================

// 粒子动效系统
class ParticleSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.particles = [];
        this.maxParticles = 50;
        this.isRunning = false;
        this.animationFrame = null;
        this.colors = [
            'rgba(102, 126, 234, 0.6)',
            'rgba(118, 75, 162, 0.5)',
            'rgba(240, 147, 251, 0.4)',
            'rgba(79, 172, 254, 0.5)',
            'rgba(0, 242, 254, 0.4)'
        ];
    }

    createParticle() {
        if (this.particles.length >= this.maxParticles) return null;

        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 6 + 2;
        const x = Math.random() * window.innerWidth;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.background = color;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
        
        this.container.appendChild(particle);
        this.particles.push(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
                const index = this.particles.indexOf(particle);
                if (index > -1) {
                    this.particles.splice(index, 1);
                }
            }
        }, (duration + delay) * 1000);

        return particle;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        const createInterval = () => {
            if (this.isRunning) {
                this.createParticle();
                setTimeout(createInterval, Math.random() * 800 + 400);
            }
        };

        for (let i = 0; i < 10; i++) {
            setTimeout(() => this.createParticle(), i * 200);
        }
        createInterval();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// 点击波纹效果
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 300);
}

// 为所有可点击元素添加波纹效果
function initRippleEffect() {
    const clickableElements = document.querySelectorAll(
        '.action-button, .btn, .dropdown-item, .shortcut-item, ' +
        '.new-search-button, .engine-option, .selected-engine'
    );
    
    clickableElements.forEach(element => {
        element.addEventListener('click', createRipple);
    });
}

// 页面加载动画
function initPageLoadAnimation() {
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
}

// 时间显示增强
function updateDateTimeEnhanced() {
    const timeElement = document.getElementById('time');
    if (timeElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        
        timeElement.textContent = timeString;
        timeElement.setAttribute('data-time', timeString);
    }
}

// ============================================
// 随机漫游模式模块
// ============================================

const RandomMode = {
    BOOKMARK_ONLY: 'bookmark_only',
    CUSTOM_LIST: 'custom_list',
    MIXED: 'mixed'
};

const UsageScenario = {
    WORK: 'work',
    ENTERTAINMENT: 'entertainment',
    STUDY: 'study'
};

class RandomRoamManager {
    constructor() {
        this.currentMode = RandomMode.MIXED;
        this.customList = [];
        this.blacklist = [];
        this.currentScenario = null;
        this.lastRandomTime = null;
        this.randomHistory = [];
        this.maxHistorySize = 50;
    }

    loadSettings() {
        try {
            const savedSettings = SecureStorage.getItem('randomRoamSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.currentMode = settings.currentMode || RandomMode.MIXED;
                this.customList = settings.customList || [];
                this.blacklist = settings.blacklist || [];
                this.lastRandomTime = settings.lastRandomTime ? new Date(settings.lastRandomTime) : null;
            }
        } catch (error) {
            console.error('Load random roam settings error:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                currentMode: this.currentMode,
                customList: this.customList,
                blacklist: this.blacklist,
                lastRandomTime: this.lastRandomTime ? this.lastRandomTime.toISOString() : null
            };
            SecureStorage.setItem('randomRoamSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Save random roam settings error:', error);
        }
    }

    detectCurrentScenario() {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend) {
            if (hour >= 10 && hour < 18) {
                return UsageScenario.ENTERTAINMENT;
            } else if (hour >= 18 && hour < 23) {
                return UsageScenario.MIXED;
            }
            return UsageScenario.ENTERTAINMENT;
        } else {
            if (hour >= 9 && hour < 12) {
                return UsageScenario.WORK;
            } else if (hour >= 14 && hour < 18) {
                return UsageScenario.WORK;
            } else if (hour >= 19 && hour < 22) {
                return UsageScenario.ENTERTAINMENT;
            } else if (hour >= 22 || hour < 6) {
                return UsageScenario.ENTERTAINMENT;
            }
            return UsageScenario.MIXED;
        }
    }

    getOptimalModeForScenario(scenario) {
        switch (scenario) {
            case UsageScenario.WORK:
                return RandomMode.CUSTOM_LIST;
            case UsageScenario.ENTERTAINMENT:
                return RandomMode.MIXED;
            case UsageScenario.STUDY:
                return RandomMode.BOOKMARK_ONLY;
            default:
                return RandomMode.MIXED;
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        this.saveSettings();
        this.logAction('mode_change', { mode: mode });
    }

    setScenarioBasedMode() {
        const scenario = this.detectCurrentScenario();
        this.currentScenario = scenario;
        const optimalMode = this.getOptimalModeForScenario(scenario);
        this.currentMode = optimalMode;
        this.saveSettings();
        this.logAction('scenario_based_mode', { 
            scenario: scenario, 
            mode: optimalMode 
        });
        return { scenario, mode: optimalMode };
    }

    addToCustomList(site) {
        if (!this.customList.find(s => s.url === site.url)) {
            this.customList.push({
                id: Date.now().toString(),
                ...site,
                addedAt: new Date().toISOString()
            });
            this.saveSettings();
            this.logAction('add_to_custom_list', { site: site.name || site.url });
        }
    }

    removeFromCustomList(id) {
        const index = this.customList.findIndex(s => s.id === id);
        if (index > -1) {
            const removed = this.customList.splice(index, 1)[0];
            this.saveSettings();
            this.logAction('remove_from_custom_list', { site: removed.name || removed.url });
        }
    }

    addToBlacklist(url) {
        if (!this.blacklist.includes(url)) {
            this.blacklist.push(url);
            this.saveSettings();
            this.logAction('add_to_blacklist', { url: url });
        }
    }

    removeFromBlacklist(url) {
        const index = this.blacklist.indexOf(url);
        if (index > -1) {
            this.blacklist.splice(index, 1);
            this.saveSettings();
            this.logAction('remove_from_blacklist', { url: url });
        }
    }

    isBlacklisted(url) {
        return this.blacklist.some(blacklisted => 
            url.includes(blacklisted) || blacklisted.includes(url)
        );
    }

    getAllAvailableSites() {
        const allSites = [];
        
        const shortcutsData = loadShortcutsData();
        if (shortcutsData && shortcutsData.groups) {
            shortcutsData.groups.forEach(group => {
                if (group.sites) {
                    group.sites.forEach(site => {
                        if (!this.isBlacklisted(site.url)) {
                            allSites.push({
                                ...site,
                                source: 'bookmark',
                                group: group.name
                            });
                        }
                    });
                }
            });
        }

        this.customList.forEach(site => {
            if (!this.isBlacklisted(site.url)) {
                allSites.push({
                    ...site,
                    source: 'custom'
                });
            }
        });

        return allSites;
    }

    getRandomSite() {
        const allSites = this.getAllAvailableSites();
        
        if (allSites.length === 0) {
            return null;
        }

        let candidateSites = [];

        switch (this.currentMode) {
            case RandomMode.BOOKMARK_ONLY:
                candidateSites = allSites.filter(s => s.source === 'bookmark');
                break;
            case RandomMode.CUSTOM_LIST:
                candidateSites = allSites.filter(s => s.source === 'custom');
                break;
            case RandomMode.MIXED:
            default:
                candidateSites = allSites;
                break;
        }

        if (candidateSites.length === 0) {
            candidateSites = allSites;
        }

        const recentHistory = this.randomHistory.slice(-10);
        const availableSites = candidateSites.filter(site => 
            !recentHistory.some(h => h.url === site.url)
        );

        const sitesToChoose = availableSites.length > 0 ? availableSites : candidateSites;
        const randomIndex = Math.floor(Math.random() * sitesToChoose.length);
        const selectedSite = sitesToChoose[randomIndex];

        this.lastRandomTime = new Date();
        this.randomHistory.push({
            ...selectedSite,
            timestamp: new Date().toISOString(),
            mode: this.currentMode
        });

        if (this.randomHistory.length > this.maxHistorySize) {
            this.randomHistory = this.randomHistory.slice(-this.maxHistorySize);
        }

        this.saveSettings();
        this.logAction('random_selection', { 
            site: selectedSite.name || selectedSite.url,
            mode: this.currentMode
        });

        return selectedSite;
    }

    logAction(action, details) {
        const logEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: action,
            details: details
        };

        try {
            let logs = [];
            const savedLogs = SecureStorage.getItem('operationLogs');
            if (savedLogs) {
                logs = JSON.parse(savedLogs);
            }
            logs.unshift(logEntry);
            
            if (logs.length > 500) {
                logs = logs.slice(0, 500);
            }

            SecureStorage.setItem('operationLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('Log action error:', error);
        }
    }

    getRandomHistory() {
        return this.randomHistory;
    }

    getCurrentMode() {
        return this.currentMode;
    }

    getCustomList() {
        return this.customList;
    }

    getBlacklist() {
        return this.blacklist;
    }
}

// ============================================
// 安全存储模块
// ============================================

const SecureStorage = {
    encryptionKey: null,

    generateKey() {
        try {
            const savedKey = localStorage.getItem('encryptionKey');
            if (savedKey) {
                this.encryptionKey = savedKey;
            } else {
                const key = this.generateRandomKey(32);
                this.encryptionKey = key;
                localStorage.setItem('encryptionKey', key);
            }
        } catch (error) {
            console.error('Generate key error:', error);
            this.encryptionKey = 'default_secure_key_2024';
        }
    },

    generateRandomKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    },

    simpleEncrypt(text, key) {
        try {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return btoa(encodeURIComponent(result));
        } catch (error) {
            console.error('Encryption error:', error);
            return text;
        }
    },

    simpleDecrypt(encrypted, key) {
        try {
            const decoded = decodeURIComponent(atob(encrypted));
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (error) {
            console.error('Decryption error:', error);
            return encrypted;
        }
    },

    setItem(key, value) {
        try {
            if (!this.encryptionKey) {
                this.generateKey();
            }

            const encryptedValue = this.simpleEncrypt(value, this.encryptionKey);
            localStorage.setItem(key, encryptedValue);

            this.createBackup(key, value);

            return true;
        } catch (error) {
            console.error('Set item error:', error);
            localStorage.setItem(key, value);
            return false;
        }
    },

    getItem(key) {
        try {
            if (!this.encryptionKey) {
                this.generateKey();
            }

            const encryptedValue = localStorage.getItem(key);
            if (!encryptedValue) {
                return this.getBackup(key);
            }

            try {
                return this.simpleDecrypt(encryptedValue, this.encryptionKey);
            } catch (decryptError) {
                console.warn('Decryption failed, trying backup:', decryptError);
                const backup = this.getBackup(key);
                if (backup) {
                    return backup;
                }
                return encryptedValue;
            }
        } catch (error) {
            console.error('Get item error:', error);
            return localStorage.getItem(key);
        }
    },

    createBackup(key, value) {
        try {
            const backups = this.getBackups();
            const timestamp = Date.now();
            
            if (!backups[key]) {
                backups[key] = [];
            }

            backups[key].push({
                value: value,
                timestamp: timestamp,
                date: new Date().toISOString()
            });

            if (backups[key].length > 5) {
                backups[key] = backups[key].slice(-5);
            }

            localStorage.setItem('secureBackups', JSON.stringify(backups));
        } catch (error) {
            console.error('Create backup error:', error);
        }
    },

    getBackups() {
        try {
            const backupStr = localStorage.getItem('secureBackups');
            if (backupStr) {
                return JSON.parse(backupStr);
            }
        } catch (error) {
            console.error('Get backups error:', error);
        }
        return {};
    },

    getBackup(key) {
        try {
            const backups = this.getBackups();
            if (backups[key] && backups[key].length > 0) {
                const latest = backups[key][backups[key].length - 1];
                return latest.value;
            }
        } catch (error) {
            console.error('Get backup error:', error);
        }
        return null;
    },

    exportAllConfig() {
        try {
            const config = {
                version: '2.0',
                exportTime: new Date().toISOString(),
                
                shortcuts: loadShortcutsData(),
                
                searchEngines: loadSearchEngines(),
                
                wallpaper: localStorage.getItem('startpage-data') ? 
                    JSON.parse(localStorage.getItem('startpage-data')).wallpaper : 'white',
                
                faviconApi: localStorage.getItem('startpage-faviconapi') ? 
                    JSON.parse(localStorage.getItem('startpage-faviconapi')) : null,
                
                randomRoamSettings: SecureStorage.getItem('randomRoamSettings') ? 
                    JSON.parse(SecureStorage.getItem('randomRoamSettings')) : null,
                
                operationLogs: SecureStorage.getItem('operationLogs') ? 
                    JSON.parse(SecureStorage.getItem('operationLogs')) : null
            };

            return config;
        } catch (error) {
            console.error('Export config error:', error);
            throw error;
        }
    },

    importAllConfig(config) {
        try {
            if (config.shortcuts) {
                localStorage.setItem('startpage-data', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('startpage-data') || '{}'),
                    groups: config.shortcuts.groups || [],
                    wallpaper: config.wallpaper || 'white'
                }));
            }

            if (config.searchEngines) {
                localStorage.setItem('searchEngines', JSON.stringify(config.searchEngines));
            }

            if (config.faviconApi) {
                localStorage.setItem('startpage-faviconapi', JSON.stringify(config.faviconApi));
            }

            if (config.randomRoamSettings) {
                SecureStorage.setItem('randomRoamSettings', JSON.stringify(config.randomRoamSettings));
            }

            if (config.operationLogs) {
                SecureStorage.setItem('operationLogs', JSON.stringify(config.operationLogs));
            }

            return true;
        } catch (error) {
            console.error('Import config error:', error);
            throw error;
        }
    }
};

// ============================================
// 操作日志管理模块
// ============================================

class OperationLogManager {
    constructor() {
        this.maxLogs = 500;
    }

    getAllLogs() {
        try {
            const logsStr = SecureStorage.getItem('operationLogs');
            if (logsStr) {
                return JSON.parse(logsStr);
            }
        } catch (error) {
            console.error('Get logs error:', error);
        }
        return [];
    }

    getLogsByType(actionType) {
        const logs = this.getAllLogs();
        return logs.filter(log => log.action === actionType);
    }

    getLogsByDateRange(startDate, endDate) {
        const logs = this.getAllLogs();
        return logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }

    clearLogs() {
        try {
            SecureStorage.setItem('operationLogs', JSON.stringify([]));
            return true;
        } catch (error) {
            console.error('Clear logs error:', error);
            return false;
        }
    }

    exportLogs() {
        const logs = this.getAllLogs();
        return {
            version: '1.0',
            exportTime: new Date().toISOString(),
            totalLogs: logs.length,
            logs: logs
        };
    }
}

// ============================================
// 全局初始化
// ============================================

let particleSystem;
let randomRoamManager;
let logManager;

function initEnhancedFeatures() {
    SecureStorage.generateKey();

    particleSystem = new ParticleSystem('particles-container');
    particleSystem.start();

    randomRoamManager = new RandomRoamManager();
    randomRoamManager.loadSettings();

    logManager = new OperationLogManager();

    initPageLoadAnimation();

    setTimeout(() => {
        initRippleEffect();
    }, 500);

    const originalUpdateDateTime = updateDateTime;
    updateDateTime = function() {
        originalUpdateDateTime();
        updateDateTimeEnhanced();
    };

    addRandomRoamButton();

    console.log('Enhanced features initialized successfully');
}

function addRandomRoamButton() {
    const topRight = document.querySelector('.top-right');
    if (!topRight) return;

    const roamButton = document.createElement('div');
    roamButton.className = 'dropdown-container';
    roamButton.innerHTML = `
        <button class="action-button roam-button" id="roam-button" title="随机漫游">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <path d="M16 11a5 5 0 0 1-5 5"></path>
                <path d="M8.79 9.39a5 5 0 0 1 7.82-1.4"></path>
            </svg>
            <span>随机漫游</span>
        </button>
        <div class="roam-dropdown-menu manage-dropdown-menu">
            <div class="dropdown-item" data-action="random-now">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="2 18 6 14 12 20 22 4"></polyline>
                    <line x1="16" y1="8" x2="22" y2="4"></line>
                    <line x1="22" y1="8" x2="16" y2="4"></line>
                </svg>
                <span>立即随机</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" data-action="mode-bookmark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>纯书签模式</span>
            </div>
            <div class="dropdown-item" data-action="mode-custom">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>自定义列表</span>
            </div>
            <div class="dropdown-item" data-action="mode-mixed">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9 17 14.74 18.18 21.02 12 17.77 5.82 21.02 7 14.74 2 9 8.91 8.26 12 2"></polygon>
                </svg>
                <span>混合模式</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" data-action="manage-custom">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                <span>管理自定义列表</span>
            </div>
            <div class="dropdown-item" data-action="view-history">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>查看历史记录</span>
            </div>
            <div class="dropdown-item" data-action="view-logs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>操作日志</span>
            </div>
        </div>
    `;

    topRight.insertBefore(roamButton, topRight.firstChild);

    const roamButtonEl = document.getElementById('roam-button');
    const roamDropdown = roamButton.querySelector('.roam-dropdown-menu');

    roamButtonEl.addEventListener('click', function(e) {
        e.stopPropagation();
        roamDropdown.classList.toggle('show');
        document.querySelector('.manage-dropdown-menu')?.classList.remove('show');
    });

    roamDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action;
            roamDropdown.classList.remove('show');

            switch (action) {
                case 'random-now':
                    const site = randomRoamManager.getRandomSite();
                    if (site) {
                        showMessage(`随机选中: ${site.name || site.url}`);
                        setTimeout(() => {
                            window.open(site.url, '_blank');
                        }, 500);
                    } else {
                        showMessage('没有可随机的网站，请先添加网站', 'error');
                    }
                    break;

                case 'mode-bookmark':
                    randomRoamManager.setMode(RandomMode.BOOKMARK_ONLY);
                    showMessage('已切换到纯书签随机模式');
                    break;

                case 'mode-custom':
                    randomRoamManager.setMode(RandomMode.CUSTOM_LIST);
                    showMessage('已切换到自定义列表随机模式');
                    break;

                case 'mode-mixed':
                    randomRoamManager.setMode(RandomMode.MIXED);
                    showMessage('已切换到混合随机模式');
                    break;

                case 'manage-custom':
                    showCustomListPopup();
                    break;

                case 'view-history':
                    showHistoryPopup();
                    break;

                case 'view-logs':
                    showLogsPopup();
                    break;
            }
        });
    });
}

function showCustomListPopup() {
    const customList = randomRoamManager.getCustomList();
    
    let popupContainer = document.getElementById('popup-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-container';
        popupContainer.className = 'popup-container';
        document.body.appendChild(popupContainer);
    }
    
    popupContainer.innerHTML = '';
    
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    
    popupContent.innerHTML = `
        <div class="popup-header">
            <h3>自定义随机列表</h3>
            <button class="popup-close">&times;</button>
        </div>
        <div class="popup-body">
            <div style="margin-bottom: 20px;">
                <button id="add-custom-site" class="btn btn-primary">添加网站</button>
            </div>
            <div id="custom-sites-list" style="max-height: 400px; overflow-y: auto;">
                ${customList.length === 0 ? `
                    <div class="empty-state">
                        <h5>暂无自定义网站</h5>
                        <p>点击"添加网站"按钮添加到随机列表</p>
                    </div>
                ` : customList.map(site => `
                    <div class="popup-site-item" style="margin-bottom: 12px; padding: 16px;">
                        <div class="popup-site-info">
                            <div class="popup-site-icon" style="width: 32px; height: 32px;">
                                ${site.name ? site.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div class="popup-site-details">
                                <div class="popup-site-name">${site.name || '未命名'}</div>
                                <div class="popup-site-url" style="font-size: 0.75rem; color: rgba(0,0,0,0.6);">${site.url}</div>
                            </div>
                        </div>
                        <div class="popup-site-actions">
                            <button class="btn btn-danger btn-sm remove-custom-site" data-id="${site.id}">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    popupContainer.appendChild(popupContent);
    popupContainer.classList.add('show');
    popupContent.classList.add('show');

    const closeBtn = popupContent.querySelector('.popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            popupContainer.classList.remove('show');
            setTimeout(() => {
                popupContainer.innerHTML = '';
            }, 300);
        });
    }

    popupContainer.addEventListener('click', (e) => {
        if (e.target === popupContainer) {
            popupContainer.classList.remove('show');
            setTimeout(() => {
                popupContainer.innerHTML = '';
            }, 300);
        }
    });

    const addBtn = popupContent.querySelector('#add-custom-site');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showAddCustomSitePopup();
        });
    }

    popupContent.querySelectorAll('.remove-custom-site').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            randomRoamManager.removeFromCustomList(id);
            showMessage('已从自定义列表中删除');
            const siteItem = this.closest('.popup-site-item');
            if (siteItem) {
                siteItem.style.transition = 'all 0.3s ease';
                siteItem.style.opacity = '0';
                siteItem.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    siteItem.remove();
                    const list = popupContent.querySelector('#custom-sites-list');
                    if (list.querySelectorAll('.popup-site-item').length === 0) {
                        list.innerHTML = `
                            <div class="empty-state">
                                <h5>暂无自定义网站</h5>
                                <p>点击"添加网站"按钮添加到随机列表</p>
                            </div>
                        `;
                    }
                }, 300);
            }
        });
    });
}

function showAddCustomSitePopup() {
    const addPopup = document.createElement('div');
    addPopup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2100;
    `;
    
    addPopup.innerHTML = `
        <div class="modal-content" style="
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 32px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            transform: translateY(30px);
            opacity: 0;
            transition: all 0.3s ease;
        ">
            <h3 style="margin: 0 0 24px 0; font-size: 1.3rem; font-weight: 600; text-align: center;">添加到随机列表</h3>
            <div class="form-group">
                <label for="custom-site-name">网站名称</label>
                <input type="text" id="custom-site-name" class="form-control" placeholder="例如: 我的博客" required>
            </div>
            <div class="form-group">
                <label for="custom-site-url">网站地址</label>
                <input type="url" id="custom-site-url" class="form-control" placeholder="https://example.com" required>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                <button id="cancel-add-custom" class="btn btn-secondary">取消</button>
                <button id="confirm-add-custom" class="btn btn-primary">添加</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(addPopup);
    
    setTimeout(() => {
        const modalContent = addPopup.querySelector('.modal-content');
        modalContent.style.transform = 'translateY(0)';
        modalContent.style.opacity = '1';
    }, 10);

    const cancelBtn = addPopup.querySelector('#cancel-add-custom');
    cancelBtn.addEventListener('click', () => {
        const modalContent = addPopup.querySelector('.modal-content');
        modalContent.style.transform = 'translateY(30px)';
        modalContent.style.opacity = '0';
        setTimeout(() => addPopup.remove(), 300);
    });

    const confirmBtn = addPopup.querySelector('#confirm-add-custom');
    confirmBtn.addEventListener('click', () => {
        const name = document.getElementById('custom-site-name').value.trim();
        const url = document.getElementById('custom-site-url').value.trim();

        if (!name || !url) {
            showMessage('请填写网站名称和地址', 'error');
            return;
        }

        randomRoamManager.addToCustomList({
            name: name,
            url: url
        });

        showMessage('已添加到自定义随机列表');
        const modalContent = addPopup.querySelector('.modal-content');
        modalContent.style.transform = 'translateY(30px)';
        modalContent.style.opacity = '0';
        setTimeout(() => {
            addPopup.remove();
            const popupContainer = document.getElementById('popup-container');
            if (popupContainer && popupContainer.classList.contains('show')) {
                popupContainer.classList.remove('show');
                setTimeout(() => {
                    showCustomListPopup();
                }, 100);
            }
        }, 300);
    });

    addPopup.addEventListener('click', (e) => {
        if (e.target === addPopup) {
            const modalContent = addPopup.querySelector('.modal-content');
            modalContent.style.transform = 'translateY(30px)';
            modalContent.style.opacity = '0';
            setTimeout(() => addPopup.remove(), 300);
        }
    });
}

function showHistoryPopup() {
    const history = randomRoamManager.getRandomHistory();
    
    let popupContainer = document.getElementById('popup-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-container';
        popupContainer.className = 'popup-container';
        document.body.appendChild(popupContainer);
    }
    
    popupContainer.innerHTML = '';
    
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    
    popupContent.innerHTML = `
        <div class="popup-header">
            <h3>随机历史记录</h3>
            <button class="popup-close">&times;</button>
        </div>
        <div class="popup-body">
            <div style="margin-bottom: 16px; font-size: 0.9rem; color: rgba(0,0,0,0.6);">
                当前模式: ${getModeName(randomRoamManager.getCurrentMode())}
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${history.length === 0 ? `
                    <div class="empty-state">
                        <h5>暂无随机历史</h5>
                        <p>开始随机漫游后将显示历史记录</p>
                    </div>
                ` : history.map((item, index) => `
                    <div class="popup-site-item" style="margin-bottom: 12px; padding: 16px; background: ${index === 0 ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255,255,255,0.5)'};">
                        <div class="popup-site-info">
                            <div style="
                                width: 28px;
                                height: 28px;
                                border-radius: 50%;
                                background: ${index === 0 ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(0,0,0,0.1)'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.75rem;
                                font-weight: 600;
                                color: ${index === 0 ? 'white' : 'rgba(0,0,0,0.8)'};
                                flex-shrink: 0;
                            ">
                                ${history.length - index}
                            </div>
                            <div class="popup-site-details">
                                <div class="popup-site-name">${item.name || '未命名'} ${index === 0 ? '<span style="font-size: 0.7rem; color: #667eea; margin-left: 8px;">最新</span>' : ''}</div>
                                <div class="popup-site-url" style="font-size: 0.75rem; color: rgba(0,0,0,0.6);">
                                    ${item.url}
                                </div>
                                <div style="font-size: 0.7rem; color: rgba(0,0,0,0.4); margin-top: 4px;">
                                    ${new Date(item.timestamp).toLocaleString('zh-CN')} · ${getModeName(item.mode)}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    popupContainer.appendChild(popupContent);
    popupContainer.classList.add('show');
    popupContent.classList.add('show');

    const closeBtn = popupContent.querySelector('.popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            popupContainer.classList.remove('show');
            setTimeout(() => {
                popupContainer.innerHTML = '';
            }, 300);
        });
    }

    popupContainer.addEventListener('click', (e) => {
        if (e.target === popupContainer) {
            popupContainer.classList.remove('show');
            setTimeout(() => {
                popupContainer.innerHTML = '';
            }, 300);
        }
    });
}

function showLogsPopup() {
    const logManager = new OperationLogManager();
    
    let popupContainer = document.getElementById('popup-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-container';
        popupContainer.className = 'popup-container';
        document.body.appendChild(popupContainer);
    }
    
    popupContainer.innerHTML = '';
    
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    popupContent.style.maxWidth = '800px';
    
    logManager.getAllLogs().then(logs => {
        popupContent.innerHTML = `
            <div class="popup-header">
                <h3>操作日志</h3>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button id="export-logs-btn" class="btn btn-secondary btn-sm">导出日志</button>
                    <button id="clear-logs-btn" class="btn btn-danger btn-sm">清空日志</button>
                    <button class="popup-close">&times;</button>
                </div>
            </div>
            <div class="popup-body">
                <div style="margin-bottom: 16px; font-size: 0.9rem; color: rgba(0,0,0,0.6);">
                    共 ${logs.length} 条记录
                </div>
                <div style="max-height: 500px; overflow-y: auto;">
                    ${logs.length === 0 ? `
                        <div class="empty-state">
                            <h5>暂无操作日志</h5>
                            <p>操作日志将记录您的所有操作</p>
                        </div>
                    ` : logs.map(log => `
                        <div class="popup-site-item" style="margin-bottom: 8px; padding: 12px; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; width: 100%;">
                                <div>
                                    <div style="font-weight: 600; color: ${getLogColor(log.action)};">${getActionName(log.action)}</div>
                                    <div style="font-size: 0.75rem; color: rgba(0,0,0,0.6); margin-top: 4px;">
                                        ${log.details ? JSON.stringify(log.details) : ''}
                                    </div>
                                </div>
                                <div style="font-size: 0.7rem; color: rgba(0,0,0,0.4); white-space: nowrap; margin-left: 16px;">
                                    ${new Date(log.timestamp).toLocaleString('zh-CN')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const exportBtn = popupContent.querySelector('#export-logs-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const logData = logManager.exportLogs();
                const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `operation-logs-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage('日志导出成功');
            });
        }

        const clearBtn = popupContent.querySelector('#clear-logs-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                showConfirmDialog('清空日志', '确定要清空所有操作日志吗？此操作不可恢复。', () => {
                    logManager.clearLogs();
                    showMessage('日志已清空');
                    popupContainer.classList.remove('show');
                    setTimeout(() => {
                        showLogsPopup();
                    }, 100);
                });
            });
        }
    });
    
    popupContainer.appendChild(popupContent);
    popupContainer.classList.add('show');
    popupContent.classList.add('show');

    setTimeout(() => {
        const closeBtn = popupContent.querySelector('.popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popupContainer.classList.remove('show');
                setTimeout(() => {
                    popupContainer.innerHTML = '';
                }, 300);
            });
        }

        popupContainer.addEventListener('click', (e) => {
            if (e.target === popupContainer) {
                popupContainer.classList.remove('show');
                setTimeout(() => {
                    popupContainer.innerHTML = '';
                }, 300);
            }
        });
    }, 100);
}

function getModeName(mode) {
    switch (mode) {
        case RandomMode.BOOKMARK_ONLY:
            return '纯书签随机';
        case RandomMode.CUSTOM_LIST:
            return '自定义列表随机';
        case RandomMode.MIXED:
        default:
            return '混合随机';
    }
}

function getActionName(action) {
    const actionNames = {
        'mode_change': '模式切换',
        'scenario_based_mode': '场景智能匹配',
        'add_to_custom_list': '添加到自定义列表',
        'remove_from_custom_list': '从自定义列表移除',
        'add_to_blacklist': '添加到黑名单',
        'remove_from_blacklist': '从黑名单移除',
        'random_selection': '随机选择'
    };
    return actionNames[action] || action;
}

function getLogColor(action) {
    if (action.includes('error') || action.includes('delete') || action.includes('remove')) {
        return '#ef4444';
    } else if (action.includes('add') || action.includes('create')) {
        return '#10b981';
    } else if (action.includes('change') || action.includes('update')) {
        return '#f59e0b';
    }
    return '#3b82f6';
}

// 重写导出/导入配置函数
const originalExportConfig = exportConfig;
exportConfig = function() {
    try {
        const config = SecureStorage.exportAllConfig();
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QidoBloom-Config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('配置导出成功（已加密）！');
        
        if (randomRoamManager) {
            randomRoamManager.logAction('export_config', { success: true });
        }
    } catch (error) {
        console.error('Export config error:', error);
        showMessage('配置导出失败：' + error.message, 'error');
        
        if (randomRoamManager) {
            randomRoamManager.logAction('export_config', { success: false, error: error.message });
        }
    }
};

const originalImportConfig = importConfig;
importConfig = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const config = JSON.parse(text);

            showConfirmDialog('导入配置', '导入配置将覆盖当前设置，确定要继续吗？', () => {
                try {
                    SecureStorage.importAllConfig(config);
                    
                    showMessage('配置导入成功！页面将自动刷新。');
                    
                    if (randomRoamManager) {
                        randomRoamManager.logAction('import_config', { success: true });
                    }
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } catch (error) {
                    console.error('Import config error:', error);
                    showMessage('配置导入失败：' + error.message, 'error');
                    
                    if (randomRoamManager) {
                        randomRoamManager.logAction('import_config', { success: false, error: error.message });
                    }
                }
            });
        } catch (error) {
            console.error('Import config error:', error);
            showMessage('配置文件格式不正确：' + error.message, 'error');
        }
    };

    input.click();
};

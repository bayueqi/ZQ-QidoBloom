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
        this.wallpaperSettings = {
            blur: 0,
            fit: 'cover', // cover, contain, stretch
            position: 'center'
        };
    }

    // 加载当前壁纸
    async loadCurrentWallpaper() {
        try {
            const savedData = localStorage.getItem('startpage-data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.currentWallpaper = data.wallpaper || 'white';
                this.wallpaperSettings = { ...this.wallpaperSettings, ...data.wallpaperSettings };
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
            data.wallpaperSettings = this.wallpaperSettings;
            this.currentWallpaper = wallpaper;
            localStorage.setItem('startpage-data', JSON.stringify(data));

            return true;
        } catch (error) {
            console.error('Save wallpaper error:', error);
            return false;
        }
    }

    // 保存壁纸配置
    async saveWallpaperSettings(settings) {
        try {
            this.wallpaperSettings = { ...this.wallpaperSettings, ...settings };
            const savedData = localStorage.getItem('startpage-data');
            let data = savedData ? JSON.parse(savedData) : { groups: [] };
            data.wallpaperSettings = this.wallpaperSettings;
            localStorage.setItem('startpage-data', JSON.stringify(data));
            this.applyWallpaper(this.currentWallpaper);
            return true;
        } catch (error) {
            console.error('Save wallpaper settings error:', error);
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
            body.style.filter = 'none';
        } else if (wallpaper.startsWith('img/') || wallpaper.startsWith('data:') || wallpaper.startsWith('http')) {
            // 处理图片
            body.style.background = `url('${wallpaper}') no-repeat ${this.wallpaperSettings.position} center fixed`;
            body.style.backgroundSize = this.wallpaperSettings.fit;
            body.style.filter = `blur(${this.wallpaperSettings.blur}px)`;
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

    // 压缩图片
    async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // 计算压缩后的尺寸
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                // 绘制压缩后的图片
                ctx.drawImage(img, 0, 0, width, height);

                // 转换为base64
                const compressedImage = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedImage);
            };

            img.onerror = function() {
                resolve(null);
            };

            // 读取文件
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 裁剪图片
    async cropImage(file, cropData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // 设置画布尺寸
                canvas.width = cropData.width;
                canvas.height = cropData.height;

                // 绘制裁剪后的图片
                ctx.drawImage(
                    img,
                    cropData.x,
                    cropData.y,
                    cropData.width,
                    cropData.height,
                    0,
                    0,
                    cropData.width,
                    cropData.height
                );

                // 转换为base64
                const croppedImage = canvas.toDataURL('image/jpeg');
                resolve(croppedImage);
            };

            img.onerror = function() {
                resolve(null);
            };

            // 读取文件
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
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

// 生成随机颜色
function getRandomColor(siteName) {
    // 基于网站名称生成固定的颜色
    let hash = 0;
    for (let i = 0; i < siteName.length; i++) {
        hash = siteName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// 图标错误处理函数
function handleIconError(img) {
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease';
    
    // 显示加载状态
    const parent = img.parentElement;
    if (parent) {
        parent.style.background = 'linear-gradient(45deg, #f0f0f0, #e0e0e0)';
        parent.style.animation = 'pulse 1.5s infinite';
    }
    
    // 图片加载成功
    img.addEventListener('load', function() {
        const parent = this.parentElement;
        if (parent) {
            parent.style.background = 'none';
            parent.style.animation = 'none';
        }
        this.style.opacity = '1';
    });
    
    // 图片加载失败
    img.addEventListener('error', function() {
        this.onerror = null;
        const parent = this.parentElement;
        const siteName = this.dataset.siteName;
        this.remove();
        if (parent && siteName) {
            const initial = siteName.charAt(0).toUpperCase();
            const color = getRandomColor(siteName);
            parent.style.background = color;
            parent.style.animation = 'none';
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'center';
            parent.style.color = '#ffffff';
            parent.style.fontWeight = '600';
            parent.style.fontSize = '0.9rem';
            parent.innerHTML = initial;
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
    const shortcutWrappers = document.querySelectorAll('.shortcut-item-wrapper');
    
    shortcutWrappers.forEach(wrapper => {
        // 设置可拖拽
        wrapper.setAttribute('draggable', 'true');
    });
    
    // 添加网站拖拽功能
    let draggedItem = null;
    
    shortcutWrappers.forEach(wrapper => {
        // 拖拽开始事件
        wrapper.addEventListener('dragstart', function(e) {
            e.stopPropagation();
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        });
        
        // 拖拽经过事件
        wrapper.addEventListener('dragover', function(e) {
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
        wrapper.addEventListener('dragenter', function(e) {
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
        wrapper.addEventListener('dragleave', function(e) {
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        // 放置事件
        wrapper.addEventListener('drop', async function(e) {
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
        wrapper.addEventListener('dragend', function(e) {
            e.stopPropagation();
            this.classList.remove('dragging');
            shortcutWrappers.forEach(i => i.classList.remove('drag-over'));
            draggedItem = null;
        });
    });
    
    // 保存新的网站排序
    async function saveNewSiteOrder(container) {
        try {
            const group = container.closest('.shortcut-group');
            const groupId = group.dataset.groupId;
            const siteItems = container.querySelectorAll('.shortcut-item-wrapper');
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
                <div class="group-header">
                    <h3 class="group-title">${group.name}</h3>
                    <div class="group-actions">
                        <button class="group-action-btn edit-group-btn" data-group-id="${group.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="group-action-btn delete-group-btn" data-group-id="${group.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="shortcut-items">
                    ${group.sites.map(site => `
                        <div class="shortcut-item-wrapper" draggable="true" data-site-id="${site.id}" data-group-id="${group.id}">
                            <a href="${site.url}" class="shortcut-item" target="_blank">
                                <div class="shortcut-icon">
                                    ${site.icon && (site.icon.startsWith('http') || site.icon.startsWith('data:')) ? `
                                        <img src="${site.icon}" alt="${site.name} icon" class="site-icon" data-site-name="${site.name}" data-hostname="${new URL(site.url).hostname}">
                                    ` : `
                                        <img src="${getIconApiUrl().replace('{domain}', new URL(site.url).hostname)}" alt="${site.name} icon" class="site-icon" data-site-name="${site.name}" data-hostname="${new URL(site.url).hostname}">
                                    `}
                                </div>
                                <span class="shortcut-name">${site.name}</span>
                            </a>
                            <div class="shortcut-actions">
                                <button class="shortcut-action-btn edit-site-btn" data-site-id="${site.id}" data-group-id="${group.id}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="shortcut-action-btn hide-site-btn" data-site-id="${site.id}" data-group-id="${group.id}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                                        <line x1="2" y1="2" x2="22" y2="22"></line>
                                    </svg>
                                </button>
                                <button class="shortcut-action-btn delete-site-btn" data-site-id="${site.id}" data-group-id="${group.id}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    <div class="add-site-btn" data-group-id="${group.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>添加网站</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.site-icon').forEach(handleIconError);

        // 初始化快捷方式事件
        initShortcuts();
        
        // 初始化快捷操作按钮事件
        initShortcutActions();
    } catch (error) {
        console.error('Render shortcuts error:', error);
    }
}

// 初始化快捷操作按钮事件
function initShortcutActions() {
    // 添加网站按钮
    document.querySelectorAll('.add-site-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.dataset.groupId;
            showAddSiteModal(groupId);
        });
    });
    
    // 编辑网站按钮
    document.querySelectorAll('.edit-site-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const siteId = this.dataset.siteId;
            const groupId = this.dataset.groupId;
            showEditSiteModal(groupId, siteId);
        });
    });
    
    // 隐藏网站按钮
    document.querySelectorAll('.hide-site-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const siteId = this.dataset.siteId;
            const groupId = this.dataset.groupId;
            toggleSiteVisibility(groupId, siteId);
        });
    });
    
    // 删除网站按钮
    document.querySelectorAll('.delete-site-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const siteId = this.dataset.siteId;
            const groupId = this.dataset.groupId;
            showConfirmDialog('删除网站', '确定要删除这个网站吗？', async () => {
                await deleteSite(groupId, siteId);
                await renderShortcuts();
            });
        });
    });
    
    // 编辑分组按钮
    document.querySelectorAll('.edit-group-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const groupId = this.dataset.groupId;
            showEditGroupModal(groupId);
        });
    });
    
    // 删除分组按钮
    document.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const groupId = this.dataset.groupId;
            showConfirmDialog('删除分组', '确定要删除这个分组吗？分组内的所有网站也会被删除。', async () => {
                await deleteGroup(groupId);
                await renderShortcuts();
            });
        });
    });
}

// 显示添加网站模态框
function showAddSiteModal(groupId) {
    // 这里可以复用现有的添加网站模态框
    const modal = document.getElementById('popup-add-site-modal');
    if (modal) {
        document.getElementById('popup-current-group-id').value = groupId;
        document.getElementById('popup-site-name').value = '';
        document.getElementById('popup-site-url').value = '';
        document.getElementById('popup-site-icon').value = '';
        modal.style.display = 'block';
    }
}

// 显示编辑网站模态框
function showEditSiteModal(groupId, siteId) {
    // 这里可以复用现有的编辑网站模态框
    const modal = document.getElementById('popup-edit-site-modal');
    if (modal) {
        // 加载网站数据并填充表单
        loadSiteData(groupId, siteId).then(site => {
            if (site) {
                document.getElementById('popup-edit-group-id').value = groupId;
                document.getElementById('popup-edit-site-id').value = siteId;
                document.getElementById('popup-edit-site-name').value = site.name;
                document.getElementById('popup-edit-site-url').value = site.url;
                document.getElementById('popup-edit-site-icon').value = site.icon || '';
                modal.style.display = 'block';
            }
        });
    }
}

// 显示编辑分组模态框
function showEditGroupModal(groupId) {
    // 这里可以复用现有的编辑分组模态框
    const modal = document.getElementById('popup-edit-group-modal');
    if (modal) {
        // 加载分组数据并填充表单
        loadGroupData(groupId).then(group => {
            if (group) {
                document.getElementById('popup-edit-group-id').value = groupId;
                document.getElementById('popup-edit-group-name').value = group.name;
                modal.style.display = 'block';
            }
        });
    }
}

// 加载网站数据
async function loadSiteData(groupId, siteId) {
    const data = await loadShortcutsData();
    const group = data.groups.find(g => g.id === groupId);
    if (group) {
        return group.sites.find(site => site.id === siteId);
    }
    return null;
}

// 加载分组数据
async function loadGroupData(groupId) {
    const data = await loadShortcutsData();
    return data.groups.find(g => g.id === groupId);
}

// 删除网站
async function deleteSite(groupId, siteId) {
    const data = await loadShortcutsData();
    const group = data.groups.find(g => g.id === groupId);
    if (group) {
        group.sites = group.sites.filter(site => site.id !== siteId);
        localStorage.setItem('startpage-data', JSON.stringify(data));
    }
}

// 删除分组
async function deleteGroup(groupId) {
    const data = await loadShortcutsData();
    data.groups = data.groups.filter(group => group.id !== groupId);
    localStorage.setItem('startpage-data', JSON.stringify(data));
}

// 切换网站可见性
async function toggleSiteVisibility(groupId, siteId) {
    const data = await loadShortcutsData();
    const group = data.groups.find(g => g.id === groupId);
    if (group) {
        const site = group.sites.find(s => s.id === siteId);
        if (site) {
            site.hidden = !site.hidden;
            localStorage.setItem('startpage-data', JSON.stringify(data));
            renderShortcuts();
        }
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

// 主题管理类
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // 加载保存的主题设置
    async loadTheme() {
        try {
            const savedTheme = localStorage.getItem('qidobloom-theme');
            if (savedTheme) {
                this.currentTheme = savedTheme;
            } else {
                this.currentTheme = 'system';
            }
            this.applyTheme();
        } catch (error) {
            console.error('Load theme error:', error);
            this.currentTheme = 'system';
            this.applyTheme();
        }
    }

    // 保存主题设置
    async saveTheme(theme) {
        try {
            this.currentTheme = theme;
            localStorage.setItem('qidobloom-theme', theme);
            this.applyTheme();
        } catch (error) {
            console.error('Save theme error:', error);
        }
    }

    // 应用主题
    applyTheme() {
        let themeToApply = this.currentTheme;
        if (themeToApply === 'system') {
            themeToApply = this.systemTheme;
        }

        if (themeToApply === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    // 更新系统主题检测
    updateSystemTheme() {
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (this.currentTheme === 'system') {
            this.applyTheme();
        }
    }
}

// 初始化主题管理器
const themeManager = new ThemeManager();

// 初始化主题切换功能
function initThemeToggle() {
    const themeButton = document.querySelector('.theme-button');
    const themeDropdown = document.querySelector('.theme-dropdown-menu');
    const themeOptions = document.querySelectorAll('[data-theme]');

    if (!themeButton || !themeDropdown) return;

    // 切换下拉菜单
    themeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    });

    // 点击外部关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!themeButton.contains(e.target) && !themeDropdown.contains(e.target)) {
            themeDropdown.classList.remove('show');
        }
    });

    // 处理主题选项点击
    themeOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const theme = this.dataset.theme;
            themeManager.saveTheme(theme);
            themeDropdown.classList.remove('show');
        });
    });

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        themeManager.updateSystemTheme();
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async function() {
    await initNewSearch();
    await renderShortcuts();
    await applyWallpaper();
    await themeManager.loadTheme();
    initThemeToggle();
    
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

// 搜索历史管理类
class SearchHistoryManager {
    constructor() {
        this.history = [];
        this.maxHistoryItems = 10;
        this.hotKeywords = [
            'GitHub', 'Google', '百度', '必应', 'YouTube',
            'Notion', 'Figma', 'CodePen', 'Stack Overflow', 'MDN Web Docs',
            'React', 'Vue', 'JavaScript', 'Python', 'TypeScript'
        ];
    }

    // 加载搜索历史
    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('qidobloom-search-history');
            if (savedHistory) {
                this.history = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Load search history error:', error);
            this.history = [];
        }
    }

    // 保存搜索历史
    saveHistory() {
        try {
            localStorage.setItem('qidobloom-search-history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Save search history error:', error);
        }
    }

    // 添加搜索记录
    addSearch(query) {
        if (!query || query.trim() === '') return;

        // 移除重复的记录
        this.history = this.history.filter(item => item.query !== query);
        
        // 添加到历史记录开头
        this.history.unshift({
            query: query,
            timestamp: Date.now(),
            frequency: 1
        });

        // 限制历史记录数量
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }

        // 保存历史记录
        this.saveHistory();
    }

    // 获取搜索历史
    getHistory() {
        return this.history;
    }

    // 清空搜索历史
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    // 获取热门关键词
    getHotKeywords() {
        return this.hotKeywords;
    }

    // 获取搜索建议
    getSuggestions(query) {
        if (!query || query.trim() === '') {
            return {
                history: this.getHistory(),
                hot: this.getHotKeywords()
            };
        }

        const lowercaseQuery = query.toLowerCase();
        const historySuggestions = this.history.filter(item => 
            item.query.toLowerCase().includes(lowercaseQuery)
        );

        const hotSuggestions = this.hotKeywords.filter(keyword => 
            keyword.toLowerCase().includes(lowercaseQuery)
        );

        return {
            history: historySuggestions,
            hot: hotSuggestions
        };
    }
}

// 初始化搜索历史管理器
const searchHistoryManager = new SearchHistoryManager();
searchHistoryManager.loadHistory();

// 初始化搜索建议功能
function initSearchSuggestions() {
    const searchInput = document.getElementById('new-search-input');
    const searchSuggestions = document.getElementById('search-suggestions');

    if (!searchInput || !searchSuggestions) return;

    // 输入事件
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length >= 0) {
            showSearchSuggestions(query);
        } else {
            hideSearchSuggestions();
        }
    });

    // 聚焦事件
    searchInput.addEventListener('focus', function() {
        const query = this.value.trim();
        showSearchSuggestions(query);
    });

    // 点击外部关闭
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            hideSearchSuggestions();
        }
    });

    // 键盘事件
    searchInput.addEventListener('keydown', function(e) {
        const activeItem = searchSuggestions.querySelector('.search-suggestion-item.active');
        const allItems = searchSuggestions.querySelectorAll('.search-suggestion-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const nextItem = activeItem.nextElementSibling;
                    if (nextItem && nextItem.classList.contains('search-suggestion-item')) {
                        nextItem.classList.add('active');
                        nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else if (allItems.length > 0) {
                        allItems[0].classList.add('active');
                    }
                } else if (allItems.length > 0) {
                    allItems[0].classList.add('active');
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const prevItem = activeItem.previousElementSibling;
                    if (prevItem && prevItem.classList.contains('search-suggestion-item')) {
                        prevItem.classList.add('active');
                        prevItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else if (allItems.length > 0) {
                        allItems[allItems.length - 1].classList.add('active');
                    }
                } else if (allItems.length > 0) {
                    allItems[allItems.length - 1].classList.add('active');
                }
                break;
            case 'Enter':
                if (activeItem) {
                    e.preventDefault();
                    searchInput.value = activeItem.dataset.query;
                    hideSearchSuggestions();
                    searchInput.form.dispatchEvent(new Event('submit'));
                }
                break;
            case 'Escape':
                hideSearchSuggestions();
                break;
        }
    });

    // 搜索表单提交事件
    const searchForm = document.getElementById('new-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const query = searchInput.value.trim();
            if (query) {
                searchHistoryManager.addSearch(query);
            }
        });
    }
}

// 显示搜索建议
function showSearchSuggestions(query) {
    const searchSuggestions = document.getElementById('search-suggestions');
    if (!searchSuggestions) return;

    const suggestions = searchHistoryManager.getSuggestions(query);
    let html = '';

    // 添加历史记录
    if (suggestions.history.length > 0) {
        html += `
            <div class="search-suggestion-group">
                <div class="search-suggestion-group-header">历史搜索</div>
                ${suggestions.history.map(item => `
                    <div class="search-suggestion-item" data-query="${item.query}">
                        <div class="icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                            </svg>
                        </div>
                        <div class="text">${item.query}</div>
                        <div class="frequency">${formatTime(item.timestamp)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 添加热门关键词
    if (suggestions.hot.length > 0) {
        html += `
            <div class="search-suggestion-group">
                <div class="search-suggestion-group-header">热门搜索</div>
                ${suggestions.hot.map(keyword => `
                    <div class="search-suggestion-item" data-query="${keyword}">
                        <div class="icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </div>
                        <div class="text">${keyword}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (html) {
        searchSuggestions.innerHTML = html;
        searchSuggestions.classList.add('show');

        // 添加点击事件
        const suggestionItems = searchSuggestions.querySelectorAll('.search-suggestion-item');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function() {
                const query = this.dataset.query;
                document.getElementById('new-search-input').value = query;
                hideSearchSuggestions();
                document.getElementById('new-search-form').dispatchEvent(new Event('submit'));
            });
        });
    } else {
        hideSearchSuggestions();
    }
}

// 隐藏搜索建议
function hideSearchSuggestions() {
    const searchSuggestions = document.getElementById('search-suggestions');
    if (searchSuggestions) {
        searchSuggestions.classList.remove('show');
    }
}

// 格式化时间
function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return '一周前';
}

// 初始化自动完成
initAutocomplete();

// 初始化搜索建议
initSearchSuggestions();

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
                        <!-- 壁纸设置选项 -->
                        <div class="wallpaper-settings">
                            <h4>壁纸设置</h4>
                            <div class="form-group">
                                <label for="wallpaper-blur">模糊效果</label>
                                <input type="range" id="wallpaper-blur" min="0" max="20" value="0" class="form-control">
                                <span id="blur-value">0px</span>
                            </div>
                            <div class="form-group">
                                <label for="wallpaper-fit">自适应方式</label>
                                <select id="wallpaper-fit" class="form-control">
                                    <option value="cover">覆盖</option>
                                    <option value="contain">包含</option>
                                    <option value="stretch">拉伸</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="wallpaper-position">位置</label>
                                <select id="wallpaper-position" class="form-control">
                                    <option value="center">居中</option>
                                    <option value="top">顶部</option>
                                    <option value="bottom">底部</option>
                                    <option value="left">左侧</option>
                                    <option value="right">右侧</option>
                                </select>
                            </div>
                        </div>
                        
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
    
    // 初始化壁纸设置控件
    const blurSlider = popupContent.querySelector('#wallpaper-blur');
    const blurValue = popupContent.querySelector('#blur-value');
    const fitSelect = popupContent.querySelector('#wallpaper-fit');
    const positionSelect = popupContent.querySelector('#wallpaper-position');
    
    if (blurSlider && blurValue) {
        blurSlider.value = wallpaperManager.wallpaperSettings.blur;
        blurValue.textContent = `${wallpaperManager.wallpaperSettings.blur}px`;
        
        // 模糊效果调整
        blurSlider.addEventListener('input', function() {
            const blur = parseInt(this.value);
            blurValue.textContent = `${blur}px`;
            wallpaperManager.saveWallpaperSettings({ blur });
        });
    }
    
    if (fitSelect) {
        fitSelect.value = wallpaperManager.wallpaperSettings.fit;
        
        // 自适应方式调整
        fitSelect.addEventListener('change', function() {
            const fit = this.value;
            wallpaperManager.saveWallpaperSettings({ fit });
        });
    }
    
    if (positionSelect) {
        positionSelect.value = wallpaperManager.wallpaperSettings.position;
        
        // 位置调整
        positionSelect.addEventListener('change', function() {
            const position = this.value;
            wallpaperManager.saveWallpaperSettings({ position });
        });
    }



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
                // 压缩图片
                const compressedImage = await wallpaperManager.compressImage(file);
                if (compressedImage) {
                    // 保存到已上传壁纸列表
                    await wallpaperManager.addUploadedWallpaper(compressedImage);
                    
                    if (await wallpaperManager.saveWallpaper(compressedImage)) {
                        wallpaperManager.applyWallpaper(compressedImage);
                        
                        // 将新壁纸添加到已有壁纸列表
                        const wallpaperPreviews = popupContent.querySelector('.wallpaper-previews');
                        if (wallpaperPreviews) {
                            // 检查是否已存在相同的壁纸
                            const existingPreview = Array.from(wallpaperPreviews.children).find(p => p.dataset.wallpaper === compressedImage);
                            if (!existingPreview) {
                                const newPreview = document.createElement('div');
                                newPreview.className = 'wallpaper-preview selected';
                                newPreview.dataset.wallpaper = compressedImage;
                                newPreview.innerHTML = `
                                    <div class="wallpaper-thumbnail" style="background-image: url('${compressedImage}'); background-size: cover; background-position: center;"></div>
                                    <button class="wallpaper-delete-btn" data-wallpaper="${compressedImage}">&times;</button>
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

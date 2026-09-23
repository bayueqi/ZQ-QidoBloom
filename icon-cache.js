/**
 * 图标缓存 —— 把图标在本地存一份，下次开新标签页直接用，不再上网要。
 *
 * 几条设计上的取舍，改动前先读一下：
 * 1. 用 IndexedDB 而不是 localStorage。localStorage 是同步写，几百 KB 会卡住主线程，
 *    而且 base64 会再膨胀三分之一。IndexedDB 是异步的、能直接存二进制、不受 5MB 限制。
 * 2. 启动时把整张表一次性读进内存（host -> blob: 地址），所以渲染仍然可以同步查表，
 *    不需要把 renderShortcuts 改成异步。
 * 3. 缓存键用「域名」而不是完整网址，也**不含图标源** —— 同一个站点改了路径或参数照样命中，
 *    换了图标源也不会让已经存好的图失效。换源时接着用旧源存下来的图，是刻意的：
 *    在用户眼里那就是"这个站的图标"，不该因为换了源就变回字母。
 * 4. 任何一步出错都静默跳过：抓不到、存不进、读不出，都退回原来的行为，不报错不弹窗。
 *    **不要**在切换图标源时清空缓存（曾经这么写过，结果换源 = 全部重抓 = 图标集体变字母）。
 */
(function (global) {
    'use strict';

    const DB_NAME = 'qdb-icon-cache';
    const DB_VERSION = 1;
    const STORE_NAME = 'icons';
    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天。过期后重新抓一次，网站换了 logo 能跟上
    const MAX_ICON_BYTES = 512 * 1024;       // 单张上限，防止把错误页整页存进来
    const MAX_CONCURRENT = 6;                // 浏览器对同一域名的并发上限也就是 6 左右

    const memUrls = Object.create(null);   // host -> blob: 地址，渲染时同步查这张表
    const attempted = Object.create(null); // host -> true，本次会话已试过，不重复试
    let dbPromise = null;
    let loaded = false;

    function openDb() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise(function (resolve) {
            if (typeof indexedDB === 'undefined') { resolve(null); return; }
            let request;
            try {
                request = indexedDB.open(DB_NAME, DB_VERSION);
            } catch (error) {
                resolve(null);
                return;
            }
            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'host' });
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { resolve(null); };
            request.onblocked = function () { resolve(null); };
        });
        return dbPromise;
    }

    function toObjectUrl(blob) {
        try {
            return URL.createObjectURL(blob);
        } catch (error) {
            return null;
        }
    }

    // 启动时把抽屉读进内存。读不到就当作空抽屉，页面照常跑。
    function loadAll() {
        if (loaded) return Promise.resolve();
        loaded = true;
        if (typeof indexedDB === 'undefined') return Promise.resolve();

        return openDb().then(function (db) {
            if (!db) return;
            return new Promise(function (resolve) {
                let request;
                try {
                    request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
                } catch (error) {
                    resolve();
                    return;
                }
                request.onsuccess = function () {
                    const now = Date.now();
                    const expired = [];
                    (request.result || []).forEach(function (row) {
                        if (!row || !row.host || !row.blob) return;
                        if (now - (row.at || 0) > TTL_MS) { expired.push(row.host); return; }
                        const url = toObjectUrl(row.blob);
                        if (url) memUrls[row.host] = url;
                    });
                    if (expired.length) removeHosts(expired);
                    resolve();
                };
                request.onerror = function () { resolve(); };
            });
        });
    }

    function get(host) {
        if (!host) return null;
        return memUrls[host] || null;
    }

    function has(host) {
        return !!(host && memUrls[host]);
    }

    function count() {
        return Object.keys(memUrls).length;
    }

    function persist(host, blob) {
        return openDb().then(function (db) {
            if (!db) return false;
            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).put({ host: host, blob: blob, at: Date.now() });
                    tx.oncomplete = function () { resolve(true); };
                    tx.onerror = function () { resolve(false); };
                } catch (error) {
                    resolve(false);
                }
            });
        });
    }

    function removeHosts(hosts) {
        return openDb().then(function (db) {
            if (!db) return;
            hosts.forEach(function (host) {
                delete memUrls[host];
                delete attempted[host];
            });
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                hosts.forEach(function (host) { store.delete(host); });
            } catch (error) {
                /* 删不掉也无所谓，反正内存里已经拿掉了 */
            }
        });
    }

    // 真正去把图标抓回来。任何一步不对就抛错，由调用方静默吞掉。
    function fetchOne(url) {
        return fetch(url, { credentials: 'omit', cache: 'no-store' }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const type = response.headers.get('content-type') || '';
            if (type && type.indexOf('image/') !== 0) throw new Error('不是图片：' + type);
            return response.blob();
        }).then(function (blob) {
            if (!blob || !blob.size) throw new Error('空内容');
            if (blob.size > MAX_ICON_BYTES) throw new Error('太大：' + blob.size);
            return blob;
        });
    }

    /**
     * 依次试候选图标源，谁先成功就用谁的。
     * 站点图标的覆盖面各家不一样：同一个站，A 源有、B 源没有（比如 B 站 htmlico 拿不到、
     * toolb 能拿到）。所以第一个源失败就自动换下一个，全都失败才放弃。
     */
    function fetchFromAny(host, sources, index) {
        if (index >= sources.length) return Promise.reject(new Error('所有图标源都没拿到'));
        let url;
        try {
            url = sources[index](host);
        } catch (error) {
            url = null;
        }
        if (!url) return fetchFromAny(host, sources, index + 1);
        return fetchOne(url).catch(function () {
            return fetchFromAny(host, sources, index + 1);
        });
    }

    /**
     * 把一批域名排队抓回来。
     * @param {string[]} hosts            要抓的域名
     * @param {Array<function>|function} urlFors
     *        候选图标源，按优先级排列，每项是 host => 地址。传单个函数也兼容。
     * @param {function} onReady          抓成功后回调 (host, blobUrl)，用于就地换图
     */
    function schedule(hosts, urlFors, onReady) {
        const sources = (Array.isArray(urlFors) ? urlFors : [urlFors]).filter(function (fn) {
            return typeof fn === 'function';
        });
        if (!sources.length) return;

        const queue = (hosts || []).filter(function (host) {
            return host && !memUrls[host] && !attempted[host];
        });
        if (!queue.length) return;
        queue.forEach(function (host) { attempted[host] = true; });

        let active = 0;
        let index = 0;

        function pump() {
            while (active < MAX_CONCURRENT && index < queue.length) {
                const host = queue[index++];
                active++;
                fetchFromAny(host, sources, 0).then(function (blob) {
                    const url = toObjectUrl(blob);
                    active--;
                    if (!url) { pump(); return; }
                    memUrls[host] = url;
                    persist(host, blob);
                    if (typeof onReady === 'function') onReady(host, url);
                    pump();
                }).catch(function () {
                    active--;
                    // 所有源都抓不到就当没这回事。不开重试、不刷日志，下次开新标签页会自动再试一次。
                    pump();
                });
            }
        }
        pump();
    }

    // 清空抽屉（设置面板的按钮用）
    function clearAll() {
        Object.keys(memUrls).forEach(function (host) {
            try { URL.revokeObjectURL(memUrls[host]); } catch (error) { /* ignore */ }
            delete memUrls[host];
        });
        Object.keys(attempted).forEach(function (host) { delete attempted[host]; });

        return openDb().then(function (db) {
            if (!db) return false;
            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).clear();
                    tx.oncomplete = function () { resolve(true); };
                    tx.onerror = function () { resolve(false); };
                } catch (error) {
                    resolve(false);
                }
            });
        });
    }

    /**
     * 这个图标地址是否在扩展的「可访问名单」里。
     * 名单就是 manifest.json 的 host_permissions —— 不写进去，浏览器就不让读，也就存不了。
     * 直接问浏览器要名单，避免代码里再抄一份、两边对不上。
     * @returns {boolean|null} null 表示不在扩展环境里，判断不了
     */
    function isUrlAllowed(url) {
        let hostname;
        try {
            hostname = new URL(url).hostname;
        } catch (error) {
            return false;
        }
        let patterns;
        try {
            patterns = (chrome.runtime.getManifest().host_permissions) || [];
        } catch (error) {
            return null; // 直接打开页面预览时走这里，不是真的没权限
        }
        return patterns.some(function (pattern) {
            try {
                return new URL(pattern.replace(/\*$/, '')).hostname === hostname;
            } catch (error) {
                return false;
            }
        });
    }

    global.iconCache = {
        loadAll: loadAll,
        get: get,
        has: has,
        count: count,
        schedule: schedule,
        clearAll: clearAll,
        isUrlAllowed: isUrlAllowed,
        TTL_DAYS: Math.round(TTL_MS / 86400000)
    };
})(window);

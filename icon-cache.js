/**
 * 图标缓存 —— 把图标在本地存一份，下次开新标签页直接用，不再上网要。
 *
 * 几条设计上的取舍，改动前先读一下：
 * 1. 用 IndexedDB 而不是 localStorage。localStorage 是同步写，几百 KB 会卡住主线程，
 *    而且 base64 会再膨胀三分之一。IndexedDB 是异步的、能直接存二进制、不受 5MB 限制。
 * 2. 启动时把整张表一次性读进内存（host -> blob: 地址），所以渲染仍然可以同步查表，
 *    不需要把 renderShortcuts 改成异步。
 * 3. 缓存键用「域名」而不是完整网址 —— 同一个站点改了路径或参数照样命中。
 *    但每条记录额外记住「这张图是哪个图标源抓来的」（src 字段），因为规则是：
 *    **当前源优先，抓到了就覆盖旧图；抓不到才继续用旧图**。所以换源之后旧源的图不会被
 *    无脑丢掉 —— 它是当前源拿不到图时的兜底 —— 但只要当前源能拿到，就会被换掉。
 * 4. 任何一步出错都静默跳过：抓不到、存不进、读不出，都退回原来的行为，不报错不弹窗。
 *    **不要**在切换图标源时清空缓存（曾经这么写过，结果换源 = 全部重抓 = 图标集体变字母）。
 */
(function (global) {
    'use strict';

    const DB_NAME = 'qdb-icon-cache';
    const DB_VERSION = 1;
    const STORE_NAME = 'icons';
    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天。同源也会过期重抓一次，跟得上网站换 logo；
                                             // 但抓不到时旧图留着兜底，不是一过期就丢掉
    const MAX_ICON_BYTES = 512 * 1024;       // 单张上限，防止把错误页整页存进来
    const MAX_CONCURRENT = 6;                // 浏览器对同一域名的并发上限也就是 6 左右

    const memUrls = Object.create(null);   // host -> blob: 地址，渲染时同步查这张表
    const memMeta = Object.create(null);   // host -> { src, at }：这张图是哪个源抓的、什么时候存的
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
                    (request.result || []).forEach(function (row) {
                        if (!row || !row.host || !row.blob) return;
                        const url = toObjectUrl(row.blob);
                        if (!url) return;
                        memUrls[row.host] = url;
                        // 老记录没有 src 字段，当作「来历不明」：与当前源一比就会重抓一次并覆盖，
                        // 正好把这次改动之前攒下的图刷新成当前源的。
                        memMeta[row.host] = { src: row.src || '', at: row.at || 0 };
                    });
                    // 过期的**不删**：当前源抓不到时它就是兜底。要不要重抓交给 needsFetch 判断。
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

    // src 记下「这张图是哪个源抓的」，下次开新标签页靠它判断要不要拿当前源重抓一遍
    function persist(host, blob, src) {
        return openDb().then(function (db) {
            if (!db) return false;
            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).put({ host: host, blob: blob, at: Date.now(), src: src || '' });
                    tx.oncomplete = function () { resolve(true); };
                    tx.onerror = function () { resolve(false); };
                } catch (error) {
                    resolve(false);
                }
            });
        });
    }

    /**
     * 这个域名要不要去当前源抓一次？
     * 三种情况要抓：① 本地一张都没有；② 手里那张不是当前源抓的（换过源）；
     * ③ 手里那张是当前源的但过期了（重抓一次，网站换了 logo 能跟上）。
     * 三种都不是就直接用手里的图，省一次请求。
     */
    function needsFetch(host, srcKey, now) {
        const meta = memMeta[host];
        if (!meta) return true;
        if (meta.src !== srcKey) return true;
        return now - meta.at > TTL_MS;
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
     * 按顺序试候选图标源，谁先成功就用谁的。
     * 调用方目前只传一个源 —— 就是用户在设置里填的那个。换源之后不该再偷偷去问旧源
     * （曾经是「当前源 → 历史源 → 内置默认源」三级兜底，用户换源后旧源照样被请求，控制台一屏 404）。
     * 这里仍收数组，只是让缓存层不认识「源」是什么，只负责依次试。
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
     * @param {string} srcKey             当前图标源的标识（直接用源的模板字符串）。会存进缓存记录，
     *                                    下次靠它判断「手里这张图是不是当前源的」。缺省时退回
     *                                    「有图就不抓」的旧行为。
     */
    function schedule(hosts, urlFors, onReady, srcKey) {
        const sources = (Array.isArray(urlFors) ? urlFors : [urlFors]).filter(function (fn) {
            return typeof fn === 'function';
        });
        if (!sources.length) return;

        const key = String(srcKey || '');
        const now = Date.now();
        const queue = (hosts || []).filter(function (host) {
            return host && !attempted[host] && needsFetch(host, key, now);
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
                    memMeta[host] = { src: key, at: Date.now() };
                    persist(host, blob, key);
                    if (typeof onReady === 'function') onReady(host, url);
                    pump();
                }).catch(function () {
                    active--;
                    // 抓不到就**保持手里那张图不动**（有的话）—— 这就是「新源拿不到就用旧图」。
                    // 不重试、不刷日志，下次开新标签页会自动再试一次。
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
            delete memMeta[host];
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

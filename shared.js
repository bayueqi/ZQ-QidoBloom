/**
 * 起始页与扩展弹窗共用的数据 / 桥接工具。
 *
 * 这两个页面同属 chrome-extension://<id> 同一源，共用 localStorage['startpage-data']。
 * 读写逻辑原来在 script.js 和 popup.js 里各写了一份，改一处忘一处就是这么来的，统一放这里。
 */
(function (global) {
    'use strict';

    const DATA_KEY = 'startpage-data';
    const MIRROR_KEY = 'groups-mirror';
    const PENDING_KEY = 'pending-sites';
    const INBOX_GROUP_NAME = '待分组';

    // 解析结果按原始字符串缓存：任何一处写盘都会让字符串变掉，缓存自动失效
    let rawCache;
    let dataCache;
    let cached = false;

    function readData() {
        const raw = localStorage.getItem(DATA_KEY);
        if (cached && rawCache === raw) return dataCache;

        let data;
        try {
            data = raw ? JSON.parse(raw) : { groups: [] };
        } catch (error) {
            data = { groups: [] };
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) data = { groups: [] };
        if (!Array.isArray(data.groups)) data.groups = [];

        rawCache = raw;
        dataCache = data;
        cached = true;
        return data;
    }

    function writeData(data) {
        const raw = JSON.stringify(data);
        localStorage.setItem(DATA_KEY, raw);
        rawCache = raw;
        dataCache = data;
        cached = true;
    }

    // 取域名（保留 www.），图标源用它
    function siteHostname(url) {
        try {
            return new URL(url).hostname;
        } catch (error) {
            return String(url || '').replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
        }
    }

    // 取域名（去掉 www.），显示与判重用它
    function hostOf(url) {
        return siteHostname(url).replace(/^www\./, '');
    }

    // 判重用的 URL 归一化：忽略锚点和结尾斜杠
    function normalizeUrl(url) {
        try {
            const parsed = new URL(url);
            parsed.hash = '';
            return parsed.href.replace(/\/$/, '');
        } catch (error) {
            return String(url || '');
        }
    }

    function hasBridge() {
        return typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.local);
    }

    function bridgeGet(key) {
        return new Promise(function (resolve) {
            if (!hasBridge()) return resolve(undefined);
            try {
                chrome.storage.local.get(key, function (result) {
                    resolve(result ? result[key] : undefined);
                });
            } catch (error) {
                resolve(undefined);
            }
        });
    }

    function bridgeSet(payload) {
        return new Promise(function (resolve) {
            if (!hasBridge()) return resolve(false);
            try {
                chrome.storage.local.set(payload, function () {
                    resolve(!chrome.runtime.lastError);
                });
            } catch (error) {
                resolve(false);
            }
        });
    }

    // 分组镜像：内容没变就不写盘（renderShortcuts 每次都会调）
    let mirrorFingerprint = null;

    function syncGroupsMirror(groups) {
        if (!hasBridge()) return Promise.resolve();
        const list = (Array.isArray(groups) ? groups : []).map(function (group) {
            return { id: group.id, name: group.name };
        });
        const fingerprint = JSON.stringify(list);
        if (fingerprint === mirrorFingerprint) return Promise.resolve();
        return bridgeSet({ [MIRROR_KEY]: list }).then(function (ok) {
            // 写成功才记指纹，失败下次自然会重试
            if (ok) mirrorFingerprint = fingerprint;
        });
    }

    // 把右键菜单攒下的网站合并进 startpage-data，然后清空队列
    async function drainPendingSites() {
        if (!hasBridge()) return 0;
        const pending = await bridgeGet(PENDING_KEY);
        if (!Array.isArray(pending) || !pending.length) return 0;

        const data = readData();
        if (!Array.isArray(data.groups)) data.groups = [];

        let added = 0;
        pending.forEach(function (item, index) {
            if (!item || !item.url) return;

            // 指定的分组可能已被删掉，这种情况落到「待分组」，不丢数据
            let group = item.groupId ? data.groups.find(function (g) { return g.id === item.groupId; }) : null;
            if (!group) {
                group = data.groups.find(function (g) { return g.name === INBOX_GROUP_NAME; });
                if (!group) {
                    group = { id: `${Date.now()}-${index}`, name: INBOX_GROUP_NAME, sites: [] };
                    data.groups.push(group);
                }
            }
            if (!Array.isArray(group.sites)) group.sites = [];

            const target = normalizeUrl(item.url);
            if (group.sites.some(function (site) { return normalizeUrl(site.url) === target; })) return;

            group.sites.push({
                id: `${group.id}-${Date.now()}-${index}`,
                name: item.name || target,
                url: item.url
            });
            added++;
        });

        writeData(data);
        await bridgeSet({ [PENDING_KEY]: [] });
        return added;
    }

    global.QDB = {
        DATA_KEY: DATA_KEY,
        PENDING_KEY: PENDING_KEY,
        INBOX_GROUP_NAME: INBOX_GROUP_NAME,
        readData: readData,
        writeData: writeData,
        siteHostname: siteHostname,
        hostOf: hostOf,
        normalizeUrl: normalizeUrl,
        hasBridge: hasBridge,
        syncGroupsMirror: syncGroupsMirror,
        drainPendingSites: drainPendingSites
    };
})(window);

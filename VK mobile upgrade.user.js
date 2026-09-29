// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      2.29.11
// @description  Улучшение интерфейса m.vk.ru: выбор тем (Светлая, Тёмная, Snow Black), раздел Мессенджер в настройках Внешнего вида, поддержка PWA/веб-приложений (выбор стартовой вкладки, стилизация загрузочного экрана, тематические иконки и название VK), ручная настройка размера и толщины значков на нижней панели, кастомизация кнопки «Поиск», скрытие подписей, круглые счетчики, кнопка «Только непрочитанные» в шапке, скрытие меню действий в списке чатов, скрытие категорий чатов, отключение звонков и видеосообщений.
// @author       Kowalski-coder
// @match        *://m.vk.ru/*
// @match        *://m.vk.com/*
// @match        *://vk.ru/*
// @match        *://vk.com/*
// @match        *://*.vk.ru/*
// @match        *://*.vk.com/*
// @include      *://m.vk.ru/*
// @include      *://m.vk.com/*
// @include      *://vk.ru/*
// @include      *://vk.com/*
// @include      *://*.vk.ru/*
// @include      *://*.vk.com/*
// @icon         https://vk.ru/favicon.ico
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    //            НАСТРОЙКИ (STORAGE)
    // ==========================================
    const STORAGE_KEYS = {
        THEME_MODE: 'vmu_theme_mode', // 'light' | 'dark' | 'snow_black'
        TAB_SEARCH: 'vmu_tab_search', // 'search' | 'friends' | 'groups' | 'music' | 'video' | 'bookmarks'
        START_PAGE: 'vmu_start_page', // 'mail' | 'feed'
        HIDE_TAB_LABELS: 'vmu_hide_tab_labels',
        HIDE_FOLDERS_BAR: 'vmu_hide_folders_bar',
        HIDE_CALLS: 'vmu_hide_calls',
        HIDE_VIDEO_MSGS: 'vmu_hide_video_msgs',
        GHOST_TYPING: 'vmu_ghost_typing',
        GHOST_READ: 'vmu_ghost_read',
        SAVE_DELETED_MSGS: 'vmu_save_deleted_msgs',
        SPY_REMOVE_FRIEND: 'vmu_spy_remove_friend',
        SPY_ONLINE_OFFLINE: 'vmu_spy_online_offline',
        SPY_INVISIBLE_MODE: 'vmu_spy_invisible_mode',
        CUSTOM_ICON_PARAMS: 'vmu_custom_icon_params_v4',
        ICON_INDIVIDUAL_MODE: 'vmu_icon_individual_mode',
        CUSTOM_SECTION_OPEN: 'vmu_custom_section_open'
    };

    function getSetting(key, defaultValue) {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return defaultValue;
            return val === 'true';
        } catch (e) {
            return defaultValue;
        }
    }

    function getStringSetting(key, defaultValue) {
        try {
            const val = localStorage.getItem(key);
            if (val === null || val === undefined) return defaultValue;
            return val;
        } catch (e) {
            return defaultValue;
        }
    }

    function setSetting(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch (e) {}
    }

    function getThemeSetting() {
        try {
            const val = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
            if (val === 'light' || val === 'dark' || val === 'nord' || val === 'snow_black') {
                return val;
            }
            const legacySwap = localStorage.getItem('vmu_color_swap');
            if (legacySwap === 'true') return 'snow_black';
            if (legacySwap === 'false') return 'dark';
        } catch (e) {}
        return 'dark'; // по умолчанию тёмная тема
    }

    let currentThemeMode = getThemeSetting();
    let currentTabSearch = getStringSetting(STORAGE_KEYS.TAB_SEARCH, 'search');
    let currentStartPage = getStringSetting(STORAGE_KEYS.START_PAGE, 'mail');
    let isColorSwapEnabled = (currentThemeMode === 'snow_black');
    let isHideLabelsEnabled = getSetting(STORAGE_KEYS.HIDE_TAB_LABELS, false);
    let isHideFoldersEnabled = getSetting(STORAGE_KEYS.HIDE_FOLDERS_BAR, true);
    let isHideCallsEnabled = getSetting(STORAGE_KEYS.HIDE_CALLS, false);
    let isHideVideoMsgsEnabled = getSetting(STORAGE_KEYS.HIDE_VIDEO_MSGS, false);
    let isGhostTypingEnabled = getSetting(STORAGE_KEYS.GHOST_TYPING, false);
    let isGhostReadEnabled = getSetting(STORAGE_KEYS.GHOST_READ, false);
    let isSaveDeletedMsgsEnabled = getSetting(STORAGE_KEYS.SAVE_DELETED_MSGS, false);
    let isSpyRemoveFriendEnabled = getSetting(STORAGE_KEYS.SPY_REMOVE_FRIEND, false);
    let isSpyOnlineOfflineEnabled = getSetting(STORAGE_KEYS.SPY_ONLINE_OFFLINE, false);
    let isSpyInvisibleEnabled = getSetting(STORAGE_KEYS.SPY_INVISIBLE_MODE, false);

    // ==========================================
    //   СЕТЕВОЙ ПЕРЕХВАТЧИК: НЕЧИТАЛКА, НЕПИСАЛКА И СОХРАНЕНИЕ УДАЛЁННЫХ СООБЩЕНИЙ
    // ==========================================
    const DB_NAME = 'vmu_messages_store_v1';
    const DB_VERSION = 1;
    const STORE_NAME = 'messages';

    let dbPromise = null;
    function getMessagesDb() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve) => {
                try {
                    const idb = (typeof window !== 'undefined' && window.indexedDB) || 
                                (typeof unsafeWindow !== 'undefined' && unsafeWindow.indexedDB);
                    if (!idb) return resolve(null);
                    const req = idb.open(DB_NAME, DB_VERSION);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                            store.createIndex('peer_id', 'peer_id', { unique: false });
                            store.createIndex('date', 'date', { unique: false });
                        }
                    };
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => resolve(null);
                } catch (e) {
                    resolve(null);
                }
            });
        }
        return dbPromise;
    }

    async function dbSaveMessages(messagesList) {
        if (!isSaveDeletedMsgsEnabled || !Array.isArray(messagesList) || messagesList.length === 0) return;
        try {
            const db = await getMessagesDb();
            if (!db) return;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            for (const msg of messagesList) {
                if (!msg || !msg.id) continue;
                // Не перезаписываем статус deleted, если сообщение уже было помечено удаленным
                const getReq = store.get(msg.id);
                getReq.onsuccess = () => {
                    const existing = getReq.result;
                    const record = {
                        id: msg.id,
                        peer_id: msg.peer_id || (existing && existing.peer_id) || 0,
                        from_id: msg.from_id || (existing && existing.from_id) || 0,
                        text: msg.text !== undefined ? msg.text : (existing ? existing.text : ''),
                        date: msg.date || (existing && existing.date) || Math.floor(Date.now() / 1000),
                        attachments: msg.attachments || (existing && existing.attachments) || [],
                        deleted: existing ? !!existing.deleted : false,
                        deleted_at: existing ? existing.deleted_at : null
                    };
                    store.put(record);
                };
            }
        } catch (e) {}
    }

    async function dbMarkMessageDeleted(msgId, peerId) {
        if (!isSaveDeletedMsgsEnabled || !msgId) return;
        try {
            const db = await getMessagesDb();
            if (!db) return;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(msgId);
            req.onsuccess = () => {
                const existing = req.result;
                if (existing) {
                    existing.deleted = true;
                    existing.deleted_at = existing.deleted_at || Date.now();
                    store.put(existing);
                } else {
                    store.put({
                        id: msgId,
                        peer_id: peerId || 0,
                        from_id: 0,
                        text: '[Сообщение не сохранено в кэше]',
                        date: Math.floor(Date.now() / 1000),
                        attachments: [],
                        deleted: true,
                        deleted_at: Date.now()
                    });
                }
            };
        } catch (e) {}
    }

    async function dbGetDeletedMessagesForPeer(peerId) {
        if (!isSaveDeletedMsgsEnabled || !peerId) return [];
        try {
            const db = await getMessagesDb();
            if (!db) return [];
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('peer_id');
                const req = index.getAll(IDBKeyRange.only(peerId));
                req.onsuccess = () => {
                    const results = (req.result || []).filter(m => m && m.deleted);
                    resolve(results);
                };
                req.onerror = () => resolve([]);
            });
        } catch (e) {
            return [];
        }
    }

    // Проверка совпадения URL / Body с паттернами
    function matchesPattern(targetStr, patterns) {
        if (!targetStr || typeof targetStr !== 'string') return false;
        const lower = targetStr.toLowerCase();
        for (let i = 0; i < patterns.length; i++) {
            if (lower.includes(patterns[i])) return true;
        }
        return false;
    }

    const TYPING_PATTERNS = ['setactivity', 'act=a_typing', 'act=set_activity', 'type=typing', 'type=audiomessage', '"type":"typing"'];
    const READ_PATTERNS = ['markasread', 'act=a_read_message', 'act=a_mark_read', 'act=mark_as_read', 'markaslistened', 'act=read'];

    const AD_NETWORK_PATTERNS = [
        'act=get_audio_ad',
        'act=stat_audio_ad',
        'act=get_ad',
        'act=ad_view',
        'audio_ad',
        'stat_ad',
        'ad.mail.ru',
        'ads.vk.com',
        'top-fwz1.mail.ru',
        'ad_params',
        'audio.getadparams',
        'audio.getpromo'
    ];


    function extractStringBody(body) {
        if (!body) return '';
        if (typeof body === 'string') return body;
        if (body instanceof URLSearchParams) return body.toString();
        if (body instanceof FormData) {
            try {
                const entries = [];
                for (let pair of body.entries()) {
                    entries.push(pair[0] + '=' + pair[1]);
                }
                return entries.join('&');
            } catch (e) {}
        }
        return '';
    }

    // Разбор входящих данных LongPoll и API ответов
    function processIncomingNetworkData(url, dataStr) {
        if (!isSaveDeletedMsgsEnabled || !dataStr || typeof dataStr !== 'string') return;
        try {
            // Обработка LongPoll updates
            if (dataStr.startsWith('{') || dataStr.startsWith('[')) {
                const parsed = JSON.parse(dataStr);
                
                // LongPoll tuple updates: [ts, [[4, msg_id, flags, peer_id, timestamp, text, attach], [6, peer_id, local_id], ...]]
                const updates = parsed.updates || (Array.isArray(parsed) ? parsed : null);
                if (Array.isArray(updates)) {
                    const incomingMsgs = [];
                    for (const u of updates) {
                        if (!Array.isArray(u)) continue;
                        const code = u[0];
                        if (code === 4) { // Новое сообщение
                            const msgId = u[1];
                            const peerId = u[3];
                            const timestamp = u[4];
                            const text = u[5] || '';
                            const attach = u[6] || {};
                            incomingMsgs.push({
                                id: msgId,
                                peer_id: peerId,
                                text: text,
                                date: timestamp,
                                attachments: attach
                            });
                        } else if (code === 6 || code === 7 || code === 0) { // Удаление сообщения
                            const msgId = u[1];
                            const peerId = u[2] || 0;
                            dbMarkMessageDeleted(msgId, peerId);
                        }
                    }
                    if (incomingMsgs.length > 0) {
                        dbSaveMessages(incomingMsgs);
                    }
                }

                // API response: { response: { items: [...] } }
                if (parsed.response && Array.isArray(parsed.response.items)) {
                    const msgs = parsed.response.items.map(item => ({
                        id: item.id || item.conversation_message_id,
                        peer_id: item.peer_id,
                        from_id: item.from_id,
                        text: item.text || '',
                        date: item.date,
                        attachments: item.attachments || []
                    }));
                    dbSaveMessages(msgs);
                }
            }
        } catch (e) {}
    }

    // Инициализация хуков window.fetch и XMLHttpRequest
    function initNetworkInterceptors() {
        const targetWin = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
        if (targetWin.__vmu_interceptors_installed) return;
        targetWin.__vmu_interceptors_installed = true;

        // 1. Hook window.fetch
        const origFetch = targetWin.fetch;
        if (typeof origFetch === 'function') {
            targetWin.fetch = async function(resource, init) {
                const url = (typeof resource === 'string') ? resource : (resource && resource.url ? resource.url : '');
                const bodyStr = init ? extractStringBody(init.body) : '';
                const combined = (url + ' ' + bodyStr).toLowerCase();

                // Неписалка
                if (isGhostTypingEnabled && matchesPattern(combined, TYPING_PATTERNS)) {
                    return new Response(JSON.stringify({ response: 1, payload: [0, []] }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }


                // Всегда активная блокировка рекламы в музыке и аналитики рекламы
                if (matchesPattern(combined, AD_NETWORK_PATTERNS)) {
                    return new Response(JSON.stringify({ response: 0, payload: [0, []], ads: false }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

    
            // Всегда активная блокировка рекламы в музыке и аналитики рекламы
            if (matchesPattern(combined, AD_NETWORK_PATTERNS)) {
                Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                Object.defineProperty(this, 'status', { value: 200, writable: true });
                Object.defineProperty(this, 'responseText', { value: '{"response":0,"payload":[0,[]],"ads":false}', writable: true });
                if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                if (typeof this.onload === 'function') this.onload();
                return;
            }

            // Нечиталка
                if (isGhostReadEnabled && matchesPattern(combined, READ_PATTERNS)) {
                    return new Response(JSON.stringify({ response: 1, payload: [0, []] }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const response = await origFetch.apply(this, arguments);

                // Сохранение сообщений из ответов
                if (isSaveDeletedMsgsEnabled) {
                    try {
                        const clone = response.clone();
                        clone.text().then(text => processIncomingNetworkData(url, text)).catch(() => {});
                    } catch (e) {}
                }

                return response;
            };
        }

        // 2. Hook XMLHttpRequest
        const origOpen = targetWin.XMLHttpRequest.prototype.open;
        const origSend = targetWin.XMLHttpRequest.prototype.send;

        targetWin.XMLHttpRequest.prototype.open = function(method, url) {
            this._vmu_url = url;
            this._vmu_method = method;
            return origOpen.apply(this, arguments);
        };

        targetWin.XMLHttpRequest.prototype.send = function(body) {
            const url = this._vmu_url || '';
            const bodyStr = extractStringBody(body);
            const combined = (url + ' ' + bodyStr).toLowerCase();

            // Неписалка
            if (isGhostTypingEnabled && matchesPattern(combined, TYPING_PATTERNS)) {
                Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                Object.defineProperty(this, 'status', { value: 200, writable: true });
                Object.defineProperty(this, 'responseText', { value: '{"response":1,"payload":[0,[]]}', writable: true });
                if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                if (typeof this.onload === 'function') this.onload();
                return;
            }


            // Всегда активная блокировка рекламы в музыке и аналитики рекламы
            if (matchesPattern(combined, AD_NETWORK_PATTERNS)) {
                Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                Object.defineProperty(this, 'status', { value: 200, writable: true });
                Object.defineProperty(this, 'responseText', { value: '{"response":0,"payload":[0,[]],"ads":false}', writable: true });
                if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                if (typeof this.onload === 'function') this.onload();
                return;
            }

            // Нечиталка
            if (isGhostReadEnabled && matchesPattern(combined, READ_PATTERNS)) {
                Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                Object.defineProperty(this, 'status', { value: 200, writable: true });
                Object.defineProperty(this, 'responseText', { value: '{"response":1,"payload":[0,[]]}', writable: true });
                if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                if (typeof this.onload === 'function') this.onload();
                return;
            }

            // Перехват входящих ответов для кэширования
            if (isSaveDeletedMsgsEnabled) {
                this.addEventListener('load', () => {
                    try {
                        processIncomingNetworkData(url, this.responseText);
                    } catch (e) {}
                });
            }

            return origSend.apply(this, arguments);
        };
    }

    // Запуск сетевых перехватчиков немедленно
    initNetworkInterceptors();


    const DEFAULT_CUSTOM_PARAMS = {
        global: { scale: 100, stroke: 1.5 },
        home: { scale: 100, stroke: 1.5 },
        search: { scale: 100, stroke: 1.5 },
        friends: { scale: 100, stroke: 1.5 },
        groups: { scale: 100, stroke: 1.5 },
        music: { scale: 100, stroke: 1.5 },
        video: { scale: 100, stroke: 1.5 },
        bookmarks: { scale: 100, stroke: 1.5 },
        messages: { scale: 100, stroke: 1.5 },
        clips: { scale: 100, stroke: 1.5 },
        more: { scale: 100, stroke: 1.5 }
    };

    function getCustomIconParams() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICON_PARAMS);
            if (raw) {
                const parsed = JSON.parse(raw);
                return Object.assign({}, DEFAULT_CUSTOM_PARAMS, parsed);
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PARAMS));
    }

    function setCustomIconParams(params) {
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_ICON_PARAMS, JSON.stringify(params));
        } catch (e) {}
    }

    function getTabSvg(targetKey) {
        const isIndividual = getSetting(STORAGE_KEYS.ICON_INDIVIDUAL_MODE, false);
        const customParams = getCustomIconParams();
        const p = isIndividual ? (customParams[targetKey] || DEFAULT_CUSTOM_PARAMS[targetKey] || { scale: 100, stroke: 1.5 }) : (customParams.global || { scale: 100, stroke: 1.5 });
        const isOutlineCustom = (targetKey === 'friends' || targetKey === 'groups' || targetKey === 'music' || targetKey === 'video');
        const baseScale = isOutlineCustom ? 1.25 : 1.0;
        const baseStrokeMult = isOutlineCustom ? (1.6 / 1.5) : 1.0;
        const s = ((p.scale || 100) / 100) * baseScale;
        const st = ((parseFloat(p.stroke) || 1.5) * baseStrokeMult).toFixed(1);
        const tx = (14 * (1 - s)).toFixed(2);
        const ty = (14 * (1 - s)).toFixed(2);
        const sStr = s.toFixed(2);

        switch (targetKey) {
            case 'friends':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--users_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><circle cx="11.75" cy="9" r="3.5"/><path d="M5.75 21.5c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M18.75 7a3 3 0 0 1 0 5"/><path d="M18.75 16c2 .5 3.5 2 3.5 4.5"/></g></svg>`;
            case 'groups':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--users_3_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="9" r="3.5"/><path d="M7 8a2.5 2.5 0 0 0 0 5"/><path d="M21 8a2.5 2.5 0 0 1 0 5"/><path d="M8.5 21.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"/><path d="M4 21.5c0-2 1.5-3.8 3.5-4.2"/><path d="M24 21.5c0-2-1.5-3.8-3.5-4.2"/></g></svg>`;
            case 'music':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--music_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="18.3" rx="3.5" ry="2.8"/><ellipse cx="19" cy="16" rx="3.5" ry="2.8"/><path d="M12.5 18.3V8.3L22.5 6V16"/><path d="M12.5 11L22.5 8.7"/></g></svg>`;
            case 'video':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--video_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="6.5" width="14.5" height="15" rx="3"/><path d="M18 11.5L24.5 7.8v12.4L18 16.5"/></g></svg>`;
            case 'bookmarks':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--bookmark_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})"><path fill="currentColor" fill-rule="evenodd" d="M7 4a3 3 0 0 0-3 3v16a1 1 0 0 0 1.55.83L14 18.25l8.45 5.58A1 1 0 0 0 24 23V7a3 3 0 0 0-3-3H7zm15 16.92-7.45-4.92a1 1 0 0 0-1.1 0L6 20.92V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13.92z" clip-rule="evenodd"/></g></svg>`;
            case 'search':
            default:
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--search_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})"><path fill="currentColor" fill-rule="evenodd" d="M12.5 3.5a9 9 0 1 0 5.7 15.98l4.41 4.41a1 1 0 0 0 1.42-1.42l-4.41-4.41A9 9 0 0 0 12.5 3.5ZM5.5 12.5a7 7 0 1 1 14 0 7 7 0 0 1-14 0Z" clip-rule="evenodd"/></g></svg>`;
        }
    }

    function getIconPreviewSvg(targetKey, scale, stroke) {
        const isOutlineCustom = (targetKey === 'friends' || targetKey === 'groups' || targetKey === 'music' || targetKey === 'video');
        const baseScale = isOutlineCustom ? 1.25 : 1.0;
        const baseStrokeMult = isOutlineCustom ? (1.6 / 1.5) : 1.0;
        const s = ((scale || 100) / 100) * baseScale;
        const st = ((parseFloat(stroke) || 1.5) * baseStrokeMult).toFixed(1);
        const tx = (14 * (1 - s)).toFixed(2);
        const ty = (14 * (1 - s)).toFixed(2);
        const sStr = s.toFixed(2);

        switch (targetKey) {
            case 'search':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--search_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})"><path fill="currentColor" fill-rule="evenodd" d="M12.5 3.5a9 9 0 1 0 5.7 15.98l4.41 4.41a1 1 0 0 0 1.42-1.42l-4.41-4.41A9 9 0 0 0 12.5 3.5ZM5.5 12.5a7 7 0 1 1 14 0 7 7 0 0 1-14 0Z" clip-rule="evenodd"/></g></svg>`;
            case 'bookmarks':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--bookmark_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})"><path fill="currentColor" fill-rule="evenodd" d="M7 4a3 3 0 0 0-3 3v16a1 1 0 0 0 1.55.83L14 18.25l8.45 5.58A1 1 0 0 0 24 23V7a3 3 0 0 0-3-3H7zm15 16.92-7.45-4.92a1 1 0 0 0-1.1 0L6 20.92V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13.92z" clip-rule="evenodd"/></g></svg>`;
            case 'home':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5L14 5.5l8.5 7v10a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4.5a1.5 1.5 0 0 0-3 0V22.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-10z"/></g></svg>`;
            case 'friends':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--users_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><circle cx="11.75" cy="9" r="3.5"/><path d="M5.75 21.5c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M18.75 7a3 3 0 0 1 0 5"/><path d="M18.75 16c2 .5 3.5 2 3.5 4.5"/></g></svg>`;
            case 'groups':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--users_3_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="9" r="3.5"/><path d="M7 8a2.5 2.5 0 0 0 0 5"/><path d="M21 8a2.5 2.5 0 0 1 0 5"/><path d="M8.5 21.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"/><path d="M4 21.5c0-2 1.5-3.8 3.5-4.2"/><path d="M24 21.5c0-2-1.5-3.8-3.5-4.2"/></g></svg>`;
            case 'music':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--music_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="18.3" rx="3.5" ry="2.8"/><ellipse cx="19" cy="16" rx="3.5" ry="2.8"/><path d="M12.5 18.3V8.3L22.5 6V16"/><path d="M12.5 11L22.5 8.7"/></g></svg>`;
            case 'video':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--video_outline_28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="6.5" width="14.5" height="15" rx="3"/><path d="M18 11.5L24.5 7.8v12.4L18 16.5"/></g></svg>`;
            case 'messages':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.5C8.2 4.5 3.5 8.5 3.5 13.5c0 2.8 1.5 5.3 3.9 7-.2 1.4-.8 2.8-1.7 3.8a.5.5 0 0 0 .4.8c2.8 0 5-1.4 6.2-2.3.6.1 1.1.2 1.7.2 5.8 0 10.5-4 10.5-9s-4.7-9-10.5-9z"/></g></svg>`;
            case 'clips':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="19" height="19" rx="4"/><path d="M4.5 10.5h19"/><path d="M10.5 4.5l-3 6"/><path d="M17.5 4.5l-3 6"/><polygon points="12,13.5 17,16.5 12,19.5" fill="currentColor"/></g></svg>`;
            case 'more':
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><line x1="5.5" y1="8.5" x2="22.5" y2="8.5"/><line x1="5.5" y1="14" x2="22.5" y2="14"/><line x1="5.5" y1="19.5" x2="22.5" y2="19.5"/></g></svg>`;
            case 'all':
            default:
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28"><g transform="matrix(${sStr}, 0, 0, ${sStr}, ${tx}, ${ty})" fill="none" stroke="currentColor" stroke-width="${st}" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="20" cy="8" r="3"/><circle cx="8" cy="20" r="3"/><circle cx="20" cy="20" r="3"/></g></svg>`;
        }
    }

    // ==========================================
    //     ОПРЕДЕЛЕНИЯ ИКОНОК И ВКЛАДОК
    // ==========================================
    const TAB_DEFINITIONS = {
        search: {
            label: 'Поиск',
            href: '/discover',
            matchPaths: ['/discover', '/search', '/feed?section=search', '/discover_search']
        },
        friends: {
            label: 'Друзья',
            href: '/friends',
            matchPaths: ['/friends']
        },
        groups: {
            label: 'Сообщества',
            href: '/groups',
            matchPaths: ['/groups', '/communities', '/groups_list']
        },
        music: {
            label: 'Музыка',
            href: '/audio',
            matchPaths: ['/audio', '/audios', '/music', '/audio_feed']
        },
        video: {
            label: 'Видео',
            href: '/video',
            matchPaths: ['/video', '/videos', '/vk_video']
        },
        bookmarks: {
            label: 'Закладки',
            href: '/bookmarks',
            matchPaths: ['/bookmarks', '/fave']
        }
    };

    const TAB_OPTIONS_SEARCH = [
        { value: 'search', label: 'Поиск' },
        { value: 'friends', label: 'Друзья' },
        { value: 'groups', label: 'Сообщества' },
        { value: 'music', label: 'Музыка' },
        { value: 'video', label: 'Видео' },
        { value: 'bookmarks', label: 'Закладки' }
    ];

    const THEME_OPTIONS = [
        { value: 'dark', label: 'Тёмная' },
        { value: 'light', label: 'Светлая' },
        { value: 'nord', label: 'Nord' },
        { value: 'snow_black', label: 'Snow Black' }
    ];
    const START_PAGE_OPTIONS = [
        { value: 'mail', label: 'Мессенджер (/mail)' },
        { value: 'feed', label: 'Главная (/feed)' }
    ];

    function isPwaApp() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    let startupNavDone = false;
    function handleStartupNavigation() {
        if (startupNavDone) return;
        startupNavDone = true;

        if (currentStartPage !== 'mail') return;

        try {
            if (sessionStorage.getItem('vmu_startup_nav_done')) {
                return;
            }
            sessionStorage.setItem('vmu_startup_nav_done', '1');
        } catch (e) {}

        const path = window.location.pathname.toLowerCase();
        const isColdEntry = (path === '/' || path === '' || path === '/index.php' || (isPwaApp() && path === '/feed'));

        if (isColdEntry && path !== '/mail') {
            try {
                window.location.replace('/mail');
            } catch (e) {
                window.location.href = '/mail';
            }
        }
    }

    function updatePwaManifestAndIcons() {
        const isLight = (currentThemeMode === 'light');
        const isSnow = (currentThemeMode === 'snow_black');

        // Фоновый цвет и цвет значка VK в зависимости от темы
        const isNord = (currentThemeMode === 'nord');

        let bg = '#19191a';      // Тёмная тема: тёмно-серый
        let fg = '#71aaeb';      // Тёмная тема: синеватый акцент
        let themeMeta = '#19191a';

        if (isLight) {
            bg = '#ffffff';      // Светлая тема: белый фон
            fg = '#2787f5';      // Светлая тема: классический синий VK
            themeMeta = '#ffffff';
        } else if (isNord) {
            bg = '#2e3440';      // Nord: Polar Night
            fg = '#88c0d0';      // Nord: Frost Ice Blue
            themeMeta = '#2e3440';
        } else if (isSnow) {
            bg = '#000000';      // Snow Black: глубокий чёрный
            fg = '#ff5c5c';      // Snow Black: красноватый акцент
            themeMeta = '#000000';
        }

        // Векторная иконка VK 512x512 с адаптивной безопасной зоной (Maskable Safe Zone)
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">` +
            `<rect width="512" height="512" fill="${bg}"/>` +
            `<g transform="translate(256, 256) scale(17) translate(-12, -12)">` +
            `<path d="M6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z" fill="${fg}"/>` +
            `</g>` +
            `</svg>`;
        const iconDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

        // Обновление Favicon
        let iconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (!iconLink) {
            iconLink = document.createElement('link');
            iconLink.rel = 'icon';
            (document.head || document.documentElement).appendChild(iconLink);
        }
        iconLink.type = 'image/svg+xml';
        iconLink.href = iconDataUrl;

        // Обновление Apple Touch Icon
        let appleLink = document.querySelector('link[rel="apple-touch-icon"]');
        if (!appleLink) {
            appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            (document.head || document.documentElement).appendChild(appleLink);
        }
        appleLink.href = iconDataUrl;

        // Обновление метатегов имени приложения
        let appNameMeta = document.querySelector('meta[name="application-name"]');
        if (!appNameMeta) {
            appNameMeta = document.createElement('meta');
            appNameMeta.name = 'application-name';
            (document.head || document.documentElement).appendChild(appNameMeta);
        }
        appNameMeta.content = 'VK';

        let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (!appleTitleMeta) {
            appleTitleMeta = document.createElement('meta');
            appleTitleMeta.name = 'apple-mobile-web-app-title';
            (document.head || document.documentElement).appendChild(appleTitleMeta);
        }
        appleTitleMeta.content = 'VK';

        // Обновление цвета статусной строки и темы браузера
        let themeMetaTag = document.querySelector('meta[name="theme-color"]');
        if (!themeMetaTag) {
            themeMetaTag = document.createElement('meta');
            themeMetaTag.name = 'theme-color';
            (document.head || document.documentElement).appendChild(themeMetaTag);
        }
        themeMetaTag.content = themeMeta;

        // Динамический Web App Manifest
        const startUrl = (currentStartPage === 'mail') ? '/mail' : '/feed';
        const manifestObj = {
            name: "VK",
            short_name: "VK",
            description: "VK Mobile Upgrade",
            start_url: startUrl,
            display: "standalone",
            background_color: bg,
            theme_color: themeMeta,
            icons: [
                {
                    src: iconDataUrl,
                    sizes: "512x512",
                    type: "image/svg+xml",
                    purpose: "any maskable"
                }
            ]
        };
        try {
            const manifestBlob = new Blob([JSON.stringify(manifestObj)], { type: 'application/manifest+json' });
            const manifestUrl = URL.createObjectURL(manifestBlob);

            let manifestLink = document.querySelector('link[rel="manifest"]');
            if (!manifestLink) {
                manifestLink = document.createElement('link');
                manifestLink.rel = 'manifest';
                (document.head || document.documentElement).appendChild(manifestLink);
            }
            manifestLink.href = manifestUrl;
        } catch (e) {}
    }


    // ==========================================
    //     БАЗОВЫЕ ИСПРАВЛЕНИЯ UI (ВСЕГДА АКТИВНЫ)
    // ==========================================
    const FIXES_CSS = `
        /* БЛОКИРОВКА РЕКЛАМЫ В ЛЕНТЕ И МУЗЫКЕ (ПОСТОЯННО АКТИВНО) */
        .ads_ad_box,
        ._ads_promoted_post,
        .post_ad,
        [data-ad-block],
        [data-ad-view],
        [data-ad-target],
        [data-ad],
        .wall_marked_as_ads,
        [class*="AdsPost"],
        [class*="PromotedPost"],
        [class*="FeedBlock--ad"],
        [class*="Feed__ad"],
        [class*="FeedBlockAd"],
        [class*="ads_"],
        .BannerAds,
        .vkuiBanner--ad,
        [class*="MusicPromo"],
        [class*="SubscriptionPromo"],
        [class*="AudioAd"],
        .audio_ad_block,
        [data-testid="ad-banner"],
        .feed_ad_promoted {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
        }

        /* СТИЛИ ДЛЯ СОХРАНЁННЫХ УДАЛЁННЫХ СООБЩЕНИЙ */
        .vmu-deleted-msg {
            border: 1px dashed rgba(255, 92, 92, 0.6) !important;
            background-color: rgba(255, 92, 92, 0.08) !important;
            border-radius: 12px !important;
            padding: 4px 6px !important;
            margin-top: 2px !important;
            margin-bottom: 2px !important;
            position: relative !important;
        }
        .vmu-deleted-badge {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            background: rgba(255, 92, 92, 0.22) !important;
            color: #ff5c5c !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            padding: 2px 6px !important;
            border-radius: 6px !important;
            margin-bottom: 4px !important;
        }

        /* 0. СТИЛИЗАЦИЯ ЗАГРУЗОЧНОГО ЭКРАНА И СПИННЕРОВ */
        html[scheme="space_gray"],
        html[data-theme="dark"] {
            background-color: #19191a !important;
        }

        html.vmu-color-swap,
        html[data-theme="snow_black"] {
            background-color: #000000 !important;
        }

        html[scheme="bright_light"],
        html[data-theme="light"] {
            background-color: #ffffff !important;
        }

        .vkuiSpinner,
        [class*="Spinner"],
        [class*="Preloader"],
        [class*="Splash"] {
            color: var(--vkui--color_icon_accent, #71aaeb) !important;
        }

        /* 1. ИСПРАВЛЕНИЕ ОВАЛЬНЫХ СЧЕТЧИКОВ СООБЩЕНИЙ/УВЕДОМЛЕНИЙ -> ИДЕАЛЬНЫЙ КРУГ */
        [class*="Counter"],
        .vkuiCounter,
        .im_peer_counter,
        [class*="Badge"] {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            min-width: 20px !important;
            height: 20px !important;
            line-height: 20px !important;
            padding: 0 5px !important;
            box-sizing: border-box !important;
            border-radius: 10px !important;
            flex-shrink: 0 !important;
        }

        [class*="Counter__in"],
        [class*="Counter__children"],
        .vkuiCounter__in,
        .vkuiCounter__children {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
            height: 100% !important;
            font-weight: 600 !important;
        }

        /* 2. АККУРАТНЫЙ ОТСТУП СПИСКА ДИАЛОГОВ ПОД ШТОРКОЙ КАТЕГОРИЙ */
        body.vmu-page-mail [class*="SubnavigationBar"],
        body.vmu-page-mail .vkuiSubnavigationBar,
        body.vmu-page-mail [class*="HorizontalScroll"],
        body.vmu-page-mail [class*="Tabs"] {
            margin-bottom: 6px !important;
        }

        /* Закрепленные сообщения в чатах: аккуратный фон темы без черных углов */
        [class*="PinnedMessage"],
        [class*="im-pinned"],
        [class*="pinned_message"] {
            background-color: var(--vkui--color_background_secondary, #3b4252) !important;
            background: var(--vkui--color_background_secondary, #3b4252) !important;
        }
        [class*="PinnedMessage"] [class*="SimpleCell__before"],
        [class*="PinnedMessage"] [class*="SimpleCell__after"],
        [class*="PinnedMessage"] [class*="Cell__before"],
        [class*="PinnedMessage"] [class*="Cell__after"],
        [class*="PinnedMessage"] [class*="IconButton"],
        [class*="im-pinned"] [class*="SimpleCell__before"],
        [class*="im-pinned"] [class*="SimpleCell__after"],
        [class*="im-pinned"] [class*="Cell__before"],
        [class*="im-pinned"] [class*="Cell__after"],
        [class*="im-pinned"] [class*="IconButton"] {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* 3. СКРЫТИЕ НИЖНЕЙ ШТОРКИ "ТОЛЬКО НЕПРОЧИТАННЫЕ" */
        .ConvoList__footerSwitch,
        [class*="ConvoList__footerSwitch"],
        [class*="footerSwitch"],
        [class*="footer_switch"],
        [class*="FooterSwitch"],
        [class*="unreadSwitch"],
        [class*="im-unread-filter"],
        [class*="ConvoList__footer"],
        [class*="convo-list-footer"],
        [class*="im-page--filter"],
        [class*="im-footer-filter"],
        .ConvoList [class*="Switch"],
        [class*="ConvoList"] [class*="Switch"],
        [class*="ConvoList"] [role="switch"],
        [class*="ConvoList"] [class*="FixedLayout--bottom"],
        [class*="ConvoList"] [class*="FixedLayout"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* 4. ЗАПРЕТ ПЕРЕНОСА КНОПОК В ШАПКЕ МЕССЕНДЖЕРА НА НОВУЮ СТРОКУ */
        .vkmListHeader,
        [class*="vkmListHeader"],
        .vkmListHeader__actions,
        [class*="vkmListHeader__actions"],
        [class*="PanelHeader__after"],
        [class*="PanelHeader__right"],
        [class*="PanelHeader__controls"] {
            flex-wrap: nowrap !important;
        }

        /* 5. СКРЫТИЕ КНОПКИ ДЕЙСТВИЙ (3 ТОЧКИ) СТРОГО В СПИСКЕ ДИАЛОГОВ (ConvoList / ConvoItem) */
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="ConvoItem__actions"],
        body.vmu-page-mail [class*="ConvoList"] [class*="ConvoItem__more"],
        body.vmu-page-mail [class*="ConvoList"] [class*="im-dialog--actions"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="ConvoItem__actions"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="ConvoItem__more"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="im-dialog--actions"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            overflow: hidden !important;
            opacity: 0 !important;
        }

        /* Контейнер окончания ячейки в списке диалогов и перенос счетчика к правому краю */
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"],
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] {
            margin-right: 0 !important;
            padding-right: 0 !important;
        }

        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] [class*="Counter"],
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] [class*="Badge"],
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] .vkuiCounter,
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] .im_peer_counter,
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [class*="Counter"],
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [class*="Badge"],
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] .vkuiCounter,
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] .im_peer_counter,
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="Counter"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="Badge"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] .vkuiCounter,
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] .im_peer_counter,
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [class*="Counter"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [class*="Badge"],
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] .vkuiCounter,
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] .im_peer_counter {
            display: inline-flex !important;
            visibility: visible !important;
            pointer-events: auto !important;
            margin-left: auto !important;
            margin-right: 0 !important;
        }

        /* 6. СКРЫТИЕ СТАНДАРТНОГО БЛОКА ВЫБОРА ТЕМЫ В НАСТРОЙКАХ ВНЕШНЕГО ВИДА */
        body.vmu-page-appearance .vkuiGroup:not(#vk-mobile-upgrade-settings-card):has(input[type="radio"]),
        body.vmu-page-appearance [class*="Group"]:not(#vk-mobile-upgrade-settings-card):has(input[type="radio"]),
        body.vmu-page-appearance .vkuiGroup:not(#vk-mobile-upgrade-settings-card):has([class*="Radio"]),
        body.vmu-page-appearance [class*="Group"]:not(#vk-mobile-upgrade-settings-card):has([class*="Radio"]),
        body.vmu-page-appearance .vkuiGroup:not(#vk-mobile-upgrade-settings-card):has(input[name="theme"]),
        body.vmu-page-appearance .vkuiGroup:not(#vk-mobile-upgrade-settings-card):has(input[name="scheme"]),
        body.vmu-page-appearance .vkuiGroup:not(#vk-mobile-upgrade-settings-card):has([class*="Appearance"]) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            pointer-events: none !important;
            opacity: 0 !important;
        }

        /* 7. ФИКСИРОВАННАЯ НИЖНЯЯ ПАНЕЛЬ ПОВЕРХ ВСЕХ ЭЛЕМЕНТОВ */
        .vkuiTabbar,
        .vkuiTabbar__in,
        [class*="Tabbar"],
        #bottom_nav,
        .bottom_nav,
        .vkuiFixedLayout--bottom,
        [class*="FixedLayout--bottom"] {
            z-index: 1000 !important;
        }

        /* 8. НЕПРОЗРАЧНАЯ ШАПКА С ВЫСОКИМ Z-INDEX НА ВСЕХ СТРАНИЦАХ (КРОМЕ КЛИПОВ) */
        body:not(.vmu-page-clips) .vkuiPanelHeader,
        body:not(.vmu-page-clips) .vkuiPanelHeader__in,
        body:not(.vmu-page-clips) .vkuiPanelHeader__bg,
        body:not(.vmu-page-clips) .vkuiPanelHeader__fixed,
        body:not(.vmu-page-clips) .vkuiFixedLayout--top,
        body:not(.vmu-page-clips) [class*="FixedLayout--top"],
        body:not(.vmu-page-clips) [class*="PanelHeader"],
        body:not(.vmu-page-clips) [class*="PanelHeader__in"],
        body:not(.vmu-page-clips) [class*="PanelHeader__bg"],
        body:not(.vmu-page-clips) [class*="PanelHeader__fixed"],
        body:not(.vmu-page-clips) .vkmListHeader,
        body:not(.vmu-page-clips) [class*="vkmListHeader"],
        body:not(.vmu-page-clips) header.layout__header,
        body:not(.vmu-page-clips) .layout__header,
        body:not(.vmu-page-clips) header {
            z-index: 800 !important;
            background: var(--vkui--color_header_background, var(--vkui--color_background, #19191a)) !important;
            background-color: var(--vkui--color_header_background, var(--vkui--color_background, #19191a)) !important;
            -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
            opacity: 1 !important;
        }

        html[scheme="bright_light"] body:not(.vmu-page-clips) .vkuiPanelHeader,
        html[scheme="bright_light"] body:not(.vmu-page-clips) .vkuiPanelHeader__in,
        html[scheme="bright_light"] body:not(.vmu-page-clips) .vkuiPanelHeader__bg,
        html[scheme="bright_light"] body:not(.vmu-page-clips) [class*="PanelHeader"],
        html[data-theme="light"] body:not(.vmu-page-clips) .vkuiPanelHeader,
        html[data-theme="light"] body:not(.vmu-page-clips) .vkuiPanelHeader__in,
        html[data-theme="light"] body:not(.vmu-page-clips) [class*="PanelHeader"] {
            background: #ffffff !important;
            background-color: #ffffff !important;
            -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
        }

        body.vmu-page-clips .vkuiPanelHeader,
        body.vmu-page-clips .vkuiPanelHeader__in,
        body.vmu-page-clips .vkuiPanelHeader__bg,
        body.vmu-page-clips [class*="PanelHeader"],
        body.vmu-page-clips [class*="PanelHeader__in"] {
            background: transparent !important;
            background-color: transparent !important;
        }

        #vk-mobile-upgrade-settings-card {
            z-index: 1 !important;
            position: relative !important;
        }

        #vk-mobile-upgrade-settings-card * {
            position: relative;
            z-index: 1;
        }

        /* 9. КАСТОМНАЯ ПОДСВЕТКА АКТИВНОЙ ВКЛАДКИ ПРИ ЗАМЕНЕ ПОИСКА */
        .vkuiTabbarItem.vkuiTabbarItem--selected,
        .vkuiTabbarItem.vmu-tab-selected,
        [class*="TabbarItem"].vkuiTabbarItem--selected,
        [class*="TabbarItem"].vmu-tab-selected {
            color: var(--vkui--color_icon_accent, var(--vkui--color_text_accent, var(--color_icon_accent, #FF5C5C))) !important;
        }

        .vkuiTabbarItem.vkuiTabbarItem--selected [class*="TabbarItem__icon"] > svg,
        .vkuiTabbarItem.vkuiTabbarItem--selected [class*="TabbarItem__text"],
        .vkuiTabbarItem.vkuiTabbarItem--selected [class*="TabbarItem__children"],
        .vmu-tab-selected [class*="TabbarItem__icon"] > svg,
        .vmu-tab-selected [class*="TabbarItem__text"],
        .vmu-tab-selected [class*="TabbarItem__children"] {
            color: var(--vkui--color_icon_accent, var(--vkui--color_text_accent, var(--color_icon_accent, #FF5C5C))) !important;
            fill: currentColor !important;
        }

        .vkuiTabbarItem:not(.vkuiTabbarItem--selected):not(.vmu-tab-selected),
        .vmu-tab-unselected {
            color: var(--vkui--color_icon_secondary, var(--vkui--color_text_secondary, #828282)) !important;
        }

        .vkuiTabbarItem:not(.vkuiTabbarItem--selected):not(.vmu-tab-selected) [class*="TabbarItem__icon"] > svg,
        .vkuiTabbarItem:not(.vkuiTabbarItem--selected):not(.vmu-tab-selected) [class*="TabbarItem__text"],
        .vkuiTabbarItem:not(.vkuiTabbarItem--selected):not(.vmu-tab-selected) [class*="TabbarItem__children"],
        .vmu-tab-unselected [class*="TabbarItem__icon"] > svg,
        .vmu-tab-unselected [class*="TabbarItem__text"],
        .vmu-tab-unselected [class*="TabbarItem__children"] {
            color: var(--vkui--color_icon_secondary, var(--vkui--color_text_secondary, #828282)) !important;
            fill: currentColor !important;
        }

        /* 10. ЕДИНЫЙ ШРИФТ И СТИЛЬ ДЛЯ НИЖНЕЙ ПАНЕЛИ */
        .vkuiTabbarItem,
        [class*="TabbarItem"],
        [class*="TabBarItem"] {
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
        }

        .vkuiTabbarItem__icon svg,
        [class*="TabbarItem__icon"] svg,
        [class*="TabBarItem__icon"] svg {
            display: block !important;
            margin: 0 auto !important;
        }

        .vkuiTabbarItem__text,
        .vkuiTabbarItem__children,
        [class*="TabbarItem__text"],
        [class*="TabBarItem__text"],
        [class*="TabbarItem__children"],
        [class*="TabBarItem__children"],
        .bottom_nav__text,
        .bottom_nav__label {
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
        }

        /* 11. СКРЫТИЕ ОШИБОК И ЛИШНИХ БАННЕРОВ ВК НА КАСТОМНЫХ СТРАНИЦАХ СКРИПТА */
        .vmu-page-script-menu .vkuiBanner,
        .vmu-page-script-menu [class*="Banner"],
        .vmu-page-script-menu [class*="FormStatus"],
        .vmu-page-script-menu [class*="Placeholder"],
        .vmu-page-script-menu [class*="Snackbar"],
        .vmu-page-script-menu .vkuiSnackbar,
        .vmu-page-script-menu [role="alert"],
        .vmu-page-script-menu .vkuiAlert,
        .vmu-page-script-menu [class*="Alert"],
        .vmu-page-script-menu [class*="Error"],
        .vmu-page-script-menu [class*="error"],
        .vmu-page-script-menu .vkuiModalCard,
        .vmu-page-script-menu [class*="ModalCard"],
        .vmu-page-script-menu .vkuiPopoutWrapper,
        .vmu-page-script-menu [class*="PopoutWrapper"],
        .vmu-page-script-menu .vkuiAppRoot__popout,
        .vmu-page-script-menu [class*="AppRoot__popout"],
        .vmu-page-script-menu .vkuiRoot__popout,
        .vmu-page-script-menu [class*="Root__popout"],
        .vmu-page-debug-script .vkuiBanner,
        .vmu-page-debug-script [class*="Banner"],
        .vmu-page-debug-script [class*="FormStatus"],
        .vmu-page-debug-script [class*="Placeholder"],
        .vmu-page-debug-script [class*="Snackbar"],
        .vmu-page-debug-script .vkuiSnackbar,
        .vmu-page-debug-script [role="alert"],
        .vmu-page-debug-script .vkuiAlert,
        .vmu-page-debug-script [class*="Alert"],
        .vmu-page-debug-script [class*="Error"],
        .vmu-page-debug-script [class*="error"],
        .vmu-page-debug-script .vkuiModalCard,
        .vmu-page-debug-script [class*="ModalCard"],
        .vmu-page-debug-script .vkuiPopoutWrapper,
        .vmu-page-debug-script [class*="PopoutWrapper"],
        .vmu-page-debug-script .vkuiAppRoot__popout,
        .vmu-page-debug-script [class*="AppRoot__popout"],
        .vmu-page-debug-script .vkuiRoot__popout,
        .vmu-page-debug-script [class*="Root__popout"],
        body:has(#vmu-script-menu-card) .vkuiBanner,
        body:has(#vmu-script-menu-card) [class*="Banner"],
        body:has(#vmu-script-menu-card) [class*="FormStatus"],
        body:has(#vmu-script-menu-card) [class*="Placeholder"],
        body:has(#vmu-script-menu-card) [class*="Snackbar"],
        body:has(#vmu-script-menu-card) .vkuiSnackbar,
        body:has(#vmu-script-menu-card) [role="alert"],
        body:has(#vmu-script-menu-card) .vkuiAlert,
        body:has(#vmu-script-menu-card) [class*="Alert"],
        body:has(#vmu-script-menu-card) .vkuiPopoutWrapper,
        body:has(#vmu-script-menu-card) [class*="PopoutWrapper"],
        body:has(#vmu-debug-script-card) .vkuiBanner,
        body:has(#vmu-debug-script-card) [class*="Banner"],
        body:has(#vmu-debug-script-card) [class*="FormStatus"],
        body:has(#vmu-debug-script-card) [class*="Placeholder"],
        body:has(#vmu-debug-script-card) [class*="Snackbar"],
        body:has(#vmu-debug-script-card) .vkuiSnackbar,
        body:has(#vmu-debug-script-card) [role="alert"],
        body:has(#vmu-debug-script-card) .vkuiAlert,
        body:has(#vmu-debug-script-card) [class*="Alert"],
        body:has(#vmu-debug-script-card) .vkuiPopoutWrapper,
        body:has(#vmu-debug-script-card) [class*="PopoutWrapper"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            overflow: hidden !important;
        }

        /* 12. СКРЫТИЕ ПУНКТА "ВНЕШНИЙ ВИД" СТРОГО В НАСТРОЙКАХ МЕССЕНДЖЕРА (m.vk.ru/mail/settings) */
        body.vmu-page-mail-settings a[href*="/mail/settings/theme"],
        body.vmu-page-mail-settings a[href*="settings/theme"],
        body.vmu-page-mail-settings a[href*="act=theme"],
        body.vmu-page-mail-settings .vkuiSimpleCell:has(a[href*="settings/theme"]),
        body.vmu-page-mail-settings [class*="SimpleCell"]:has(a[href*="settings/theme"]),
        body.vmu-page-mail-settings .vkuiCell:has(a[href*="settings/theme"]),
        body.vmu-page-mail-settings [class*="Cell"]:has(a[href*="settings/theme"]),
        body.vmu-page-mail-settings .vkuiSimpleCell:has(a[href*="act=theme"]),
        body.vmu-page-mail-settings [class*="SimpleCell"]:has(a[href*="act=theme"]),
        body.vmu-page-mail-settings .vkuiCell:has(a[href*="act=theme"]),
        body.vmu-page-mail-settings [class*="Cell"]:has(a[href*="act=theme"]) {
            display: none !important;
        }
    `;

    // ==========================================
    //         ЦВЕТА И СТИЛИ ПОДМЕНЫ
    // ==========================================
    const COLOR_ACCENT_SWAPPED = '#FF5C5C'; // Изначально #71AAEB -> теперь красный
    const COLOR_NEGATIVE_SWAPPED = '#71AAEB'; // Изначально #FF5C5C -> теперь голубой

    
            // ==========================================
    //       NORD THEME (POLAR NIGHT & FROST)
    // ==========================================
    const NORD_THEME_CSS = `
        /* ==========================================
           NORD THEME: ЧИСТЫЕ ТОКЕНЫ VKUI (POLAR NIGHT & FROST)
           ========================================== */
        *, *::before, *::after,
        :root, html, body,
        html.vmu-theme-nord,
        html[data-theme="nord"],
        [data-theme="nord"] body,
        html.vmu-theme-nord body,
        .vk__page, .vkui__root, .vkuiRoot, .vkuiAppRoot,
        [scheme], [data-theme="nord"], div#root, div#vk_wrap, #vk_area_wrap, .layout {
            /* ФОНОВЫЕ ЦВЕТА (POLAR NIGHT) */
            --vkui--color_background: #2e3440 !important;
            --color_background: #2e3440 !important;
            --background_page: #2e3440 !important;
            --vkui--color_background_content: #2e3440 !important;
            --color_background_content: #2e3440 !important;
            --background_content: #2e3440 !important;
            --vkui--color_background_secondary: #3b4252 !important;
            --color_background_secondary: #3b4252 !important;
            --vkui--color_background_secondary_alpha: rgba(59, 66, 82, 0.92) !important;
            --vkui--color_background_tertiary: #434c5e !important;
            --color_background_tertiary: #434c5e !important;
            --vkui--color_background_modal: #2e3440 !important;
            --color_background_modal: #2e3440 !important;
            --vkui--color_header_background: #2e3440 !important;
            --color_header_background: #2e3440 !important;
            --header_background: #2e3440 !important;
            --vkui--color_field_background: #3b4252 !important;
            --vkui--color_search_field_background: #3b4252 !important;
            --vkui--color_write_bar_input_background: #3b4252 !important;
            --input_background: #3b4252 !important;

            /* ТЕКСТ (SNOW STORM) */
            --vkui--color_text_primary: #eceff4 !important;
            --color_text_primary: #eceff4 !important;
            --text_primary: #eceff4 !important;
            --vkui--color_text_secondary: #d8dee9 !important;
            --color_text_secondary: #d8dee9 !important;
            --text_secondary: #d8dee9 !important;
            --vkui--color_text_subhead: #e5e9f0 !important;
            --color_text_subhead: #e5e9f0 !important;
            --text_subhead: #e5e9f0 !important;
            --vkui--color_text_muted: #7b88a1 !important;
            --color_text_muted: #7b88a1 !important;
            --text_muted: #7b88a1 !important;
            --vkui--color_text_contrast: #2e3440 !important;

            /* ИКОНКИ */
            --vkui--color_icon_primary: #eceff4 !important;
            --color_icon_primary: #eceff4 !important;
            --vkui--color_icon_secondary: #d8dee9 !important;
            --color_icon_secondary: #d8dee9 !important;
            --vkui--color_icon_medium: #d8dee9 !important;
            --vkui--color_icon_tertiary: #7b88a1 !important;

            /* АКЦЕНТЫ (FROST: #88C0D0 / #81A1C1) */
            --vkui--color_im_text_name: #88c0d0 !important;
            --color_im_text_name: #88c0d0 !important;
            --vkui--color_text_accent: #88c0d0 !important;
            --color_text_accent: #88c0d0 !important;
            --vkui--color_text_accent_themed: #88c0d0 !important;
            --color_text_accent_themed: #88c0d0 !important;
            --vkui--color_icon_accent: #88c0d0 !important;
            --color_icon_accent: #88c0d0 !important;
            --vkui--color_icon_accent_themed: #88c0d0 !important;
            --color_icon_accent_themed: #88c0d0 !important;
            --vkui--color_background_accent: #88c0d0 !important;
            --color_background_accent: #88c0d0 !important;
            --vkui--color_background_accent_themed: #88c0d0 !important;
            --color_background_accent_themed: #88c0d0 !important;
            --vkui--color_background_accent_tint: rgba(136, 192, 208, 0.16) !important;
            --color_background_accent_tint: rgba(136, 192, 208, 0.16) !important;
            --vkui--color_stroke_accent: #88c0d0 !important;
            --color_stroke_accent: #88c0d0 !important;
            --vkui--color_stroke_accent_themed: #88c0d0 !important;
            --color_stroke_accent_themed: #88c0d0 !important;
            --vkui--color_text_link: #88c0d0 !important;
            --color_text_link: #88c0d0 !important;
            --vkui--color_text_link_themed: #88c0d0 !important;
            --color_text_link_themed: #88c0d0 !important;
            --vkui--color_text_link_tint: rgba(136, 192, 208, 0.16) !important;
            --color_text_link_tint: rgba(136, 192, 208, 0.16) !important;
            --vkui--color_track_background: #88c0d0 !important;
            --vkui--color_write_bar_icon: #88c0d0 !important;
            --vkui--color_im_forward_line: #88c0d0 !important;
            --vkui--color_im_quote_line: #88c0d0 !important;
            --accent: #88c0d0 !important;
            --accent_blue: #88c0d0 !important;
            --link_color: #88c0d0 !important;
            --button_primary_background: #88c0d0 !important;
            --button_primary_foreground: #2e3440 !important;
            --counter_primary_background: #88c0d0 !important;
            --counter_primary_text: #2e3440 !important;

            /* РАЗДЕЛИТЕЛИ И РАМКИ */
            --vkui--color_separator_primary: #434c5e !important;
            --vkui--color_separator_primary_alpha: rgba(76, 86, 106, 0.5) !important;
            --vkui--color_separator_secondary: #4c566a !important;
            --vkui--color_field_border_alpha: rgba(76, 86, 106, 0.4) !important;
            --vkui--color_image_border_alpha: rgba(76, 86, 106, 0.3) !important;

            /* ЧАТЫ И СООБЩЕНИЯ В NORD */
            --vkui--vkontakte_color_im_bubble_incoming: #3b4252 !important;
            --vkui--vkontakte_color_im_bubble_incoming_alternate: #3b4252 !important;
            --vkui--vkontakte_color_im_bubble_outgoing: #434c5e !important;

            /* AURORA */
            --vkui--color_text_negative: #bf616a !important;
            --color_text_negative: #bf616a !important;
            --vkui--color_icon_negative: #bf616a !important;
            --color_icon_negative: #bf616a !important;
            --vkui--color_text_positive: #a3be8c !important;
            --color_text_positive: #a3be8c !important;
        }

        html.vmu-theme-nord body,
        html[data-theme="nord"] body {
            background-color: #2e3440 !important;
            color: #eceff4 !important;
        }

        html.vmu-theme-nord .vkuiTabBar,
        html.vmu-theme-nord [class*="TabBar"],
        html.vmu-theme-nord .Tabbar,
        html[data-theme="nord"] .vkuiTabBar,
        html[data-theme="nord"] [class*="TabBar"],
        html[data-theme="nord"] .Tabbar {
            background-color: #2e3440 !important;
            border-top: 1px solid #434c5e !important;
        }

        /* Шапка и фиксированные панели в теме Nord */
        html.vmu-theme-nord .vkuiPanelHeader,
        html.vmu-theme-nord .vkuiPanelHeader__in,
        html.vmu-theme-nord .vkuiPanelHeader__bg,
        html.vmu-theme-nord .vkuiPanelHeader__fixed,
        html.vmu-theme-nord [class*="PanelHeader"],
        html.vmu-theme-nord [class*="PanelHeader__in"],
        html.vmu-theme-nord [class*="PanelHeader__bg"],
        html.vmu-theme-nord [class*="PanelHeader__fixed"],
        html.vmu-theme-nord .vkmListHeader,
        html.vmu-theme-nord [class*="vkmListHeader"],
        html.vmu-theme-nord header,
        html[data-theme="nord"] .vkuiPanelHeader,
        html[data-theme="nord"] .vkuiPanelHeader__in,
        html[data-theme="nord"] .vkuiPanelHeader__bg,
        html[data-theme="nord"] .vkuiPanelHeader__fixed,
        html[data-theme="nord"] [class*="PanelHeader"],
        html[data-theme="nord"] [class*="PanelHeader__in"],
        html[data-theme="nord"] [class*="PanelHeader__bg"],
        html[data-theme="nord"] [class*="PanelHeader__fixed"],
        html[data-theme="nord"] .vkmListHeader,
        html[data-theme="nord"] [class*="vkmListHeader"],
        html[data-theme="nord"] header {
            background: #2e3440 !important;
            background-color: #2e3440 !important;
        }


    `;


    // ==========================================
    //   ВСЕГДА АКТИВНЫЕ ФУНКЦИИ (БЕЗ ПЕРЕКЛЮЧАТЕЛЕЙ)
    // ==========================================

    // 1. ПРЯМЫЕ ВНЕШНИЕ ССЫЛКИ (БЕЗ AWAY.PHP)
    function initDirectLinksBypass() {
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a');
            if (!a || !a.href) return;
            if (a.href.includes('away.php') || a.href.includes('vk.com/away')) {
                try {
                    const u = new URL(a.href, window.location.origin);
                    const dest = u.searchParams.get('to');
                    if (dest) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(decodeURIComponent(dest), '_blank', 'noopener,noreferrer');
                    }
                } catch (err) {}
            }
        }, true);
    }
    initDirectLinksBypass();

    // 2. ОБХОД ВОЗРАСТНЫХ ОГРАНИЧЕНИЙ 18+
    function bypassAgeRestrictions() {
        const warningBtns = document.querySelectorAll('.video_restriction__btn, [class*="AdultRestriction"] button, [class*="ContentWarning"] button, .video_adult_warning .button');
        for (let i = 0; i < warningBtns.length; i++) {
            try { warningBtns[i].click(); } catch (e) {}
        }
    }

    // 3. ДАТА РЕГИСТРАЦИИ И ИНСТРУМЕНТЫ ДЛЯ ЗАКРЫТЫХ ПРОФИЛЕЙ
    const regDateCache = {};
    async function enhanceProfileInfo() {
        const path = window.location.pathname.toLowerCase();
        const isProfile = !path.startsWith('/mail') && !path.startsWith('/settings') && !path.startsWith('/feed') && !path.startsWith('/clips') && !path.startsWith('/im') && path.length > 1;
        if (!isProfile) return;

        // Поиск ID пользователя
        let userId = null;
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && canonical.href) {
            const m = canonical.href.match(/vk\.com\/id(\d+)/);
            if (m) userId = parseInt(m[1]);
        }
        if (!userId) {
            const linkId = document.querySelector('a[href*="id="], [data-user-id], [data-owner-id]');
            if (linkId) {
                const raw = linkId.getAttribute('data-user-id') || linkId.getAttribute('data-owner-id');
                if (raw) userId = parseInt(raw);
            }
        }
        if (!userId) {
            const pathMatch = path.match(/^\/?id(\d+)/);
            if (pathMatch) userId = parseInt(pathMatch[1]);
        }

        const profileHeader = document.querySelector('.OwnerHeader, [class*="OwnerHeader"], .ProfileHeader, [class*="ProfileHeader"], .pp_cont, .vmu-profile-card');
        if (!profileHeader) return;

        // Добавление даты регистрации
        if (userId && !profileHeader.querySelector('.vmu-reg-date-badge')) {
            const badge = document.createElement('div');
            badge.className = 'vmu-reg-date-badge';
            badge.style.cssText = 'font-size: 12px; color: var(--vkui--color_text_secondary, #d8dee9); margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;';
            
            if (regDateCache[userId]) {
                badge.innerHTML = `📅 Регистрация: <b>${regDateCache[userId]}</b>`;
                profileHeader.appendChild(badge);
            } else {
                badge.innerHTML = `📅 Регистрация: <span style="opacity:0.7;">загрузка...</span>`;
                profileHeader.appendChild(badge);
                // Фоновый расчет приблизительного или FOAF запроса
                fetch(`https://vk.com/foaf.php?id=${userId}`)
                    .then(res => res.text())
                    .then(txt => {
                        const m = txt.match(/<ya:created dc:date="([^"]+)"/);
                        if (m && m[1]) {
                            const dateObj = new Date(m[1]);
                            const formatted = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                            const yearsAgo = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
                            const resStr = `${formatted} (${yearsAgo} лет назад)`;
                            regDateCache[userId] = resStr;
                            badge.innerHTML = `📅 Регистрация: <b>${resStr}</b>`;
                        } else {
                            badge.style.display = 'none';
                        }
                    })
                    .catch(() => { badge.style.display = 'none'; });
            }
        }

        // Инструменты для закрытого профиля
        const isClosed = document.querySelector('.profile_closed, [class*="ProfileClosed"], [class*="LockedProfile"]');
        if (isClosed && userId && !profileHeader.querySelector('.vmu-closed-tools')) {
            const tools = document.createElement('div');
            tools.className = 'vmu-closed-tools';
            tools.style.cssText = 'margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;';
            
            // Кнопка полноразмерного аватара
            const ogImg = document.querySelector('meta[property="og:image"]');
            if (ogImg && ogImg.content) {
                const avaBtn = document.createElement('a');
                avaBtn.href = ogImg.content;
                avaBtn.target = '_blank';
                avaBtn.className = 'vkuiButton vkuiButton--size-s vkuiButton--mode-secondary';
                avaBtn.style.cssText = 'padding: 4px 10px; border-radius: 8px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; background: var(--vkui--color_background_secondary, #3b4252); color: var(--vkui--color_text_primary, #eceff4);';
                avaBtn.textContent = '🖼️ Полноразмерный аватар';
                tools.appendChild(avaBtn);
            }

            // Кнопка WebArchive
            const webArchBtn = document.createElement('a');
            webArchBtn.href = `https://web.archive.org/web/*/vk.com/id${userId}`;
            webArchBtn.target = '_blank';
            webArchBtn.className = 'vkuiButton vkuiButton--size-s vkuiButton--mode-secondary';
            webArchBtn.style.cssText = 'padding: 4px 10px; border-radius: 8px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; background: var(--vkui--color_background_secondary, #3b4252); color: var(--vkui--color_text_primary, #eceff4);';
            webArchBtn.textContent = '🏛️ Архив страницы';
            tools.appendChild(webArchBtn);

            profileHeader.appendChild(tools);
        }
    }

    const COLOR_SWAP_CSS = `
        /* ПОЛНАЯ ЗАМЕНА ТОКЕНОВ И ПЕРЕМЕННЫХ VKUI И VK MOBILE */
        *, *::before, *::after,
        :root, html, body,
        .vk__page, .vkui__root, .vkuiRoot, .vkuiAppRoot,
        [scheme], [data-theme], div#root, div#vk_wrap, #vk_area_wrap, .layout {
            /* АКЦЕНТНЫЕ ЦВЕТА И ИМЕНА В ЧАТАХ -> #FF5C5C */
            --vkui--color_im_text_name: ${COLOR_ACCENT_SWAPPED} !important;
            --color_im_text_name: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_text_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --color_text_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_text_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --color_text_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_icon_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --color_icon_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_icon_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --color_icon_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_background_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --color_background_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_background_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --color_background_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_background_accent_tint: rgba(255, 92, 92, 0.14) !important;
            --color_background_accent_tint: rgba(255, 92, 92, 0.14) !important;
            --vkui--color_background_accent_alternative: ${COLOR_ACCENT_SWAPPED} !important;
            --color_background_accent_alternative: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_stroke_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --color_stroke_accent: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_stroke_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --color_stroke_accent_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_text_link: ${COLOR_ACCENT_SWAPPED} !important;
            --color_text_link: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_text_link_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --color_text_link_themed: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_text_link_tint: rgba(255, 92, 92, 0.14) !important;
            --color_text_link_tint: rgba(255, 92, 92, 0.14) !important;
            --vkui--color_field_border_alpha--focus: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_track_background: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_write_bar_icon: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_im_forward_line: ${COLOR_ACCENT_SWAPPED} !important;
            --vkui--color_im_quote_line: ${COLOR_ACCENT_SWAPPED} !important;
            --accent: ${COLOR_ACCENT_SWAPPED} !important;
            --accent_blue: ${COLOR_ACCENT_SWAPPED} !important;
            --link_color: ${COLOR_ACCENT_SWAPPED} !important;
            --button_primary_background: ${COLOR_ACCENT_SWAPPED} !important;
            --counter_primary_background: ${COLOR_ACCENT_SWAPPED} !important;

            /* НЕГАТИВНЫЕ СЦЕНАРИИ, ОШИБКИ И ЛАЙКИ -> #71AAEB */
            --vkui--color_text_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_text_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_icon_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_icon_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_background_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_background_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_background_negative_tint: rgba(113, 170, 235, 0.14) !important;
            --color_background_negative_tint: rgba(113, 170, 235, 0.14) !important;
            --vkui--color_stroke_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_stroke_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_icon_like: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_icon_like: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_icon_like_fill: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_icon_like_fill: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_icon_like_outline: ${COLOR_NEGATIVE_SWAPPED} !important;
            --color_icon_like_outline: ${COLOR_NEGATIVE_SWAPPED} !important;
            --vkui--color_action_sheet_text_negative: ${COLOR_NEGATIVE_SWAPPED} !important;
            --button_destructive_background: ${COLOR_NEGATIVE_SWAPPED} !important;
            --counter_prominent_background: ${COLOR_NEGATIVE_SWAPPED} !important;
            --like_active_color: ${COLOR_NEGATIVE_SWAPPED} !important;
            --like_color: ${COLOR_NEGATIVE_SWAPPED} !important;
            --like_hover_color: ${COLOR_NEGATIVE_SWAPPED} !important;
        }

        /* Имена в чатах */
        [class*="im-page--history-name"],
        [class*="PeerName"],
        [class*="peer-name"],
        [class*="MessageAuthor"],
        [class*="im-mess--author"],
        [class*="nim-dialog--name"],
        [class*="author"] a,
        a[class*="author"],
        .im_peer_name,
        [data-testid="message-author"] {
            color: ${COLOR_ACCENT_SWAPPED} !important;
        }

        /* Ссылки и активные элементы */
        a.vkuiLink,
        .vkuiLink,
        [class*="Link--accent"],
        [class*="TabBarItem--selected"],
        [class*="TabbarItem--selected"],
        [class*="BottomNavigationItem--selected"],
        [class*="Tab--selected"],
        [class*="Tab--active"] {
            color: ${COLOR_ACCENT_SWAPPED} !important;
        }

        /* Кнопки и счетчики */
        [class*="Button--mode-primary"],
        [class*="vkuiButton--mode-primary"] {
            background-color: ${COLOR_ACCENT_SWAPPED} !important;
            color: #ffffff !important;
        }

        [class*="Button--mode-destructive"],
        [class*="vkuiButton--mode-destructive"] {
            background-color: ${COLOR_NEGATIVE_SWAPPED} !important;
            color: #ffffff !important;
        }

        [class*="Counter--mode-primary"] {
            background-color: ${COLOR_ACCENT_SWAPPED} !important;
        }

        [class*="Counter--mode-prominent"] {
            background-color: ${COLOR_NEGATIVE_SWAPPED} !important;
        }

        /* Ошибки и негативные статусы */
        [class*="FormStatus--mode-error"],
        [class*="ErrorMessage"],
        [class*="SubnavigationBar--negative"],
        [class*="ActionSheetItem--mode-destructive"] {
            color: ${COLOR_NEGATIVE_SWAPPED} !important;
        }

        /* Лайки (активные реакции) */
        [class*="like_active"] svg,
        [class*="Like__active"] svg,
        [class*="PostBottomAction--active"] svg,
        [data-reaction="like"] svg,
        [aria-label*="Нравится"][aria-pressed="true"] svg,
        [aria-label*="Лайк"][aria-pressed="true"] svg {
            fill: ${COLOR_NEGATIVE_SWAPPED} !important;
            color: ${COLOR_NEGATIVE_SWAPPED} !important;
        }
    `;

    const HIDE_LABELS_CSS = `
        /* 1. СКРЫТИЕ ВСЕХ ТЕКСТОВЫХ ПОДПИСЕЙ В НИЖНЕЙ НАВИГАЦИОННОЙ ПАНЕЛИ */
        .vkuiTabbarItem__text,
        .vkuiTabbarItem__children,
        [class*="TabbarItem__text"],
        [class*="TabBarItem__text"],
        [class*="TabbarItem__children"],
        [class*="TabBarItem__children"],
        .bottom_nav__text,
        .bottom_nav__label,
        #bottom_nav [class*="label"],
        #bottom_nav [class*="text"],
        #bottom_nav [class*="caption"],
        .bottom_nav [class*="label"],
        .bottom_nav [class*="text"],
        .bottom_nav [class*="caption"],
        .vkuiTabbarItem__in > .vkuiTabbarItem__label:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]),
        [class*="TabbarItem__in"] > [class*="TabbarItem__label"]:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]),
        [class*="TabBarItem__in"] > [class*="TabBarItem__label"]:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]),
        .vkuiTabbarItem__label:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]):not(:has([class*="Counter"])):not(:has([class*="Badge"])):not([class*="icon"]):not([class*="Icon"]),
        [class*="TabbarItem__label"]:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]):not(:has([class*="Counter"])):not(:has([class*="Badge"])):not([class*="icon"]):not([class*="Icon"]),
        [class*="TabBarItem__label"]:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]):not(:has([class*="Counter"])):not(:has([class*="Badge"])):not([class*="icon"]):not([class*="Icon"]),
        .vkuiTabbarItem > .vkuiTabbarItem__in > span:last-child:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]),
        [class*="TabbarItem"] > [class*="TabbarItem__in"] > span:last-child:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]),
        [class*="TabBarItem"] > [class*="TabBarItem__in"] > span:last-child:not([class*="Counter"]):not([class*="Badge"]):not([class*="Indicator"]):not([class*="indicator"]) {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            font-size: 0 !important;
            line-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            pointer-events: none !important;
        }

        /* 2. СТРОГОЕ СОХРАНЕНИЕ ВИДИМОСТИ ИНДИКАТОРОВ И СЧЕТЧИКОВ СООБЩЕНИЙ */
        .vkuiTabbar [class*="Counter"],
        .vkuiTabbar [class*="Badge"],
        .vkuiTabbar [class*="Indicator"],
        .vkuiTabbar [class*="indicator"],
        .vkuiTabbar .vkuiCounter,
        .vkuiTabbar .vkuiBadge,
        .vkuiTabbar .vkuiIndicator,
        [class*="Tabbar"] [class*="Counter"],
        [class*="Tabbar"] [class*="Badge"],
        [class*="Tabbar"] [class*="Indicator"],
        [class*="Tabbar"] [class*="indicator"],
        [class*="TabbarItem"] [class*="Counter"],
        [class*="TabbarItem"] [class*="Badge"],
        [class*="TabbarItem"] [class*="Indicator"],
        [class*="TabbarItem"] [class*="indicator"],
        [class*="TabBarItem"] [class*="Counter"],
        [class*="TabBarItem"] [class*="Badge"],
        [class*="TabBarItem"] [class*="Indicator"],
        [class*="TabBarItem"] [class*="indicator"],
        .vkuiTabbarItem__indicator,
        .vkuiTabbarItem__badge,
        .vkuiIndicator,
        [class*="TabbarItem__icon"] [class*="indicator"],
        [class*="TabbarItem__icon"] [class*="Indicator"],
        [class*="TabbarItem__icon"] [class*="badge"],
        [class*="TabbarItem__icon"] [class*="Badge"],
        [class*="TabbarItem__icon"] [class*="counter"],
        [class*="TabbarItem__icon"] [class*="Counter"],
        .vkuiTabbarItem__icon .vkuiTabbarItem__indicator,
        .vkuiTabbarItem__icon .vkuiTabbarItem__badge,
        .vkuiTabbarItem__icon .vkuiIndicator,
        .vkuiTabbarItem__icon .vkuiCounter,
        #bottom_nav [class*="counter"],
        #bottom_nav [class*="badge"],
        #bottom_nav [class*="Counter"],
        #bottom_nav [class*="Badge"],
        #bottom_nav [class*="indicator"],
        .bottom_nav [class*="counter"],
        .bottom_nav [class*="badge"],
        .bottom_nav [class*="Counter"],
        .bottom_nav [class*="Badge"],
        .bottom_nav [class*="indicator"] {
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        /* 3. ЦЕНТРИРОВАНИЕ ИКОНОК В ТАБ-БАРЕ БЕЗ НАРУШЕНИЯ ФИКСИРОВАННОГО ПОЛОЖЕНИЯ */
        .vkuiTabbarItem,
        [class*="TabbarItem"],
        [class*="TabBarItem"],
        .bottom_nav__item,
        #bottom_nav a,
        .bottom_nav a {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        .vkuiTabbarItem__in,
        [class*="TabbarItem__in"],
        [class*="TabBarItem__in"],
        .bottom_nav__in {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100% !important;
        }

        .vkuiTabbarItem__icon,
        [class*="TabbarItem__icon"],
        [class*="TabBarItem__icon"] {
            margin: 0 auto !important;
        }
    `;

    const HIDE_FOLDERS_CSS = `
        /* ПОЛНОЕ СКРЫТИЕ ПАНЕЛИ ПАПОК/КАТЕГОРИЙ В МЕССЕНДЖЕРЕ ("Все, Каналы, Бизнес, Чаты...") И ЕЁ ОТСТУПОВ */
        [class*="ConvoList"] [class*="SubnavigationBar"],
        [class*="ConvoList"] .vkuiSubnavigationBar,
        [class*="ConvoList"] [class*="HorizontalScroll"],
        [class*="ConvoList"] [class*="Tabs"],
        [class*="ConvoList__subnavigation"],
        [class*="ConvoList__folders"],
        [class*="convo-folders"],
        [class*="im-page--folders"],
        [class*="im-folders"],
        a[href*="act=folders"],
        body.vmu-page-mail [class*="SubnavigationBar"],
        body.vmu-page-mail .vkuiSubnavigationBar,
        body.vmu-page-mail [class*="HorizontalScroll"],
        body.vmu-page-mail [class*="Tabs"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
        }

        /* Точный отступ для контейнера списка чатов, чтобы первый закрепленный диалог ("Избранное") не перекрывался плавающим поиском */
        body.vmu-page-mail .ConvoList,
        body.vmu-page-mail [class*="ConvoList"] {
            padding-top: 14px !important;
        }
    `;

    const HIDE_CALLS_CSS = `
        /* ПОЛНОЕ СКРЫТИЕ ЗВОНКОВ В ШАПКЕ ЧАТОВ И ДИАЛОГОВ */
        /* Прямые ссылки и кнопки по атрибутам */
        a[href*="/call"]:not(#vmu-top-unread-btn),
        a[href*="act=call"]:not(#vmu-top-unread-btn),
        a[href*="call?"]:not(#vmu-top-unread-btn),
        a[href*="calls?"]:not(#vmu-top-unread-btn),
        a[href*="/calls/"]:not(#vmu-top-unread-btn),
        [aria-label*="звон" i]:not(#vmu-top-unread-btn),
        [aria-label*="Звон" i]:not(#vmu-top-unread-btn),
        [aria-label*="вызов" i]:not(#vmu-top-unread-btn),
        [aria-label*="Вызов" i]:not(#vmu-top-unread-btn),
        [aria-label*="позвон" i]:not(#vmu-top-unread-btn),
        [aria-label*="Позвон" i]:not(#vmu-top-unread-btn),
        [aria-label*="звонок" i]:not(#vmu-top-unread-btn),
        [aria-label*="видеозвонок" i]:not(#vmu-top-unread-btn),
        [aria-label*="аудиозвонок" i]:not(#vmu-top-unread-btn),
        [aria-label*="call" i]:not(#vmu-top-unread-btn),
        [aria-label*="Call" i]:not(#vmu-top-unread-btn),
        [data-testid*="call" i]:not(#vmu-top-unread-btn),
        [data-testid*="phone" i]:not(#vmu-top-unread-btn),
        [data-testid*="videocall" i]:not(#vmu-top-unread-btn),
        [class*="ChatHeader__call"],
        [class*="im-header-call"],
        [class*="im-page--header-call"],
        [class*="chat-header--call"],
        [class*="vkmChatHeader__call"],

        /* Кнопки внутри шапок с иконками звонков */
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="phone" i]),
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="videocam" i]),
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="call" i]),
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="video_camera" i]),
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="phone" i]),
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="videocam" i]),
        :is(.vkuiPanelHeader, [class*="PanelHeader"], .vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-page--header"], [class*="im-header"], header, .layout__header) :is(button, a, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="call" i]),

        /* Иконки звонков */
        [class*="phone_outline"]:not(#vmu-top-unread-btn),
        [class*="videocam_outline"]:not(#vmu-top-unread-btn),
        [class*="Icon--phone"]:not(#vmu-top-unread-btn),
        [class*="Icon--videocam"]:not(#vmu-top-unread-btn),
        [class*="Icon--call"]:not(#vmu-top-unread-btn) {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
        }
    `;

    const HIDE_VIDEO_MSGS_CSS = `
        /* ПОЛНОЕ СКРЫТИЕ КНОПКИ ЗАПИСИ КРУЖКОВ (ВИДЕОСООБЩЕНИЙ) В СТРОКЕ ВВОДА */
        /* Прямые селекторы атрибутов и классов */
        [aria-label*="видеосообщен" i],
        [aria-label*="Видеосообщен" i],
        [aria-label*="кружок" i],
        [aria-label*="Кружок" i],
        [aria-label*="кружоч" i],
        [aria-label*="Кружоч" i],
        [aria-label*="video message" i],
        [aria-label*="Video message" i],
        [aria-label*="video_message" i],
        [data-testid*="video-message" i],
        [data-testid*="video_message" i],
        [data-testid*="videomsg" i],
        [data-testid*="video-msg" i],
        [data-testid*="round_video" i],
        [data-testid*="round-video" i],
        [data-testid*="roundVideo" i],
        [class*="VideoMessage"],
        [class*="video_message"],
        [class*="videoMessage"],
        [class*="video-message"],
        [class*="video_circle"],
        [class*="camera_circle"],
        [class*="WriteBar__action--video"],
        [class*="writeBar__action--video"],
        [class*="WriteBar__video"],
        [class*="writeBar__video"],
        [class*="VideoMessage__record"],
        [class*="video_message__record"],

        /* Внутри строк ввода сообщений (WriteBar / im-chat-input) */
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) [aria-label*="видео" i],
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) [aria-label*="Видео" i],
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) [aria-label*="круж" i],
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) [aria-label*="Круж" i],
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) [aria-label*="video" i],
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) [aria-label*="Video" i],
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="video_message" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="video_circle" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="camera_circle" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="videocam" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="video" i]:not([class*="attach"]):not([class*="photo"])),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has([class*="camera" i]:not([class*="attach"]):not([class*="photo"]):not([class*="picture"])),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="video_message" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="video_circle" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="camera_circle" i]),
        :is([class*="WriteBar"], [class*="writeBar"], [class*="writebox"], [class*="chat-input"], [class*="ChatInput"], [class*="im-chat-input"], [class*="im-send-btn"], .vkuiWriteBar, .im-write-form) :is(button, a, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]):has(use[*|href*="videocam" i]),

        /* Иконки кружков */
        :is(button, a, [role="button"], [class*="IconButton"], [class*="Tappable"]):has(svg[class*="video_message" i]),
        :is(button, a, [role="button"], [class*="IconButton"], [class*="Tappable"]):has(svg[class*="video_circle" i]),
        :is(button, a, [role="button"], [class*="IconButton"], [class*="Tappable"]):has(svg[class*="camera_circle" i]),
        :is(button, a, [role="button"], [class*="IconButton"], [class*="Tappable"]):has(use[*|href*="video_message" i]),
        :is(button, a, [role="button"], [class*="IconButton"], [class*="Tappable"]):has(use[*|href*="video_circle" i]),
        :is(button, a, [role="button"], [class*="IconButton"], [class*="Tappable"]):has(use[*|href*="camera_circle" i]) {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
        }
    `;

    // ==========================================
    //           УПРАВЛЕНИЕ СТИЛЯМИ
    // ==========================================
    function setOrRemoveStyle(id, css, enabled) {
        let style = document.getElementById(id);
        if (!enabled) {
            if (style) style.remove();
            return;
        }

        const parent = document.head || document.documentElement;
        if (!parent) return;

        if (!style) {
            style = document.createElement('style');
            style.id = id;
            style.type = 'text/css';
            parent.appendChild(style);
        }

        if (style.textContent !== css) {
            style.textContent = css;
        }
    }

    function applyStyles() {
        setOrRemoveStyle('vmu-base-fixes-styles', FIXES_CSS, true);
        setOrRemoveStyle('vmu-nord-theme-styles', NORD_THEME_CSS, currentThemeMode === 'nord');
        setOrRemoveStyle('vmu-color-swap-styles', COLOR_SWAP_CSS, isColorSwapEnabled);
        setOrRemoveStyle('vmu-hide-labels-styles', HIDE_LABELS_CSS, isHideLabelsEnabled);
        setOrRemoveStyle('vmu-hide-folders-styles', HIDE_FOLDERS_CSS, isHideFoldersEnabled);
        setOrRemoveStyle('vmu-hide-calls-styles', HIDE_CALLS_CSS, isHideCallsEnabled);
        setOrRemoveStyle('vmu-hide-video-msgs-styles', HIDE_VIDEO_MSGS_CSS, isHideVideoMsgsEnabled);
    }

    // Применяем стили мгновенно при старте
    applyStyles();

    // ==========================================
    //    ОПРЕДЕЛЕНИЕ ТЕКУЩЕЙ СТРАНИЦЫ
    // ==========================================
    function isInChatPage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();

        // 1. Исключаем все разделы, заведомо не являющиеся диалогами
        if (path.startsWith('/settings') || path.startsWith('/menu') || path.startsWith('/feed') ||
            path.startsWith('/clips') || path.startsWith('/clip-') || path.startsWith('/video') || path.startsWith('/music') ||
            path.startsWith('/friends') || path.startsWith('/groups') || path.startsWith('/photos') ||
            path.startsWith('/bookmarks') || path.startsWith('/docs') ||
            isMailAppearancePage() || isScriptMenuPage() || isDebugScriptPage()) {
            return false;
        }

        // 2. Явные параметры URL открытого диалога
        if (search.includes('peer=') || search.includes('sel=') || search.includes('act=show') ||
            search.includes('act=write') || hash.includes('peer=') || hash.includes('sel=') ||
            path.startsWith('/write') || path.startsWith('/convo') || path.includes('/im/convo') ||
            path.includes('/im/chat') || path.includes('/im/peer')) {
            return true;
        }

        // 3. Наличие элементов чата в DOM (строка ввода сообщений WriteBar)
        const writeBar = document.querySelector(
            '[class*="WriteBar"], [class*="writeBar"], [class*="Writebar"], [class*="write_bar"], [class*="im-chat-input"], [class*="writebox"], textarea[placeholder*="сообщен" i], textarea[placeholder*="Сообщен" i], [data-testid*="writebar" i]'
        );
        if (writeBar && (writeBar.offsetWidth > 0 || writeBar.offsetHeight > 0 || writeBar.offsetParent !== null)) {
            return true;
        }

        // 4. Наличие истории сообщений или контейнера чата
        const chatMessages = document.querySelector(
            '[class*="ChatHistory"], [class*="MessagesList"], .vkmChat, [class*="vkmChat"], [class*="im-history"], [class*="im-chat"], [class*="im-page--chat"], [class*="MessageBubble"], [class*="MessageStack"]'
        );
        if (chatMessages && (chatMessages.offsetWidth > 0 || chatMessages.offsetHeight > 0 || chatMessages.offsetParent !== null)) {
            return true;
        }

        // 5. Наличие шапки чата (ChatHeader)
        const chatHeader = document.querySelector(
            '.vkmChatHeader, [class*="vkmChatHeader"], [class*="ChatHeader"], [class*="im-chat--header"], [data-testid*="chat-header" i]'
        );
        if (chatHeader && (chatHeader.offsetWidth > 0 || chatHeader.offsetHeight > 0 || chatHeader.offsetParent !== null)) {
            return true;
        }

        return false;
    }

    function isMainMailListPage() {
        if (isInChatPage()) {
            return false;
        }

        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();

        // Исключаем все разделы, не относящиеся к диалогам
        if (path.startsWith('/settings') || path.startsWith('/menu') || path.startsWith('/feed') ||
            path.startsWith('/clips') || path.startsWith('/clip-') || path.startsWith('/video') || path.startsWith('/music') ||
            path.startsWith('/id') || path.startsWith('/wall') || path.startsWith('/friends') ||
            path.startsWith('/groups') || path.startsWith('/photos') || path.startsWith('/docs') ||
            path.startsWith('/bookmarks') || path.startsWith('/call') || search.includes('act=appearance') ||
            isMailAppearancePage() || isScriptMenuPage() || isDebugScriptPage()) {
            return false;
        }

        // Путь относится к почте / мессенджеру
        if (path.startsWith('/mail') || path.startsWith('/im')) {
            return true;
        }

        return false;
    }

    function isAppearancePage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();

        if (path.startsWith('/im') || path.startsWith('/mail') || path.startsWith('/feed') ||
            path.startsWith('/clips') || path.startsWith('/clip-') || path.startsWith('/video') || path.startsWith('/music') ||
            path.startsWith('/id') || path.startsWith('/wall') || path.startsWith('/audios') ||
            path.startsWith('/friends') || path.startsWith('/groups') || path.startsWith('/photos') ||
            path.startsWith('/docs') || path.startsWith('/bookmarks') || path.startsWith('/call')) {
            return false;
        }

        if (isScriptMenuPage() || isDebugScriptPage() || isMailAppearancePage()) {
            return false;
        }

        if (search.includes('act=appearance') || path.includes('/settings/appearance')) {
            return true;
        }

        if (path.startsWith('/settings') && (search.includes('appearance') || document.querySelector('input[name="theme"], input[name="scheme"]'))) {
            return true;
        }

        return false;
    }

    function isScriptMenuPage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        return (path.startsWith('/settings') && (search.includes('act=vmu_menu') || search.includes('act=vmu_script'))) || window.location.hash === '#vmu_menu';
    }

    function isDebugScriptPage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        return (path.startsWith('/settings') && search.includes('act=vmu_debug')) || window.location.hash === '#vmu_debug';
    }

    function isMailAppearancePage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        return path.includes('/mail/settings/theme') || path.includes('/settings/appearance/im') || search.includes('act=vmu_mail_theme');
    }

    function isMailSettingsPage() {
        const path = window.location.pathname.toLowerCase();
        return (path.startsWith('/mail/settings') || path.startsWith('/im/settings')) && !path.includes('/mail/settings/theme');
    }

    function isChatPage() {
        return isInChatPage();
    }

    function updatePageBodyClasses() {
        if (!document.body) return;
        const isMail = isMainMailListPage();
        if (isMail) {
            if (!document.body.classList.contains('vmu-page-mail')) {
                document.body.classList.add('vmu-page-mail');
            }
        } else {
            if (document.body.classList.contains('vmu-page-mail')) {
                document.body.classList.remove('vmu-page-mail');
            }
        }

        const isApp = isAppearancePage();
        if (isApp) {
            if (!document.body.classList.contains('vmu-page-appearance')) {
                document.body.classList.add('vmu-page-appearance');
            }
        } else {
            if (document.body.classList.contains('vmu-page-appearance')) {
                document.body.classList.remove('vmu-page-appearance');
            }
        }

        const isClips = window.location.pathname.toLowerCase().startsWith('/clips') || window.location.pathname.toLowerCase().startsWith('/clip-');
        if (isClips) {
            if (!document.body.classList.contains('vmu-page-clips')) {
                document.body.classList.add('vmu-page-clips');
            }
        } else {
            if (document.body.classList.contains('vmu-page-clips')) {
                document.body.classList.remove('vmu-page-clips');
            }
        }

        const inChat = isChatPage();
        if (inChat) {
            if (!document.body.classList.contains('vmu-in-chat')) {
                document.body.classList.add('vmu-in-chat');
            }
        } else {
            if (document.body.classList.contains('vmu-in-chat')) {
                document.body.classList.remove('vmu-in-chat');
            }
        }

        const isScriptMenu = isScriptMenuPage();
        if (isScriptMenu) {
            document.body.classList.add('vmu-page-script-menu');
            if (document.documentElement) document.documentElement.classList.add('vmu-page-script-menu');
        } else {
            document.body.classList.remove('vmu-page-script-menu');
            if (document.documentElement) document.documentElement.classList.remove('vmu-page-script-menu');
        }

        const isDebugScript = isDebugScriptPage();
        if (isDebugScript) {
            document.body.classList.add('vmu-page-debug-script');
            if (document.documentElement) document.documentElement.classList.add('vmu-page-debug-script');
        } else {
            document.body.classList.remove('vmu-page-debug-script');
            if (document.documentElement) document.documentElement.classList.remove('vmu-page-debug-script');
        }

        const isMailSettings = isMailSettingsPage();
        if (isMailSettings) {
            document.body.classList.add('vmu-page-mail-settings');
        } else {
            document.body.classList.remove('vmu-page-mail-settings');
        }
    }

    // ==========================================
    //    ФИЛЬТР НЕПРОЧИТАННЫХ В ШАПКЕ (m.vk.ru/mail)
    // ==========================================
    const UNREAD_TOP_BTN_ID = 'vmu-top-unread-btn';

    function getNativeUnreadSwitch() {
        return document.querySelector(
            '.ConvoList__footerSwitch input, [class*="ConvoList__footerSwitch"] input, [class*="footerSwitch"] input, [class*="footer_switch"] input, [class*="FooterSwitch"] input, .ConvoList__footerSwitch [role="switch"], [class*="ConvoList__footerSwitch"] [role="switch"], [class*="footerSwitch"] [role="switch"], [class*="footer_switch"] [role="switch"], .ConvoList__footerSwitch, [class*="ConvoList__footerSwitch"], [class*="footerSwitch"], [class*="footer_switch"]'
        );
    }

    function findHeaderActionsSlot() {
        // 1. Ищем контейнер действий справа
        const actionContainers = document.querySelectorAll(
            '.vkmListHeader__actions, [class*="vkmListHeader__actions"], [class*="ListHeader__actions"], .vkuiPanelHeader__after, [class*="PanelHeader__after"], .vkuiPanelHeader__controls, [class*="PanelHeader__controls"], .vkuiPanelHeader__right, [class*="PanelHeader__right"]'
        );
        for (let i = 0; i < actionContainers.length; i++) {
            const c = actionContainers[i];
            if (c.querySelector('svg, button, a') && !c.classList.contains('vkuiPanelHeader__before') && !c.className.includes('before')) {
                return { container: c, insertBefore: c.firstChild };
            }
        }

        // 2. Ищем кнопку Архива или создания чата в шапке
        const candidateBtns = document.querySelectorAll(
            'a[href*="archive"], [aria-label*="Архив"], [aria-label*="Написать"], [aria-label*="Новое сообщение"], a[href*="act=write"], a[href*="new_chat"]'
        );
        for (let i = 0; i < candidateBtns.length; i++) {
            const btn = candidateBtns[i];
            const header = btn.closest('.vkmListHeader, [class*="vkmListHeader"], .vkuiPanelHeader, [class*="PanelHeader"]');
            if (header && btn.parentElement) {
                return { container: btn.parentElement, insertBefore: btn.parentElement.firstChild };
            }
        }

        // 3. Ищем кнопки в правой половине шапки
        const header = document.querySelector('.vkmListHeader, [class*="vkmListHeader"], .vkuiPanelHeader, [class*="PanelHeader"]');
        if (header) {
            const allBtns = header.querySelectorAll('a, button, [role="button"], .vkuiPanelHeaderButton, .vkuiTappable');
            for (let i = 0; i < allBtns.length; i++) {
                const b = allBtns[i];
                if (b.id === UNREAD_TOP_BTN_ID) continue;
                const rect = b.getBoundingClientRect();
                if (rect.left > (window.innerWidth / 2) && b.parentElement) {
                    return { container: b.parentElement, insertBefore: b };
                }
            }
        }

        return null;
    }

    function handleUnreadFilter() {
        const isMainMail = isMainMailListPage();

        // СТРОГОЕ УДАЛЕНИЕ КНОПКИ НА ВСЕХ ОСТАЛЬНЫХ ЭКРАНАХ
        if (!isMainMail) {
            const existingBtn = document.getElementById(UNREAD_TOP_BTN_ID);
            if (existingBtn) {
                existingBtn.remove();
            }
            return;
        }

        // Скрываем нижний нативный переключатель, если найден
        const sw = getNativeUnreadSwitch();
        if (sw) {
            const swRow = sw.closest('[class*="footerSwitch"], [class*="FooterSwitch"], [class*="footer_switch"], [class*="unreadSwitch"], [class*="FixedLayout"], label, [class*="Cell"]');
            if (swRow && !swRow.classList.contains('vkuiPanel') && swRow.id !== 'root' && swRow !== document.body) {
                swRow.style.setProperty('display', 'none', 'important');
                swRow.style.setProperty('visibility', 'hidden', 'important');
                swRow.style.setProperty('height', '0', 'important');
                swRow.style.setProperty('pointer-events', 'none', 'important');
            }
        }

        // Внедряем кнопку в шапку мессенджера (строго на главной странице)
        injectTopUnreadToggle();
    }

    function injectTopUnreadToggle() {
        const slot = findHeaderActionsSlot();
        if (!slot) return;

        const headerActions = slot.container;
        const insertBeforeEl = slot.insertBefore;

        const existingBtn = document.getElementById(UNREAD_TOP_BTN_ID);

        // Если кнопка уже вставлена в правильное место, ничего не делаем
        if (existingBtn && existingBtn.parentElement === headerActions) {
            return;
        }

        // Если кнопка была вставлена в неправильный контейнер (например, слева от аватарки) — перемещаем
        if (existingBtn) {
            existingBtn.remove();
        }

        // Предотвращаем перенос кнопок в шапке
        headerActions.style.setProperty('display', 'flex', 'important');
        headerActions.style.setProperty('flex-direction', 'row', 'important');
        headerActions.style.setProperty('flex-wrap', 'nowrap', 'important');
        headerActions.style.setProperty('align-items', 'center', 'important');

        const btn = document.createElement('div');
        btn.id = UNREAD_TOP_BTN_ID;
        btn.className = 'vkuiPanelHeaderButton vkuiTappable';
        btn.title = 'Только непрочитанные';
        btn.style.cssText = `
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            user-select: none !important;
            margin: 0 1px !important;
            color: var(--vkui--color_icon_secondary, #828282) !important;
            background: transparent !important;
            transition: background-color 0.2s ease, color 0.2s ease !important;
            -webkit-tap-highlight-color: transparent !important;
            flex-shrink: 0 !important;
            z-index: 100 !important;
        `;

        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="10" r="2.5" fill="currentColor"></circle>
            </svg>
        `;

        let isUnread = false;
        const initialSw = getNativeUnreadSwitch();
        if (initialSw) {
            const input = initialSw.tagName === 'INPUT' ? initialSw : initialSw.querySelector('input');
            if ((input && input.checked) || initialSw.getAttribute('aria-checked') === 'true' || initialSw.classList.contains('active')) {
                isUnread = true;
            }
        }

        function updateBtnVisual() {
            if (isUnread) {
                btn.style.setProperty('background-color', 'rgba(255, 92, 92, 0.16)', 'important');
                btn.style.setProperty('color', '#FF5C5C', 'important');
            } else {
                btn.style.setProperty('background-color', 'transparent', 'important');
                btn.style.setProperty('color', 'var(--vkui--color_icon_secondary, #828282)', 'important');
            }
        }

        updateBtnVisual();

        function triggerToggle(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            isUnread = !isUnread;
            updateBtnVisual();

            const currentSw = getNativeUnreadSwitch();
            if (currentSw) {
                const input = currentSw.tagName === 'INPUT' ? currentSw : currentSw.querySelector('input');
                if (input) {
                    input.click();
                } else {
                    currentSw.click();
                }
            }
        }

        btn.addEventListener('click', triggerToggle);
        btn.addEventListener('touchend', triggerToggle, { passive: false });

        if (insertBeforeEl && headerActions.contains(insertBeforeEl)) {
            headerActions.insertBefore(btn, insertBeforeEl);
        } else {
            headerActions.appendChild(btn);
        }
    }

    // ==========================================
    //    ИНТЕРФЕЙС НАСТРОЕК В m.vk.ru/settings
    // ==========================================
    const SETTINGS_UI_ID = 'vk-mobile-upgrade-settings-card';

    function createSelectRow(title, desc, currentValue, optionsList, onSelect) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            cursor: pointer;
            position: relative;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;

        const textCol = document.createElement('div');
        textCol.style.cssText = 'flex: 1; padding-right: 12px; pointer-events: none;';

        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size: 16px; font-weight: 400; color: var(--vkui--color_text_primary, #ffffff); line-height: 1.3;';
        titleEl.textContent = title;

        textCol.appendChild(titleEl);

        if (desc) {
            const descEl = document.createElement('div');
            descEl.style.cssText = 'font-size: 13px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px; line-height: 1.3;';
            descEl.textContent = desc;
            textCol.appendChild(descEl);
        }

        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'display: flex; align-items: center; gap: 6px; pointer-events: none;';

        const valueEl = document.createElement('div');
        valueEl.style.cssText = 'font-size: 15px; color: var(--vkui--color_text_secondary, #999999); font-weight: 400;';

        function getOptionTitle(val) {
            const found = optionsList.find(opt => opt.value === val);
            return found ? found.label : val;
        }

        valueEl.textContent = getOptionTitle(currentValue);

        const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.setAttribute('width', '16');
        chevron.setAttribute('height', '16');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('fill', 'none');
        chevron.setAttribute('stroke', 'currentColor');
        chevron.style.cssText = 'color: var(--vkui--color_icon_secondary, #828282); flex-shrink: 0;';
        chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />';

        rightCol.appendChild(valueEl);
        rightCol.appendChild(chevron);

        const select = document.createElement('select');
        select.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            -webkit-appearance: none;
            background: transparent;
            z-index: 2;
        `;

        optionsList.forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt.value;
            optEl.textContent = opt.label;
            select.appendChild(optEl);
        });

        select.value = currentValue;

        select.addEventListener('change', (e) => {
            const selected = e.target.value;
            valueEl.textContent = getOptionTitle(selected);
            onSelect(selected);
        });

        row.appendChild(textCol);
        row.appendChild(rightCol);
        row.appendChild(select);

        return row;
    }

    function createSwitchRow(title, desc, initialChecked, onToggle) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            cursor: default;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;

        const textCol = document.createElement('div');
        textCol.style.cssText = 'flex: 1; padding-right: 14px; pointer-events: none;';

        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size: 16px; font-weight: 400; color: var(--vkui--color_text_primary, #ffffff); line-height: 1.3;';
        titleEl.textContent = title;

        textCol.appendChild(titleEl);

        if (desc) {
            const descEl = document.createElement('div');
            descEl.style.cssText = 'font-size: 13px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px; line-height: 1.3;';
            descEl.textContent = desc;
            textCol.appendChild(descEl);
        }

        const switchWrapper = document.createElement('div');
        switchWrapper.style.cssText = `
            padding: 8px;
            margin: -8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            flex-shrink: 0;
        `;

        const switchBtn = document.createElement('div');
        switchBtn.role = 'switch';
        switchBtn.setAttribute('aria-checked', initialChecked ? 'true' : 'false');
        switchBtn.style.cssText = `
            position: relative;
            width: 48px;
            height: 28px;
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-sizing: border-box;
            transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease;
            flex-shrink: 0;
            pointer-events: none;
        `;

        const slider = document.createElement('div');
        slider.style.cssText = `
            position: absolute;
            top: 2px;
            left: 2px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease;
            pointer-events: none;
        `;
        switchBtn.appendChild(slider);
        switchWrapper.appendChild(switchBtn);

        let isChecked = initialChecked;

        function updateSwitchVisual(checked) {
            if (checked) {
                switchBtn.style.backgroundColor = isColorSwapEnabled ? '#FF5C5C' : 'var(--vkui--color_background_accent, #2787F5)';
                switchBtn.style.borderColor = 'transparent';
                slider.style.backgroundColor = '#ffffff';
                slider.style.transform = 'translateX(20px)';
            } else {
                switchBtn.style.backgroundColor = '#2c2d2e';
                switchBtn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                slider.style.backgroundColor = '#8c9096';
                slider.style.transform = 'translateX(0)';
            }
        }

        updateSwitchVisual(isChecked);

        let lastToggleTime = 0;
        function handleToggle(e) {
            const now = Date.now();
            if (now - lastToggleTime < 250) return;
            lastToggleTime = now;

            if (e) {
                e.stopPropagation();
            }
            isChecked = !isChecked;
            switchBtn.setAttribute('aria-checked', isChecked ? 'true' : 'false');
            updateSwitchVisual(isChecked);
            onToggle(isChecked);
        }

        switchWrapper.addEventListener('click', handleToggle);
        switchWrapper.addEventListener('touchend', (e) => {
            e.stopPropagation();
            handleToggle(e);
        });

        row.appendChild(textCol);
        row.appendChild(switchWrapper);

        return row;
    }

    function createNavRow(title, desc, onClick) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            cursor: pointer;
            position: relative;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;

        const textCol = document.createElement('div');
        textCol.style.cssText = 'flex: 1; padding-right: 12px; pointer-events: none;';

        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size: 16px; font-weight: 400; color: var(--vkui--color_text_primary, #ffffff); line-height: 1.3;';
        titleEl.textContent = title;
        textCol.appendChild(titleEl);

        if (desc) {
            const descEl = document.createElement('div');
            descEl.style.cssText = 'font-size: 13px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px; line-height: 1.3;';
            descEl.textContent = desc;
            textCol.appendChild(descEl);
        }

        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'display: flex; align-items: center; gap: 6px; pointer-events: none;';

        const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.setAttribute('width', '16');
        chevron.setAttribute('height', '16');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('fill', 'none');
        chevron.setAttribute('stroke', 'currentColor');
        chevron.style.cssText = 'color: var(--vkui--color_icon_secondary, #828282); flex-shrink: 0; transform: rotate(-90deg);';
        chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />';

        rightCol.appendChild(chevron);
        row.appendChild(textCol);
        row.appendChild(rightCol);

        row.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });

        return row;
    }

    function applyBottomTabIconParams(items) {
        if (!items || items.length === 0) {
            items = getAllBottomNavItems();
        }
        if (!items || items.length === 0) return;

        const isIndividual = getSetting(STORAGE_KEYS.ICON_INDIVIDUAL_MODE, false);
        const customParams = getCustomIconParams();

        items.forEach((item, index) => {
            let key = 'global';
            if (isIndividual) {
                if (index === 0) key = 'home';
                else if (index === 1) key = currentTabSearch || 'search';
                else if (index === 2) key = 'messages';
                else if (index === 3) key = 'clips';
                else if (index >= 4) key = 'more';
            }

            const p = isIndividual ? (customParams[key] || DEFAULT_CUSTOM_PARAMS[key] || { scale: 100, stroke: 1.5 }) : (customParams.global || { scale: 100, stroke: 1.5 });
            const scaleVal = (p.scale || 100) / 100;
            const strokeVal = parseFloat(p.stroke) || 1.5;

            const svgs = item.querySelectorAll('svg');
            for (let i = 0; i < svgs.length; i++) {
                const svg = svgs[i];
                if (svg.closest('.vkuiCounter, [class*="Counter"], .vkuiBadge, [class*="Badge"], .vmu-restored-badge')) {
                    continue;
                }

                if (svg.dataset.vmuSvg && (svg.dataset.vmuSvg === 'friends' || svg.dataset.vmuSvg === 'groups' || svg.dataset.vmuSvg === 'music' || svg.dataset.vmuSvg === 'video')) {
                    svg.style.transform = '';
                } else {
                    svg.style.transform = scaleVal !== 1 ? `scale(${scaleVal})` : '';
                    svg.style.transformOrigin = 'center center';
                }

                const strokeEls = svg.querySelectorAll('[stroke], [stroke-width]');
                for (let j = 0; j < strokeEls.length; j++) {
                    const el = strokeEls[j];
                    if (el.getAttribute('stroke') !== 'none') {
                        el.setAttribute('stroke-width', String(strokeVal));
                    }
                }
            }
        });
    }

    function createCustomIconsSection() {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-top: 14px;
            border: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.12));
            border-radius: 12px;
            background: var(--vkui--color_background_secondary, rgba(255, 255, 255, 0.04));
            overflow: hidden;
        `;

        let isOpen = getSetting(STORAGE_KEYS.CUSTOM_SECTION_OPEN, true);
        let isIndividual = getSetting(STORAGE_KEYS.ICON_INDIVIDUAL_MODE, false);

        // Header (Click to toggle accordion)
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        `;

        const titleCol = document.createElement('div');
        titleCol.style.cssText = 'flex: 1; padding-right: 10px; pointer-events: none;';

        const titleText = document.createElement('div');
        titleText.style.cssText = 'font-size: 16px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff);';
        titleText.textContent = 'Размер значков';

        const descText = document.createElement('div');
        descText.style.cssText = 'font-size: 13px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px;';
        descText.textContent = 'Ручная настройка размера и толщины значков на нижней панели';

        titleCol.appendChild(titleText);
        titleCol.appendChild(descText);

        const chevron = document.createElement('div');
        chevron.style.cssText = `
            font-size: 14px;
            color: var(--vkui--color_text_secondary, #999999);
            transition: transform 0.25s ease;
            transform: ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
            pointer-events: none;
        `;
        chevron.textContent = '▼';

        header.appendChild(titleCol);
        header.appendChild(chevron);
        container.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.style.cssText = `
            display: ${isOpen ? 'block' : 'none'};
            padding: 0 14px 14px 14px;
            border-top: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;

        let customParams = getCustomIconParams();

        function refreshAll() {
            setCustomIconParams(customParams);
            try { updateCustomTabs(); } catch(e) {}
            try { applyBottomTabIconParams(getAllBottomNavItems()); } catch(e) {}
        }

        // Toggle row for "По отдельности"
        const toggleRow = createSwitchRow(
            'По отдельности',
            'Индивидуальная настройка каждого значка',
            isIndividual,
            (checked) => {
                isIndividual = checked;
                setSetting(STORAGE_KEYS.ICON_INDIVIDUAL_MODE, isIndividual);
                renderBodyContent();
                refreshAll();
            }
        );
        toggleRow.style.cssText += 'margin-top: 6px; padding: 10px 0; border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));';
        body.appendChild(toggleRow);

        const contentContainer = document.createElement('div');
        body.appendChild(contentContainer);

        function createIconCard(itemKey, itemName, paramObj, onParamChange) {
            const card = document.createElement('div');
            card.style.cssText = `
                margin-top: 10px;
                padding: 12px;
                border-radius: 10px;
                background: rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.06);
            `;

            // Card Header (Icon Preview + Name + Badge)
            const cardHeader = document.createElement('div');
            cardHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';

            const leftBox = document.createElement('div');
            leftBox.style.cssText = 'display: flex; align-items: center; gap: 10px;';

            const prevBox = document.createElement('div');
            prevBox.style.cssText = `
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.08);
                color: var(--vkui--color_text_accent, #71aaeb);
            `;
            prevBox.innerHTML = getIconPreviewSvg(itemKey, paramObj.scale, paramObj.stroke);

            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-size: 15px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff);';
            nameEl.textContent = itemName;

            leftBox.appendChild(prevBox);
            leftBox.appendChild(nameEl);

            const badge = document.createElement('div');
            badge.style.cssText = `
                font-size: 12px;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.08);
                color: var(--vkui--color_text_primary, #ffffff);
                font-family: monospace;
            `;
            badge.textContent = `${paramObj.scale}% • ${Number(paramObj.stroke).toFixed(1)}px`;

            cardHeader.appendChild(leftBox);
            cardHeader.appendChild(badge);
            card.appendChild(cardHeader);

            function updateCardView() {
                prevBox.innerHTML = getIconPreviewSvg(itemKey, paramObj.scale, paramObj.stroke);
                badge.textContent = `${paramObj.scale}% • ${Number(paramObj.stroke).toFixed(1)}px`;
                onParamChange();
            }

            // Controls 1: Размер
            const scaleRow = document.createElement('div');
            scaleRow.style.cssText = 'margin-bottom: 8px;';

            const scaleLabelRow = document.createElement('div');
            scaleLabelRow.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px; color: var(--vkui--color_text_secondary, #999); margin-bottom: 4px;';
            scaleLabelRow.innerHTML = `<span>Размер</span><span>${paramObj.scale}%</span>`;

            const scaleControl = document.createElement('div');
            scaleControl.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            const btnScaleMinus = document.createElement('button');
            btnScaleMinus.textContent = '-5%';
            btnScaleMinus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            const scaleSlider = document.createElement('input');
            scaleSlider.type = 'range';
            scaleSlider.min = '70';
            scaleSlider.max = '160';
            scaleSlider.step = '1';
            scaleSlider.value = String(paramObj.scale);
            scaleSlider.style.cssText = 'flex: 1; accent-color: #2787F5; cursor: pointer;';

            const btnScalePlus = document.createElement('button');
            btnScalePlus.textContent = '+5%';
            btnScalePlus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            btnScaleMinus.onclick = (e) => {
                e.preventDefault();
                let v = Math.max(70, (paramObj.scale || 100) - 5);
                paramObj.scale = v;
                scaleSlider.value = String(v);
                scaleLabelRow.lastElementChild.textContent = `${v}%`;
                updateCardView();
            };

            btnScalePlus.onclick = (e) => {
                e.preventDefault();
                let v = Math.min(160, (paramObj.scale || 100) + 5);
                paramObj.scale = v;
                scaleSlider.value = String(v);
                scaleLabelRow.lastElementChild.textContent = `${v}%`;
                updateCardView();
            };

            scaleSlider.oninput = (e) => {
                let v = parseInt(e.target.value, 10);
                paramObj.scale = v;
                scaleLabelRow.lastElementChild.textContent = `${v}%`;
                updateCardView();
            };

            scaleControl.appendChild(btnScaleMinus);
            scaleControl.appendChild(scaleSlider);
            scaleControl.appendChild(btnScalePlus);
            scaleRow.appendChild(scaleLabelRow);
            scaleRow.appendChild(scaleControl);
            card.appendChild(scaleRow);

            // Controls 2: Толщина линий
            const strokeRow = document.createElement('div');
            strokeRow.style.cssText = 'margin-bottom: 4px;';

            const strokeLabelRow = document.createElement('div');
            strokeLabelRow.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px; color: var(--vkui--color_text_secondary, #999); margin-bottom: 4px;';
            strokeLabelRow.innerHTML = `<span>Толщина линий</span><span>${Number(paramObj.stroke).toFixed(1)}px</span>`;

            const strokeControl = document.createElement('div');
            strokeControl.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            const btnStrokeMinus = document.createElement('button');
            btnStrokeMinus.textContent = '-0.1';
            btnStrokeMinus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            const strokeSlider = document.createElement('input');
            strokeSlider.type = 'range';
            strokeSlider.min = '0.5';
            strokeSlider.max = '3.5';
            strokeSlider.step = '0.1';
            strokeSlider.value = String(paramObj.stroke);
            strokeSlider.style.cssText = 'flex: 1; accent-color: #2787F5; cursor: pointer;';

            const btnStrokePlus = document.createElement('button');
            btnStrokePlus.textContent = '+0.1';
            btnStrokePlus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            btnStrokeMinus.onclick = (e) => {
                e.preventDefault();
                let v = Math.max(0.5, Math.round(((paramObj.stroke || 1.5) - 0.1) * 10) / 10);
                paramObj.stroke = v;
                strokeSlider.value = String(v);
                strokeLabelRow.lastElementChild.textContent = `${v.toFixed(1)}px`;
                updateCardView();
            };

            btnStrokePlus.onclick = (e) => {
                e.preventDefault();
                let v = Math.min(3.5, Math.round(((paramObj.stroke || 1.5) + 0.1) * 10) / 10);
                paramObj.stroke = v;
                strokeSlider.value = String(v);
                strokeLabelRow.lastElementChild.textContent = `${v.toFixed(1)}px`;
                updateCardView();
            };

            strokeSlider.oninput = (e) => {
                let v = Math.round(parseFloat(e.target.value) * 10) / 10;
                paramObj.stroke = v;
                strokeLabelRow.lastElementChild.textContent = `${v.toFixed(1)}px`;
                updateCardView();
            };

            strokeControl.appendChild(btnStrokeMinus);
            strokeControl.appendChild(strokeSlider);
            strokeControl.appendChild(btnStrokePlus);
            strokeRow.appendChild(strokeLabelRow);
            strokeRow.appendChild(strokeControl);
            card.appendChild(strokeRow);

            return card;
        }

        function renderBodyContent() {
            contentContainer.innerHTML = '';

            if (!isIndividual) {
                // Общий режим (2 ползунка для всех иконок)
                if (!customParams.global) {
                    customParams.global = { scale: 100, stroke: 1.5 };
                }
                const globalCard = createIconCard('all', 'Все значки панели', customParams.global, refreshAll);
                contentContainer.appendChild(globalCard);

                const resetBtn = document.createElement('button');
                resetBtn.textContent = '↺ Сбросить до стандартных';
                resetBtn.style.cssText = `
                    margin-top: 12px;
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--vkui--color_text_primary, #ffffff);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    touch-action: manipulation;
                `;
                resetBtn.onclick = (e) => {
                    e.preventDefault();
                    customParams.global = { scale: 100, stroke: 1.5 };
                    renderBodyContent();
                    refreshAll();
                };
                contentContainer.appendChild(resetBtn);
            } else {
                // Индивидуальный режим (по отдельности для каждого значка)
                const iconsList = [
                    { key: 'home', name: 'Главная' },
                    { key: 'search', name: 'Поиск' },
                    { key: 'friends', name: 'Друзья' },
                    { key: 'groups', name: 'Сообщества' },
                    { key: 'music', name: 'Музыка' },
                    { key: 'video', name: 'Видео' },
                    { key: 'bookmarks', name: 'Закладки' },
                    { key: 'messages', name: 'Мессенджер' },
                    { key: 'clips', name: 'Клипы' },
                    { key: 'more', name: 'Ещё' }
                ];

                iconsList.forEach(item => {
                    if (!customParams[item.key]) {
                        customParams[item.key] = Object.assign({}, DEFAULT_CUSTOM_PARAMS[item.key] || { scale: 100, stroke: 1.5 });
                    }
                    const iconCard = createIconCard(item.key, item.name, customParams[item.key], refreshAll);
                    contentContainer.appendChild(iconCard);
                });

                const resetBtn = document.createElement('button');
                resetBtn.textContent = '↺ Сбросить все настройки';
                resetBtn.style.cssText = `
                    margin-top: 12px;
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--vkui--color_text_primary, #ffffff);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    touch-action: manipulation;
                `;
                resetBtn.onclick = (e) => {
                    e.preventDefault();
                    customParams = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PARAMS));
                    renderBodyContent();
                    refreshAll();
                };
                contentContainer.appendChild(resetBtn);
            }
        }

        renderBodyContent();
        container.appendChild(body);

        header.addEventListener('click', () => {
            isOpen = !isOpen;
            body.style.display = isOpen ? 'block' : 'none';
            chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            setSetting(STORAGE_KEYS.CUSTOM_SECTION_OPEN, isOpen);
        });

        return container;
    }

    // ==========================================
    //       УПРАВЛЕНИЕ И СИНХРОНИЗАЦИЯ ТЕМ
    // ==========================================
    function setThemeMode(mode) {
        currentThemeMode = mode;
        setSetting(STORAGE_KEYS.THEME_MODE, mode);
        isColorSwapEnabled = (mode === 'snow_black');

        const isLight = (mode === 'light');
        const isNord = (mode === 'nord');
        const isSnow = (mode === 'snow_black');

        const vkuiTheme = isLight ? 'bright_light' : 'space_gray';
        const vkTheme = isLight ? 'light' : (isSnow ? 'snow_black' : (isNord ? 'nord' : 'dark'));

        try {
            localStorage.setItem('vkui_theme', vkuiTheme);
            localStorage.setItem('vk_theme', vkTheme);
            localStorage.setItem('theme', vkTheme);
            localStorage.setItem('scheme', vkuiTheme);
            localStorage.setItem('vkui-theme', vkuiTheme);
        } catch (e) {}

        const html = document.documentElement;
        const body = document.body;
        if (html) {
            html.setAttribute('scheme', vkuiTheme);
            html.setAttribute('data-theme', vkTheme);
            html.setAttribute('data-vkui-theme', vkuiTheme);
            html.classList.toggle('vmu-color-swap', isSnow);
            html.classList.toggle('vmu-theme-nord', isNord);
        }
        if (body) {
            body.setAttribute('scheme', vkuiTheme);
            body.setAttribute('data-theme', vkTheme);
            body.setAttribute('data-vkui-theme', vkuiTheme);
            body.classList.toggle('vmu-color-swap', isSnow);
            body.classList.toggle('vmu-theme-nord', isNord);
        }

        applyStyles();
        updatePwaManifestAndIcons();
        scheduleFixes();

        // Синхронизируем с нативными переключателями VK, если есть
        const lightRadio = document.querySelector(
            'input[type="radio"][value*="light"], input[type="radio"][value*="bright_light"], input[type="radio"][value="1"], input[type="radio"][id*="light"]'
        );
        const darkRadio = document.querySelector(
            'input[type="radio"][value*="dark"], input[type="radio"][value*="space_gray"], input[type="radio"][value="2"], input[type="radio"][id*="dark"]'
        );

        if (isLight && lightRadio && !lightRadio.checked) {
            lightRadio.checked = true;
            lightRadio.click();
        } else if (!isLight && darkRadio && !darkRadio.checked) {
            darkRadio.checked = true;
            darkRadio.click();
        }
    }

    function syncCurrentTheme() {
        const isLight = (currentThemeMode === 'light');
        const isNord = (currentThemeMode === 'nord');
        const isSnow = (currentThemeMode === 'snow_black');

        const vkuiTheme = isLight ? 'bright_light' : 'space_gray';
        const vkTheme = isLight ? 'light' : (isSnow ? 'snow_black' : (isNord ? 'nord' : 'dark'));

        try {
            if (localStorage.getItem('vkui_theme') !== vkuiTheme) localStorage.setItem('vkui_theme', vkuiTheme);
            if (localStorage.getItem('vk_theme') !== vkTheme) localStorage.setItem('vk_theme', vkTheme);
            if (localStorage.getItem('scheme') !== vkuiTheme) localStorage.setItem('scheme', vkuiTheme);
        } catch (e) {}

        const html = document.documentElement;
        if (html) {
            if (html.getAttribute('scheme') !== vkuiTheme) html.setAttribute('scheme', vkuiTheme);
            if (html.getAttribute('data-theme') !== vkTheme) html.setAttribute('data-theme', vkTheme);
            if (html.getAttribute('data-vkui-theme') !== vkuiTheme) html.setAttribute('data-vkui-theme', vkuiTheme);
            html.classList.toggle('vmu-color-swap', isSnow);
            html.classList.toggle('vmu-theme-nord', isNord);
        }
    }

    syncCurrentTheme();
    try { handleStartupNavigation(); } catch (e) {}
    try { updatePwaManifestAndIcons(); } catch (e) {}

    const SCRIPT_MENU_UI_ID = 'vmu-script-menu-card';
    const DEBUG_SCRIPT_UI_ID = 'vmu-debug-script-card';
    const MAIL_APPEARANCE_UI_ID = 'vmu-mail-appearance-card';

    function injectCustomSettingsMenuItems() {
        const path = window.location.pathname.toLowerCase();
        if (!path.startsWith('/settings')) return;

        // Ищем пункт "Внешний вид" в основном списке настроек
        const cells = document.querySelectorAll('a[href*="act=appearance"], a[href*="/settings/appearance"], .vkuiSimpleCell, [class*="SimpleCell"], [class*="Cell"], [role="link"]');
        let appearanceCell = null;
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (c.textContent.includes('Внешний вид') && !c.classList.contains('vmu-custom-settings-item')) {
                appearanceCell = c;
                break;
            }
        }

        if (!appearanceCell || !appearanceCell.parentElement) return;

        const existingMenu = document.getElementById('vmu-settings-item-menu');
        const existingDebug = document.getElementById('vmu-settings-item-debug');

        if (existingMenu && existingDebug) {
            if (appearanceCell.nextElementSibling !== existingMenu) {
                appearanceCell.insertAdjacentElement('afterend', existingDebug);
                appearanceCell.insertAdjacentElement('afterend', existingMenu);
            }
            return;
        }

        // 1. Создаем пункт "Меню скрипта" с контурной иконкой шестерёнки
        const itemMenu = appearanceCell.cloneNode(true);
        itemMenu.id = 'vmu-settings-item-menu';
        itemMenu.classList.add('vmu-custom-settings-item');
        itemMenu.setAttribute('href', '/settings?act=vmu_menu');

        const iconContainerMenu = itemMenu.querySelector('.vkuiSimpleCell__before, [class*="SimpleCell__before"], [class*="Cell__before"]');
        const gearSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--w-28 vkuiIcon--h-28" style="display: block !important; width: 28px !important; height: 28px !important; margin: 0 auto !important;"><circle cx="14" cy="14" r="3.75" stroke="currentColor" stroke-width="2"/><path d="M14 2.5a1.5 1.5 0 0 1 1.45 1.1l.3 1.2a2 2 0 0 0 2.1 1.5l1.2-.3a1.5 1.5 0 0 1 1.7 1.7l-.3 1.2a2 2 0 0 0 1.5 2.1l1.2.3a1.5 1.5 0 0 1 1.1 1.45v1.5a1.5 1.5 0 0 1-1.1 1.45l-1.2.3a2 2 0 0 0-1.5 2.1l.3 1.2a1.5 1.5 0 0 1-1.7 1.7l-1.2-.3a2 2 0 0 0-2.1 1.5l-.3 1.2a1.5 1.5 0 0 1-1.45 1.1h-1.5a1.5 1.5 0 0 1-1.45-1.1l-.3-1.2a2 2 0 0 0-2.1-1.5l-1.2.3a1.5 1.5 0 0 1-1.7-1.7l.3-1.2a2 2 0 0 0-1.5-2.1l-1.2-.3a1.5 1.5 0 0 1-1.1-1.45v-1.5a1.5 1.5 0 0 1 1.1-1.45l1.2-.3a2 2 0 0 0 1.5-2.1l-.3-1.2a1.5 1.5 0 0 1 1.7-1.7l1.2.3a2 2 0 0 0 2.1-1.5l.3-1.2a1.5 1.5 0 0 1 1.45-1.1h1.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
        if (iconContainerMenu) {
            iconContainerMenu.innerHTML = gearSvg;
        }

        const textElMenu = itemMenu.querySelector('.vkuiSimpleCell__text, [class*="SimpleCell__text"], [class*="Cell__text"], [class*="SimpleCell__children"], [class*="Cell__children"]') || itemMenu;
        let walkerM = document.createTreeWalker(textElMenu, NodeFilter.SHOW_TEXT);
        let nodeM;
        let setM = false;
        while ((nodeM = walkerM.nextNode())) {
            if (nodeM.nodeValue.includes('Внешний вид') || nodeM.nodeValue.trim().length > 0) {
                nodeM.nodeValue = 'Меню скрипта';
                setM = true;
                break;
            }
        }
        if (!setM) {
            textElMenu.textContent = 'Меню скрипта';
        }

        itemMenu.onclick = (e) => {
            e.preventDefault();
            window.history.pushState(null, '', '/settings?act=vmu_menu');
            scheduleFixes();
        };

        // 2. Создаем пункт "Debug script" с контурной иконкой жука (как в Баг-трекере)
        const itemDebug = appearanceCell.cloneNode(true);
        itemDebug.id = 'vmu-settings-item-debug';
        itemDebug.classList.add('vmu-custom-settings-item');
        itemDebug.setAttribute('href', '/settings?act=vmu_debug');

        const iconContainerDebug = itemDebug.querySelector('.vkuiSimpleCell__before, [class*="SimpleCell__before"], [class*="Cell__before"]');
        const bugSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--w-28 vkuiIcon--h-28" style="display: block !important; width: 28px !important; height: 28px !important; margin: 0 auto !important;"><path d="M11 8L8.5 4.5M17 8l2.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="8.5" y="8" width="11" height="13" rx="5.5" stroke="currentColor" stroke-width="2"/><path d="M3.5 11.5h5M3.5 15h5M3.5 18.5h5M19.5 11.5h5M19.5 15h5M19.5 18.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11.5v7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        if (iconContainerDebug) {
            iconContainerDebug.innerHTML = bugSvg;
        }

        const textElDebug = itemDebug.querySelector('.vkuiSimpleCell__text, [class*="SimpleCell__text"], [class*="Cell__text"], [class*="SimpleCell__children"], [class*="Cell__children"]') || itemDebug;
        let walkerD = document.createTreeWalker(textElDebug, NodeFilter.SHOW_TEXT);
        let nodeD;
        let setD = false;
        while ((nodeD = walkerD.nextNode())) {
            if (nodeD.nodeValue.includes('Внешний вид') || nodeD.nodeValue.trim().length > 0) {
                nodeD.nodeValue = 'Debug script';
                setD = true;
                break;
            }
        }
        if (!setD) {
            textElDebug.textContent = 'Debug script';
        }

        itemDebug.onclick = (e) => {
            e.preventDefault();
            window.history.pushState(null, '', '/settings?act=vmu_debug');
            scheduleFixes();
        };

        appearanceCell.insertAdjacentElement('afterend', itemDebug);
        appearanceCell.insertAdjacentElement('afterend', itemMenu);
    }

    function renderScriptMenuPage() {
        const existingPage = document.getElementById(SCRIPT_MENU_UI_ID);
        if (existingPage) return;

        const groups = document.querySelectorAll('.vkuiGroup, [class*="Group"], .vkuiPanel__in > div, .vkuiBanner, [class*="Banner"], .vkuiFormStatus--mode-error, [class*="FormStatus--error"], [class*="Snackbar"], .vkuiSnackbar, [class*="FormStatus"], [class*="Placeholder"], [role="alert"], .vkuiAlert');
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].id !== SCRIPT_MENU_UI_ID && groups[i].id !== DEBUG_SCRIPT_UI_ID && groups[i].id !== SETTINGS_UI_ID) {
                groups[i].style.setProperty('display', 'none', 'important');
            }
        }

        // Удаление баннеров ошибок VK
        const errorEls = document.querySelectorAll('.vkuiBanner, [class*="Banner"], .vkuiFormStatus, [class*="FormStatus"], [class*="Placeholder"], [class*="Snackbar"], .vkuiSnackbar, [role="alert"], .vkuiAlert, [class*="Alert"]');
        for (let i = 0; i < errorEls.length; i++) {
            const el = errorEls[i];
            if (!el.closest('#' + SCRIPT_MENU_UI_ID) && !el.closest('#' + DEBUG_SCRIPT_UI_ID)) {
                el.style.setProperty('display', 'none', 'important');
                try { el.remove(); } catch(e) {}
            }
        }

        let target = document.querySelector('.vkuiPanel__in, [class*="Panel__in"], .layout, main') || document.body;

        const card = document.createElement('div');
        card.id = SCRIPT_MENU_UI_ID;
        card.className = 'vkuiGroup vkuiGroup--mode-none vkuiGroup--padding-m';
        card.style.cssText = `
            margin: 0 0 90px 0 !important;
            padding: 0 0 20px 0 !important;
            background: transparent !important;
            border: none !important;
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
            display: block !important;
            position: relative !important;
            z-index: 1 !important;
        `;

        const topNav = document.createElement('div');
        topNav.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
            margin-bottom: 12px;
        `;

        const backBtn = document.createElement('button');
        backBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            color: var(--vkui--color_text_accent, #71aaeb);
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            padding: 6px 8px;
            margin: -6px -8px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;
        backBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span>Настройки</span>
        `;
        backBtn.onclick = (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/settings';
            }
            setTimeout(scheduleFixes, 50);
        };

        const pageTitle = document.createElement('div');
        pageTitle.style.cssText = 'font-size: 18px; font-weight: 600; color: var(--vkui--color_text_primary, #ffffff);';
        pageTitle.textContent = 'Меню скрипта';

        topNav.appendChild(backBtn);
        topNav.appendChild(pageTitle);
        card.appendChild(topNav);

        // 1. Стартовая вкладка веб-приложения
        const rowStartPage = createSelectRow(
            'Стартовая вкладка',
            'Вкладка при открытии веб-приложения (PWA) или главной страницы',
            currentStartPage,
            START_PAGE_OPTIONS,
            (selected) => {
                currentStartPage = selected;
                setSetting(STORAGE_KEYS.START_PAGE, selected);
                updatePwaManifestAndIcons();
            }
        );
        card.appendChild(rowStartPage);

        // 2. Замена вкладки Поиск
        const rowTabSearch = createSelectRow(
            'Замена вкладки Поиск',
            'Кнопка на нижней панели (по умолчанию: Поиск)',
            currentTabSearch,
            TAB_OPTIONS_SEARCH,
            (selected) => {
                currentTabSearch = selected;
                setSetting(STORAGE_KEYS.TAB_SEARCH, selected);
                scheduleFixes();
            }
        );
        card.appendChild(rowTabSearch);

        // 3. Скрыть категории чатов
        const rowFolders = createSwitchRow(
            'Скрыть категории чатов',
            'Убирает панель категорий (Все, Каналы, Бизнес, Чаты) и лишние отступы',
            isHideFoldersEnabled,
            (checked) => {
                isHideFoldersEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_FOLDERS_BAR, isHideFoldersEnabled);
                applyStyles();
        updatePwaManifestAndIcons();
            }
        );
        card.appendChild(rowFolders);

        // 4. Отключить звонки в чатах
        const rowCalls = createSwitchRow(
            'Отключить звонки в чатах',
            'Скрывает кнопку звонка из шапки диалогов',
            isHideCallsEnabled,
            (checked) => {
                isHideCallsEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_CALLS, isHideCallsEnabled);
                applyStyles();
        updatePwaManifestAndIcons();
                scheduleFixes();
            }
        );
        card.appendChild(rowCalls);

        // 5. Отключить кружки в чатах
        const rowVideo = createSwitchRow(
            'Отключить кружки в чатах',
            'Скрывает кнопку записи кружков в строке ввода сообщений',
            isHideVideoMsgsEnabled,
            (checked) => {
                isHideVideoMsgsEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_VIDEO_MSGS, isHideVideoMsgsEnabled);
                applyStyles();
                updatePwaManifestAndIcons();
                scheduleFixes();
            }
        );
        card.appendChild(rowVideo);

        // 6. Неписалка (Скрывать статус «Печатает...»)
        const rowGhostTyping = createSwitchRow(
            'Неписалка',
            'Скрывает статус «Печатает...» при наборе текста во всех диалогах и беседах',
            isGhostTypingEnabled,
            (checked) => {
                isGhostTypingEnabled = checked;
                setSetting(STORAGE_KEYS.GHOST_TYPING, isGhostTypingEnabled);
            }
        );
        card.appendChild(rowGhostTyping);

        // 7. Нечиталка (Не отправлять статус прочтения)
        const rowGhostRead = createSwitchRow(
            'Нечиталка',
            'Оставляет входящие сообщения непрочитанными для собеседников при их открытии',
            isGhostReadEnabled,
            (checked) => {
                isGhostReadEnabled = checked;
                setSetting(STORAGE_KEYS.GHOST_READ, isGhostReadEnabled);
            }
        );
        card.appendChild(rowGhostRead);

        // 8. Сохранять удаленные сообщения
        const rowSaveDeleted = createSwitchRow(
            'Сохранять удаленные сообщения',
            'Сохраняет в локальный кэш и выделяет в чате удаленные собеседником сообщения',
            isSaveDeletedMsgsEnabled,
            (checked) => {
                isSaveDeletedMsgsEnabled = checked;
                setSetting(STORAGE_KEYS.SAVE_DELETED_MSGS, isSaveDeletedMsgsEnabled);
            }
        );
        rowSaveDeleted.style.borderBottom = '1px solid var(--vkui--color_separator_primary_alpha, rgba(255, 255, 255, 0.08))';
        card.appendChild(rowSaveDeleted);

        // РАЗДЕЛ: ШПИОН И АКТИВНОСТЬ
        const spyTitle = document.createElement('div');
        spyTitle.style.cssText = 'font-size: 15px; font-weight: 600; color: var(--vkui--color_text_primary, #eceff4); margin: 16px 0 8px 0; padding-top: 12px; border-top: 1px solid var(--vkui--color_separator_primary_alpha, rgba(255,255,255,0.1));';
        spyTitle.textContent = '🕵️ Шпион и активность';
        card.appendChild(spyTitle);

        // 9. Уведомление об удалении из друзей
        const rowSpyFriends = createSwitchRow(
            'Уведомление об удалении из друзей',
            'Отслеживает список друзей и присылает уведомление при удалении вас из друзей',
            isSpyRemoveFriendEnabled,
            (checked) => {
                isSpyRemoveFriendEnabled = checked;
                setSetting(STORAGE_KEYS.SPY_REMOVE_FRIEND, isSpyRemoveFriendEnabled);
            }
        );
        card.appendChild(rowSpyFriends);

        // 10. Уведомление об онлайне / оффлайне
        const rowSpyOnline = createSwitchRow(
            'Уведомление об онлайне / оффлайне',
            'Показывает статус-уведомление при входе или выходе собеседника из сети',
            isSpyOnlineOfflineEnabled,
            (checked) => {
                isSpyOnlineOfflineEnabled = checked;
                setSetting(STORAGE_KEYS.SPY_ONLINE_OFFLINE, isSpyOnlineOfflineEnabled);
            }
        );
        card.appendChild(rowSpyOnline);

        // 11. Невидимка (Оффлайн-статус)
        const rowSpyInvisible = createSwitchRow(
            'Невидимка (Оффлайн-статус)',
            'Блокирует отправку периодических сигналов онлайна на сервер',
            isSpyInvisibleEnabled,
            (checked) => {
                isSpyInvisibleEnabled = checked;
                setSetting(STORAGE_KEYS.SPY_INVISIBLE_MODE, isSpyInvisibleEnabled);
            }
        );
        rowSpyInvisible.style.borderBottom = 'none';
        card.appendChild(rowSpyInvisible);


        target.appendChild(card);
        cleanupCustomPageErrors();
    }

    function renderDebugScriptPage() {
        const existingPage = document.getElementById(DEBUG_SCRIPT_UI_ID);
        if (existingPage) return;

        const groups = document.querySelectorAll('.vkuiGroup, [class*="Group"], .vkuiPanel__in > div, .vkuiBanner, [class*="Banner"], .vkuiFormStatus--mode-error, [class*="FormStatus--error"], [class*="Snackbar"], .vkuiSnackbar, [class*="FormStatus"], [class*="Placeholder"], [role="alert"], .vkuiAlert');
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].id !== SCRIPT_MENU_UI_ID && groups[i].id !== DEBUG_SCRIPT_UI_ID && groups[i].id !== SETTINGS_UI_ID) {
                groups[i].style.setProperty('display', 'none', 'important');
            }
        }

        // Удаление баннеров ошибок VK
        const errorEls = document.querySelectorAll('.vkuiBanner, [class*="Banner"], .vkuiFormStatus, [class*="FormStatus"], [class*="Placeholder"], [class*="Snackbar"], .vkuiSnackbar, [role="alert"], .vkuiAlert, [class*="Alert"]');
        for (let i = 0; i < errorEls.length; i++) {
            const el = errorEls[i];
            if (!el.closest('#' + SCRIPT_MENU_UI_ID) && !el.closest('#' + DEBUG_SCRIPT_UI_ID)) {
                el.style.setProperty('display', 'none', 'important');
                try { el.remove(); } catch(e) {}
            }
        }

        let target = document.querySelector('.vkuiPanel__in, [class*="Panel__in"], .layout, main') || document.body;

        const card = document.createElement('div');
        card.id = DEBUG_SCRIPT_UI_ID;
        card.className = 'vkuiGroup vkuiGroup--mode-none vkuiGroup--padding-m';
        card.style.cssText = `
            margin: 0 0 90px 0 !important;
            padding: 0 0 20px 0 !important;
            background: transparent !important;
            border: none !important;
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
            display: block !important;
            position: relative !important;
            z-index: 1 !important;
        `;

        const topNav = document.createElement('div');
        topNav.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
            margin-bottom: 12px;
        `;

        const backBtn = document.createElement('button');
        backBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            color: var(--vkui--color_text_accent, #71aaeb);
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            padding: 6px 8px;
            margin: -6px -8px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;
        backBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span>Настройки</span>
        `;
        backBtn.onclick = (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/settings';
            }
            setTimeout(scheduleFixes, 50);
        };

        const pageTitle = document.createElement('div');
        pageTitle.style.cssText = 'font-size: 18px; font-weight: 600; color: var(--vkui--color_text_primary, #ffffff);';
        pageTitle.textContent = 'Debug script';

        topNav.appendChild(backBtn);
        topNav.appendChild(pageTitle);
        card.appendChild(topNav);

        // 1. Ручная настройка размера значков на нижней панели
        const customSection = createCustomIconsSection();
        card.appendChild(customSection);

        // 2. Системная диагностика
        const diagBox = document.createElement('div');
        diagBox.style.cssText = `
            margin: 16px 16px 14px 16px;
            padding: 14px;
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: monospace;
            font-size: 12px;
            color: #ddd;
            line-height: 1.6;
        `;

        const customP = getCustomIconParams();
        const tabInfo = `${currentTabSearch} (scale: ${customP[currentTabSearch] ? customP[currentTabSearch].scale : 100}%, stroke: ${customP[currentTabSearch] ? customP[currentTabSearch].stroke : 1.5}px)`;

        diagBox.innerHTML = `
            <div style="color: #71aaeb; font-weight: bold; margin-bottom: 8px;">🐞 СИСТЕМНАЯ ДИАГНОСТИКА:</div>
            <div>• <b>Script Version:</b> v2.29.3</div>
            <div>• <b>Theme Mode:</b> ${currentThemeMode} (color swap: ${isColorSwapEnabled})</div>
            <div>• <b>Custom Tab Slot:</b> ${tabInfo}</div>
            <div>• <b>Stealth Features:</b> Ghost typing: ${isGhostTypingEnabled}, Ghost read: ${isGhostReadEnabled}, Save deleted: ${isSaveDeletedMsgsEnabled}</div>
            <div>• <b>Hide Labels:</b> ${isHideLabelsEnabled}</div>
            <div>• <b>Hide Folders:</b> ${isHideFoldersEnabled}</div>
            <div>• <b>Hide Calls / Circles:</b> ${isHideCallsEnabled} / ${isHideVideoMsgsEnabled}</div>
            <div>• <b>Location:</b> ${window.location.pathname}${window.location.search}</div>
            <div>• <b>Screen:</b> ${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})</div>
        `;
        card.appendChild(diagBox);

        const btnBox = document.createElement('div');
        btnBox.style.cssText = 'margin: 0 16px; display: flex; gap: 8px; flex-direction: column;';

        const copyLogBtn = document.createElement('button');
        copyLogBtn.textContent = '📋 Скопировать Debug Log';
        copyLogBtn.style.cssText = `
            padding: 10px 14px;
            border-radius: 8px;
            border: none;
            background: var(--vkui--color_background_accent, #2787F5);
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            touch-action: manipulation;
        `;
        copyLogBtn.onclick = (e) => {
            e.preventDefault();
            const logText = diagBox.textContent.replace(/\s+/g, ' ').trim();
            try {
                navigator.clipboard.writeText(logText).then(() => {
                    const orig = copyLogBtn.textContent;
                    copyLogBtn.textContent = '✓ Скопировано в буфер!';
                    setTimeout(() => { copyLogBtn.textContent = orig; }, 2000);
                });
            } catch (err) {
                copyLogBtn.textContent = '✓ Готово!';
                setTimeout(() => { copyLogBtn.textContent = '📋 Скопировать Debug Log'; }, 2000);
            }
        };

        const clearCacheBtn = document.createElement('button');
        clearCacheBtn.textContent = '🗑️ Сбросить сохраненный кэш';
        clearCacheBtn.style.cssText = `
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.15);
            background: transparent;
            color: var(--vkui--color_text_primary, #ffffff);
            font-size: 14px;
            cursor: pointer;
            touch-action: manipulation;
        `;
        clearCacheBtn.onclick = (e) => {
            e.preventDefault();
            try {
                localStorage.removeItem('vmu_cached_unread_count');
                alert('Кэш счетчиков очищен!');
            } catch(e) {}
        };

        btnBox.appendChild(copyLogBtn);
        btnBox.appendChild(clearCacheBtn);
        card.appendChild(btnBox);

        target.appendChild(card);
        cleanupCustomPageErrors();
    }

    function renderMailAppearancePage() {
        if (!isMailAppearancePage()) return;

        // Фиксируем кнопку «Назад» в шапке нативной страницы
        const backBtns = document.querySelectorAll(
            '.vkuiPanelHeaderBack, [class*=PanelHeaderBack], [aria-label*=Назад i], [aria-label*=назад i], [data-testid=header-back], .vkuiPanelHeader__before a, .vkuiPanelHeader__before button, .vkuiPanelHeader__before [role=button]'
        );
        for (let b = 0; b < backBtns.length; b++) {
            const btn = backBtns[b];
            if (!btn.dataset.vmuFixedBack) {
                btn.dataset.vmuFixedBack = 'true';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = '/settings?act=appearance';
                };
            }
        }
    }

    function cleanupLegacyCustomTheme() {
        const bgLayer = document.getElementById('vmu-chat-custom-wallpaper');
        if (bgLayer) bgLayer.remove();
        const bgStyle = document.getElementById('vmu-custom-chat-bg-style');
        if (bgStyle) bgStyle.remove();
        const panelWallpapers = document.querySelectorAll('#vmu-chat-panel-wallpaper, #vmu-custom-theme-editor-overlay');
        for (let i = 0; i < panelWallpapers.length; i++) {
            panelWallpapers[i].remove();
        }
        if (document.body) {
            document.body.classList.remove('vmu-theme-custom-active', 'vmu-has-custom-chat-bg', 'vmu-in-chat');
        }
    }

    function hideMailSettingsAppearanceItem() {
        const path = window.location.pathname.toLowerCase();
        if (!path.startsWith('/mail/settings') && !path.startsWith('/im/settings')) return;
        if (path.includes('/mail/settings/theme')) return;

        const cells = document.querySelectorAll('a[href*="/mail/settings/theme"], a[href*="settings/theme"], a[href*="act=theme"], .vkuiSimpleCell, [class*="SimpleCell"], .vkuiCell, [class*="Cell"], [role="link"]');
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (c.href && (c.href.includes('/mail/settings/theme') || c.href.includes('settings/theme') || c.href.includes('act=theme'))) {
                const row = c.closest('.vkuiSimpleCell, [class*="SimpleCell"], .vkuiCell, [class*="Cell"]') || c;
                row.style.setProperty('display', 'none', 'important');
                row.style.setProperty('visibility', 'hidden', 'important');
                row.style.setProperty('height', '0', 'important');
                row.style.setProperty('pointer-events', 'none', 'important');
            } else if (c.textContent && c.textContent.trim().startsWith('Внешний вид') && !c.classList.contains('vmu-custom-settings-item')) {
                const row = c.closest('.vkuiSimpleCell, [class*="SimpleCell"], .vkuiCell, [class*="Cell"]') || c;
                row.style.setProperty('display', 'none', 'important');
                row.style.setProperty('visibility', 'hidden', 'important');
                row.style.setProperty('height', '0', 'important');
                row.style.setProperty('pointer-events', 'none', 'important');
            }
        }
    }

    function cleanupCustomPageErrors() {
        if (!isScriptMenuPage() && !isDebugScriptPage()) return;

        // 1. Прячем все соседние блоки VK внутри контейнера страницы
        const containers = document.querySelectorAll('.vkuiPanel__in, [class*="Panel__in"], .layout, main, .vkuiSplitCol, [class*="SplitCol"]');
        for (let c = 0; c < containers.length; c++) {
            const children = containers[c].children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.id !== SCRIPT_MENU_UI_ID && child.id !== DEBUG_SCRIPT_UI_ID && child.id !== SETTINGS_UI_ID) {
                    if (!child.contains(document.getElementById(SCRIPT_MENU_UI_ID)) && !child.contains(document.getElementById(DEBUG_SCRIPT_UI_ID))) {
                        child.style.setProperty('display', 'none', 'important');
                        child.style.setProperty('visibility', 'hidden', 'important');
                        child.style.setProperty('height', '0', 'important');
                        child.style.setProperty('pointer-events', 'none', 'important');
                    }
                }
            }
        }

        // 2. Ищем и скрываем любые блоки с текстом "Неизвестная ошибка" или "Ошибка"
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        const nodesToHide = [];
        while ((node = walker.nextNode())) {
            if (node.nodeValue && (node.nodeValue.includes('Неизвестная ошибка') || node.nodeValue.includes('неизвестная ошибка') || node.nodeValue.includes('Unknown error'))) {
                nodesToHide.push(node.parentElement);
            }
        }
        for (let i = 0; i < nodesToHide.length; i++) {
            const parent = nodesToHide[i];
            if (parent && !parent.closest('#' + SCRIPT_MENU_UI_ID) && !parent.closest('#' + DEBUG_SCRIPT_UI_ID)) {
                const topBlock = parent.closest('.vkuiSnackbar, [class*="Snackbar"], .vkuiBanner, [class*="Banner"], .vkuiPlaceholder, [class*="Placeholder"], .vkuiFormStatus, [class*="FormStatus"], [role="alert"], .vkuiAlert, [class*="Alert"], .vkuiGroup, [class*="Group"], .vkuiSimpleCell, [class*="SimpleCell"], .vkuiPopoutWrapper, [class*="PopoutWrapper"], .vkuiModalCard, [class*="ModalCard"]') || parent;
                topBlock.style.setProperty('display', 'none', 'important');
                topBlock.style.setProperty('visibility', 'hidden', 'important');
                topBlock.style.setProperty('height', '0', 'important');
                topBlock.style.setProperty('opacity', '0', 'important');
                topBlock.style.setProperty('pointer-events', 'none', 'important');
                try { topBlock.remove(); } catch(e) {}
            }
        }

        // 3. Скрываем баннеры, снэкбары и плейсхолдеры
        const errorCandidates = document.querySelectorAll(
            '.vkuiBanner, [class*="Banner"], .vkuiFormStatus, [class*="FormStatus"], [class*="Placeholder"], [class*="Snackbar"], .vkuiSnackbar, [role="alert"], .vkuiAlert, [class*="Alert"], .vkuiPopoutWrapper, [class*="PopoutWrapper"], .vkuiModalCard, [class*="ModalCard"]'
        );
        for (let i = 0; i < errorCandidates.length; i++) {
            const el = errorCandidates[i];
            if (!el.closest('#' + SCRIPT_MENU_UI_ID) && !el.closest('#' + DEBUG_SCRIPT_UI_ID)) {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.style.setProperty('height', '0', 'important');
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
                try { el.remove(); } catch(e) {}
            }
        }
    }

    function updateSettingsVisibility() {
        const isAppearance = isAppearancePage();
        const isScriptMenu = isScriptMenuPage();
        const isDebugScript = isDebugScriptPage();
        const isMailApp = isMailAppearancePage();

        const existingCard = document.getElementById(SETTINGS_UI_ID);
        const existingMenuCard = document.getElementById(SCRIPT_MENU_UI_ID);
        const existingDebugCard = document.getElementById(DEBUG_SCRIPT_UI_ID);
        const existingMailCard = document.getElementById(MAIL_APPEARANCE_UI_ID);

        if (!isAppearance && existingCard) {
            existingCard.remove();
        }
        if (!isScriptMenu && existingMenuCard) {
            existingMenuCard.remove();
        }
        if (!isDebugScript && existingDebugCard) {
            existingDebugCard.remove();
        }
        if (!isMailApp && existingMailCard) {
            existingMailCard.remove();
        }

        // Внедряем пункты меню на главной странице настроек
        try { injectCustomSettingsMenuItems(); } catch (e) {}

        if (isScriptMenu) {
            renderScriptMenuPage();
            return;
        }

        if (isDebugScript) {
            renderDebugScriptPage();
            return;
        }

        if (isMailApp) {
            renderMailAppearancePage();
            return;
        }

        if (!isAppearance) {
            return;
        }

        // Прячем стандартный блок выбора темы
        const radio = document.querySelector('input[type="radio"], .vkuiRadio, [class*="Radio"], input[name="theme"], input[name="scheme"], [class*="Appearance"]');
        let nativeGroup = null;

        if (radio) {
            nativeGroup = radio.closest('.vkuiGroup, [class*="Group"]') || radio.parentElement;
        }

        if (!nativeGroup) {
            const groups = document.querySelectorAll('.vkuiGroup, [class*="Group"]');
            for (let i = 0; i < groups.length; i++) {
                if (groups[i].id !== SETTINGS_UI_ID && (groups[i].textContent.includes('Светлая') || groups[i].textContent.includes('Тёмная') || groups[i].textContent.includes('системную'))) {
                    nativeGroup = groups[i];
                    break;
                }
            }
        }

        if (nativeGroup && nativeGroup.id !== SETTINGS_UI_ID) {
            nativeGroup.style.setProperty('display', 'none', 'important');
            nativeGroup.style.setProperty('visibility', 'hidden', 'important');
            nativeGroup.style.setProperty('height', '0', 'important');
            nativeGroup.style.setProperty('margin', '0', 'important');
            nativeGroup.style.setProperty('padding', '0', 'important');
            nativeGroup.style.setProperty('pointer-events', 'none', 'important');
        }

        if (existingCard) {
            if (nativeGroup && nativeGroup.parentElement && existingCard.nextElementSibling !== nativeGroup && existingCard.previousElementSibling !== nativeGroup) {
                nativeGroup.insertAdjacentElement('beforebegin', existingCard);
            }
            return;
        }

        let target = nativeGroup;
        if (!target) {
            const groups = document.querySelectorAll('.vkuiGroup, [class*="Group"]');
            if (groups.length > 0) {
                target = groups[groups.length - 1];
            }
        }
        if (!target) {
            target = document.querySelector('.vkuiPanel__in, [class*="Panel__in"], .layout, main') || document.body;
        }

        const card = document.createElement('div');
        card.id = SETTINGS_UI_ID;
        card.className = 'vkuiGroup vkuiGroup--mode-none vkuiGroup--padding-m';
        card.style.cssText = `
            margin: 58px 0 90px 0 !important;
            padding: 0 0 20px 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
            display: block !important;
            position: relative !important;
            z-index: 1 !important;
        `;

        // 1. Выбор темы (Светлая / Тёмная / Snow Black)
        const rowTheme = createSelectRow(
            'Тема',
            'Оформление интерфейса',
            currentThemeMode,
            THEME_OPTIONS,
            (mode) => {
                setThemeMode(mode);
            }
        );
        card.appendChild(rowTheme);

        // 2. Мессенджер (переход в оформление всех чатов)
        const rowMessenger = createNavRow(
            'Мессенджер',
            'Оформление всех чатов',
            () => {
                try {
                    const a = document.createElement('a');
                    a.href = '/mail/settings/theme';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } catch (err) {
                    window.location.href = '/mail/settings/theme';
                }
                scheduleFixes();
            }
        );
        card.appendChild(rowMessenger);

        // 3. Скрыть подписи на нижней панели
        const rowLabels = createSwitchRow(
            'Скрыть подписи на нижней панели',
            'Оставлять только иконки (Главная, Поиск, Мессенджер, Клипы, Ещё)',
            isHideLabelsEnabled,
            (checked) => {
                isHideLabelsEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_TAB_LABELS, isHideLabelsEnabled);
                applyStyles();
        updatePwaManifestAndIcons();
            }
        );
        card.appendChild(rowLabels);

        if (nativeGroup && nativeGroup.parentElement) {
            nativeGroup.insertAdjacentElement('beforebegin', card);
        } else if (target && target.parentElement && target !== document.body) {
            target.insertAdjacentElement('afterend', card);
        } else if (target) {
            target.appendChild(card);
        }
    }

    // ==========================================
    //    БЛОКИРОВКА КОНТЕКСТНОГО МЕНЮ В СПИСКЕ ЧАТОВ
    // ==========================================
    function isMoreTrigger(target) {
        if (!target || !target.closest) return null;
        if (!document.body.classList.contains('vmu-page-mail') || !isMainMailListPage()) {
            return null;
        }

        const convoItem = target.closest('[class*="ConvoItem"], [class*="ConvoList"], [class*="im-dialog"]');
        if (!convoItem) {
            return null;
        }

        if (target.closest('.vkuiPanelHeader, [class*="PanelHeader"], .vkmListHeader, [class*="vkmListHeader"], #vmu-top-unread-btn, #vk-mobile-upgrade-settings-card, [class*="im-page--chat"], [class*="WriteBar"], [class*="im-chat-input"], [class*="im-mess"]')) {
            return null;
        }

        return target.closest(
            '[class*="Icon--more_vertical"], [class*="Icon--more_horizontal"], [class*="Icon--more"], [class*="more_vertical"], [class*="more_horizontal"], [class*="ConvoItem__actions"], [class*="im-dialog--actions"], [class*="ConvoItem__more"], [aria-label*="действи" i], [aria-label*="меню" i], [aria-label*="еще" i], [aria-label*="ещё" i]'
        );
    }

    function interceptChatMoreActions(e) {
        const moreBtn = isMoreTrigger(e.target);
        if (moreBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const cell = moreBtn.closest('[class*="SimpleCell"], [class*="Cell"], [class*="ConvoItem"], [class*="im-dialog"], [role="link"], a');
            if (cell && cell !== moreBtn) {
                cell.click();
            }
        }
    }

    function interceptActionButtons(e) {
        // Блокировка звонков при включенной опции
        if (isHideCallsEnabled) {
            const callTarget = e.target && e.target.closest && e.target.closest(
                'a[href*="/call"], a[href*="act=call"], a[href*="call?"], a[href*="calls?"], a[href*="/calls/"], [aria-label*="звон" i], [aria-label*="вызов" i], [aria-label*="позвон" i], [aria-label*="звонок" i], [aria-label*="видеозвонок" i], [aria-label*="аудиозвонок" i], [aria-label*="call" i], [data-testid*="call" i], [data-testid*="phone" i], [data-testid*="videocall" i], [class*="ChatHeader__call"], [class*="Icon--phone"], [class*="Icon--videocam"], [class*="Icon--call"], [class*="phone_outline"], [class*="videocam_outline"]'
            );
            if (callTarget && callTarget.id !== 'vmu-top-unread-btn' && !callTarget.closest('#vmu-top-unread-btn') && !callTarget.closest('#vk-mobile-upgrade-settings-card')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return;
            }
        }

        // Блокировка кружков (видеосообщений) при включенной опции
        if (isHideVideoMsgsEnabled) {
            const videoTarget = e.target && e.target.closest && e.target.closest(
                '[aria-label*="видеосообщен" i], [aria-label*="круж" i], [aria-label*="video message" i], [data-testid*="video-message" i], [data-testid*="video_message" i], [data-testid*="videomsg" i], [data-testid*="round_video" i], [data-testid*="round-video" i], [class*="Icon--video_message"], [class*="Icon--video_circle"], [class*="Icon--camera_circle"], [class*="video_message"], [class*="video_circle"], [class*="camera_circle"], [class*="VideoMessage"]'
            );
            if (videoTarget && !videoTarget.closest('#vk-mobile-upgrade-settings-card')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return;
            }
        }
    }

    function blockMorePointer(e) {
        const moreBtn = isMoreTrigger(e.target);
        if (moreBtn) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }

    function hideChatListActions() {
        if (!document.body.classList.contains('vmu-page-mail') || !isMainMailListPage()) return;

        const convoList = document.querySelector('[class*="ConvoList"], [class*="convo-list"]');
        if (!convoList) return;

        const moreIcons = convoList.querySelectorAll(
            '[class*="more_vertical"], [class*="more_horizontal"], [class*="Icon--more"], [aria-label*="действи" i], [aria-label*="меню" i], [aria-label*="еще" i], [aria-label*="ещё" i], [class*="ConvoItem__actions"], [class*="im-dialog--actions"], [class*="ConvoItem__more"]'
        );
        for (let i = 0; i < moreIcons.length; i++) {
            const el = moreIcons[i];
            if (el.closest('.vkuiPanelHeader, [class*="PanelHeader"], .vkmListHeader, [class*="vkmListHeader"], #vmu-top-unread-btn, #vk-mobile-upgrade-settings-card, [class*="im-page--chat"], [class*="WriteBar"], [class*="im-chat-input"], [class*="im-mess"]')) {
                continue;
            }
            const btn = el.closest('button, [role="button"], [class*="IconButton"], [class*="ConvoItem__actions"], [class*="ConvoItem__more"], [class*="im-dialog--actions"]') || el;
            btn.style.setProperty('display', 'none', 'important');
            btn.style.setProperty('visibility', 'hidden', 'important');
            btn.style.setProperty('width', '0', 'important');
            btn.style.setProperty('height', '0', 'important');
            btn.style.setProperty('min-width', '0', 'important');
            btn.style.setProperty('max-width', '0', 'important');
            btn.style.setProperty('margin', '0', 'important');
            btn.style.setProperty('padding', '0', 'important');
            btn.style.setProperty('pointer-events', 'none', 'important');
            btn.style.setProperty('opacity', '0', 'important');
            btn.style.setProperty('overflow', 'hidden', 'important');
        }
    }

    function hideCallsAndVideoMessages() {
        // 1. Скрытие кнопки звонка в шапке диалогов
        if (isHideCallsEnabled) {
            const callTargets = document.querySelectorAll(
                'a[href*="/call"], a[href*="act=call"], a[href*="call?"], a[href*="calls?"], a[href*="/calls/"], [aria-label*="звон" i], [aria-label*="Звон" i], [aria-label*="вызов" i], [aria-label*="Вызов" i], [aria-label*="позвон" i], [aria-label*="Позвон" i], [aria-label*="звонок" i], [aria-label*="видеозвонок" i], [aria-label*="аудиозвонок" i], [aria-label*="call" i], [aria-label*="Call" i], [data-testid*="call" i], [data-testid*="phone" i], [data-testid*="videocall" i], [class*="phone_outline"], [class*="videocam_outline"], [class*="Icon--phone"], [class*="Icon--videocam"], [class*="Icon--call"], [class*="ChatHeader__call"], [class*="im-header-call"], [class*="vkmChatHeader__call"]'
            );
            for (let j = 0; j < callTargets.length; j++) {
                const el = callTargets[j];
                if (el.id === 'vmu-top-unread-btn' || el.closest('#vmu-top-unread-btn') || el.closest('#vk-mobile-upgrade-settings-card')) continue;
                const btn = el.closest('a, button, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]') || el;
                if (btn && btn.id !== 'vmu-top-unread-btn' && !btn.closest('#vk-mobile-upgrade-settings-card')) {
                    btn.style.setProperty('display', 'none', 'important');
                    btn.style.setProperty('visibility', 'hidden', 'important');
                    btn.style.setProperty('width', '0', 'important');
                    btn.style.setProperty('height', '0', 'important');
                    btn.style.setProperty('min-width', '0', 'important');
                    btn.style.setProperty('max-width', '0', 'important');
                    btn.style.setProperty('padding', '0', 'important');
                    btn.style.setProperty('margin', '0', 'important');
                    btn.style.setProperty('pointer-events', 'none', 'important');
                    btn.style.setProperty('opacity', '0', 'important');
                }
            }

            // Поиск по SVG use tags в заголовках
            const uses = document.querySelectorAll('header use, [class*="Header"] use, [class*="Panel"] use, .vkuiPanelHeader use, [class*="vkmChatHeader"] use, [class*="ChatHeader"] use');
            for (let k = 0; k < uses.length; k++) {
                const use = uses[k];
                const href = (use.getAttribute('href') || use.getAttribute('xlink:href') || '').toLowerCase();
                if (href.includes('phone') || href.includes('videocam') || href.includes('call') || href.includes('video_camera')) {
                    const btn = use.closest('a, button, [role="button"], [class*="PanelHeaderButton"], [class*="HeaderButton"], [class*="IconButton"], [class*="Tappable"], [class*="action"]') || use.closest('svg');
                    if (btn && btn.id !== 'vmu-top-unread-btn' && !btn.closest('#vk-mobile-upgrade-settings-card')) {
                        btn.style.setProperty('display', 'none', 'important');
                        btn.style.setProperty('visibility', 'hidden', 'important');
                        btn.style.setProperty('width', '0', 'important');
                        btn.style.setProperty('height', '0', 'important');
                        btn.style.setProperty('min-width', '0', 'important');
                        btn.style.setProperty('max-width', '0', 'important');
                        btn.style.setProperty('padding', '0', 'important');
                        btn.style.setProperty('margin', '0', 'important');
                        btn.style.setProperty('pointer-events', 'none', 'important');
                        btn.style.setProperty('opacity', '0', 'important');
                    }
                }
            }
        }

        // 2. Скрытие кнопки записи кружков (видеосообщений) в строке ввода
        if (isHideVideoMsgsEnabled) {
            const videoTargets = document.querySelectorAll(
                '[aria-label*="видеосообщен" i], [aria-label*="Видеосообщен" i], [aria-label*="кружок" i], [aria-label*="Кружок" i], [aria-label*="кружоч" i], [aria-label*="Кружоч" i], [aria-label*="video message" i], [aria-label*="Video message" i], [aria-label*="video_message" i], [data-testid*="video-message" i], [data-testid*="video_message" i], [data-testid*="videomsg" i], [data-testid*="video-msg" i], [data-testid*="round_video" i], [data-testid*="round-video" i], [data-testid*="roundVideo" i], [class*="video_message"], [class*="VideoMessage"], [class*="video-message"], [class*="video_circle"], [class*="camera_circle"], [class*="WriteBar__action--video"], [class*="writeBar__action--video"], [class*="WriteBar__video"], [class*="writeBar__video"], [class*="VideoMessage__record"], [class*="Icon--video_message"], [class*="Icon--video_circle"], [class*="Icon--camera_circle"], [class*="video_message_outline"], [class*="video_circle_outline"], [class*="camera_circle_outline"]'
            );
            for (let j = 0; j < videoTargets.length; j++) {
                const el = videoTargets[j];
                if (el.closest('#vk-mobile-upgrade-settings-card')) continue;
                const btn = el.closest('button, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]') || el;
                if (btn && !btn.closest('#vk-mobile-upgrade-settings-card')) {
                    btn.style.setProperty('display', 'none', 'important');
                    btn.style.setProperty('visibility', 'hidden', 'important');
                    btn.style.setProperty('width', '0', 'important');
                    btn.style.setProperty('height', '0', 'important');
                    btn.style.setProperty('min-width', '0', 'important');
                    btn.style.setProperty('max-width', '0', 'important');
                    btn.style.setProperty('padding', '0', 'important');
                    btn.style.setProperty('margin', '0', 'important');
                    btn.style.setProperty('pointer-events', 'none', 'important');
                    btn.style.setProperty('opacity', '0', 'important');
                }
            }

            // Поиск по SVG use tags в строке ввода
            const uses = document.querySelectorAll('[class*="WriteBar"] use, [class*="writeBar"] use, [class*="writebox"] use, [class*="chat-input"] use, [class*="im-chat-input"] use, .vkuiWriteBar use, .im-write-form use');
            for (let k = 0; k < uses.length; k++) {
                const use = uses[k];
                const href = (use.getAttribute('href') || use.getAttribute('xlink:href') || '').toLowerCase();
                if (href.includes('video_message') || href.includes('video_circle') || href.includes('camera_circle') || href.includes('round_video') || (href.includes('videocam') && !href.includes('attach'))) {
                    const btn = use.closest('button, [role="button"], [class*="WriteBar__action"], [class*="IconButton"], [class*="Tappable"], [class*="action"]') || use.closest('svg');
                    if (btn && !btn.closest('#vk-mobile-upgrade-settings-card')) {
                        btn.style.setProperty('display', 'none', 'important');
                        btn.style.setProperty('visibility', 'hidden', 'important');
                        btn.style.setProperty('width', '0', 'important');
                        btn.style.setProperty('height', '0', 'important');
                        btn.style.setProperty('min-width', '0', 'important');
                        btn.style.setProperty('max-width', '0', 'important');
                        btn.style.setProperty('padding', '0', 'important');
                        btn.style.setProperty('margin', '0', 'important');
                        btn.style.setProperty('pointer-events', 'none', 'important');
                        btn.style.setProperty('opacity', '0', 'important');
                    }
                }
            }
        }
    }

    // ==========================================
    //       КАСТОМИЗАЦИЯ ВКЛАДКИ ПОИСК
    // ==========================================
    function getAllBottomNavItems() {
        // 1. Ищем внутри контейнеров навигации
        const containers = document.querySelectorAll(
            '.vkuiTabbar, [class*="Tabbar"], #bottom_nav, .bottom_nav, .vkuiFixedLayout--bottom, [class*="FixedLayout--bottom"], .layout__bottom, nav'
        );
        for (let i = 0; i < containers.length; i++) {
            const c = containers[i];
            if (c.closest('.ConvoList, [class*="ConvoList"], .vkuiPanelHeader, [class*="PanelHeader"], header, [class*="Subnavigation"], [class*="Tabs"], [class*="HorizontalScroll"], [class*="WriteBar"], [class*="writeBar"], .vkuiSearch, [class*="Search"]')) {
                continue;
            }
            let items = Array.from(c.querySelectorAll('.vkuiTabbarItem, [class*="TabbarItem"], .bottom_nav__item, [role="tab"]'));
            items = items.filter(el => {
                const p = el.parentElement;
                return !p || !p.closest('.vkuiTabbarItem, [class*="TabbarItem"], .bottom_nav__item, [role="tab"]');
            });
            if (items.length >= 3) {
                return items;
            }
        }

        // 2. Прямой поиск всех элементов табов на странице
        const allCandidateItems = Array.from(document.querySelectorAll(
            '.vkuiTabbarItem, [class*="TabbarItem"], .bottom_nav__item, [class*="TabBarItem"]'
        ));
        const filteredItems = allCandidateItems.filter(el => {
            if (el.closest('.ConvoList, [class*="ConvoList"], .vkuiPanelHeader, [class*="PanelHeader"], header, [class*="Subnavigation"], [class*="Tabs"], [class*="HorizontalScroll"], [class*="WriteBar"], .vkuiSearch')) {
                return false;
            }
            const p = el.parentElement;
            return !p || !p.closest('.vkuiTabbarItem, [class*="TabbarItem"], .bottom_nav__item, [class*="TabBarItem"]');
        });

        if (filteredItems.length >= 3) {
            return filteredItems;
        }

        return [];
    }

    function getBottomSearchTab() {
        const items = getAllBottomNavItems();
        if (items.length >= 2) {
            // Вторая кнопка снизу (индекс 1) — это ВСЕГДА кнопка Поиска!
            return items[1];
        }
        return null;
    }

    function applySearchTabCustomization(item) {
        if (!item) return;

        const targetKey = currentTabSearch;
        const def = TAB_DEFINITIONS[targetKey] || TAB_DEFINITIONS.search;
        if (!def) return;

        item.dataset.vmuSlot = 'search';

        // 1. Ссылка перехода
        if (item.tagName === 'A') {
            item.href = def.href;
            item.setAttribute('href', def.href);
            item.dataset.vmuHref = def.href;
        }
        const innerLinks = item.querySelectorAll('a');
        for (let l = 0; l < innerLinks.length; l++) {
            innerLinks[l].href = def.href;
            innerLinks[l].setAttribute('href', def.href);
            innerLinks[l].dataset.vmuHref = def.href;
        }

        // 2. aria-label и title
        item.setAttribute('aria-label', def.label);
        item.setAttribute('title', def.label);
        for (let l = 0; l < innerLinks.length; l++) {
            innerLinks[l].setAttribute('aria-label', def.label);
            innerLinks[l].setAttribute('title', def.label);
        }

        // 3. Текстовая подпись - обновление только текстового узла без удаления внутренних span/шрифтовых стилей
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const p = node.parentElement;
                if (!p) return NodeFilter.FILTER_REJECT;
                if (p.closest('.vkuiTabbarItem__icon, [class*="TabbarItem__icon"], [class*="Counter"], [class*="Badge"], [class*="Indicator"], [class*="badge"], [class*="counter"]')) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.nodeValue && node.nodeValue.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        });

        let foundTextNode = false;
        let textNode;
        while ((textNode = walker.nextNode())) {
            if (textNode.nodeValue !== def.label) {
                textNode.nodeValue = def.label;
            }
            foundTextNode = true;
        }

        if (!foundTextNode) {
            let textEl = item.querySelector(
                '.vkuiTabbarItem__text, .vkuiTabbarItem__children, [class*="TabbarItem__text"], [class*="TabBarItem__text"], [class*="TabbarItem__children"], [class*="TabBarItem__children"], .bottom_nav__text, .bottom_nav__label'
            );
            if (textEl) {
                let deepChild = textEl;
                while (deepChild.firstElementChild) {
                    deepChild = deepChild.firstElementChild;
                }
                if (deepChild.textContent !== def.label) {
                    deepChild.textContent = def.label;
                }
            }
        }

        // 4. Иконка SVG
        const iconContainer = item.querySelector('.vkuiTabbarItem__icon, [class*="TabbarItem__icon"], [class*="TabBarItem__icon"]') || item;
        const existingSvg = iconContainer.querySelector('svg');
        const isIndividual = getSetting(STORAGE_KEYS.ICON_INDIVIDUAL_MODE, false);
        const customParams = getCustomIconParams();
        const p = isIndividual ? (customParams[targetKey] || DEFAULT_CUSTOM_PARAMS[targetKey] || { scale: 100, stroke: 1.5 }) : (customParams.global || { scale: 100, stroke: 1.5 });
        const svgSig = `${targetKey}_${isIndividual ? 'ind' : 'glob'}_${p.scale || 100}_${p.stroke || 1.5}`;

        if (!existingSvg || existingSvg.dataset.vmuSvgSig !== svgSig) {
            const temp = document.createElement('div');
            temp.innerHTML = getTabSvg(targetKey).trim();
            const newSvg = temp.firstElementChild;
            newSvg.dataset.vmuSvg = targetKey;
            newSvg.dataset.vmuSvgSig = svgSig;
            newSvg.style.cssText = 'display: block !important; margin: 0 auto !important;';

            if (existingSvg) {
                const origClass = existingSvg.getAttribute('class');
                if (origClass) {
                    newSvg.setAttribute('class', origClass);
                }
                existingSvg.replaceWith(newSvg);
            } else {
                iconContainer.prepend(newSvg);
            }
        }

        // Удаление лишних наслоившихся SVG
        const allSvgs = iconContainer.querySelectorAll('svg');
        if (allSvgs.length > 1) {
            for (let s = 1; s < allSvgs.length; s++) {
                allSvgs[s].remove();
            }
        }

    }

    function syncMessengerCounter(items) {
        if (!items || items.length < 3) return;
        const messengerItem = items[2];
        if (!messengerItem) return;

        const existingCounter = messengerItem.querySelector('.vkuiCounter, .vkuiBadge, [class*="Counter"], [class*="Badge"], [class*="Indicator"], .vkuiTabbarItem__indicator, .vkuiTabbarItem__badge');
        const restoredBadge = messengerItem.querySelector('.vmu-restored-badge');
        const isNativeCounter = existingCounter && !existingCounter.classList.contains('vmu-restored-badge');

        if (isNativeCounter && existingCounter.textContent.trim().length > 0) {
            const countText = existingCounter.textContent.trim();
            const num = parseInt(countText, 10);
            if (!isNaN(num) && num > 0) {
                try { localStorage.setItem('vmu_cached_unread_count', String(num)); } catch(e) {}
            } else if (num === 0 || countText === '') {
                try { localStorage.removeItem('vmu_cached_unread_count'); } catch(e) {}
            }
            if (restoredBadge) {
                restoredBadge.remove();
            }
        } else {
            const currentPath = window.location.pathname.toLowerCase();
            const isMailPage = currentPath.startsWith('/mail') || currentPath.startsWith('/im') || currentPath.startsWith('/messages');

            if (isMailPage && (!isNativeCounter || existingCounter.textContent.trim() === '')) {
                try { localStorage.removeItem('vmu_cached_unread_count'); } catch(e) {}
                if (restoredBadge) restoredBadge.remove();
            } else {
                let cachedCount = null;
                try { cachedCount = localStorage.getItem('vmu_cached_unread_count'); } catch(e) {}
                if (cachedCount && parseInt(cachedCount, 10) > 0) {
                    const iconContainer = messengerItem.querySelector('.vkuiTabbarItem__icon, [class*="TabbarItem__icon"], [class*="TabBarItem__icon"]') || messengerItem;
                    let badge = restoredBadge;
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'vkuiCounter vkuiCounter--mode-prominent vkuiCounter--size-s vmu-restored-badge';
                        badge.style.cssText = `
                            position: absolute !important;
                            top: -2px !important;
                            right: -4px !important;
                            min-width: 18px !important;
                            height: 18px !important;
                            line-height: 18px !important;
                            border-radius: 9px !important;
                            padding: 0 4px !important;
                            background-color: #FF5C5C !important;
                            color: #ffffff !important;
                            font-size: 11px !important;
                            font-weight: 700 !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            text-align: center !important;
                            z-index: 10 !important;
                            box-shadow: 0 0 0 2px var(--vkui--color_background_content, #19191a) !important;
                        `;
                        iconContainer.style.setProperty('position', 'relative', 'important');
                        iconContainer.appendChild(badge);
                    }
                    if (badge.textContent !== cachedCount) {
                        badge.textContent = cachedCount;
                    }
                } else {
                    if (restoredBadge) restoredBadge.remove();
                }
            }
        }
    }

    function updateCustomTabs() {
        // Очистка ошибочных SVG на верхней панели и в контенте
        const nonBottomSvgs = document.querySelectorAll('header [data-vmu-svg], .vkuiPanelHeader [data-vmu-svg], [class*="PanelHeader"] [data-vmu-svg], .vkuiTabs [data-vmu-svg], [class*="Tabs"] [data-vmu-svg]');
        const items = getAllBottomNavItems();
        for (let i = 0; i < nonBottomSvgs.length; i++) {
            const s = nonBottomSvgs[i];
            const isInsideBottom = items.some(it => it.contains(s));
            if (!isInsideBottom) {
                s.removeAttribute('data-vmu-svg');
            }
        }

        if (items.length < 2) return;

        // Синхронизация и сохранение счетчика сообщений Мессенджера
        syncMessengerCounter(items);

        const searchItem = items[1];
        searchItem.dataset.vmuSlot = 'search';
        applySearchTabCustomization(searchItem);
        applyBottomTabIconParams(items);

        // Управление активным состоянием табов при кастомизации
        if (currentTabSearch !== 'search') {
            const def = TAB_DEFINITIONS[currentTabSearch];
            if (def) {
                const currentPath = window.location.pathname.toLowerCase();
                const currentSearch = window.location.search.toLowerCase();
                const fullUrl = currentPath + currentSearch;
                const isCustomTabActive = def.matchPaths.some(p => fullUrl.startsWith(p) || fullUrl.includes(p));

                const menuItem = items[items.length - 1];

                if (isCustomTabActive) {
                    // 1. Подсвечиваем замененную кнопку (items[1]) как активную
                    searchItem.classList.add('vkuiTabbarItem--selected', 'vmu-tab-selected');
                    searchItem.classList.remove('vmu-tab-unselected');
                    searchItem.setAttribute('aria-selected', 'true');

                    // 2. Снимаем подсветку со ВСЕХ остальных вкладок на панели (Главная, Мессенджер, Клипы, Ещё)
                    for (let i = 0; i < items.length; i++) {
                        if (i !== 1) {
                            items[i].classList.remove('vkuiTabbarItem--selected', 'vmu-tab-selected', 'bottom_nav__item--active');
                            items[i].classList.add('vmu-tab-unselected');
                            items[i].setAttribute('aria-selected', 'false');
                        }
                    }
                } else {
                    searchItem.classList.remove('vmu-tab-selected', 'vkuiTabbarItem--selected');
                    searchItem.setAttribute('aria-selected', 'false');
                    for (let i = 0; i < items.length; i++) {
                        if (i !== 1) {
                            items[i].classList.remove('vmu-tab-unselected');
                        }
                    }
                }
            }
        } else {
            searchItem.classList.remove('vmu-tab-selected');
            for (let i = 0; i < items.length; i++) {
                if (i !== 1) {
                    items[i].classList.remove('vmu-tab-unselected');
                }
            }
        }
    }

    function interceptTabbarClick(e) {
        if (currentTabSearch === 'search') return;
        const target = e.target;
        if (!target || !target.closest) return;

        const searchItem = getBottomSearchTab();
        if (!searchItem) return;

        if (searchItem === target || searchItem.contains(target)) {
            const def = TAB_DEFINITIONS[currentTabSearch];
            if (def && def.href) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (e.type === 'click' || e.type === 'touchend') {
                    if (window.location.pathname !== def.href) {
                        try {
                            const a = document.createElement('a');
                            a.href = def.href;
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                        } catch (err) {
                            window.location.href = def.href;
                        }
                        runAllFixes();
                    }
                }
            }
        }
    }

    document.addEventListener('click', interceptTabbarClick, true);
    document.addEventListener('touchend', interceptTabbarClick, true);
    document.addEventListener('pointerdown', interceptTabbarClick, true);
    document.addEventListener('touchstart', interceptTabbarClick, true);
    document.addEventListener('mousedown', interceptTabbarClick, true);

    document.addEventListener('click', interceptChatMoreActions, true);
    document.addEventListener('click', interceptActionButtons, true);
    document.addEventListener('pointerdown', interceptActionButtons, true);
    document.addEventListener('touchstart', interceptActionButtons, true);
    document.addEventListener('mousedown', interceptActionButtons, true);
    document.addEventListener('pointerdown', blockMorePointer, true);
    document.addEventListener('touchstart', blockMorePointer, true);
    document.addEventListener('mousedown', blockMorePointer, true);

    // ==========================================
    //       ИНИЦИАЛИЗАЦИЯ И MUTATION OBSERVER
    // ==========================================
    let isRunningFixes = false;
    let fixesScheduled = false;

    
    // Оформление удалённых сообщений в активном чате
    async function decorateDeletedMessagesInChat() {
        if (!isSaveDeletedMsgsEnabled) return;
        const path = window.location.pathname.toLowerCase();
        const isChat = path.startsWith('/mail') || path.startsWith('/im') || path.includes('act=show');
        if (!isChat) return;

        // Извлекаем peer_id из URL параметров
        const urlParams = new URLSearchParams(window.location.search);
        let peerId = parseInt(urlParams.get('peer') || urlParams.get('sel') || '0');
        if (!peerId) {
            const match = window.location.href.match(/[?&](peer|sel)=(-?\d+)/);
            if (match) peerId = parseInt(match[2]);
        }
        if (!peerId) return;

        const deletedList = await dbGetDeletedMessagesForPeer(peerId);
        if (!deletedList || deletedList.length === 0) return;

        for (const item of deletedList) {
            if (!item || !item.id) continue;
            // Ищем элемент сообщения в DOM по msgid / data-id
            const msgEl = document.querySelector(`[data-msgid="${item.id}"], [data-id="${item.id}"], [data-ts="${item.id}"], #im_msg_${item.id}`);
            if (msgEl && !msgEl.classList.contains('vmu-deleted-msg')) {
                msgEl.classList.add('vmu-deleted-msg');
                if (!msgEl.querySelector('.vmu-deleted-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'vmu-deleted-badge';
                    const timeStr = item.deleted_at ? new Date(item.deleted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    badge.innerHTML = `🗑️ [Удалено${timeStr ? ' ' + timeStr : ''}]`;
                    msgEl.insertBefore(badge, msgEl.firstChild);
                }
            }
        }
    }

    
    // Постоянная очистка ленты новостей от рекламных постов
    function removeAdPostsFromFeed() {
        const posts = document.querySelectorAll('.post, .wall_item, [data-post-id], [class*="Post"], [class*="FeedBlock"]');
        for (let i = 0; i < posts.length; i++) {
            const p = posts[i];
            if (p.classList.contains('vmu-ad-processed')) continue;
            
            // Проверка на рекламу по классам и атрибутам
            const isAd = p.classList.contains('wall_marked_as_ads') ||
                         p.classList.contains('ads_ad_box') ||
                         p.hasAttribute('data-ad-block') ||
                         p.hasAttribute('data-ad-view') ||
                         p.querySelector('.wall_marked_as_ads, .ads_ad_box, [data-ad-view], [class*="AdsPost"], [class*="PromotedPost"]');
            
            if (isAd) {
                p.classList.add('vmu-ad-processed');
                p.style.setProperty('display', 'none', 'important');
                continue;
            }

            // Проверка по тексту "Реклама" в шапке поста
            const headerLabel = p.querySelector('[class*="PostHeader__label"], [class*="Header__label"], [class*="Post__author"], .author');
            if (headerLabel && headerLabel.textContent.trim().toLowerCase() === 'реклама') {
                p.classList.add('vmu-ad-processed');
                p.style.setProperty('display', 'none', 'important');
            }
        }
    }

    function runAllFixes() {
        if (isRunningFixes) return;
        isRunningFixes = true;
        try {
            try { updatePwaManifestAndIcons(); } catch (e) {}
            try { updatePageBodyClasses(); } catch (e) {}
            try { applyStyles(); } catch (e) {}
            try { syncCurrentTheme(); } catch (e) {}
            try { cleanupLegacyCustomTheme(); } catch (e) {}
            try { applyBottomTabIconParams(); } catch (e) {}
            try { hideMailSettingsAppearanceItem(); } catch (e) {}
            try { updateSettingsVisibility(); } catch (e) {}
            try { handleUnreadFilter(); } catch (e) {}
            try { hideChatListActions(); } catch (e) {}
            try { hideCallsAndVideoMessages(); } catch (e) {}
            try { updateCustomTabs(); } catch (e) {}
            try { decorateDeletedMessagesInChat(); } catch (e) {}
            try { removeAdPostsFromFeed(); } catch (e) {}
            try { bypassAgeRestrictions(); } catch (e) {}
            try { enhanceProfileInfo(); } catch (e) {}
            try { cleanupCustomPageErrors(); } catch (e) {}
        } finally {
            isRunningFixes = false;
        }
    }

    function scheduleFixes() {
        if (fixesScheduled) return;
        fixesScheduled = true;
        requestAnimationFrame(() => {
            fixesScheduled = false;
            runAllFixes();
        });
    }

    let observer = null;
    function startObserver() {
        if (observer) return;
        observer = new MutationObserver((mutations) => {
            if (currentTabSearch !== 'search') {
                for (let i = 0; i < mutations.length; i++) {
                    const target = mutations[i].target;
                    if (target && target.closest && (target.closest('.vkuiTabbar, [class*="Tabbar"], .bottom_nav') || (target.classList && (target.classList.contains('vkuiTabbar') || target.classList.contains('vkuiTabbarItem'))))) {
                        try { updateCustomTabs(); } catch(e) {}
                        break;
                    }
                }
            }
            scheduleFixes();
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runAllFixes();
            startObserver();
        });
    } else {
        runAllFixes();
        startObserver();
    }

    window.addEventListener('load', scheduleFixes);
    window.addEventListener('popstate', scheduleFixes);
    window.addEventListener('hashchange', scheduleFixes);
})();

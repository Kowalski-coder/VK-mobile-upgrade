// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      2.25.8
// @description  Улучшение интерфейса m.vk.ru: выбор тем (Светлая, Тёмная, Snow Black), «Своё оформление» чатов (фон из галереи + свой цвет сообщений с интерактивным предпросмотром), раздел Мессенджер в настройках, кастомизация кнопки «Поиск» в нижней панели (Друзья, Сообщества, Музыка, Видео, Закладки), скрытие подписей, круглые счетчики, кнопка «Только непрочитанные» в шапке, скрытие меню действий в списке чатов, скрытие категорий чатов, отключение звонков и видеосообщений (кружков).
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
        HIDE_TAB_LABELS: 'vmu_hide_tab_labels',
        HIDE_FOLDERS_BAR: 'vmu_hide_folders_bar',
        HIDE_CALLS: 'vmu_hide_calls',
        HIDE_VIDEO_MSGS: 'vmu_hide_video_msgs',
        CUSTOM_ICON_PARAMS: 'vmu_custom_icon_params_v2',
        CUSTOM_SECTION_OPEN: 'vmu_custom_section_open',
        CUSTOM_CHAT_BG: 'vmu_custom_chat_bg',
        CUSTOM_CHAT_COLOR: 'vmu_custom_chat_color',
        DIFF_CHAT_THEMES: 'vmu_diff_chat_themes',
        CHAT_THEME_PRESET: 'vmu_chat_theme_preset'
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
            if (val === 'light' || val === 'dark' || val === 'snow_black') {
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
    let isColorSwapEnabled = (currentThemeMode === 'snow_black');
    let isHideLabelsEnabled = getSetting(STORAGE_KEYS.HIDE_TAB_LABELS, false);
    let isHideFoldersEnabled = getSetting(STORAGE_KEYS.HIDE_FOLDERS_BAR, true);
    let isHideCallsEnabled = getSetting(STORAGE_KEYS.HIDE_CALLS, false);
    let isHideVideoMsgsEnabled = getSetting(STORAGE_KEYS.HIDE_VIDEO_MSGS, false);
    let isDiffChatThemesEnabled = getSetting(STORAGE_KEYS.DIFF_CHAT_THEMES, false);
    let currentChatPreset = getStringSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'classic');
    let currentCustomChatColor = getStringSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, '#2c2d2e');

    const CHAT_COLOR_PRESETS = [
        { key: 'classic', label: 'Тёмный', value: '#2c2d2e' },
        { key: 'blue', label: 'Синий', value: '#2787F5' },
        { key: 'pink', label: 'Розовый', value: '#E05282' },
        { key: 'sky', label: 'Голубой', value: '#3F8AE0' },
        { key: 'green', label: 'Зелёный', value: '#4BB34B' },
        { key: 'sunset', label: 'Закат', value: 'linear-gradient(135deg, #FF5C77, #F58231)' },
        { key: 'purple', label: 'Фиолетовый', value: 'linear-gradient(135deg, #7928CA, #FF0080)' },
        { key: 'ocean', label: 'Океан', value: 'linear-gradient(135deg, #2E86DE, #00D2D3)' }
    ];

    const DEFAULT_CUSTOM_PARAMS = {
        friends: { scale: 125, stroke: 1.6 },
        groups: { scale: 125, stroke: 1.6 },
        music: { scale: 125, stroke: 1.6 },
        video: { scale: 125, stroke: 1.6 }
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
        const customParams = getCustomIconParams();
        const p = customParams[targetKey] || { scale: 125, stroke: 1.6 };
        const s = (p.scale || 125) / 100;
        const st = (parseFloat(p.stroke) || 1.6).toFixed(1);
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
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--bookmark_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M7 4a3 3 0 0 0-3 3v16a1 1 0 0 0 1.55.83L14 18.25l8.45 5.58A1 1 0 0 0 24 23V7a3 3 0 0 0-3-3H7zm15 16.92-7.45-4.92a1 1 0 0 0-1.1 0L6 20.92V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13.92z" clip-rule="evenodd"/></svg>`;
            case 'search':
            default:
                return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--search_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M12.5 3.5a9 9 0 1 0 5.7 15.98l4.41 4.41a1 1 0 0 0 1.42-1.42l-4.41-4.41A9 9 0 0 0 12.5 3.5ZM5.5 12.5a7 7 0 1 1 14 0 7 7 0 0 1-14 0Z" clip-rule="evenodd"/></svg>`;
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
        { value: 'snow_black', label: 'Snow Black' }
    ];

    // ==========================================
    //     БАЗОВЫЕ ИСПРАВЛЕНИЯ UI (ВСЕГДА АКТИВНЫ)
    // ==========================================
    const FIXES_CSS = `
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
        body.vmu-page-mail [class*="ConvoList"] [class*="SimpleCell__after"] [class*="Tappable"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoList"] [class*="Cell__after"] [class*="Tappable"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="Tappable"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] button:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [role="button"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [class*="IconButton"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="ConvoItem"] [class*="Cell__after"] [class*="Tappable"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
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
            background: #19191a !important;
            background-color: #19191a !important;
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

        /* 13. КАСТОМНОЕ ОФОРМЛЕНИЕ ЧАТОВ («СВОЁ ОФОРМЛЕНИЕ») */
        :root {
            --vmu-custom-chat-bg: none;
            --vmu-custom-chat-bubble: #2c2d2e;
            --vmu-custom-chat-bubble-gradient: none;
            --vmu-custom-chat-bubble-color: #2c2d2e;
        }

        /* Полное скрытие ВСЕХ нативных обоев, картинок, узоров и фонов оригинальных тем VK */
        body.vmu-theme-custom-active [class*="Wallpaper"],
        body.vmu-theme-custom-active [class*="wallpaper"],
        body.vmu-theme-custom-active .vkmChatWallpaper,
        body.vmu-theme-custom-active [class*="ChatBackground"],
        body.vmu-theme-custom-active [class*="ChatTheme"],
        body.vmu-theme-custom-active [class*="Chat__wallpaper"],
        body.vmu-theme-custom-active [class*="im-chat-wallpaper"],
        body.vmu-theme-custom-active [data-testid*="wallpaper"],
        body.vmu-theme-custom-active [data-testid*="chat-wallpaper"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            background: transparent !important;
            background-image: none !important;
        }

        body.vmu-theme-custom-active [class*="Wallpaper"] *,
        body.vmu-theme-custom-active [class*="wallpaper"] *,
        body.vmu-theme-custom-active .vkmChatWallpaper * {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }

        /* Делаем все контейнеры чата прозрачными в режиме кастомного фона */
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat #root,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkuiRoot,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkuiSplitLayout,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkuiSplitCol,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkuiView,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkuiPanel,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkuiPanel__in,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat main,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .layout,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat .vkmChat,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="ChatHistory"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="MessagesList"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="im-page"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="ChatView"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="ChatLayout"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="ChatRoot"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="Chat__content"],
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg.vmu-in-chat [class*="Conversation"] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
        }

        /* Статичный слой кастомного фона */
        #vmu-chat-custom-wallpaper {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: -1 !important;
            pointer-events: none !important;
            background-size: cover !important;
            background-position: center center !important;
            background-repeat: no-repeat !important;
            display: none;
        }

        body.vmu-theme-custom-active.vmu-in-chat.vmu-has-custom-chat-bg #vmu-chat-custom-wallpaper,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg:has([class*="WriteBar"]) #vmu-chat-custom-wallpaper,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg:has([class*="ChatHistory"]) #vmu-chat-custom-wallpaper,
        body.vmu-theme-custom-active.vmu-has-custom-chat-bg:has(.vkmChat) #vmu-chat-custom-wallpaper {
            display: block !important;
        }

        /* 1. Фон накладывается ТОЛЬКО на сам пузырь обычного текстового сообщения */
        body.vmu-theme-custom-active .vkmMessage--out:not(.vkmMessage--media):not(.vkmMessage--has-attach) > .vkmMessage__bubble,
        body.vmu-theme-custom-active .vkmMessage--out:not(.vkmMessage--media):not(.vkmMessage--has-attach) .vkmMessage__bubble,
        body.vmu-theme-custom-active .vkmMessage_out:not(.vkmMessage--media):not(.vkmMessage--has-attach) .vkmMessage__bubble,
        body.vmu-theme-custom-active [class*="vkmMessage--out"]:not([class*="--media"]):not([class*="--has-attach"]) > [class*="vkmMessage__bubble"],
        body.vmu-theme-custom-active [class*="vkmMessage--out"]:not([class*="--media"]):not([class*="--has-attach"]) .vkmMessage__bubble,
        body.vmu-theme-custom-active [class*="vkmMessage_out"]:not([class*="--media"]):not([class*="--has-attach"]) .vkmMessage__bubble,
        body.vmu-theme-custom-active [class*="Message--out"]:not([class*="--media"]):not([class*="--has-attach"]) > [class*="Message__bubble"],
        body.vmu-theme-custom-active [class*="Message--out"]:not([class*="--media"]):not([class*="--has-attach"]) .Message__bubble,
        body.vmu-theme-custom-active .im-mess_out:not(.im-mess--media) .im-mess--bubble,
        body.vmu-theme-custom-active [class*="im-mess_out"]:not([class*="--media"]) .im-mess--bubble,
        body.vmu-theme-custom-active [class*="MessageBubble--outgoing"]:not([class*="--media"]),
        body.vmu-theme-custom-active [class*="MessageBubble--out"]:not([class*="--media"]) {
            background: var(--vmu-custom-chat-bubble, #2c2d2e) !important;
            background-color: var(--vmu-custom-chat-bubble-color, #2c2d2e) !important;
            background-image: var(--vmu-custom-chat-bubble-gradient, none) !important;
            color: #ffffff !important;
        }

        /* 2. Все внутренние контейнеры текста, контента и вложений ДОЛЖНЫ быть прозрачными */
        body.vmu-theme-custom-active .vkmMessage--out .vkmMessage__content,
        body.vmu-theme-custom-active .vkmMessage--out .vkmMessage__text,
        body.vmu-theme-custom-active .vkmMessage--out .vkmMessage__in,
        body.vmu-theme-custom-active [class*="vkmMessage--out"] [class*="content" i],
        body.vmu-theme-custom-active [class*="vkmMessage--out"] [class*="text" i],
        body.vmu-theme-custom-active [class*="Message--out"] [class*="content" i],
        body.vmu-theme-custom-active [class*="Message--out"] [class*="text" i],
        body.vmu-theme-custom-active [class*="im-mess_out"] [class*="content" i],
        body.vmu-theme-custom-active [class*="im-mess_out"] [class*="text" i] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            color: #ffffff !important;
        }

        /* 3. Кнопка действий «...» слева от сообщения НЕ должна иметь фона */
        body.vmu-theme-custom-active .vkmMessage__actions,
        body.vmu-theme-custom-active [class*="vkmMessage__actions"],
        body.vmu-theme-custom-active [class*="vkmMessage__action"],
        body.vmu-theme-custom-active [class*="Message__actions"],
        body.vmu-theme-custom-active [class*="im-mess__actions"] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
        }

        /* 4. Вложения медиа (видео, фото, карточки) не должны иметь цветной заливки */
        body.vmu-theme-custom-active [class*="vkmMessage"] [class*="attachment" i],
        body.vmu-theme-custom-active [class*="vkmMessage"] [class*="VideoCard" i],
        body.vmu-theme-custom-active [class*="vkmMessage"] [class*="Snippet" i],
        body.vmu-theme-custom-active [class*="vkmMessage"] [class*="WallPost" i],
        body.vmu-theme-custom-active [class*="Message"] [class*="attachment" i],
        body.vmu-theme-custom-active [class*="Message"] [class*="VideoCard" i] {
            background-color: transparent !important;
        }

        /* Визуальное отключение активного состояния стандартных тем при выборе «Своё» */
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [class*="Radio"]:not(#vmu-custom-theme-card) [class*="icon" i],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [class*="Radio"]:not(#vmu-custom-theme-card) [class*="check" i],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [class*="Radio"]:not(#vmu-custom-theme-card) [class*="badge" i],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [class*="Radio"]:not(#vmu-custom-theme-card) svg,
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [role="radio"]:not(#vmu-custom-theme-card) [class*="icon" i],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [role="radio"]:not(#vmu-custom-theme-card) [class*="check" i],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [role="radio"]:not(#vmu-custom-theme-card) [class*="badge" i],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [role="radio"]:not(#vmu-custom-theme-card) svg,
        body.vmu-theme-custom-active [class*="HorizontalScroll"] label:not(#vmu-custom-theme-card) svg,
        body.vmu-theme-custom-active [class*="HorizontalScroll"] div:not(#vmu-custom-theme-card):not(#vmu-live-chat-preview) > div > svg {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }

        body.vmu-theme-custom-active [class*="HorizontalScroll"] [class*="Radio"]:not(#vmu-custom-theme-card) [class*="Radio__content"],
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [role="radio"]:not(#vmu-custom-theme-card) > div,
        body.vmu-theme-custom-active [class*="HorizontalScroll"] [class*="Radio"]:not(#vmu-custom-theme-card) > div {
            border-color: rgba(255, 255, 255, 0.12) !important;
        }

        /* Предотвращение мигания карточек в карусели */
        .vmu-custom-theme-carousel-item {
            transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .vmu-custom-theme-carousel-item:active {
            transform: scale(0.96);
        }
    `;

    // ==========================================
    //         ЦВЕТА И СТИЛИ ПОДМЕНЫ
    // ==========================================
    const COLOR_ACCENT_SWAPPED = '#FF5C5C'; // Изначально #71AAEB -> теперь красный
    const COLOR_NEGATIVE_SWAPPED = '#71AAEB'; // Изначально #FF5C5C -> теперь голубой

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

        body.vmu-page-mail [class*="Search"],
        body.vmu-page-mail .vkuiSearch,
        body.vmu-page-mail [class*="vkmListHeader"] + [class*="Search"] {
            margin-bottom: 2px !important;
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

    function isCustomThemeEditorPage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        return (path.includes('/mail/settings/theme') || path.includes('/settings')) && (search.includes('act=vmu_custom_theme') || hash === '#vmu_custom_theme');
    }

    function isMailAppearancePage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        return (path.includes('/mail/settings/theme') || path.includes('/settings/appearance/im') || search.includes('act=vmu_mail_theme')) && !isCustomThemeEditorPage();
    }

    function isMailSettingsPage() {
        const path = window.location.pathname.toLowerCase();
        return (path.startsWith('/mail/settings') || path.startsWith('/im/settings')) && !path.includes('/mail/settings/theme');
    }

    function isChatPage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        if (path.startsWith('/mail') && (search.includes('act=show') || search.includes('peer') || search.includes('chat') || search.includes('sel'))) return true;
        if (path.startsWith('/im') && (search.includes('sel') || path.includes('/convo/') || path.includes('/chat/'))) return true;
        if (path.startsWith('/write')) return true;
        if (document.querySelector && document.querySelector('[class*="WriteBar"], [class*="ChatHistory"], [class*="MessagesList"], .vkmChat, [class*="ChatView"], [class*="im-page--chat"], [class*="ChatLayout"]')) return true;
        return false;
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

    function processUploadedImage(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 1440;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                if (dataUrl.length > 2200000) {
                    const smallCanvas = document.createElement('canvas');
                    smallCanvas.width = Math.round(width * 0.75);
                    smallCanvas.height = Math.round(height * 0.75);
                    const sCtx = smallCanvas.getContext('2d');
                    sCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
                    dataUrl = smallCanvas.toDataURL('image/jpeg', 0.75);
                }
                callback(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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

        // Header (Click to toggle)
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
        titleText.style.cssText = 'font-size: 16px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff); display: flex; align-items: center; gap: 8px;';
        titleText.innerHTML = '<span>🛠️ Размер значков на нижней панели</span> <span style="font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; background: rgba(39, 135, 245, 0.2); color: var(--vkui--color_text_accent, #71aaeb);">ручная настройка</span>';

        const descText = document.createElement('div');
        descText.style.cssText = 'font-size: 13px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px;';
        descText.textContent = 'Размер и толщина линий (Друзья, Сообщества, Музыка, Видео)';

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

        const iconsList = [
            { key: 'friends', name: 'Друзья' },
            { key: 'groups', name: 'Сообщества' },
            { key: 'music', name: 'Музыка' },
            { key: 'video', name: 'Видео' }
        ];

        let customParams = getCustomIconParams();
        const previewMap = {};
        const badgeMap = {};

        function refreshAll() {
            setCustomIconParams(customParams);
            iconsList.forEach(item => {
                if (previewMap[item.key]) {
                    previewMap[item.key].innerHTML = getTabSvg(item.key);
                }
                if (badgeMap[item.key]) {
                    const p = customParams[item.key] || { scale: 100, stroke: 1.5 };
                    badgeMap[item.key].textContent = `${p.scale}% • ${Number(p.stroke).toFixed(1)}px`;
                }
            });
            updateSummary();
            try { updateCustomTabs(); } catch(e) {}
        }

        iconsList.forEach(item => {
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
            prevBox.innerHTML = getTabSvg(item.key);
            previewMap[item.key] = prevBox;

            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-size: 15px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff);';
            nameEl.textContent = item.name;

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
            const initP = customParams[item.key] || { scale: 105, stroke: 1.5 };
            badge.textContent = `${initP.scale}% • ${Number(initP.stroke).toFixed(1)}px`;
            badgeMap[item.key] = badge;

            cardHeader.appendChild(leftBox);
            cardHeader.appendChild(badge);
            card.appendChild(cardHeader);

            // Controls 1: Размер
            const scaleRow = document.createElement('div');
            scaleRow.style.cssText = 'margin-bottom: 8px;';

            const scaleLabelRow = document.createElement('div');
            scaleLabelRow.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px; color: var(--vkui--color_text_secondary, #999); margin-bottom: 4px;';
            scaleLabelRow.innerHTML = `<span>Размер</span><span id="vmu-scale-val-${item.key}">${initP.scale}%</span>`;

            const scaleControl = document.createElement('div');
            scaleControl.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            const btnScaleMinus = document.createElement('button');
            btnScaleMinus.textContent = '-5%';
            btnScaleMinus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            const scaleSlider = document.createElement('input');
            scaleSlider.type = 'range';
            scaleSlider.min = '80';
            scaleSlider.max = '150';
            scaleSlider.step = '1';
            scaleSlider.value = String(initP.scale);
            scaleSlider.style.cssText = 'flex: 1; accent-color: #2787F5; cursor: pointer;';

            const btnScalePlus = document.createElement('button');
            btnScalePlus.textContent = '+5%';
            btnScalePlus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            btnScaleMinus.onclick = (e) => {
                e.preventDefault();
                let v = Math.max(80, (customParams[item.key].scale || 100) - 5);
                customParams[item.key].scale = v;
                scaleSlider.value = String(v);
                scaleLabelRow.lastElementChild.textContent = `${v}%`;
                refreshAll();
            };

            btnScalePlus.onclick = (e) => {
                e.preventDefault();
                let v = Math.min(150, (customParams[item.key].scale || 100) + 5);
                customParams[item.key].scale = v;
                scaleSlider.value = String(v);
                scaleLabelRow.lastElementChild.textContent = `${v}%`;
                refreshAll();
            };

            scaleSlider.oninput = (e) => {
                let v = parseInt(e.target.value, 10);
                customParams[item.key].scale = v;
                scaleLabelRow.lastElementChild.textContent = `${v}%`;
                refreshAll();
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
            strokeLabelRow.innerHTML = `<span>Толщина линий</span><span id="vmu-stroke-val-${item.key}">${Number(initP.stroke).toFixed(1)}px</span>`;

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
            strokeSlider.value = String(initP.stroke);
            strokeSlider.style.cssText = 'flex: 1; accent-color: #2787F5; cursor: pointer;';

            const btnStrokePlus = document.createElement('button');
            btnStrokePlus.textContent = '+0.1';
            btnStrokePlus.style.cssText = 'padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; touch-action: manipulation;';

            btnStrokeMinus.onclick = (e) => {
                e.preventDefault();
                let v = Math.max(0.5, Math.round(((customParams[item.key].stroke || 1.5) - 0.1) * 10) / 10);
                customParams[item.key].stroke = v;
                strokeSlider.value = String(v);
                strokeLabelRow.lastElementChild.textContent = `${v.toFixed(1)}px`;
                refreshAll();
            };

            btnStrokePlus.onclick = (e) => {
                e.preventDefault();
                let v = Math.min(3.5, Math.round(((customParams[item.key].stroke || 1.5) + 0.1) * 10) / 10);
                customParams[item.key].stroke = v;
                strokeSlider.value = String(v);
                strokeLabelRow.lastElementChild.textContent = `${v.toFixed(1)}px`;
                refreshAll();
            };

            strokeSlider.oninput = (e) => {
                let v = Math.round(parseFloat(e.target.value) * 10) / 10;
                customParams[item.key].stroke = v;
                strokeLabelRow.lastElementChild.textContent = `${v.toFixed(1)}px`;
                refreshAll();
            };

            strokeControl.appendChild(btnStrokeMinus);
            strokeControl.appendChild(strokeSlider);
            strokeControl.appendChild(btnStrokePlus);
            strokeRow.appendChild(strokeLabelRow);
            strokeRow.appendChild(strokeControl);
            card.appendChild(strokeRow);

            body.appendChild(card);
        });

        // Summary Box & Copy Button
        const summaryCard = document.createElement('div');
        summaryCard.style.cssText = `
            margin-top: 14px;
            padding: 10px 12px;
            border-radius: 8px;
            background: rgba(0,0,0,0.25);
            border: 1px dashed rgba(255,255,255,0.15);
        `;

        const summaryText = document.createElement('div');
        summaryText.style.cssText = 'font-size: 12px; color: var(--vkui--color_text_primary, #fff); font-family: monospace; word-break: break-all; margin-bottom: 8px; line-height: 1.4;';

        function getSummaryString() {
            return `Друзья: ${customParams.friends.scale}% / ${Number(customParams.friends.stroke).toFixed(1)}px | Сообщества: ${customParams.groups.scale}% / ${Number(customParams.groups.stroke).toFixed(1)}px | Музыка: ${customParams.music.scale}% / ${Number(customParams.music.stroke).toFixed(1)}px | Видео: ${customParams.video.scale}% / ${Number(customParams.video.stroke).toFixed(1)}px`;
        }

        function updateSummary() {
            summaryText.textContent = getSummaryString();
        }
        updateSummary();

        const actionsRow = document.createElement('div');
        actionsRow.style.cssText = 'display: flex; gap: 8px; align-items: center; justify-content: space-between;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Скопировать параметры';
        copyBtn.style.cssText = `
            padding: 6px 12px;
            border-radius: 6px;
            border: none;
            background: var(--vkui--color_background_accent, #2787F5);
            color: #ffffff;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            touch-action: manipulation;
        `;
        copyBtn.onclick = (e) => {
            e.preventDefault();
            const str = getSummaryString();
            try {
                navigator.clipboard.writeText(str).then(() => {
                    const orig = copyBtn.textContent;
                    copyBtn.textContent = '✓ Скопировано!';
                    setTimeout(() => { copyBtn.textContent = orig; }, 2000);
                });
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = str;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
                copyBtn.textContent = '✓ Скопировано!';
                setTimeout(() => { copyBtn.textContent = '📋 Скопировать параметры'; }, 2000);
            }
        };

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '↺ Сброс';
        resetBtn.style.cssText = `
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.15);
            background: transparent;
            color: var(--vkui--color_text_secondary, #999);
            font-size: 12px;
            cursor: pointer;
            touch-action: manipulation;
        `;
        resetBtn.onclick = (e) => {
            e.preventDefault();
            customParams = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PARAMS));
            refreshAll();
            scheduleFixes();
        };

        actionsRow.appendChild(copyBtn);
        actionsRow.appendChild(resetBtn);

        summaryCard.appendChild(summaryText);
        summaryCard.appendChild(actionsRow);
        body.appendChild(summaryCard);

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

        const isLight = mode === 'light';
        const vkuiTheme = isLight ? 'bright_light' : 'space_gray';
        const vkTheme = isLight ? 'light' : 'dark';

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
        }
        if (body) {
            body.setAttribute('scheme', vkuiTheme);
            body.setAttribute('data-theme', vkTheme);
            body.setAttribute('data-vkui-theme', vkuiTheme);
        }

        applyStyles();

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
        const isLight = currentThemeMode === 'light';
        const vkuiTheme = isLight ? 'bright_light' : 'space_gray';
        const vkTheme = isLight ? 'light' : 'dark';

        try {
            if (localStorage.getItem('vkui_theme') !== vkuiTheme) {
                localStorage.setItem('vkui_theme', vkuiTheme);
            }
            if (localStorage.getItem('vk_theme') !== vkTheme) {
                localStorage.setItem('vk_theme', vkTheme);
            }
            if (localStorage.getItem('scheme') !== vkuiTheme) {
                localStorage.setItem('scheme', vkuiTheme);
            }
        } catch (e) {}

        const html = document.documentElement;
        if (html && html.getAttribute('scheme') !== vkuiTheme) {
            html.setAttribute('scheme', vkuiTheme);
            html.setAttribute('data-theme', vkTheme);
            html.setAttribute('data-vkui-theme', vkuiTheme);
        }
    }

    syncCurrentTheme();

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
        const gearSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--w-28 vkuiIcon--h-28" style="display: block !important; width: 28px !important; height: 28px !important; color: var(--vkui--color_icon_accent, #FF5C5C) !important; margin: 0 auto !important;"><circle cx="14" cy="14" r="3.75" stroke="currentColor" stroke-width="2"/><path d="M14 2.5a1.5 1.5 0 0 1 1.45 1.1l.3 1.2a2 2 0 0 0 2.1 1.5l1.2-.3a1.5 1.5 0 0 1 1.7 1.7l-.3 1.2a2 2 0 0 0 1.5 2.1l1.2.3a1.5 1.5 0 0 1 1.1 1.45v1.5a1.5 1.5 0 0 1-1.1 1.45l-1.2.3a2 2 0 0 0-1.5 2.1l.3 1.2a1.5 1.5 0 0 1-1.7 1.7l-1.2-.3a2 2 0 0 0-2.1 1.5l-.3 1.2a1.5 1.5 0 0 1-1.45 1.1h-1.5a1.5 1.5 0 0 1-1.45-1.1l-.3-1.2a2 2 0 0 0-2.1-1.5l-1.2.3a1.5 1.5 0 0 1-1.7-1.7l.3-1.2a2 2 0 0 0-1.5-2.1l-1.2-.3a1.5 1.5 0 0 1-1.1-1.45v-1.5a1.5 1.5 0 0 1 1.1-1.45l1.2-.3a2 2 0 0 0 1.5-2.1l-.3-1.2a1.5 1.5 0 0 1 1.7-1.7l1.2.3a2 2 0 0 0 2.1-1.5l.3-1.2a1.5 1.5 0 0 1 1.45-1.1h1.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
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
        const bugSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--w-28 vkuiIcon--h-28" style="display: block !important; width: 28px !important; height: 28px !important; color: var(--vkui--color_icon_accent, #FF5C5C) !important; margin: 0 auto !important;"><path d="M11 8L8.5 4.5M17 8l2.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="8.5" y="8" width="11" height="13" rx="5.5" stroke="currentColor" stroke-width="2"/><path d="M3.5 11.5h5M3.5 15h5M3.5 18.5h5M19.5 11.5h5M19.5 15h5M19.5 18.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11.5v7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
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

        // 1. Замена вкладки Поиск
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

        // 2. Скрыть категории чатов
        const rowFolders = createSwitchRow(
            'Скрыть категории чатов',
            'Убирает панель категорий (Все, Каналы, Бизнес, Чаты) и лишние отступы',
            isHideFoldersEnabled,
            (checked) => {
                isHideFoldersEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_FOLDERS_BAR, isHideFoldersEnabled);
                applyStyles();
            }
        );
        card.appendChild(rowFolders);

        // 3. Отключить звонки в чатах
        const rowCalls = createSwitchRow(
            'Отключить звонки в чатах',
            'Скрывает кнопку звонка из шапки диалогов',
            isHideCallsEnabled,
            (checked) => {
                isHideCallsEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_CALLS, isHideCallsEnabled);
                applyStyles();
                scheduleFixes();
            }
        );
        card.appendChild(rowCalls);

        // 4. Отключить кружки в чатах
        const rowVideo = createSwitchRow(
            'Отключить кружки в чатах',
            'Скрывает кнопку записи кружков в строке ввода сообщений',
            isHideVideoMsgsEnabled,
            (checked) => {
                isHideVideoMsgsEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_VIDEO_MSGS, isHideVideoMsgsEnabled);
                applyStyles();
                scheduleFixes();
            }
        );
        rowVideo.style.borderBottom = 'none';
        card.appendChild(rowVideo);

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
        const tabInfo = `${currentTabSearch} (scale: ${customP[currentTabSearch] ? customP[currentTabSearch].scale : 125}%, stroke: ${customP[currentTabSearch] ? customP[currentTabSearch].stroke : 1.6}px)`;

        diagBox.innerHTML = `
            <div style="color: #71aaeb; font-weight: bold; margin-bottom: 8px;">🐞 СИСТЕМНАЯ ДИАГНОСТИКА:</div>
            <div>• <b>Script Version:</b> v2.25.4</div>
            <div>• <b>Theme Mode:</b> ${currentThemeMode} (color swap: ${isColorSwapEnabled})</div>
            <div>• <b>Custom Tab Slot:</b> ${tabInfo}</div>
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

    const CUSTOM_THEME_EDITOR_UI_ID = 'vmu-custom-theme-editor-overlay';

    function findThemesCarouselRow() {
        // 1. Ищем любую из стандартных тем (Поле, Ковёр, Пиксели, Чёрный, etc.)
        const candidateNames = ['Поле', 'Ковёр', 'Ковер', 'Пиксели', 'Чёрный', 'Черный', 'Классический', 'Неон', 'Графика', 'Космос'];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        let foundCardItem = null;

        while ((node = walker.nextNode())) {
            const txt = node.nodeValue ? node.nodeValue.trim() : '';
            if (candidateNames.includes(txt)) {
                let cur = node.parentElement;
                // Поднимаемся до уровня элемента-карточки темы
                while (cur && cur !== document.body) {
                    if (cur.matches && (cur.matches('.vkuiRadio, [class*="Radio"], [role="radio"], .vkuiTappable') || cur.querySelector('input[type="radio"]'))) {
                        foundCardItem = cur;
                        break;
                    }
                    if (cur.parentElement && cur.parentElement.children.length >= 2) {
                        const style = window.getComputedStyle(cur.parentElement);
                        if (style.display.includes('flex') && (style.flexDirection === 'row' || !style.flexDirection || style.flexDirection === 'normal')) {
                            foundCardItem = cur;
                            break;
                        }
                    }
                    cur = cur.parentElement;
                }
                if (foundCardItem) break;
            }
        }

        if (foundCardItem && foundCardItem.parentElement) {
            return foundCardItem.parentElement;
        }

        // 2. Вторичный поиск по точным селекторам VKUI HorizontalScroll
        const scrolls = document.querySelectorAll(
            '.vkuiHorizontalScroll__content, [class*="HorizontalScroll__content"], .vkuiHorizontalScroll__in > div, [class*="HorizontalScroll__in"] > div'
        );
        for (let i = 0; i < scrolls.length; i++) {
            if (scrolls[i].children.length >= 2) {
                return scrolls[i];
            }
        }

        return null;
    }

    function injectCustomThemeOptionInCarousel() {
        if (!isMailAppearancePage()) return;

        const carouselRow = findThemesCarouselRow();
        if (!carouselRow) return;

        let customCard = document.getElementById('vmu-custom-theme-card');
        const isCustomActive = (currentChatPreset === 'custom');
        let customBg = null;
        try { customBg = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHAT_BG); } catch(e) {}
        let customColor = getStringSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, '#2c2d2e');

        if (!customCard) {
            customCard = document.createElement('div');
            customCard.id = 'vmu-custom-theme-card';
            customCard.className = 'vmu-custom-theme-carousel-item';
            carouselRow.insertBefore(customCard, carouselRow.firstElementChild);
        } else {
            if (customCard.parentElement !== carouselRow || carouselRow.firstElementChild !== customCard) {
                carouselRow.insertBefore(customCard, carouselRow.firstElementChild);
            }
        }

        const bgStyle = customBg ? `background-image: url("${customBg}"); background-size: cover; background-position: center;` : `background: #19191a;`;

        customCard.style.cssText = `
            display: inline-flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            margin-right: 12px !important;
            cursor: pointer !important;
            user-select: none !important;
            flex-shrink: 0 !important;
            -webkit-tap-highlight-color: transparent !important;
            vertical-align: top !important;
            width: auto !important;
        `;

        customCard.innerHTML = `
            <div style="position: relative; width: 84px; height: 84px; border-radius: 14px; overflow: hidden; border: ${isCustomActive ? '2.5px solid var(--vkui--color_text_accent, #FF5C5C)' : '1px solid rgba(255,255,255,0.12)'}; ${bgStyle}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); box-sizing: border-box;">
                <div style="position: absolute; right: 8px; top: 18px; width: 44px; height: 16px; border-radius: 8px; background: ${customColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; left: 8px; bottom: 18px; width: 48px; height: 16px; border-radius: 8px; background: rgba(255,255,255,0.22); box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
                ${isCustomActive ? `
                    <div style="position: absolute; top: 6px; left: 6px; width: 22px; height: 22px; border-radius: 50%; background: #ffffff; color: #000000; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">✓</div>
                ` : ''}
            </div>
            <div style="font-size: 13px; color: ${isCustomActive ? 'var(--vkui--color_text_accent, #FF5C5C)' : 'var(--vkui--color_text_primary, #ffffff)'}; font-weight: ${isCustomActive ? '600' : '400'}; margin-top: 6px; text-align: center;">Своё</div>
        `;

        clearNativeThemeCheckmarks();

        customCard.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentChatPreset = 'custom';
            setSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'custom');
            applyCustomChatBackground();
            clearNativeThemeCheckmarks();
            injectCustomThemeOptionInCarousel();
            window.history.pushState(null, '', '/mail/settings/theme?act=vmu_custom_theme');
            renderCustomThemeEditorPage();
        };

        if (!carouselRow.dataset.vmuNativeListener) {
            carouselRow.dataset.vmuNativeListener = 'true';
            carouselRow.addEventListener('click', (e) => {
                const target = e.target;
                if (target && !target.closest('#vmu-custom-theme-card')) {
                    currentChatPreset = 'native';
                    setSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'native');
                    applyCustomChatBackground();
                    injectCustomThemeOptionInCarousel();
                    carouselRow.querySelectorAll('.vkuiRadio, [class*="Radio"], [role="radio"], label').forEach(item => {
                        const icons = item.querySelectorAll('[class*="icon" i], [class*="Icon"], [class*="checked" i], [class*="check" i], svg, [class*="badge" i]');
                        icons.forEach(ic => {
                            ic.style.removeProperty('display');
                            ic.style.removeProperty('visibility');
                            ic.style.removeProperty('opacity');
                        });
                        const borderEl = item.querySelector('[class*="content" i], div');
                        if (borderEl) {
                            borderEl.style.removeProperty('border-color');
                        }
                    });
                }
            }, false);
        }
    }

    function clearNativeThemeCheckmarks() {
        if (currentChatPreset !== 'custom') return;
        const carouselRow = findThemesCarouselRow();
        if (!carouselRow) return;

        const cards = carouselRow.children;
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (card.id === 'vmu-custom-theme-card' || card.contains(document.getElementById('vmu-custom-theme-card'))) {
                continue;
            }

            card.classList.remove('vkuiRadio--checked');
            card.removeAttribute('checked');
            card.setAttribute('aria-checked', 'false');
            const radioInput = card.querySelector('input[type="radio"]');
            if (radioInput) radioInput.checked = false;

            const allChildren = card.querySelectorAll('*');
            for (let j = 0; j < allChildren.length; j++) {
                const el = allChildren[j];
                if (el.textContent && el.textContent.trim() === '✓') {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                }
                if (el.tagName && el.tagName.toLowerCase() === 'svg') {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                }
                const cls = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';
                if (cls.includes('icon') || cls.includes('check') || cls.includes('badge') || cls.includes('indicator')) {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                }
            }
            const borderEl = card.querySelector('[class*="content" i], div');
            if (borderEl) {
                borderEl.style.setProperty('border-color', 'rgba(255, 255, 255, 0.12)', 'important');
            }
        }
    }

    let customThemeActiveTab = 'bg'; // 'bg' | 'color'

    function closeCustomThemeEditor() {
        const overlay = document.getElementById(CUSTOM_THEME_EDITOR_UI_ID);
        if (overlay) overlay.remove();
        if (window.location.search.includes('act=vmu_custom_theme') || window.location.hash === '#vmu_custom_theme') {
            window.history.replaceState(null, '', '/mail/settings/theme');
        }
        injectCustomThemeOptionInCarousel();
    }

    function renderCustomThemeEditorPage() {
        let overlay = document.getElementById(CUSTOM_THEME_EDITOR_UI_ID);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = CUSTOM_THEME_EDITOR_UI_ID;
            document.body.appendChild(overlay);
        }

        let customBg = null;
        try { customBg = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHAT_BG); } catch(e) {}
        let customColor = getStringSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, '#2c2d2e');

        overlay.innerHTML = '';
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: var(--vkui--color_background_content, #19191a) !important;
            color: var(--vkui--color_text_primary, #ffffff) !important;
            z-index: 99999 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
            user-select: none !important;
        `;

        // 1. Шапка страницы
        const topNav = document.createElement('div');
        topNav.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: var(--vkui--color_background_content, #19191a);
            position: sticky;
            top: 0;
            z-index: 10;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;

        const backBtn = document.createElement('button');
        backBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: var(--vkui--color_text_accent, #FF5C5C);
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            padding: 6px 8px;
            margin: -6px -8px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;
        backBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        `;
        backBtn.onclick = (e) => {
            e.preventDefault();
            closeCustomThemeEditor();
        };

        const pageTitle = document.createElement('div');
        pageTitle.style.cssText = 'font-size: 18px; font-weight: 600; color: var(--vkui--color_text_primary, #ffffff);';
        pageTitle.textContent = 'Своё оформление';

        topNav.appendChild(backBtn);
        topNav.appendChild(pageTitle);
        overlay.appendChild(topNav);

        // 2. Интерактивный предпросмотр чата (Live Preview)
        const previewContainer = document.createElement('div');
        previewContainer.id = 'vmu-live-chat-preview';
        const liveBgStyle = customBg ? `background-image: url("${customBg}"); background-size: cover; background-position: center;` : `background: #101010;`;
        previewContainer.style.cssText = `
            position: relative;
            margin: 16px;
            height: 360px;
            border-radius: 16px;
            overflow: hidden;
            ${liveBgStyle};
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 12px;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
            flex-shrink: 0;
        `;

        previewContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                <!-- Входящее сообщение 1 (Лиза) -->
                <div style="display: flex; align-items: flex-end; gap: 8px; max-width: 82%;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #6c5ce7; display: flex; align-items: center; justify-content: center;">
                        <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#8854d0"/><circle cx="14" cy="11" r="5" fill="#ffeaa7"/><path d="M6 25c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#ffeaa7"/></svg>
                    </div>
                    <div style="background: #232324; border-radius: 16px 16px 16px 4px; padding: 8px 12px; color: #ffffff; font-size: 14px; line-height: 1.35; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        <div style="color: var(--vkui--color_text_accent, #FF5C5C); font-weight: 600; font-size: 12px; margin-bottom: 2px;">Лиза</div>
                        <div>Привет! Как тебе новое оформление? ✨</div>
                        <div style="text-align: right; font-size: 11px; opacity: 0.6; margin-top: 3px;">19:24</div>
                    </div>
                </div>

                <!-- Исходящее сообщение 1 -->
                <div style="align-self: flex-end; max-width: 80%; background: ${customColor}; border-radius: 16px 16px 4px 16px; padding: 8px 12px; color: #ffffff; font-size: 14px; line-height: 1.35; position: relative; box-shadow: 0 2px 6px rgba(0,0,0,0.3);" class="vmu-preview-out-bubble">
                    <div>Выглядит просто супер! 🔥</div>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 3px; font-size: 11px; opacity: 0.75; margin-top: 3px;">
                        <span>19:24</span>
                        <span>✓✓</span>
                    </div>
                </div>

                <!-- Входящее сообщение 2 (Лиза) -->
                <div style="display: flex; align-items: flex-end; gap: 8px; max-width: 82%;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #6c5ce7; display: flex; align-items: center; justify-content: center;">
                        <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#8854d0"/><circle cx="14" cy="11" r="5" fill="#ffeaa7"/><path d="M6 25c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#ffeaa7"/></svg>
                    </div>
                    <div style="background: #232324; border-radius: 16px 16px 16px 4px; padding: 8px 12px; color: #ffffff; font-size: 14px; line-height: 1.35; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        <div>Цвет сообщений и фон идеально сочетаются)</div>
                        <div style="text-align: right; font-size: 11px; opacity: 0.6; margin-top: 3px;">19:25</div>
                    </div>
                </div>

                <!-- Исходящее сообщение 2 -->
                <div style="align-self: flex-end; max-width: 80%; background: ${customColor}; border-radius: 16px 16px 4px 16px; padding: 8px 12px; color: #ffffff; font-size: 14px; line-height: 1.35; position: relative; box-shadow: 0 2px 6px rgba(0,0,0,0.3);" class="vmu-preview-out-bubble">
                    <div>Да, мне тоже очень нравится!</div>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 3px; font-size: 11px; opacity: 0.75; margin-top: 3px;">
                        <span>19:25</span>
                        <span>✓✓</span>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(previewContainer);

        // 3. Табы переключения: «Фон» | «Цвет»
        const tabNav = document.createElement('div');
        tabNav.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-around;
            margin: 0 16px 14px 16px;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.1));
            position: relative;
            flex-shrink: 0;
        `;

        const tabBg = document.createElement('div');
        tabBg.textContent = 'Фон';
        tabBg.style.cssText = `
            flex: 1;
            text-align: center;
            padding: 10px 0;
            font-size: 15px;
            font-weight: ${customThemeActiveTab === 'bg' ? '600' : '400'};
            color: ${customThemeActiveTab === 'bg' ? 'var(--vkui--color_text_primary, #ffffff)' : 'var(--vkui--color_text_secondary, #828282)'};
            cursor: pointer;
            border-bottom: ${customThemeActiveTab === 'bg' ? '2.5px solid var(--vkui--color_text_accent, #FF5C5C)' : '2.5px solid transparent'};
            transition: all 0.2s ease;
        `;

        const tabColor = document.createElement('div');
        tabColor.textContent = 'Цвет';
        tabColor.style.cssText = `
            flex: 1;
            text-align: center;
            padding: 10px 0;
            font-size: 15px;
            font-weight: ${customThemeActiveTab === 'color' ? '600' : '400'};
            color: ${customThemeActiveTab === 'color' ? 'var(--vkui--color_text_primary, #ffffff)' : 'var(--vkui--color_text_secondary, #828282)'};
            cursor: pointer;
            border-bottom: ${customThemeActiveTab === 'color' ? '2.5px solid var(--vkui--color_text_accent, #FF5C5C)' : '2.5px solid transparent'};
            transition: all 0.2s ease;
        `;

        tabNav.appendChild(tabBg);
        tabNav.appendChild(tabColor);
        overlay.appendChild(tabNav);

        // 4. Скрытый file input для галереи
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        fileInput.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                processUploadedImage(file, (dataUrl) => {
                    try {
                        localStorage.setItem(STORAGE_KEYS.CUSTOM_CHAT_BG, dataUrl);
                        currentChatPreset = 'custom';
                        setSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'custom');
                    } catch(err) {
                        alert('Превышен лимит размера памяти браузера. Пожалуйста, выберите другое изображение.');
                    }
                    applyCustomChatBackground();
                    renderCustomThemeEditorPage();
                });
            }
        };
        overlay.appendChild(fileInput);

        // 5. Контейнер содержимого табов
        const tabContentContainer = document.createElement('div');
        tabContentContainer.style.cssText = 'margin: 0 16px 40px 16px; flex-shrink: 0;';

        function updateTabContent() {
            tabContentContainer.innerHTML = '';

            if (customThemeActiveTab === 'bg') {
                const bgRow = document.createElement('div');
                bgRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    overflow-x: auto;
                    padding: 6px 0 14px 0;
                    -webkit-overflow-scrolling: touch;
                `;

                // Кнопка 1: Выбрать фото из галереи
                const uploadBtn = document.createElement('div');
                uploadBtn.style.cssText = `
                    width: 80px;
                    height: 80px;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1.5px dashed rgba(255, 255, 255, 0.25);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: transform 0.15s ease;
                `;
                uploadBtn.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 2px;">🖼️</div>
                    <div style="font-size: 11px; color: var(--vkui--color_text_accent, #FF5C5C); font-weight: 500;">Галерея</div>
                `;
                uploadBtn.onclick = (e) => {
                    e.preventDefault();
                    fileInput.click();
                };
                bgRow.appendChild(uploadBtn);

                // Кнопка 2: Текущее фото (если загружено)
                if (customBg) {
                    const activePhotoCard = document.createElement('div');
                    activePhotoCard.style.cssText = `
                        position: relative;
                        width: 80px;
                        height: 80px;
                        border-radius: 14px;
                        background-image: url("${customBg}");
                        background-size: cover;
                        background-position: center;
                        border: 2px solid var(--vkui--color_text_accent, #FF5C5C);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
                        cursor: pointer;
                        flex-shrink: 0;
                    `;
                    activePhotoCard.innerHTML = `
                        <div style="position: absolute; top: 6px; left: 6px; width: 20px; height: 20px; border-radius: 50%; background: #ffffff; color: #000000; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</div>
                    `;
                    bgRow.appendChild(activePhotoCard);

                    // Кнопка 3: Удалить фото
                    const deleteBtn = document.createElement('div');
                    deleteBtn.style.cssText = `
                        width: 80px;
                        height: 80px;
                        border-radius: 14px;
                        background: rgba(255, 92, 92, 0.1);
                        border: 1px solid rgba(255, 92, 92, 0.3);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        flex-shrink: 0;
                    `;
                    deleteBtn.innerHTML = `
                        <div style="font-size: 20px; margin-bottom: 2px;">🗑️</div>
                        <div style="font-size: 11px; color: #FF5C5C; font-weight: 500;">Сбросить</div>
                    `;
                    deleteBtn.onclick = (e) => {
                        e.preventDefault();
                        try { localStorage.removeItem(STORAGE_KEYS.CUSTOM_CHAT_BG); } catch(err) {}
                        applyCustomChatBackground();
                        renderCustomThemeEditorPage();
                    };
                    bgRow.appendChild(deleteBtn);
                } else {
                    // Карточка "Без фона"
                    const noBgCard = document.createElement('div');
                    noBgCard.style.cssText = `
                        position: relative;
                        width: 80px;
                        height: 80px;
                        border-radius: 14px;
                        background: #19191a;
                        border: 2px solid var(--vkui--color_text_accent, #FF5C5C);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #ffffff;
                        font-size: 12px;
                        cursor: pointer;
                        flex-shrink: 0;
                    `;
                    noBgCard.innerHTML = `
                        <div style="position: absolute; top: 6px; left: 6px; width: 20px; height: 20px; border-radius: 50%; background: #ffffff; color: #000000; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</div>
                        <div style="opacity: 0.7;">Без фона</div>
                    `;
                    bgRow.appendChild(noBgCard);
                }

                tabContentContainer.appendChild(bgRow);
            } else {
                // Вкладка «Цвет»
                const colorRow = document.createElement('div');
                colorRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    overflow-x: auto;
                    padding: 8px 0 16px 0;
                    -webkit-overflow-scrolling: touch;
                `;

                CHAT_COLOR_PRESETS.forEach(preset => {
                    const isSelected = (currentCustomChatColor.toLowerCase() === preset.value.toLowerCase());
                    const swatch = document.createElement('div');
                    swatch.title = preset.label;
                    swatch.style.cssText = `
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: ${preset.value};
                        border: ${isSelected ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)'};
                        box-shadow: ${isSelected ? '0 0 0 2px var(--vkui--color_text_accent, #FF5C5C), 0 4px 8px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.2)'};
                        cursor: pointer;
                        flex-shrink: 0;
                        transition: transform 0.15s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;

                    if (isSelected) {
                        swatch.innerHTML = '<span style="color: #ffffff; font-size: 14px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.6);">✓</span>';
                    }

                    swatch.onclick = (e) => {
                        e.preventDefault();
                        currentCustomChatColor = preset.value;
                        setSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, preset.value);
                        currentChatPreset = 'custom';
                        setSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'custom');

                        const outBubbles = previewContainer.querySelectorAll('.vmu-preview-out-bubble');
                        outBubbles.forEach(b => {
                            b.style.background = preset.value;
                            b.style.backgroundColor = preset.value;
                        });

                        applyCustomChatBackground();
                        updateTabContent();
                    };

                    colorRow.appendChild(swatch);
                });

                // Палитра выбора произвольного цвета (Color picker)
                const customColorPicker = document.createElement('label');
                customColorPicker.title = 'Свой цвет';
                customColorPicker.style.cssText = `
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
                    border: 1px solid rgba(255,255,255,0.3);
                    cursor: pointer;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    position: relative;
                    overflow: hidden;
                `;

                const hiddenColorInput = document.createElement('input');
                hiddenColorInput.type = 'color';
                hiddenColorInput.value = currentCustomChatColor.startsWith('#') ? currentCustomChatColor : '#2c2d2e';
                hiddenColorInput.style.cssText = 'position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;';

                hiddenColorInput.onchange = (e) => {
                    const chosen = e.target.value;
                    currentCustomChatColor = chosen;
                    setSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, chosen);
                    currentChatPreset = 'custom';
                    setSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'custom');

                    const outBubbles = previewContainer.querySelectorAll('.vmu-preview-out-bubble');
                    outBubbles.forEach(b => {
                        b.style.background = chosen;
                        b.style.backgroundColor = chosen;
                    });

                    applyCustomChatBackground();
                    updateTabContent();
                };

                customColorPicker.appendChild(hiddenColorInput);
                colorRow.appendChild(customColorPicker);

                tabContentContainer.appendChild(colorRow);
            }
        }

        tabBg.onclick = (e) => {
            e.preventDefault();
            customThemeActiveTab = 'bg';
            tabBg.style.fontWeight = '600';
            tabBg.style.color = 'var(--vkui--color_text_primary, #ffffff)';
            tabBg.style.borderBottom = '2.5px solid var(--vkui--color_text_accent, #FF5C5C)';
            tabColor.style.fontWeight = '400';
            tabColor.style.color = 'var(--vkui--color_text_secondary, #828282)';
            tabColor.style.borderBottom = '2.5px solid transparent';
            updateTabContent();
        };

        tabColor.onclick = (e) => {
            e.preventDefault();
            customThemeActiveTab = 'color';
            tabColor.style.fontWeight = '600';
            tabColor.style.color = 'var(--vkui--color_text_primary, #ffffff)';
            tabColor.style.borderBottom = '2.5px solid var(--vkui--color_text_accent, #FF5C5C)';
            tabBg.style.fontWeight = '400';
            tabBg.style.color = 'var(--vkui--color_text_secondary, #828282)';
            tabBg.style.borderBottom = '2.5px solid transparent';
            updateTabContent();
        };

        updateTabContent();
        overlay.appendChild(tabContentContainer);
    }

    function renderMailAppearancePage() {
        if (!isMailAppearancePage()) return;

        // Фиксируем кнопку «Назад» в шапке нативной страницы
        const backBtns = document.querySelectorAll(
            '.vkuiPanelHeaderBack, [class*="PanelHeaderBack"], [aria-label*="Назад" i], [aria-label*="назад" i], [data-testid="header-back"], .vkuiPanelHeader__before a, .vkuiPanelHeader__before button, .vkuiPanelHeader__before [role="button"]'
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

        // Удаляем старую отдельную карточку, если осталась
        const oldCard = document.getElementById(MAIL_APPEARANCE_UI_ID);
        if (oldCard) oldCard.remove();

        // Внедряем пункт «Своё» в карусель тем
        injectCustomThemeOptionInCarousel();
    }

    function applyCustomChatBackground() {
        currentChatPreset = getStringSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'classic');
        const isCustom = (currentChatPreset === 'custom');
        let customBg = null;
        let customColor = getStringSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, '#2c2d2e');

        try {
            customBg = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHAT_BG);
        } catch(e) {}

        const html = document.documentElement;
        if (html) {
            html.style.setProperty('--vmu-custom-chat-bg', customBg ? `url("${customBg}")` : 'none');
            html.style.setProperty('--vmu-custom-chat-bubble', customColor);
            html.style.setProperty('--vmu-custom-chat-bubble-gradient', customColor.startsWith('linear-gradient') ? customColor : 'none');
            html.style.setProperty('--vmu-custom-chat-bubble-color', customColor.startsWith('linear-gradient') ? '#2c2d2e' : customColor);
        }

        if (document.body) {
            if (isCustom) {
                if (!document.body.classList.contains('vmu-theme-custom-active')) {
                    document.body.classList.add('vmu-theme-custom-active');
                }
                if (customBg) {
                    document.body.classList.add('vmu-has-custom-chat-bg');
                } else {
                    document.body.classList.remove('vmu-has-custom-chat-bg');
                }

                // Управление постоянным фиксированным фоновым слоем
                let bgLayer = document.getElementById('vmu-chat-custom-wallpaper');
                if (customBg) {
                    if (!bgLayer) {
                        bgLayer = document.createElement('div');
                        bgLayer.id = 'vmu-chat-custom-wallpaper';
                        document.body.prepend(bgLayer);
                    }
                    bgLayer.style.setProperty('background-image', `url("${customBg}")`, 'important');
                } else {
                    if (bgLayer) bgLayer.remove();
                }
            } else {
                document.body.classList.remove('vmu-theme-custom-active');
                document.body.classList.remove('vmu-has-custom-chat-bg');
                const bgLayer = document.getElementById('vmu-chat-custom-wallpaper');
                if (bgLayer) bgLayer.remove();
            }
        }

        try { fixChatElementsDirectly(); } catch (e) {}
    }

    function fixChatElementsDirectly() {
        currentChatPreset = getStringSetting(STORAGE_KEYS.CHAT_THEME_PRESET, 'classic');
        const isCustom = (currentChatPreset === 'custom');
        if (!isCustom) return;

        let customBg = null;
        let customColor = getStringSetting(STORAGE_KEYS.CUSTOM_CHAT_COLOR, '#2c2d2e');
        try {
            customBg = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHAT_BG);
        } catch(e) {}

        const inChat = isChatPage();

        // 1. Управление статичным фоном в чате
        let bgLayer = document.getElementById('vmu-chat-custom-wallpaper');
        if (inChat && customBg) {
            document.body.classList.add('vmu-in-chat');
            if (!bgLayer) {
                bgLayer = document.createElement('div');
                bgLayer.id = 'vmu-chat-custom-wallpaper';
                document.body.prepend(bgLayer);
            }
            bgLayer.style.setProperty('background-image', `url("${customBg}")`, 'important');
            bgLayer.style.setProperty('display', 'block', 'important');

            const containersToClear = document.querySelectorAll(
                '#root, .vkuiRoot, .vkuiSplitLayout, .vkuiSplitCol, .vkuiView, .vkuiPanel, .vkuiPanel__in, main, .layout, .vkmChat, [class*="ChatHistory"], [class*="MessagesList"], [class*="im-page"], [class*="ChatView"], [class*="ChatLayout"], [class*="Conversation"]'
            );
            for (let i = 0; i < containersToClear.length; i++) {
                containersToClear[i].style.setProperty('background-color', 'transparent', 'important');
                containersToClear[i].style.setProperty('background', 'transparent', 'important');
                containersToClear[i].style.setProperty('background-image', 'none', 'important');
            }
        } else {
            document.body.classList.remove('vmu-in-chat');
            if (bgLayer) {
                bgLayer.style.setProperty('display', 'none', 'important');
            }
        }

        // 2. Полное подавление любых нативных обоев, картинок и узоров темы VK
        const nativeWallpapers = document.querySelectorAll(
            '.vkmChatWallpaper, [class*="ChatWallpaper"], [class*="Wallpaper"], [class*="ChatBackground"], [class*="ChatTheme"], [class*="Chat__wallpaper"], [class*="im-chat-wallpaper"], [data-testid*="wallpaper"], [data-testid*="chat-wallpaper"]'
        );
        for (let i = 0; i < nativeWallpapers.length; i++) {
            const wp = nativeWallpapers[i];
            wp.style.setProperty('display', 'none', 'important');
            wp.style.setProperty('opacity', '0', 'important');
            wp.style.setProperty('visibility', 'hidden', 'important');
            wp.style.setProperty('background-image', 'none', 'important');
            const innerMedia = wp.querySelectorAll('img, svg, picture, video, canvas, div');
            for (let j = 0; j < innerMedia.length; j++) {
                innerMedia[j].style.setProperty('display', 'none', 'important');
                innerMedia[j].style.setProperty('opacity', '0', 'important');
                innerMedia[j].style.setProperty('visibility', 'hidden', 'important');
            }
        }

        // 3. Динамическая покраска ТОЛЬКО текстовых исходящих сообщений
        const isGrad = customColor.startsWith('linear-gradient');
        const outRows = document.querySelectorAll(
            '[class*="vkmMessage--out"], [class*="vkmMessage_out"], [class*="Message--out"], [class*="Message_out"], [class*="Message--outgoing"], [class*="im-mess_out"], [class*="im-mess--out"], [data-testid*="outgoing"], [class*="MessageBubble--outgoing"], [class*="MessageBubble--out"]'
        );
        for (let i = 0; i < outRows.length; i++) {
            const row = outRows[i];

            // Проверяем, является ли сообщение чистым медиа-вложением (видео/фото без текста)
            const hasMediaAttach = !!row.querySelector('.vkmMessage__attachment, [class*="attachment" i], [class*="VideoCard" i], [class*="Snippet" i], [class*="WallPost" i], video, iframe');
            const hasText = !!(row.querySelector('.vkmMessage__text, [class*="text" i]') && row.querySelector('.vkmMessage__text, [class*="text" i]').textContent.trim());

            // Очищаем кнопку действий «...» слева от пузыря
            const actions = row.querySelectorAll('[class*="actions" i], [class*="action" i], [class*="tools" i]');
            for (let a = 0; a < actions.length; a++) {
                actions[a].style.setProperty('background', 'transparent', 'important');
                actions[a].style.setProperty('background-color', 'transparent', 'important');
                actions[a].style.setProperty('background-image', 'none', 'important');
            }

            // Находим ТОЛЬКО главный пузырь сообщения
            let bubble = row.querySelector('.vkmMessage__bubble, .im-mess--bubble, .Message__bubble, [class*="MessageBubble"]');
            if (!bubble) {
                const children = row.children;
                for (let c = 0; c < children.length; c++) {
                    const ch = children[c];
                    const cls = (ch.className && typeof ch.className === 'string') ? ch.className.toLowerCase() : '';
                    if (!cls.includes('action') && !cls.includes('tool') && !cls.includes('avatar') && !cls.includes('author')) {
                        bubble = ch;
                        break;
                    }
                }
            }

            if (bubble) {
                if (hasMediaAttach && !hasText) {
                    // Чистое медиа-вложение: не красим фон пузыря
                    bubble.style.setProperty('background', 'transparent', 'important');
                    bubble.style.setProperty('background-color', 'transparent', 'important');
                    bubble.style.setProperty('background-image', 'none', 'important');
                } else {
                    // Обычное текстовое сообщение: красим пузырь
                    if (isGrad) {
                        bubble.style.setProperty('background', customColor, 'important');
                        bubble.style.setProperty('background-image', customColor, 'important');
                    } else {
                        bubble.style.setProperty('background', customColor, 'important');
                        bubble.style.setProperty('background-color', customColor, 'important');
                        bubble.style.setProperty('background-image', 'none', 'important');
                    }
                    bubble.style.setProperty('color', '#ffffff', 'important');

                    // Очищаем внутренний текст/контент, чтобы не было вложенного прямоугольника
                    const innerContents = bubble.querySelectorAll('.vkmMessage__text, .vkmMessage__content, .vkmMessage__in, [class*="content" i], [class*="text" i]');
                    for (let ic = 0; ic < innerContents.length; ic++) {
                        innerContents[ic].style.setProperty('background', 'transparent', 'important');
                        innerContents[ic].style.setProperty('background-color', 'transparent', 'important');
                        innerContents[ic].style.setProperty('background-image', 'none', 'important');
                        innerContents[ic].style.setProperty('color', '#ffffff', 'important');
                    }
                }
            }
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
                if (child.id !== SCRIPT_MENU_UI_ID && child.id !== DEBUG_SCRIPT_UI_ID && child.id !== SETTINGS_UI_ID && child.id !== CUSTOM_THEME_EDITOR_UI_ID) {
                    if (!child.contains(document.getElementById(SCRIPT_MENU_UI_ID)) && !child.contains(document.getElementById(DEBUG_SCRIPT_UI_ID)) && !child.contains(document.getElementById(CUSTOM_THEME_EDITOR_UI_ID))) {
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
            if (parent && !parent.closest('#' + SCRIPT_MENU_UI_ID) && !parent.closest('#' + DEBUG_SCRIPT_UI_ID) && !parent.closest('#' + CUSTOM_THEME_EDITOR_UI_ID)) {
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
            if (!el.closest('#' + SCRIPT_MENU_UI_ID) && !el.closest('#' + DEBUG_SCRIPT_UI_ID) && !el.closest('#' + CUSTOM_THEME_EDITOR_UI_ID)) {
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
        const isCustomEditor = isCustomThemeEditorPage();
        const isMailApp = isMailAppearancePage();

        const existingCard = document.getElementById(SETTINGS_UI_ID);
        const existingMenuCard = document.getElementById(SCRIPT_MENU_UI_ID);
        const existingDebugCard = document.getElementById(DEBUG_SCRIPT_UI_ID);
        const existingEditorCard = document.getElementById(CUSTOM_THEME_EDITOR_UI_ID);
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
        if (!isCustomEditor && existingEditorCard) {
            existingEditorCard.remove();
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

        if (isCustomEditor) {
            renderCustomThemeEditorPage();
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

        // 2. Мессенджер (переход в оформление всех чатов и фон из галереи)
        const rowMessenger = createNavRow(
            'Мессенджер',
            'Оформление всех чатов и фон из галереи',
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
            const btn = el.closest('button, [role="button"], [class*="IconButton"], [class*="Tappable"], [class*="ConvoItem__actions"], [class*="ConvoItem__more"], [class*="im-dialog--actions"]') || el;
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
        const customParams = getCustomIconParams();
        const p = customParams[targetKey] || { scale: 100, stroke: 1.5 };
        const svgSig = `${targetKey}_${p.scale || 100}_${p.stroke || 1.5}`;

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

    function runAllFixes() {
        if (isRunningFixes) return;
        isRunningFixes = true;
        try {
            try { updatePageBodyClasses(); } catch (e) {}
            try { applyStyles(); } catch (e) {}
            try { syncCurrentTheme(); } catch (e) {}
            try { applyCustomChatBackground(); } catch (e) {}
            try { clearNativeThemeCheckmarks(); } catch (e) {}
            try { fixChatElementsDirectly(); } catch (e) {}
            try { hideMailSettingsAppearanceItem(); } catch (e) {}
            try { updateSettingsVisibility(); } catch (e) {}
            try { handleUnreadFilter(); } catch (e) {}
            try { hideChatListActions(); } catch (e) {}
            try { hideCallsAndVideoMessages(); } catch (e) {}
            try { updateCustomTabs(); } catch (e) {}
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

// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      2.20.0
// @description  Улучшение интерфейса m.vk.ru: выбор тем (Светлая, Тёмная, Snow Black), кастомизация кнопки «Поиск» в нижней панели (Друзья, Сообщества, Музыка, Видео, Закладки), скрытие подписей, круглые счетчики, кнопка «Только непрочитанные» в шапке, скрытие меню действий в списке чатов, скрытие панели папок, отключение звонков и видеосообщений (кружков).
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
        HIDE_VIDEO_MSGS: 'vmu_hide_video_msgs'
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

    // ==========================================
    //     ОПРЕДЕЛЕНИЯ ИКОНОК И ВКЛАДОК
    // ==========================================
    const TAB_DEFINITIONS = {
        search: {
            label: 'Поиск',
            href: '/discover',
            matchPaths: ['/discover', '/search', '/feed?section=search', '/discover_search'],
            svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--search_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M12.5 3.5a9 9 0 1 0 5.7 15.98l4.41 4.41a1 1 0 0 0 1.42-1.42l-4.41-4.41A9 9 0 0 0 12.5 3.5ZM5.5 12.5a7 7 0 1 1 14 0 7 7 0 0 1-14 0Z" clip-rule="evenodd"/></svg>`
        },
        friends: {
            label: 'Друзья',
            href: '/friends',
            matchPaths: ['/friends'],
            svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--users_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M12 5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM9.5 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM20.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-2.5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.5 14c-3.038 0-5.5 2.462-5.5 5.5v.75a1.75 1.75 0 0 0 1.75 1.75h11.5A1.75 1.75 0 0 0 17 20.25v-.75c0-3.038-2.462-5.5-5.5-5.5Zm-3 5.5c0-1.657 1.343-3 3-3s3 1.343 3 3v.75a.25.25 0 0 1-.25.25H4.75a.25.25 0 0 1-.25-.25v-.75Zm14.5-3.415c1.472.482 2.5 1.83 2.5 3.415v.75a1.75 1.75 0 0 1-1.75 1.75h-1.5a1 1 0 0 1 0-2h1.5a.25.25 0 0 0 .25-.25v-.75c0-.966-.784-1.75-1.75-1.75h-.5a1 1 0 1 1 0-2h.5c.264 0 .52.04.75.115Z" clip-rule="evenodd"/></svg>`
        },
        groups: {
            label: 'Сообщества',
            href: '/groups',
            matchPaths: ['/groups', '/communities', '/groups_list'],
            svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--users_3_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M14 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12.5 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM6 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5.5 10a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM22 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-1.5 3a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM14 13.5c-3.175 0-5.75 2.575-5.75 5.75v1a1.75 1.75 0 0 0 1.75 1.75h8a1.75 1.75 0 0 0 1.75-1.75v-1c0-3.175-2.575-5.75-5.75-5.75Zm-3.25 5.75c0-1.795 1.455-3.25 3.25-3.25s3.25 1.455 3.25 3.25v1a.25.25 0 0 1-.25.25H11a.25.25 0 0 1-.25-.25v-1ZM6 15.5c1.47 0 2.768.618 3.682 1.608a1 1 0 0 1-1.464 1.362A3.242 3.242 0 0 0 6 17.5a.25.25 0 0 0-.25.25v.75a1 1 0 0 1-2 0v-.75C3.75 16.284 4.784 15.5 6 15.5Zm16 0c1.216 0 2.25.784 2.25 2.25v.75a1 1 0 1 1-2 0v-.75a.25.25 0 0 0-.25-.25 3.242 3.242 0 0 0-2.218.97 1 1 0 1 1-1.464-1.362A5.228 5.228 0 0 1 22 15.5Z" clip-rule="evenodd"/></svg>`
        },
        music: {
            label: 'Музыка',
            href: '/audio',
            matchPaths: ['/audio', '/audios', '/music', '/audio_feed'],
            svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--music_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M19.75 4a1 1 0 0 1 .993.883L20.75 5v10.75a4.75 4.75 0 1 1-2-3.873V7.618l-8.5 2.125V17.75a4.75 4.75 0 1 1-2-3.873V6a1 1 0 0 1 .757-.97l11.5-2.875A1 1 0 0 1 19.75 4ZM6.25 18.5a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 0 0-5.5 0Zm10-2a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 0 0-5.5 0Zm2.5-8.882L10.25 9.743V7.07l8.5-2.125v2.673Z" clip-rule="evenodd"/></svg>`
        },
        video: {
            label: 'Видео',
            href: '/video',
            matchPaths: ['/video', '/videos', '/vk_video'],
            svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--video_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M4.75 6A2.75 2.75 0 0 0 2 8.75v10.5A2.75 2.75 0 0 0 4.75 22h12.5A2.75 2.75 0 0 0 20 19.25V17.7l4.135 2.481A1.75 1.75 0 0 0 26.75 18.68V9.32a1.75 1.75 0 0 0-2.615-1.501L20 10.3V8.75A2.75 2.75 0 0 0 17.25 6H4.75Zm13.25 4.75v6.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V8.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 .75.75v2Zm2 4.148 4.75 2.85v-7.496l-4.75 2.85v1.796Z" clip-rule="evenodd"/></svg>`
        },
        bookmarks: {
            label: 'Закладки',
            href: '/bookmarks',
            matchPaths: ['/bookmarks', '/fave'],
            svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" class="vkuiIcon vkuiIcon--28 vkuiIcon--bookmark_outline_28"><path fill="currentColor" fill-rule="evenodd" d="M7 4a3 3 0 0 0-3 3v16a1 1 0 0 0 1.55.83L14 18.25l8.45 5.58A1 1 0 0 0 24 23V7a3 3 0 0 0-3-3H7zm15 16.92-7.45-4.92a1 1 0 0 0-1.1 0L6 20.92V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13.92z" clip-rule="evenodd"/></svg>`
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
    function isMainMailListPage() {
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        const path = window.location.pathname.toLowerCase();

        // 1. Исключаем все разделы, не относящиеся к диалогам
        if (path.startsWith('/settings') || path.startsWith('/menu') || path.startsWith('/feed') ||
            path.startsWith('/clips') || path.startsWith('/video') || path.startsWith('/music') ||
            path.startsWith('/id') || path.startsWith('/wall') || path.startsWith('/friends') ||
            path.startsWith('/groups') || path.startsWith('/photos') || path.startsWith('/docs') ||
            path.startsWith('/bookmarks') || path.startsWith('/call') || search.includes('act=appearance')) {
            return false;
        }

        // 2. Если открыт конкретный диалог / чат / написание сообщения
        if (search.includes('peer=') || search.includes('sel=') || search.includes('act=show') ||
            search.includes('act=archive') || search.includes('act=folders') || search.includes('act=settings') ||
            search.includes('act=write') || hash.includes('peer=') || hash.includes('sel=') ||
            path.startsWith('/write') || path.startsWith('/convo') || path.includes('/im/convo') ||
            path.includes('/im/chat') || path.includes('/im/peer')) {
            return false;
        }

        // 3. Если внутри шапки есть кнопка "Назад" (стрелочка) или "Закрыть" (крестик)
        const backBtn = document.querySelector(
            '[aria-label*="Назад" i], [aria-label*="назад" i], [aria-label*="Закрыть" i], [aria-label*="закрыть" i], [data-testid="header-back"], [class*="PanelHeaderBack"], [class*="Header__back"], [class*="Icon--chevron_left"], [class*="Icon--back"], [class*="Icon--arrow_left"]'
        );
        if (backBtn && backBtn.closest('.vkuiPanelHeader, [class*="PanelHeader"], .vkmListHeader, [class*="vkmListHeader"]')) {
            return false;
        }

        // 4. Проверка строки ввода (WriteBar) — признак открытого диалога
        const writeBars = document.querySelectorAll(
            '[class*="WriteBar"], [class*="writeBar"], [class*="Writebar"], [class*="write_bar"], [class*="im-chat-input"], [class*="writebox"]'
        );
        for (let i = 0; i < writeBars.length; i++) {
            const wb = writeBars[i];
            if (wb.offsetWidth > 0 && wb.offsetHeight > 0 && wb.offsetParent !== null) {
                return false;
            }
        }

        // 5. Заголовок шапки
        const titleEl = document.querySelector(
            '.vkmListHeader__title, [class*="vkmListHeader__title"], .vkuiPanelHeader__typography, [class*="PanelHeader__typography"], .vkuiPanelHeader__content, [class*="PanelHeader__content"]'
        );
        if (titleEl && titleEl.textContent) {
            const titleText = titleEl.textContent.trim().toLowerCase();
            if (titleText === 'архив' || titleText === 'папки с чатами' || titleText.includes('участник') || titleText.includes('онлайн') || titleText.includes('был') || titleText.includes('была')) {
                return false;
            }
        }

        // 6. Только если путь относится к почте / сообщениям
        if (path.startsWith('/mail') || path.startsWith('/im')) {
            return true;
        }

        return false;
    }

    function isAppearancePage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();

        if (path.startsWith('/im') || path.startsWith('/mail') || path.startsWith('/feed') ||
            path.startsWith('/clips') || path.startsWith('/video') || path.startsWith('/music') ||
            path.startsWith('/id') || path.startsWith('/wall') || path.startsWith('/audios') ||
            path.startsWith('/friends') || path.startsWith('/groups') || path.startsWith('/photos') ||
            path.startsWith('/docs') || path.startsWith('/bookmarks') || path.startsWith('/call')) {
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

    function updateSettingsVisibility() {
        const isAppearance = isAppearancePage();
        const existingCard = document.getElementById(SETTINGS_UI_ID);

        if (!isAppearance) {
            if (existingCard) {
                existingCard.remove();
            }
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
            margin: 20px 0 90px 0 !important;
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

        // 4. Скрыть панель папок / категорий
        const rowFolders = createSwitchRow(
            'Скрыть вкладки папок в мессенджере',
            'Убирает панель категорий (Все, Каналы, Бизнес, Чаты) и лишние отступы',
            isHideFoldersEnabled,
            (checked) => {
                isHideFoldersEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_FOLDERS_BAR, isHideFoldersEnabled);
                applyStyles();
            }
        );
        card.appendChild(rowFolders);

        // 5. Отключить звонки в чатах
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

        // 6. Отключить видеосообщения (кружки)
        const rowVideo = createSwitchRow(
            'Отключить видеосообщения (кружки)',
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

        // 3. Текстовая подпись - глубокий поиск и обновление всех текстовых узлов
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const p = node.parentElement;
                if (!p) return NodeFilter.FILTER_REJECT;
                if (p.closest('.vkuiTabbarItem__icon, [class*="TabbarItem__icon"], [class*="Counter"], [class*="Badge"], [class*="Indicator"], [class*="badge"], [class*="counter"]')) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.textContent.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        });

        let foundTextNode = false;
        let textNode;
        while ((textNode = walker.nextNode())) {
            if (textNode.textContent.trim() !== def.label) {
                textNode.textContent = def.label;
            }
            foundTextNode = true;
        }

        let textEl = item.querySelector(
            '.vkuiTabbarItem__text, .vkuiTabbarItem__children, [class*="TabbarItem__text"], [class*="TabBarItem__text"], [class*="TabbarItem__children"], [class*="TabBarItem__children"], .bottom_nav__text, .bottom_nav__label'
        );
        if (!textEl && !foundTextNode) {
            const inContainer = item.querySelector('.vkuiTabbarItem__in, [class*="TabbarItem__in"]') || item;
            const spans = inContainer.querySelectorAll('span');
            for (let s = 0; s < spans.length; s++) {
                if (!spans[s].querySelector('svg') && !spans[s].className.includes('icon') && !spans[s].className.includes('Badge') && !spans[s].className.includes('Counter') && !spans[s].className.includes('indicator')) {
                    textEl = spans[s];
                    break;
                }
            }
        }
        if (textEl && textEl.textContent.trim() !== def.label) {
            textEl.textContent = def.label;
        }

        // 4. Иконка SVG
        const iconContainer = item.querySelector('.vkuiTabbarItem__icon, [class*="TabbarItem__icon"], [class*="TabBarItem__icon"]') || item;
        const existingSvg = iconContainer.querySelector('svg');

        if (!existingSvg || existingSvg.dataset.vmuSvg !== targetKey) {
            const temp = document.createElement('div');
            temp.innerHTML = def.svg.trim();
            const newSvg = temp.firstElementChild;
            newSvg.dataset.vmuSvg = targetKey;

            if (existingSvg) {
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
            try { updateSettingsVisibility(); } catch (e) {}
            try { handleUnreadFilter(); } catch (e) {}
            try { hideChatListActions(); } catch (e) {}
            try { hideCallsAndVideoMessages(); } catch (e) {}
            try { updateCustomTabs(); } catch (e) {}
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
        observer = new MutationObserver(() => {
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

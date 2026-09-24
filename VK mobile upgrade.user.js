// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      2.8.0
// @description  Улучшение интерфейса m.vk.ru: смена акцентных цветов, скрытие подписей в нижней панели, круглые счетчики, кнопка «Только непрочитанные» в шапке мессенджера, скрытие меню действий в списке чатов и исправление верстки.
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
        COLOR_SWAP: 'vmu_color_swap',
        HIDE_TAB_LABELS: 'vmu_hide_tab_labels'
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

    function setSetting(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch (e) {}
    }

    let isColorSwapEnabled = getSetting(STORAGE_KEYS.COLOR_SWAP, true);
    let isHideLabelsEnabled = getSetting(STORAGE_KEYS.HIDE_TAB_LABELS, false);

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

        /* 5. СКРЫТИЕ КНОПКИ ДЕЙСТВИЙ (3 ТОЧКИ) В СПИСКЕ ДИАЛОГОВ И СМЕЩЕНИЕ СЧЕТЧИКА ВПРАВО */
        body.vmu-page-mail [class*="SimpleCell__after"] > *:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="Cell__after"] > *:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="SimpleCell__after"] button,
        body.vmu-page-mail [class*="SimpleCell__after"] [class*="IconButton"],
        body.vmu-page-mail [class*="SimpleCell__after"] [class*="Tappable"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="Cell__after"] button,
        body.vmu-page-mail [class*="Cell__after"] [class*="IconButton"],
        body.vmu-page-mail [class*="Cell__after"] [class*="Tappable"]:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        body.vmu-page-mail [class*="Icon--more_vertical"],
        body.vmu-page-mail [class*="Icon--more_horizontal"],
        body.vmu-page-mail [class*="Icon--more"],
        body.vmu-page-mail [class*="ConvoItem__actions"],
        body.vmu-page-mail [class*="im-dialog--actions"],
        body.vmu-page-mail [class*="ConvoItem__more"],
        [class*="ConvoList"] [class*="SimpleCell__after"] > *:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        [class*="ConvoItem"] [class*="SimpleCell__after"] > *:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        [class*="im-dialog"] [class*="SimpleCell__after"] > *:not([class*="Counter"]):not([class*="Badge"]):not(.vkuiCounter):not(.im_peer_counter),
        [class*="ConvoList"] [class*="SimpleCell__after"] button,
        [class*="ConvoList"] [class*="SimpleCell__after"] [class*="IconButton"],
        [class*="ConvoItem"] [class*="SimpleCell__after"] button,
        [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="IconButton"],
        [class*="im-dialog"] [class*="SimpleCell__after"] button,
        [class*="im-dialog"] [class*="SimpleCell__after"] [class*="IconButton"],
        [class*="ConvoList"] [class*="Icon--more_vertical"],
        [class*="ConvoItem"] [class*="Icon--more_vertical"],
        [class*="im-dialog"] [class*="Icon--more_vertical"] {
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

        /* Контейнер окончания ячейки и перенос счетчика к правому краю */
        body.vmu-page-mail [class*="SimpleCell__after"],
        body.vmu-page-mail [class*="Cell__after"] {
            margin-right: 0 !important;
            padding-right: 0 !important;
        }

        body.vmu-page-mail [class*="SimpleCell__after"] [class*="Counter"],
        body.vmu-page-mail [class*="SimpleCell__after"] [class*="Badge"],
        body.vmu-page-mail [class*="SimpleCell__after"] .vkuiCounter,
        body.vmu-page-mail [class*="SimpleCell__after"] .im_peer_counter,
        body.vmu-page-mail [class*="Cell__after"] [class*="Counter"],
        body.vmu-page-mail [class*="Cell__after"] [class*="Badge"],
        body.vmu-page-mail [class*="Cell__after"] .vkuiCounter,
        body.vmu-page-mail [class*="Cell__after"] .im_peer_counter,
        [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="Counter"],
        [class*="ConvoItem"] [class*="SimpleCell__after"] [class*="Badge"],
        [class*="ConvoItem"] [class*="SimpleCell__after"] .vkuiCounter,
        [class*="ConvoList"] [class*="SimpleCell__after"] [class*="Counter"],
        [class*="ConvoList"] [class*="SimpleCell__after"] [class*="Badge"],
        [class*="ConvoList"] [class*="SimpleCell__after"] .vkuiCounter,
        [class*="SimpleCell__after"] [class*="Counter"],
        [class*="SimpleCell__after"] [class*="Badge"],
        [class*="SimpleCell__after"] .vkuiCounter,
        [class*="SimpleCell__after"] .im_peer_counter {
            display: inline-flex !important;
            visibility: visible !important;
            pointer-events: auto !important;
            margin-left: auto !important;
            margin-right: 0 !important;
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
        /* СКРЫТИЕ ПОДПИСЕЙ В НИЖНЕЙ НАВИГАЦИОННОЙ ПАНЕЛИ */
        [class*="TabbarItem__label"],
        [class*="TabBarItem__label"],
        [class*="TabbarItem__text"],
        [class*="TabBarItem__text"],
        .vkuiTabbarItem__label,
        .vkuiTabbarItem__text,
        .bottom_nav__label,
        .bottom_nav__text,
        #bottom_nav [class*="label"],
        #bottom_nav [class*="text"],
        .bottom_nav [class*="label"],
        .bottom_nav [class*="text"],
        [class*="TabbarItem"] > [class*="TabbarItem__in"] > span:last-child:not([class*="Counter"]):not([class*="Badge"]),
        [class*="TabBarItem"] > [class*="TabBarItem__in"] > span:last-child:not([class*="Counter"]):not([class*="Badge"]),
        .vkuiTabbarItem > .vkuiTabbarItem__in > span:last-child:not([class*="Counter"]):not([class*="Badge"]) {
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

        /* Центрирование иконок в таб-баре */
        [class*="TabbarItem"],
        [class*="TabBarItem"],
        .vkuiTabbarItem,
        .bottom_nav__item,
        #bottom_nav a,
        .bottom_nav a {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        [class*="TabbarItem__in"],
        [class*="TabBarItem__in"],
        .vkuiTabbarItem__in,
        .bottom_nav__in {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100% !important;
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

        // 1. Если есть параметры перехода в конкретный чат/архив/папки/настройки
        if (search.includes('peer=') || search.includes('sel=') || search.includes('act=show') ||
            search.includes('act=archive') || search.includes('act=folders') || search.includes('act=settings') ||
            search.includes('act=write') || hash.includes('peer=') || hash.includes('sel=')) {
            return false;
        }

        // 2. Если в шапке есть кнопка "Назад" (стрелочка) или "Закрыть" (крестик) -> это экран внутри чата/архива/папок
        const beforeBtn = document.querySelector(
            '.vkuiPanelHeader__before, [class*="PanelHeader__before"], .vkmListHeader__before, [class*="vkmListHeader__before"], [aria-label="Назад"], [aria-label="Закрыть"], [data-testid="header-back"]'
        );
        if (beforeBtn && beforeBtn.querySelector('svg, [class*="Icon"]')) {
            return false;
        }

        // 3. Заголовок шапки
        const titleEl = document.querySelector(
            '.vkmListHeader__title, [class*="vkmListHeader__title"], .vkuiPanelHeader__typography, [class*="PanelHeader__typography"], .vkuiPanelHeader__content, [class*="PanelHeader__content"]'
        );
        if (titleEl && titleEl.textContent) {
            const titleText = titleEl.textContent.trim().toLowerCase();
            if (titleText === 'архив' || titleText === 'папки с чатами' || titleText.includes('участник') || titleText.includes('онлайн')) {
                return false;
            }
        }

        // 4. Проверяем наличие категорий или строки поиска основного мессенджера
        const hasSubnav = document.querySelector('[class*="SubnavigationBar"], .vkuiSubnavigationBar, [class*="ConvoList"]');
        const hasSearch = document.querySelector('input[placeholder*="Поиск"], [class*="Search"] input, .vkuiSearch input');
        const isMessengerTitle = titleEl && titleEl.textContent.trim().toLowerCase() === 'мессенджер';

        if (path.includes('/mail') || path.includes('/im') || isMessengerTitle || hasSubnav || hasSearch) {
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

    function createSwitchRow(title, desc, initialChecked, onToggle) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;

        const textCol = document.createElement('div');
        textCol.style.cssText = 'flex: 1; padding-right: 14px; pointer-events: none;';

        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size: 15px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff); line-height: 1.3;';
        titleEl.textContent = title;

        const descEl = document.createElement('div');
        descEl.style.cssText = 'font-size: 12px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px; line-height: 1.3;';
        descEl.textContent = desc;

        textCol.appendChild(titleEl);
        textCol.appendChild(descEl);

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
            cursor: pointer;
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

        function handleToggle(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            isChecked = !isChecked;
            switchBtn.setAttribute('aria-checked', isChecked ? 'true' : 'false');
            updateSwitchVisual(isChecked);
            onToggle(isChecked);
        }

        row.addEventListener('click', handleToggle, true);
        row.addEventListener('touchend', handleToggle, { passive: false });

        row.appendChild(textCol);
        row.appendChild(switchBtn);

        return row;
    }

    function updateSettingsVisibility() {
        const isAppearance = isAppearancePage();
        const existingCard = document.getElementById(SETTINGS_UI_ID);

        if (!isAppearance) {
            if (existingCard) {
                existingCard.remove();
            }
            return;
        }

        if (existingCard) return;

        const radio = document.querySelector('input[type="radio"], .vkuiRadio, [class*="Radio"], [class*="Appearance"]');
        let target = null;

        if (radio) {
            target = radio.closest('.vkuiGroup, [class*="Group"]') || radio.parentElement;
        }

        if (!target) {
            const groups = document.querySelectorAll('.vkuiGroup, [class*="Group"]');
            if (groups.length > 0) {
                target = groups[groups.length - 1];
            }
        }

        if (!target) return;

        const card = document.createElement('div');
        card.id = SETTINGS_UI_ID;
        card.className = 'vkuiGroup vkuiGroup--mode-card';
        card.style.cssText = `
            margin: 16px 12px 32px !important;
            background: var(--vkui--color_background_content, var(--background_content, #222222)) !important;
            border-radius: 14px !important;
            overflow: hidden !important;
            border: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08)) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif) !important;
            display: block !important;
            position: relative !important;
            z-index: 100 !important;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 14px 16px 8px !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.6px !important;
            color: var(--vkui--color_text_subhead, #888888) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08)) !important;
        `;
        header.innerHTML = `
            <span>🚀 VK Mobile Upgrade</span>
            <span style="font-size: 11px; font-weight: 600; opacity: 0.8; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 6px;">v2.8.0</span>
        `;
        card.appendChild(header);

        // Тумблер 1: Подмена цветов
        const row1 = createSwitchRow(
            'Подмена цветов темы',
            'Меняет местами #71AAEB (акценты/имена) и #FF5C5C (лайки/ошибки)',
            isColorSwapEnabled,
            (checked) => {
                isColorSwapEnabled = checked;
                setSetting(STORAGE_KEYS.COLOR_SWAP, isColorSwapEnabled);
                applyStyles();
            }
        );
        card.appendChild(row1);

        // Тумблер 2: Скрыть подписи на нижней панели
        const row2 = createSwitchRow(
            'Скрыть подписи на нижней панели',
            'Оставлять только иконки (Главная, Поиск, Мессенджер, Клипы, Ещё)',
            isHideLabelsEnabled,
            (checked) => {
                isHideLabelsEnabled = checked;
                setSetting(STORAGE_KEYS.HIDE_TAB_LABELS, isHideLabelsEnabled);
                applyStyles();
            }
        );
        row2.style.borderBottom = 'none';
        card.appendChild(row2);

        if (target.parentElement) {
            target.insertAdjacentElement('afterend', card);
        }
    }

    // ==========================================
    //    БЛОКИРОВКА КОНТЕКСТНОГО МЕНЮ В ЧАТАХ
    // ==========================================
    function interceptChatMoreActions(e) {
        if (!isMainMailListPage()) return;
        const target = e.target;
        if (!target || !target.closest) return;

        const moreBtn = target.closest(
            '[class*="Icon--more_vertical"], [class*="Icon--more_horizontal"], [class*="Icon--more"], [class*="ConvoItem__actions"], [class*="im-dialog--actions"], [class*="ConvoItem__more"], [aria-label*="действи" i], [aria-label*="меню" i], [data-testid*="more" i], [data-testid*="action" i]'
        );

        if (moreBtn && !moreBtn.closest('.vkuiPanelHeader, [class*="PanelHeader"], .vkmListHeader, [class*="vkmListHeader"], #vmu-top-unread-btn')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const cell = moreBtn.closest('[class*="SimpleCell"], [class*="Cell"], [class*="ConvoItem"], [class*="im-dialog"], [role="link"], a');
            if (cell && cell !== moreBtn) {
                cell.click();
            }
        }
    }

    document.addEventListener('click', interceptChatMoreActions, true);
    document.addEventListener('pointerdown', (e) => {
        if (!isMainMailListPage()) return;
        const target = e.target;
        if (!target || !target.closest) return;
        const moreBtn = target.closest(
            '[class*="Icon--more_vertical"], [class*="Icon--more_horizontal"], [class*="Icon--more"], [class*="ConvoItem__actions"], [class*="im-dialog--actions"], [class*="ConvoItem__more"], [aria-label*="действи" i], [aria-label*="меню" i], [data-testid*="more" i], [data-testid*="action" i]'
        );
        if (moreBtn && !moreBtn.closest('.vkuiPanelHeader, [class*="PanelHeader"], .vkmListHeader, [class*="vkmListHeader"], #vmu-top-unread-btn')) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, true);

    // ==========================================
    //       ИНИЦИАЛИЗАЦИЯ И MUTATION OBSERVER
    // ==========================================
    let isRunningFixes = false;
    let fixesScheduled = false;

    function runAllFixes() {
        if (isRunningFixes) return;
        isRunningFixes = true;
        try {
            updatePageBodyClasses();
            applyStyles();
            updateSettingsVisibility();
            handleUnreadFilter();
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

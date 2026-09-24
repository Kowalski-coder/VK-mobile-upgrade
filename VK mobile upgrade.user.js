// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      2.1
// @description  Улучшение интерфейса m.vk.ru: смена акцентных цветов, скрытие подписей в нижней панели, круглые счетчики, кнопка «Только непрочитанные» в шапке мессенджера и исправление верстки.
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
        /* 1. ИСПРАВЛЕНИЕ ОВАЛЬНЫХ СЧЕТЧИКОВ СООБЩЕНИЙ/УВЕДОМЛЕНИЙ -> КРУГЛЫЕ */
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

        /* 2. ОТСТУП СПИСКА ДИАЛОГОВ ПОД ШТОРКОЙ КАТЕГОРИЙ (m.vk.ru/mail) */
        [class*="HorizontalScroll"] + [class*="Group"],
        [class*="SubnavigationBar"] + [class*="Group"],
        [class*="Tabs"] + [class*="Group"],
        [class*="HorizontalScroll"] + div,
        [class*="SubnavigationBar"] + div {
            margin-top: 14px !important;
            padding-top: 4px !important;
        }

        /* 3. БЕЗОПАСНОЕ СКРЫТИЕ НИЖНЕЙ ШТОРКИ "ТОЛЬКО НЕПРОЧИТАННЫЕ" */
        [class*="FixedLayout--vertical-bottom"]:has(input):not(:has(nav)),
        [class*="FixedLayout--bottom"]:has(input):not(:has(nav)),
        .vkuiFixedLayout--vertical-bottom:has(input):not(:has(nav)),
        [class*="im-page--unread-filter"],
        [class*="im-unread-filter"] {
            display: none !important;
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
        /* СТРОГО ВНУТРИ НИЖНЕЙ НАВИГАЦИОННОЙ ПАНЕЛИ (TABBAR) */
        nav.vkuiTabbar .vkuiTabbarItem__label,
        nav[class*="Tabbar"] [class*="TabbarItem__label"],
        nav[class*="TabBar"] [class*="TabBarItem__label"],
        nav[class*="Tabbar"] [class*="TabbarItem__text"],
        nav[class*="TabBar"] [class*="TabBarItem__text"],
        #bottom_nav [class*="label"],
        #bottom_nav [class*="text"],
        .bottom_nav [class*="label"],
        .bottom_nav [class*="text"],
        .bottom_nav__label,
        .bottom_nav__text {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            font-size: 0 !important;
            line-height: 0 !important;
            pointer-events: none !important;
        }

        /* Центрирование иконок в таб-баре */
        nav.vkuiTabbar .vkuiTabbarItem,
        nav[class*="Tabbar"] [class*="TabbarItem"],
        nav[class*="TabBar"] [class*="TabBarItem"],
        #bottom_nav a,
        .bottom_nav a,
        .bottom_nav__item {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        nav.vkuiTabbar .vkuiTabbarItem__in,
        nav[class*="Tabbar"] [class*="TabbarItem__in"],
        nav[class*="TabBar"] [class*="TabBarItem__in"],
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

    function updateBottomBarLabels() {
        if (!isHideLabelsEnabled) return;

        const navs = document.querySelectorAll(
            'nav.vkuiTabbar, nav[class*="Tabbar"], nav[class*="TabBar"], #bottom_nav, .bottom_nav, .Tabbar'
        );

        for (let i = 0; i < navs.length; i++) {
            const nav = navs[i];
            const items = nav.querySelectorAll('a, .vkuiTabbarItem, .TabbarItem, [class*="TabbarItem"], [class*="TabBarItem"], .bottom_nav__item');
            for (let j = 0; j < items.length; j++) {
                const item = items[j];
                const allElements = item.querySelectorAll('*');
                for (let k = 0; k < allElements.length; k++) {
                    const el = allElements[k];
                    if (el.tagName === 'SVG' || el.tagName === 'PATH' || el.closest('svg')) continue;
                    if (el.querySelector('svg')) continue;
                    const className = String(el.className || '');
                    if (className.includes('Counter') || className.includes('counter') || className.includes('Badge') || className.includes('badge')) continue;
                    if (el.closest('[class*="Counter"], [class*="counter"], [class*="Badge"], [class*="badge"]')) continue;

                    const text = el.textContent ? el.textContent.trim() : '';
                    if (text && !/^\d+$/.test(text)) {
                        el.style.setProperty('display', 'none', 'important');
                    }
                }
            }
        }
    }

    function applyStyles() {
        setOrRemoveStyle('vmu-base-fixes-styles', FIXES_CSS, true);
        setOrRemoveStyle('vmu-color-swap-styles', COLOR_SWAP_CSS, isColorSwapEnabled);
        setOrRemoveStyle('vmu-hide-labels-styles', HIDE_LABELS_CSS, isHideLabelsEnabled);
        if (isHideLabelsEnabled) {
            updateBottomBarLabels();
        }
    }

    // Применяем стили мгновенно
    applyStyles();

    // ==========================================
    //    ФИЛЬТР НЕПРОЧИТАННЫХ В ШАПКЕ (m.vk.ru/mail)
    // ==========================================
    const UNREAD_TOP_BTN_ID = 'vmu-top-unread-btn';

    function isMailOrMessengerPage() {
        const path = window.location.pathname.toLowerCase();
        return path.startsWith('/mail') || path.startsWith('/im') || path.includes('/mail') || path.includes('/im');
    }

    function findNativeUnreadSwitch() {
        const switches = document.querySelectorAll(
            '[class*="FixedLayout"] input[type="checkbox"], [class*="FixedLayout"] [role="switch"], [class*="unread"] input, #mail_filter_unread input'
        );
        for (let i = 0; i < switches.length; i++) {
            const sw = switches[i];
            const text = sw.closest('label, div, [class*="Cell"]')?.textContent || '';
            if (text.includes('непрочитанные') || text.includes('Непрочитанные')) {
                return sw;
            }
        }
        return switches[0] || null;
    }

    function injectTopUnreadToggle() {
        if (!isMailOrMessengerPage()) {
            const btn = document.getElementById(UNREAD_TOP_BTN_ID);
            if (btn) btn.remove();
            return;
        }

        if (document.getElementById(UNREAD_TOP_BTN_ID)) return;

        // Ищем правый блок шапки (рядом с архивом и созданием чата)
        const headerRight = document.querySelector(
            '.vkuiPanelHeader__after, .PanelHeader__after, [class*="PanelHeader__after"], [class*="PanelHeader__right"], .vkuiPanelHeader__right, .im-page--header-right, [class*="PanelHeader"] [class*="Right"], .mail_header_actions'
        );
        if (!headerRight) return;

        const btn = document.createElement('div');
        btn.id = UNREAD_TOP_BTN_ID;
        btn.title = 'Только непрочитанные';
        btn.style.cssText = `
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 38px !important;
            height: 38px !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            user-select: none !important;
            margin-right: 4px !important;
            color: var(--vkui--color_icon_secondary, #828282) !important;
            background: transparent !important;
            transition: background-color 0.2s ease, color 0.2s ease !important;
            -webkit-tap-highlight-color: transparent !important;
            flex-shrink: 0 !important;
        `;

        btn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="10" r="2.5" fill="currentColor"></circle>
            </svg>
        `;

        let isUnread = false;

        function updateBtnVisual() {
            if (isUnread) {
                btn.style.setProperty('background-color', 'rgba(255, 92, 92, 0.16)', 'important');
                btn.style.setProperty('color', '#FF5C5C', 'important');
            } else {
                btn.style.setProperty('background-color', 'transparent', 'important');
                btn.style.setProperty('color', 'var(--vkui--color_icon_secondary, #828282)', 'important');
            }
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            isUnread = !isUnread;
            updateBtnVisual();

            const nativeSwitch = findNativeUnreadSwitch();
            if (nativeSwitch) {
                nativeSwitch.click();
            }
        });

        headerRight.insertBefore(btn, headerRight.firstChild);
    }

    // ==========================================
    //    ИНТЕРФЕЙС НАСТРОЕК В m.vk.ru/settings
    // ==========================================
    const SETTINGS_UI_ID = 'vk-mobile-upgrade-settings-card';

    function isAppearancePage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();

        // Строгая изоляция: не отображать в чатах, ленте, клипах, профилях и т.д.
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
            <span style="font-size: 11px; font-weight: 600; opacity: 0.8; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 6px;">v2.1</span>
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
    //               ИНИЦИАЛИЗАЦИЯ
    // ==========================================
    function init() {
        applyStyles();
        updateSettingsVisibility();
        injectTopUnreadToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    setInterval(() => {
        updateSettingsVisibility();
        injectTopUnreadToggle();
        if (isHideLabelsEnabled) {
            updateBottomBarLabels();
        }
    }, 250);

    function onNavigate() {
        applyStyles();
        updateSettingsVisibility();
        injectTopUnreadToggle();
        setTimeout(updateSettingsVisibility, 100);
        setTimeout(injectTopUnreadToggle, 100);
        setTimeout(updateSettingsVisibility, 300);
        setTimeout(injectTopUnreadToggle, 300);
        if (isHideLabelsEnabled) {
            updateBottomBarLabels();
        }
    }

    window.addEventListener('load', onNavigate);
    window.addEventListener('popstate', onNavigate);

    const origPushState = history.pushState;
    history.pushState = function() {
        origPushState.apply(this, arguments);
        onNavigate();
    };

    const origReplaceState = history.replaceState;
    history.replaceState = function() {
        origReplaceState.apply(this, arguments);
        onNavigate();
    };
})();

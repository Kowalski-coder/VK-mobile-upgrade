// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      1.3
// @description  Улучшение и кастомизация интерфейса мобильной версии VK (m.vk.ru / vk.ru). Опциональная смена акцентных цветов (#71AAEB ⇄ #FF5C5C) и скрытие подписей в нижней панели. Легковесный, без зависаний.
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
    //         ЦВЕТА И СТИЛИ ПОДМЕНЫ
    // ==========================================
    const COLOR_ACCENT_SWAPPED = '#FF5C5C'; // Изначально #71AAEB -> теперь красный
    const COLOR_NEGATIVE_SWAPPED = '#71AAEB'; // Изначально #FF5C5C -> теперь голубой

    const COLOR_SWAP_CSS = `
        /* 1. ПОЛНАЯ ЗАМЕНА ТОКЕНОВ И ПЕРЕМЕННЫХ VKUI И VK MOBILE */
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

        /* 2. ПРЯМЫЕ СТИЛИ ДЛЯ ИМЕН В ЧАТАХ (color_im_text_name) */
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

        /* 3. ПРЯМЫЕ СТИЛИ ДЛЯ ССЫЛОК И АКЦЕНТНЫХ ЭЛЕМЕНТОВ */
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

        /* 4. КНОПКИ И СЧЕТЧИКИ */
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

        /* 5. ОШИБКИ И НЕГАТИВНЫЕ СТАТУСЫ */
        [class*="FormStatus--mode-error"],
        [class*="ErrorMessage"],
        [class*="SubnavigationBar--negative"],
        [class*="ActionSheetItem--mode-destructive"] {
            color: ${COLOR_NEGATIVE_SWAPPED} !important;
        }

        /* 6. ЛАЙКИ (активные реакции) */
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
        /* Скрытие подписей под иконками в нижней панели */
        .vkuiTabbarItem__label,
        .TabbarItem__label,
        .TabbarItem__text,
        [class*="TabbarItem__label"],
        [class*="TabbarItem__text"],
        [class*="TabBarItem__label"],
        [class*="TabBarItem__text"],
        [class*="BottomNavigationItem__label"],
        [class*="BottomNavigationItem__text"],
        nav[class*="Tabbar"] span[class*="Typography"],
        nav[class*="TabBar"] span[class*="Typography"],
        nav[class*="Tabbar"] [class*="Caption"],
        nav[class*="TabBar"] [class*="Caption"],
        nav[class*="Tabbar"] [class*="Subhead"],
        nav[class*="TabBar"] [class*="Subhead"],
        nav[class*="Tabbar"] [class*="Footnote"],
        nav[class*="TabBar"] [class*="Footnote"] {
            display: none !important;
        }

        /* Вертикальное центрирование иконок */
        .vkuiTabbarItem,
        .TabbarItem,
        [class*="TabbarItem"],
        [class*="TabBarItem"],
        [class*="BottomNavigationItem"] {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
        }

        .vkuiTabbarItem__in,
        .TabbarItem__in,
        [class*="TabbarItem__in"],
        [class*="TabBarItem__in"] {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            height: 100% !important;
        }

        .vkuiTabbarItem__icon,
        .TabbarItem__icon,
        [class*="TabbarItem__icon"],
        [class*="TabBarItem__icon"] {
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
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
        setOrRemoveStyle('vmu-color-swap-styles', COLOR_SWAP_CSS, isColorSwapEnabled);
        setOrRemoveStyle('vmu-hide-labels-styles', HIDE_LABELS_CSS, isHideLabelsEnabled);
    }

    // Применяем стили мгновенно на этапе загрузки страницы (0ms overhead)
    applyStyles();

    // ==========================================
    //    ИНТЕРФЕЙС НАСТРОЕК В m.vk.ru/settings
    // ==========================================
    const SETTINGS_UI_ID = 'vk-mobile-upgrade-settings-card';

    function isAppearancePage() {
        const path = window.location.pathname;
        const search = window.location.search;
        return search.includes('act=appearance') || path.includes('/settings/appearance') || (path.startsWith('/settings') && search.includes('appearance'));
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
            background-color: ${initialChecked ? 'var(--vkui--color_background_accent, #2787F5)' : 'var(--vkui--color_track_background, rgba(255, 255, 255, 0.2))'};
            transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            flex-shrink: 0;
            cursor: pointer;
        `;

        const slider = document.createElement('div');
        slider.style.cssText = `
            position: absolute;
            top: 3px;
            left: 3px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background-color: #ffffff;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            transform: ${initialChecked ? 'translateX(20px)' : 'translateX(0)'};
            pointer-events: none;
        `;
        switchBtn.appendChild(slider);

        let isChecked = initialChecked;

        function handleToggle(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            isChecked = !isChecked;
            switchBtn.setAttribute('aria-checked', isChecked ? 'true' : 'false');
            switchBtn.style.backgroundColor = isChecked
                ? 'var(--vkui--color_background_accent, #2787F5)'
                : 'var(--vkui--color_track_background, rgba(255, 255, 255, 0.2))';
            slider.style.transform = isChecked ? 'translateX(20px)' : 'translateX(0)';
            onToggle(isChecked);
        }

        row.addEventListener('click', handleToggle, true);
        row.addEventListener('touchend', handleToggle, { passive: false });

        row.appendChild(textCol);
        row.appendChild(switchBtn);

        return row;
    }

    function tryInjectSettings() {
        if (!isAppearancePage()) return;
        if (document.getElementById(SETTINGS_UI_ID)) return;

        // Ищем контейнер страницы внешнего вида
        const targetContainer = document.querySelector(
            '[class*="AppearanceSettings"], [class*="settings_appearance"], [class*="SettingsAppearance"], .vkuiPanel__in, .Panel__in, main, #content'
        );
        if (!targetContainer) return;

        // Ищем существующие группы темы (Светлая/Темная/Системная)
        const groups = targetContainer.querySelectorAll('.vkuiGroup, [class*="Group"]');
        const insertAfterElement = groups.length > 0 ? groups[groups.length - 1] : null;

        const card = document.createElement('div');
        card.id = SETTINGS_UI_ID;
        card.className = 'vkuiGroup vkuiGroup--mode-card';
        card.style.cssText = `
            margin: 16px 12px 24px;
            background: var(--vkui--color_background_content, var(--background_content, #222222));
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 14px 16px 8px;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: var(--vkui--color_text_subhead, #888888);
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
        `;
        header.innerHTML = `
            <span>🚀 VK Mobile Upgrade</span>
            <span style="font-size: 11px; font-weight: 600; opacity: 0.8; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 6px;">v1.3</span>
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

        if (insertAfterElement) {
            insertAfterElement.insertAdjacentElement('afterend', card);
        } else {
            targetContainer.appendChild(card);
        }
    }

    // ==========================================
    //       ОПТИМИЗИРОВАННЫЙ НАБЛЮДАТЕЛЬ
    // ==========================================
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
        if (!isAppearancePage()) return;
        if (debounceTimer) return;

        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            tryInjectSettings();
        }, 200);
    });

    function init() {
        applyStyles();
        if (document.documentElement) {
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
        tryInjectSettings();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // SPA навигация
    function onNavigate() {
        applyStyles();
        setTimeout(tryInjectSettings, 100);
        setTimeout(tryInjectSettings, 400);
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

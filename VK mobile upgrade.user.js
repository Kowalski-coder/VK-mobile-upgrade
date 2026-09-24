// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      1.2
// @description  Улучшение и кастомизация интерфейса мобильной версии VK (m.vk.ru / vk.ru). Опциональная смена акцентных цветов (#71AAEB ⇄ #FF5C5C) и скрытие подписей в нижней панели с надежными переключателями в «Внешний вид».
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
        } else if (style.parentElement !== parent) {
            parent.appendChild(style);
        }

        if (style.textContent !== css) {
            style.textContent = css;
        }
    }

    function applyCurrentStyles() {
        setOrRemoveStyle('vmu-color-swap-styles', COLOR_SWAP_CSS, isColorSwapEnabled);
        setOrRemoveStyle('vmu-hide-labels-styles', HIDE_LABELS_CSS, isHideLabelsEnabled);
    }

    // ==========================================
    //   ДИНАМИЧЕСКИЙ АНАЛИЗ И ЗАМЕНА В DOM
    // ==========================================
    function isBlueRgb(r, g, b) {
        return (r >= 100 && r <= 125) && (g >= 155 && g <= 185) && (b >= 220 && b <= 250);
    }

    function isRedRgb(r, g, b) {
        return (r >= 240 && r <= 255) && (g >= 75 && g <= 110) && (b >= 75 && b <= 110);
    }

    function parseRgb(str) {
        if (!str || typeof str !== 'string') return null;
        const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (m) {
            return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
        }
        return null;
    }

    function swapColorString(str) {
        if (!str || typeof str !== 'string') return str;
        // Hex
        let res = str.replace(/#(71aaeb|ff5c5c)([0-9a-fA-F]{2})?\b/gi, (match, hex, alpha) => {
            const isBlue = hex.toLowerCase() === '71aaeb';
            return (isBlue ? COLOR_ACCENT_SWAPPED : COLOR_NEGATIVE_SWAPPED) + (alpha || '');
        });
        // RGB
        res = res.replace(/rgba?\(\s*(?:(113\s*,\s*170\s*,\s*235)|(255\s*,\s*92\s*,\s*92))(\s*[,/]\s*[^)]+)?\s*\)/gi, (match, rgbA, rgbB, alphaPart) => {
            const target = rgbA ? '255, 92, 92' : '113, 170, 235';
            const func = alphaPart ? 'rgba' : 'rgb';
            return `${func}(${target}${alphaPart || ''})`;
        });
        return res;
    }

    function processElement(el) {
        if (!isColorSwapEnabled || !el || el.nodeType !== 1) return;

        // 1. Атрибуты SVG Fill / Stroke
        const fill = el.getAttribute('fill');
        if (fill && fill !== 'none' && fill !== 'currentColor') {
            const rgb = parseRgb(fill);
            if (fill.toLowerCase().includes('71aaeb') || (rgb && isBlueRgb(rgb.r, rgb.g, rgb.b))) {
                el.setAttribute('fill', COLOR_ACCENT_SWAPPED);
            } else if (fill.toLowerCase().includes('ff5c5c') || (rgb && isRedRgb(rgb.r, rgb.g, rgb.b))) {
                el.setAttribute('fill', COLOR_NEGATIVE_SWAPPED);
            }
        }

        const stroke = el.getAttribute('stroke');
        if (stroke && stroke !== 'none' && stroke !== 'currentColor') {
            const rgb = parseRgb(stroke);
            if (stroke.toLowerCase().includes('71aaeb') || (rgb && isBlueRgb(rgb.r, rgb.g, rgb.b))) {
                el.setAttribute('stroke', COLOR_ACCENT_SWAPPED);
            } else if (stroke.toLowerCase().includes('ff5c5c') || (rgb && isRedRgb(rgb.r, rgb.g, rgb.b))) {
                el.setAttribute('stroke', COLOR_NEGATIVE_SWAPPED);
            }
        }

        // 2. Инлайн стили
        const style = el.getAttribute('style');
        if (style && (style.includes('71aaeb') || style.includes('ff5c5c') || style.includes('113, 170, 235') || style.includes('255, 92, 92'))) {
            const swapped = swapColorString(style);
            if (swapped !== style) {
                el.setAttribute('style', swapped);
            }
        }
    }

    function processTree(root) {
        if (!isColorSwapEnabled || !root || root.nodeType !== 1) return;
        processElement(root);
        const children = root.querySelectorAll('*');
        for (let i = 0; i < children.length; i++) {
            processElement(children[i]);
        }
    }

    // ==========================================
    //    ИНТЕРФЕЙС НАСТРОЕК В m.vk.ru/settings
    // ==========================================
    const SETTINGS_UI_ID = 'vk-mobile-upgrade-settings-card';

    function isAppearancePage() {
        const url = window.location.href;
        return url.includes('act=appearance') || url.includes('/settings/appearance') || (url.includes('/settings') && url.includes('appearance'));
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
        row.addEventListener('touchend', (e) => {
            handleToggle(e);
        }, { passive: false });

        row.appendChild(textCol);
        row.appendChild(switchBtn);

        return row;
    }

    function injectSettingsUI() {
        if (!isAppearancePage()) return;
        if (document.getElementById(SETTINGS_UI_ID)) return;

        // Ищем существующие группы настроек внешнего вида (тема, тема системы и т.д.)
        const groups = document.querySelectorAll('.vkuiGroup, [class*="Group--mode-card"], [class*="Group--mode-plain"], [class*="Group"]');
        let target = null;
        let insertMethod = 'afterend';

        if (groups.length > 0) {
            target = groups[groups.length - 1];
            insertMethod = 'afterend';
        } else {
            target = document.querySelector('.vkuiPanel__in, [class*="Panel__in"], main');
            insertMethod = 'append';
        }

        if (!target) return;

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

        // Заголовок карточки
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
            <span style="font-size: 11px; font-weight: 600; opacity: 0.8; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 6px;">v1.2</span>
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
                applyCurrentStyles();
                if (isColorSwapEnabled) {
                    processTree(document.documentElement);
                }
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
                applyCurrentStyles();
            }
        );
        row2.style.borderBottom = 'none';
        card.appendChild(row2);

        if (insertMethod === 'afterend') {
            target.insertAdjacentElement('afterend', card);
        } else {
            target.appendChild(card);
        }
    }

    // ==========================================
    //               НАБЛЮДАТЕЛЬ
    // ==========================================
    const observer = new MutationObserver((mutations) => {
        applyCurrentStyles();
        injectSettingsUI();

        if (isColorSwapEnabled) {
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];
                if (m.type === 'childList') {
                    for (let j = 0; j < m.addedNodes.length; j++) {
                        const node = m.addedNodes[j];
                        if (node.nodeType === 1) {
                            processTree(node);
                        }
                    }
                } else if (m.type === 'attributes') {
                    processElement(m.target);
                }
            }
        }
    });

    function start() {
        applyCurrentStyles();
        if (document.documentElement) {
            if (isColorSwapEnabled) {
                processTree(document.documentElement);
            }
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'fill', 'stroke']
            });
        }
        injectSettingsUI();
    }

    // Запуск на раннем этапе
    applyCurrentStyles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.addEventListener('load', () => {
        applyCurrentStyles();
        injectSettingsUI();
    });

    window.addEventListener('popstate', () => {
        applyCurrentStyles();
        injectSettingsUI();
    });
})();

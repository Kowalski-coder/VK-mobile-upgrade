// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      1.1
// @description  Улучшение и кастомизация интерфейса мобильной версии VK (m.vk.ru / vk.ru). Опциональная смена акцентных цветов (#71AAEB ⇄ #FF5C5C) и скрытие подписей в нижней панели с настройками в «Внешний вид».
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
        [class*="TabBarItem__text"],
        [class*="TabBarItem__label"],
        [class*="TabBarItem__in"] > [class*="Typography"],
        [class*="BottomNavigationItem__text"],
        [class*="BottomNavigationItem__label"],
        [class*="TabBarItem"] > span[class*="Typography"],
        [class*="TabBarItem"] [class*="Caption"],
        [class*="TabBarItem"] [class*="Footnote"],
        [class*="TabBarItem"] [class*="Subhead"],
        .TabBarItem__text,
        .TabBarItem__label,
        .BottomNavigationItem__label {
            display: none !important;
        }

        /* Вертикальное центрирование иконок */
        [class*="TabBarItem__in"],
        [class*="TabBarItem"],
        [class*="BottomNavigationItem"] {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
        }

        [class*="TabBarItem__icon"],
        [class*="BottomNavigationItem__icon"] {
            margin: 0 !important;
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

    function injectSettingsUI() {
        if (!isAppearancePage()) return;
        if (document.getElementById(SETTINGS_UI_ID)) return;

        // Ищем подходящий контейнер настроек
        const container = document.querySelector(
            '[class*="AppearanceSettings"], [class*="settings_appearance"], [class*="SettingsAppearance"], .vkuiPanel__in, .Panel__in, main, [class*="Panel"]'
        );
        if (!container) return;

        // Создаем блок настроек
        const card = document.createElement('div');
        card.id = SETTINGS_UI_ID;
        card.style.cssText = `
            margin: 16px 12px;
            background: var(--vkui--color_background_content, var(--background_content, #222222));
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08));
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            font-family: var(--vkui--font_family_base, -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif);
        `;

        card.innerHTML = `
            <style>
                .vmu-switch-wrapper {
                    position: relative;
                    display: inline-block;
                    width: 46px;
                    height: 26px;
                    flex-shrink: 0;
                }
                .vmu-switch-wrapper input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .vmu-switch-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: var(--vkui--color_track_background, rgba(255, 255, 255, 0.2));
                    transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 26px;
                }
                .vmu-switch-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background-color: #ffffff;
                    transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 50%;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                }
                .vmu-switch-wrapper input:checked + .vmu-switch-slider {
                    background-color: var(--vkui--color_background_accent, #2787F5);
                }
                .vmu-switch-wrapper input:checked + .vmu-switch-slider:before {
                    transform: translateX(20px);
                }
            </style>
            <div style="padding: 14px 16px 8px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vkui--color_text_subhead, #888888); display: flex; align-items: center; justify-content: space-between;">
                <span>🚀 VK Mobile Upgrade</span>
                <span style="font-size: 11px; font-weight: 600; opacity: 0.8; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 6px;">v1.1</span>
            </div>

            <!-- Тумблер 1: Подмена цветов -->
            <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--vkui--color_separator_primary, rgba(255, 255, 255, 0.08)); user-select: none;">
                <div style="flex: 1; padding-right: 14px;">
                    <div style="font-size: 15px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff); line-height: 1.3;">Подмена цветов темы</div>
                    <div style="font-size: 12px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px; line-height: 1.3;">Меняет местами #71AAEB (акценты/имена) и #FF5C5C (лайки/ошибки)</div>
                </div>
                <div class="vmu-switch-wrapper">
                    <input type="checkbox" id="vmu-toggle-color-swap" ${isColorSwapEnabled ? 'checked' : ''}>
                    <span class="vmu-switch-slider"></span>
                </div>
            </label>

            <!-- Тумблер 2: Скрыть подписи на панели -->
            <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; user-select: none;">
                <div style="flex: 1; padding-right: 14px;">
                    <div style="font-size: 15px; font-weight: 500; color: var(--vkui--color_text_primary, #ffffff); line-height: 1.3;">Скрыть подписи на нижней панели</div>
                    <div style="font-size: 12px; color: var(--vkui--color_text_secondary, #999999); margin-top: 3px; line-height: 1.3;">Оставлять только иконки (Главная, Поиск, Мессенджер, Клипы, Ещё)</div>
                </div>
                <div class="vmu-switch-wrapper">
                    <input type="checkbox" id="vmu-toggle-hide-labels" ${isHideLabelsEnabled ? 'checked' : ''}>
                    <span class="vmu-switch-slider"></span>
                </div>
            </label>
        `;

        container.appendChild(card);

        // Обработчики переключения
        const colorCheckbox = card.querySelector('#vmu-toggle-color-swap');
        if (colorCheckbox) {
            colorCheckbox.addEventListener('change', (e) => {
                isColorSwapEnabled = e.target.checked;
                setSetting(STORAGE_KEYS.COLOR_SWAP, isColorSwapEnabled);
                applyCurrentStyles();
                if (isColorSwapEnabled) {
                    processTree(document.documentElement);
                }
            });
        }

        const labelsCheckbox = card.querySelector('#vmu-toggle-hide-labels');
        if (labelsCheckbox) {
            labelsCheckbox.addEventListener('change', (e) => {
                isHideLabelsEnabled = e.target.checked;
                setSetting(STORAGE_KEYS.HIDE_TAB_LABELS, isHideLabelsEnabled);
                applyCurrentStyles();
            });
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

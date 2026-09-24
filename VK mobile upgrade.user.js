// ==UserScript==
// @name         VK mobile upgrade
// @namespace    https://github.com/Kowalski-coder/VK-mobile-upgrade
// @version      1.0
// @description  Улучшение и кастомизация интерфейса мобильной версии VK (m.vk.ru / vk.ru). Смена акцентных цветов, имен в чатах, лайков и системных статусов.
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

    const COLOR_ACCENT_SWAPPED = '#FF5C5C'; // Изначально #71AAEB -> теперь красный
    const COLOR_NEGATIVE_SWAPPED = '#71AAEB'; // Изначально #FF5C5C -> теперь голубой

    // ==========================================
    //       ГЛОБАЛЬНЫЕ СТИЛИ И СЕМАНТИКА
    // ==========================================
    const CUSTOM_CSS = `
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

    const STYLE_ID = 'vk-mobile-upgrade-styles';

    function injectMasterStyle() {
        let style = document.getElementById(STYLE_ID);
        const parent = document.head || document.documentElement;
        if (!parent) return;

        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            style.type = 'text/css';
            parent.appendChild(style);
        } else if (style.parentElement !== parent) {
            parent.appendChild(style);
        }

        if (style.textContent !== CUSTOM_CSS) {
            style.textContent = CUSTOM_CSS;
        }
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
        if (!el || el.nodeType !== 1) return;

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
        if (!root || root.nodeType !== 1) return;
        processElement(root);
        const children = root.querySelectorAll('*');
        for (let i = 0; i < children.length; i++) {
            processElement(children[i]);
        }
    }

    // ==========================================
    //               НАБЛЮДАТЕЛЬ
    // ==========================================
    const observer = new MutationObserver((mutations) => {
        injectMasterStyle();

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
    });

    function start() {
        injectMasterStyle();
        if (document.documentElement) {
            processTree(document.documentElement);
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'fill', 'stroke']
            });
        }
    }

    // Запуск на ранней стадии
    injectMasterStyle();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.addEventListener('load', injectMasterStyle);
    window.addEventListener('popstate', injectMasterStyle);
})();

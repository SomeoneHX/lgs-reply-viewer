/**
 * LGS Reply Viewer — host page loader.
 *
 *   <script src="https://<host>/embed.js"
 *           data-article="lwr2bdre"
 *           data-theme="auto"
 *           async></script>
 *
 * Creates an iframe pointing at the widget and keeps its height in sync via
 * postMessage, so the host page never shows a scrollbar inside the frame.
 * No dependencies, no build step.
 */
(function () {
    'use strict';

    var RESIZE_MESSAGE = 'lgs-reply-viewer:resize';

    var script =
        document.currentScript ||
        (function () {
            var all = document.getElementsByTagName('script');
            return all[all.length - 1];
        })();
    if (!script) return;

    var dataset = script.dataset || {};

    function attr(name) {
        var value = dataset[name];
        if (value === undefined || value === null) {
            value = script.getAttribute('data-' + name.replace(/[A-Z]/g, function (c) {
                return '-' + c.toLowerCase();
            }));
        }
        return value === undefined || value === null ? null : String(value);
    }

    var article = attr('article') || attr('id');
    if (!article) {
        if (window.console && console.warn) {
            console.warn('[lgs-reply-viewer] missing required data-article attribute');
        }
        return;
    }

    // Base URL of the deployed widget: dirname of this script's src.
    var src = script.getAttribute('src') || '';
    var baseUrl;
    try {
        baseUrl = new URL(src, window.location.href).href;
    } catch (e) {
        baseUrl = window.location.href;
    }
    baseUrl = baseUrl.replace(/embed\.js(\?.*)?(#.*)?$/, '');

    var PASSTHROUGH = ['theme', 'title', 'refresh', 'floor', 'note', 'max', 'collapse'];

    var params = new URLSearchParams();
    params.set('article', article);
    for (var i = 0; i < PASSTHROUGH.length; i++) {
        var key = PASSTHROUGH[i];
        var value = attr(key);
        if (value !== null && value !== '') params.set(key, value);
    }

    var iframe = document.createElement('iframe');
    iframe.src = baseUrl + '#/embed?' + params.toString();
    iframe.title = '洛谷文章评论';
    iframe.loading = 'lazy';
    iframe.setAttribute('scrolling', 'no');
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    iframe.style.colorScheme = 'light dark';
    iframe.style.height = attr('height') ? attr('height') + 'px' : '160px';

    if (script.parentNode) {
        script.parentNode.insertBefore(iframe, script);
    } else {
        document.body.appendChild(iframe);
    }

    function resize(height) {
        if (!height || height <= 0) return;
        iframe.style.height = Math.ceil(height) + 'px';
    }

    window.addEventListener('message', function (event) {
        var data = event.data;
        if (!data || data.type !== RESIZE_MESSAGE) return;
        // Only trust frames that actually loaded our widget.
        if (event.source !== iframe.contentWindow) return;
        resize(data.height);
    });

    // Fallback for browsers/extensions that block postMessage: measure directly.
    iframe.addEventListener('load', function () {
        try {
            var doc = iframe.contentDocument;
            if (doc && doc.documentElement) {
                resize(doc.documentElement.scrollHeight);
            }
        } catch (e) {
            /* cross-origin — postMessage path handles it */
        }
    });
})();

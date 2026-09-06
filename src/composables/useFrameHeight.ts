import { onScopeDispose, onMounted } from 'vue';

export const FRAME_MESSAGE_TYPE = 'lgs-reply-viewer:resize';

export interface ResizeMessage {
    type: typeof FRAME_MESSAGE_TYPE;
    height: number;
}

/**
 * giscus-style auto height: measures the document and posts the height to the
 * embedding page so the host iframe can be sized without scrollbars.
 * Safe to call outside an iframe (postMessage to self is a no-op listener-wise).
 */
export function useFrameHeight(target?: () => HTMLElement | null) {
    let observer: ResizeObserver | null = null;
    let raf = 0;

    function post() {
        if (typeof window === 'undefined') return;
        const el = target?.() ?? document.documentElement;
        const height = Math.ceil(el.getBoundingClientRect().height);
        const payload: ResizeMessage = { type: FRAME_MESSAGE_TYPE, height };
        try {
            window.parent?.postMessage(payload, '*');
        } catch {
            /* ignore */
        }
    }

    function schedule() {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(post);
    }

    onMounted(() => {
        schedule();
        const root = target?.() ?? document.body;
        if (typeof ResizeObserver !== 'undefined' && root) {
            observer = new ResizeObserver(schedule);
            observer.observe(root);
            observer.observe(document.documentElement);
        }
        window.addEventListener('load', schedule);
        if (document.fonts?.ready) void document.fonts.ready.then(schedule);
    });

    onScopeDispose(() => {
        cancelAnimationFrame(raf);
        observer?.disconnect();
        observer = null;
        window.removeEventListener('load', schedule);
    });

    return { schedule, post };
}

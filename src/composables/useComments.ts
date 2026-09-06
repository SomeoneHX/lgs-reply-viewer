import { onScopeDispose, ref, shallowRef } from 'vue';
import { getArticleComments, getArticleMeta, refreshArticleComments } from '@/api/comment';
import { toTimestamp, type ArticleComment, type ArticleMeta } from '@/types/comment';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface UseCommentsOptions {
    /** When true, re-fetch once after a delay if upstream reports stale data. */
    autoRetryOnStale?: boolean;
}

export interface NormalisedComment {
    id: string;
    content: string;
    timeMs: number;
    author: {
        id: number;
        name: string;
        color: string;
        ccfLevel: number;
        xcpcLevel: number;
    };
}

function normalise(list: ArticleComment[]): NormalisedComment[] {
    return (list ?? []).map(c => ({
        id: String(c.id),
        content: c.content ?? '',
        timeMs: toTimestamp(c.time),
        author: {
            id: c.author?.id ?? 0,
            name: c.author?.name || `用户 ${c.author?.id ?? '?'}`,
            color: c.author?.color || 'Gray',
            ccfLevel: c.author?.ccfLevel ?? 0,
            xcpcLevel: c.author?.xcpcLevel ?? 0
        }
    }));
}

export function useComments(articleId: () => string | null, options: UseCommentsOptions = {}) {
    const autoRetry = options.autoRetryOnStale ?? true;

    const state = ref<LoadState>('idle');
    const errorMessage = ref<string>('');
    const comments = shallowRef<NormalisedComment[]>([]);
    const fetchedAtMs = ref<number>(0);
    const stale = ref(false);
    const refreshing = ref(false);
    const article = shallowRef<ArticleMeta | null>(null);

    let controller: AbortController | null = null;
    let retryTimer: number | undefined;

    function clearRetry() {
        if (retryTimer !== undefined) {
            clearTimeout(retryTimer);
            retryTimer = undefined;
        }
    }

    async function load(silent = false) {
        const id = articleId();
        if (!id) {
            state.value = 'idle';
            comments.value = [];
            article.value = null;
            return;
        }

        controller?.abort();
        controller = new AbortController();
        const signal = controller.signal;

        if (!silent) state.value = 'loading';
        errorMessage.value = '';

        try {
            const res = await getArticleComments(id, signal);
            if (signal.aborted) return;
            if (res.code === 200 && res.data) {
                comments.value = normalise(res.data.comments);
                stale.value = res.data.commentsStale;
                fetchedAtMs.value = res.data.commentsFetchedAt
                    ? Date.parse(res.data.commentsFetchedAt)
                    : 0;
                state.value = 'ready';

                // Upstream dispatches a re-scrape when data is stale; poll once
                // so the widget converges without a websocket connection.
                clearRetry();
                if (autoRetry && res.data.commentsStale) {
                    retryTimer = window.setTimeout(() => void load(true), 8000);
                }
            } else {
                state.value = 'error';
                errorMessage.value = res.message || '获取评论失败';
            }
        } catch (error) {
            if (signal.aborted || (error as Error)?.name === 'AbortError') return;
            state.value = 'error';
            errorMessage.value = error instanceof Error ? error.message : '获取评论失败';
        }

        // Title is optional decoration — never let it break the widget.
        try {
            const meta = await getArticleMeta(id, signal);
            if (!signal.aborted && meta.code === 200 && meta.data) {
                article.value = meta.data;
            }
        } catch {
            /* ignore */
        }
    }

    async function refresh() {
        const id = articleId();
        if (!id || refreshing.value) return;
        refreshing.value = true;
        try {
            await refreshArticleComments(id);
            stale.value = true;
            clearRetry();
            retryTimer = window.setTimeout(() => void load(true), 8000);
            return true;
        } catch {
            return false;
        } finally {
            refreshing.value = false;
        }
    }

    onScopeDispose(() => {
        clearRetry();
        controller?.abort();
    });

    return { state, errorMessage, comments, fetchedAtMs, stale, refreshing, article, load, refresh };
}

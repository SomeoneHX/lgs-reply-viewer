import { apiGet, apiPost } from './client';
import type { ApiResponse, ArticleCommentsResponse, ArticleMeta } from '@/types/comment';

/** GET /article/comments/:id */
export async function getArticleComments(id: string, signal?: AbortSignal) {
    return (await apiGet<ArticleCommentsResponse>(
        `/article/comments/${encodeURIComponent(id)}`,
        { signal }
    )) as ApiResponse<ArticleCommentsResponse>;
}

/** POST /article/comments/:id/refresh — asks upstream to re-scrape. Read-only UI. */
export async function refreshArticleComments(id: string) {
    return (await apiPost<{ taskId: string }>(
        `/article/comments/${encodeURIComponent(id)}/refresh`
    )) as ApiResponse<{ taskId: string }>;
}

/** GET /article/query/:id — used only to show the article title. Never fatal. */
export async function getArticleMeta(id: string, signal?: AbortSignal) {
    return (await apiGet<ArticleMeta>(`/article/query/${encodeURIComponent(id)}`, {
        signal
    })) as ApiResponse<ArticleMeta>;
}

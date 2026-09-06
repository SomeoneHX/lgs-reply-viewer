/**
 * Comment data shapes, ported verbatim from
 * laikit-dev/luogu-saver (packages/frontend/src/types/comment.d.ts)
 */

export interface CommentAuthor {
    id: number;
    name?: string;
    color?: string;
    ccfLevel?: number;
    xcpcLevel?: number;
}

export interface ArticleComment {
    id: string;
    content: string;
    /**
     * Unix seconds. The upstream API serialises this as a *string* on some
     * rows (`"1739176294"`), so it must always be coerced with Number().
     */
    time: number | string;
    author: CommentAuthor;
}

export interface ArticleCommentsResponse {
    comments: ArticleComment[];
    commentsStale: boolean;
    commentsFetchedAt: string | null;
}

/** Minimal shape of GET /article/query/:id — only what the widget needs. */
export interface ArticleMeta {
    id: string;
    title?: string;
    authorId?: number;
    authorName?: string;
    authorColor?: string;
}

export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T | null;
}

export function toTimestamp(value: number | string | null | undefined): number {
    const n = typeof value === 'string' ? Number(value) : (value ?? NaN);
    if (!Number.isFinite(n) || n <= 0) return 0;
    // Heuristic: treat < 1e11 as seconds (upstream) and ms otherwise.
    return n < 1e11 ? n * 1000 : n;
}

import type { ApiResponse } from '@/types/comment';

/**
 * Upstream luogu-saver API origin. Overridable at build time with VITE_API_BASE.
 * The API sends `access-control-allow-origin: *`, so it is callable directly
 * from static hosting such as GitHub Pages.
 */
export const API_BASE: string = (
    (import.meta.env.VITE_API_BASE as string | undefined) || 'https://api.luogu.me'
).replace(/\/+$/, '');

export class ApiError extends Error {
    constructor(
        message: string,
        readonly code: number
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

const DEFAULT_TIMEOUT = 30000;

export async function apiGet<T>(
    path: string,
    options: { timeout?: number; signal?: AbortSignal } = {}
): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort);

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal
        });
        if (!res.ok) {
            throw new ApiError(`HTTP ${res.status}`, res.status);
        }
        return (await res.json()) as ApiResponse<T>;
    } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onAbort);
    }
}

export async function apiPost<T>(
    path: string,
    options: { timeout?: number } = {}
): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            signal: controller.signal
        });
        if (!res.ok) {
            throw new ApiError(`HTTP ${res.status}`, res.status);
        }
        return (await res.json()) as ApiResponse<T>;
    } finally {
        clearTimeout(timer);
    }
}

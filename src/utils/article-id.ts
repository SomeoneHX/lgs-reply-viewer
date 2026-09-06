/** Upstream accepts /^[A-Za-z0-9]{1,8}$/ for article ids. */
const ARTICLE_ID_RE = /^[A-Za-z0-9]{1,8}$/;

const ID_IN_PATH_RE = /\/article\/([A-Za-z0-9]{1,8})/;

export interface ParseResult {
    ok: boolean;
    id: string | null;
    message: string;
}

/**
 * Accepts any of:
 *   lwr2bdre
 *   https://www.luogu.com.cn/article/lwr2bdre
 *   https://www.luogu.com/article/lwr2bdre
 *   https://luogu.store/article/lwr2bdre
 *   https://lglg.top/article/lwr2bdre
 *   https://.../article/lwr2bdre?foo=bar#anchor
 *   https://.../?article=lwr2bdre
 *   /#/article/lwr2bdre
 */
export function extractArticleId(input: string): ParseResult {
    const raw = (input ?? '').trim();
    if (!raw) {
        return { ok: false, id: null, message: '请输入文章链接或文章 ID' };
    }

    if (ARTICLE_ID_RE.test(raw)) {
        return { ok: true, id: raw, message: `识别为文章 ID：${raw}` };
    }

    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `https://${raw}`;

    let url: URL;
    try {
        url = new URL(withScheme);
    } catch {
        return { ok: false, id: null, message: '无法解析为链接，请检查输入' };
    }

    const fromPath = url.pathname.match(ID_IN_PATH_RE);
    if (fromPath?.[1]) {
        return { ok: true, id: fromPath[1], message: `从链接路径识别到：${fromPath[1]}` };
    }

    for (const key of ['article', 'articleId', 'id', 'lid']) {
        const value = url.searchParams.get(key);
        if (value && ARTICLE_ID_RE.test(value)) {
            return { ok: true, id: value, message: `从查询参数 ${key} 识别到：${value}` };
        }
    }

    const fromHash = url.hash.match(ID_IN_PATH_RE);
    if (fromHash?.[1]) {
        return { ok: true, id: fromHash[1], message: `从锚点识别到：${fromHash[1]}` };
    }

    return {
        ok: false,
        id: null,
        message: '未在链接中找到文章 ID（应为 1–8 位字母数字，如 /article/lwr2bdre）'
    };
}

/** Normalised upstream permalink for a parsed id. */
export function toLuoguUrl(id: string): string {
    return `https://www.luogu.com.cn/article/${id}`;
}

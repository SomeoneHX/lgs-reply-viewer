export type ThemeMode = 'light' | 'dark' | 'auto';

export const THEME_MODES: ThemeMode[] = ['light', 'dark', 'auto'];

export function isThemeMode(value: unknown): value is ThemeMode {
    return value === 'light' || value === 'dark' || value === 'auto';
}

export function prefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'auto') return prefersDark() ? 'dark' : 'light';
    return mode;
}

/**
 * Applies the theme by setting `data-theme` on <html>. All widget colours are
 * driven from that attribute so an embedded iframe can be themed independently
 * of the host page.
 */
export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
    const resolved = resolveTheme(mode);
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    return resolved;
}

/** Re-applies on OS theme change while mode === 'auto'. Returns a disposer. */
export function watchSystemTheme(onChange: () => void): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => onChange();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
}

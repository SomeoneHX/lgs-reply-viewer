const pad = (n: number) => String(n).padStart(2, '0');

/** 2026-09-06 17:59 */
export function formatDateTime(ms: number): string {
    if (!ms) return '';
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Mirrors naive-ui's <n-time type="relative"> wording. */
export function formatRelative(ms: number, now = Date.now()): string {
    if (!ms) return '';
    const diff = now - ms;
    const abs = Math.abs(diff);
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (abs < minute) return '刚刚';

    const render = (value: number, unit: string) =>
        diff >= 0 ? `${value} ${unit}前` : `${value} ${unit}后`;

    if (abs < hour) return render(Math.floor(abs / minute), '分钟');
    if (abs < day) return render(Math.floor(abs / hour), '小时');
    if (abs < 30 * day) return render(Math.floor(abs / day), '天');
    if (abs < 365 * day) return render(Math.floor(abs / (30 * day)), '个月');
    return render(Math.floor(abs / (365 * day)), '年');
}

/** Absolute ISO-ish string for the title attribute. */
export function formatFull(ms: number): string {
    if (!ms) return '';
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

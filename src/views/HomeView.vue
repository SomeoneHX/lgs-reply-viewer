<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Check, Copy, ExternalLink, Link2, Loader2, MessagesSquare } from 'lucide-vue-next';
import { extractArticleId, toLuoguUrl } from '@/utils/article-id';
import { applyTheme, watchSystemTheme, type ThemeMode } from '@/utils/theme';
import { FRAME_MESSAGE_TYPE } from '@/composables/useFrameHeight';

const route = useRoute();
const router = useRouter();

const EXAMPLES = [
    { id: 'lwr2bdre', label: '洛谷词典（617 条评论）' },
    { id: '6pmxxgus', label: 'MXWC 集训' },
    { id: 'ymxk8co4', label: '驱魔人2' },
    { id: 'hnhpiatl', label: 'TW（暂无评论）' }
];

const input = ref('');
const themeMode = ref<ThemeMode>('auto');
const showTitle = ref(true);
const showRefresh = ref(true);
const showFloor = ref(true);
const showNote = ref(true);
const maxComments = ref(0);
const collapse = ref(0);

const previewHeight = ref(320);
const copiedKey = ref<string | null>(null);
let copyTimer: number | undefined;

const parsed = computed(() => extractArticleId(input.value));
const activeId = computed(() => parsed.value.id);

/* ------------------------------------------------------------------ URL ---- */

function buildEmbedUrl(id: string): string {
    const params = new URLSearchParams();
    params.set('article', id);
    if (themeMode.value !== 'auto') params.set('theme', themeMode.value);
    if (!showTitle.value) params.set('title', '0');
    if (!showRefresh.value) params.set('refresh', '0');
    if (!showFloor.value) params.set('floor', '0');
    if (!showNote.value) params.set('note', '0');
    if (maxComments.value > 0) params.set('max', String(maxComments.value));
    if (collapse.value > 0) params.set('collapse', String(collapse.value));

    const base = new URL(window.location.href);
    // Hash routing: keep path, drop any existing hash, then point at #/embed
    base.hash = '';
    base.search = '';
    return `${base.href}#/embed?${params.toString()}`;
}

const embedUrl = computed(() => (activeId.value ? buildEmbedUrl(activeId.value) : ''));

/** Origin-relative script src (public/embed.js) so the snippet is portable. */
const scriptSrc = computed(() => {
    if (typeof window === 'undefined') return 'embed.js';
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    return new URL('embed.js', url.href).href;
});

const iframeSnippet = computed(() => {
    if (!embedUrl.value) return '';
    return [
        `<iframe`,
        `  src="${embedUrl.value}"`,
        `  loading="lazy"`,
        `  title="洛谷文章评论"`,
        `  style="width: 100%; border: 0; color-scheme: light dark;"`,
        `  onload="this.style.height=this.contentWindow.document.body.scrollHeight+'px'"`,
        `></iframe>`
    ].join('\n');
});

const scriptSnippet = computed(() => {
    if (!activeId.value) return '';
    const attrs = [`data-article="${activeId.value}"`];
    if (themeMode.value !== 'auto') attrs.push(`data-theme="${themeMode.value}"`);
    if (!showTitle.value) attrs.push(`data-title="0"`);
    if (!showRefresh.value) attrs.push(`data-refresh="0"`);
    if (!showFloor.value) attrs.push(`data-floor="0"`);
    if (!showNote.value) attrs.push(`data-note="0"`);
    if (maxComments.value > 0) attrs.push(`data-max="${maxComments.value}"`);
    if (collapse.value > 0) attrs.push(`data-collapse="${collapse.value}"`);
    return `<script src="${scriptSrc.value}"\n        ${attrs.join('\n        ')}\n        async><\/script>`;
});

const luoguUrl = computed(() => (activeId.value ? toLuoguUrl(activeId.value) : ''));

/* --------------------------------------------------------------- actions ---- */

async function copy(key: string, text: string) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand('copy');
        } catch {
            /* ignore */
        }
        document.body.removeChild(el);
    }
    copiedKey.value = key;
    clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => (copiedKey.value = null), 1600);
}

function useExample(id: string) {
    input.value = toLuoguUrl(id);
}

function onMessage(event: MessageEvent) {
    const data = event.data as { type?: string; height?: number } | null;
    if (!data || data.type !== FRAME_MESSAGE_TYPE) return;
    if (typeof data.height === 'number' && data.height > 0) {
        previewHeight.value = Math.min(Math.max(data.height, 120), 2000);
    }
}

/* ----------------------------------------------------------------- setup ---- */

let stopSystemWatch: (() => void) | null = null;

onMounted(() => {
    const initial = route.query.article;
    if (typeof initial === 'string' && initial.trim()) {
        input.value = toLuoguUrl(initial.trim());
    }
    window.addEventListener('message', onMessage);
    applyTheme(themeMode.value);
    stopSystemWatch = watchSystemTheme(() => applyTheme(themeMode.value));
});

onUnmounted(() => {
    window.removeEventListener('message', onMessage);
    stopSystemWatch?.();
    clearTimeout(copyTimer);
});

// Keep the home URL shareable: #/?article=<id>
watch(activeId, id => {
    const next = { ...route.query };
    if (id) next.article = id;
    else delete next.article;
    if (route.query.article === next.article) return;
    void router.replace({ path: '/', query: next });
});
</script>

<template>
    <div class="home">
        <header class="hero">
            <div class="hero-brand">
                <MessagesSquare :size="22" class="hero-icon" aria-hidden="true" />
                <h1>LGS Reply Viewer</h1>
            </div>
            <p class="hero-desc">
                洛谷文章评论区只读嵌入组件。粘贴文章链接即可生成 iframe 地址，下方实时预览。
                数据来自 <code>api.luogu.me</code>，可部署到 GitHub Pages。
            </p>
        </header>

        <section class="panel">
            <label class="field-label" for="article-input">文章链接或文章 ID</label>
            <div class="input-row">
                <input
                    id="article-input"
                    v-model="input"
                    class="text-input"
                    type="text"
                    placeholder="https://www.luogu.com.cn/article/lwr2bdre"
                    spellcheck="false"
                    autocomplete="off"
                    @keyup.enter="() => {}"
                />
            </div>

            <p class="parse-hint" :class="{ 'is-error': !parsed.ok && input.trim() }">
                <Loader2 v-if="!input.trim()" :size="13" aria-hidden="true" />
                {{ parsed.ok ? parsed.message : input.trim() ? parsed.message : '等待输入…' }}
            </p>

            <div class="examples">
                <span class="examples-label">示例：</span>
                <button
                    v-for="example in EXAMPLES"
                    :key="example.id"
                    type="button"
                    class="chip"
                    @click="useExample(example.id)"
                >
                    {{ example.label }}
                </button>
            </div>
        </section>

        <template v-if="activeId">
            <section class="panel">
                <h2 class="panel-title">显示选项</h2>
                <div class="options">
                    <label class="option">
                        <span class="option-label">主题</span>
                        <select v-model="themeMode" class="select">
                            <option value="auto">跟随系统</option>
                            <option value="light">浅色</option>
                            <option value="dark">深色</option>
                        </select>
                    </label>

                    <label class="option option-check">
                        <input v-model="showTitle" type="checkbox" />
                        <span>显示标题栏</span>
                    </label>
                    <label class="option option-check">
                        <input v-model="showFloor" type="checkbox" />
                        <span>显示楼层</span>
                    </label>
                    <label class="option option-check">
                        <input v-model="showRefresh" type="checkbox" />
                        <span>显示刷新按钮</span>
                    </label>
                    <label class="option option-check">
                        <input v-model="showNote" type="checkbox" />
                        <span>显示来源说明</span>
                    </label>
                    <label class="option option-number">
                        <span class="option-label">最多条数</span>
                        <input
                            v-model.number="maxComments"
                            class="number-input"
                            type="number"
                            min="0"
                            step="10"
                        />
                    </label>
                    <label class="option option-number">
                        <span class="option-label">折叠阈值</span>
                        <input
                            v-model.number="collapse"
                            class="number-input"
                            type="number"
                            min="0"
                            step="10"
                        />
                    </label>
                </div>
            </section>

            <section class="panel">
                <div class="panel-head">
                    <h2 class="panel-title">iframe 地址</h2>
                    <a class="ghost-link" :href="embedUrl" target="_blank" rel="noopener noreferrer">
                        <ExternalLink :size="13" aria-hidden="true" />
                        新窗口打开
                    </a>
                </div>
                <div class="code-row">
                    <input :value="embedUrl" class="code-input" readonly @focus="event => (event.target as HTMLInputElement).select()" />
                    <button
                        type="button"
                        class="copy-button"
                        :class="{ copied: copiedKey === 'url' }"
                        @click="copy('url', embedUrl)"
                    >
                        <Check v-if="copiedKey === 'url'" :size="14" aria-hidden="true" />
                        <Copy v-else :size="14" aria-hidden="true" />
                        {{ copiedKey === 'url' ? '已复制' : '复制' }}
                    </button>
                </div>

                <h3 class="sub-title">
                    <Link2 :size="13" aria-hidden="true" />
                    iframe 标签
                </h3>
                <div class="code-block">
                    <pre class="code-pre">{{ iframeSnippet }}</pre>
                    <button
                        type="button"
                        class="copy-button"
                        :class="{ copied: copiedKey === 'iframe' }"
                        @click="copy('iframe', iframeSnippet)"
                    >
                        <Check v-if="copiedKey === 'iframe'" :size="14" aria-hidden="true" />
                        <Copy v-else :size="14" aria-hidden="true" />
                        {{ copiedKey === 'iframe' ? '已复制' : '复制' }}
                    </button>
                </div>

                <h3 class="sub-title">
                    <Link2 :size="13" aria-hidden="true" />
                    自动高度脚本（推荐）
                </h3>
                <div class="code-block">
                    <pre class="code-pre">{{ scriptSnippet }}</pre>
                    <button
                        type="button"
                        class="copy-button"
                        :class="{ copied: copiedKey === 'script' }"
                        @click="copy('script', scriptSnippet)"
                    >
                        <Check v-if="copiedKey === 'script'" :size="14" aria-hidden="true" />
                        <Copy v-else :size="14" aria-hidden="true" />
                        {{ copiedKey === 'script' ? '已复制' : '复制' }}
                    </button>
                </div>
                <p class="note">
                    脚本方式会创建 iframe 并监听高度变化自动调整，无需手写
                    <code>onload</code>。原始文章：
                    <a :href="luoguUrl" target="_blank" rel="noopener noreferrer">{{ luoguUrl }}</a>
                </p>
            </section>

            <section class="panel">
                <h2 class="panel-title">实时预览</h2>
                <div class="preview-frame" :style="{ height: `${previewHeight}px` }">
                    <iframe
                        :key="embedUrl"
                        :src="embedUrl"
                        class="preview-iframe"
                        title="评论预览"
                        loading="lazy"
                        scrolling="auto"
                    />
                </div>
            </section>
        </template>

        <footer class="footer">
            <span>
                只读展示，不支持发布评论。数据版权归洛谷及原作者所有 · API:
                <code>api.luogu.me</code>
            </span>
            <span>
                由 <a href="https://www.luogu.me" target="_blank" rel="noopener noreferrer">洛谷保存站</a>
                提供数据支持 · <a href="https://github.com/laikit-dev/luogu-saver" target="_blank" rel="noopener noreferrer">laikit-dev/luogu-saver</a> · AGPL-3.0
            </span>
        </footer>
    </div>
</template>

<style scoped>
.home {
    max-width: 860px;
    margin: 0 auto;
    padding: var(--ui-space-8) var(--ui-space-5) var(--ui-space-10);
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-4);
}

.hero-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}
.hero-icon {
    color: var(--ui-primary-color);
}
.hero h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--ui-card-title-color);
    letter-spacing: -0.01em;
}
.hero-desc {
    margin: 10px 0 0;
    font-size: 14px;
    color: var(--ui-secondary-text-color);
}

.panel {
    background: var(--ui-card-color);
    border: 1px solid var(--ui-border-color);
    border-radius: 8px;
    padding: var(--ui-space-5);
}

.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ui-space-3);
}

.panel-title {
    margin: 0 0 var(--ui-space-3);
    font-size: 14px;
    font-weight: 700;
    color: var(--ui-card-title-color);
}
.panel-head .panel-title {
    margin-bottom: var(--ui-space-3);
}

.sub-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--ui-space-4) 0 var(--ui-space-2);
    font-size: 12px;
    font-weight: 600;
    color: var(--ui-muted-text-color);
}

.field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--ui-secondary-text-color);
    margin-bottom: var(--ui-space-2);
}

.input-row {
    display: flex;
    gap: var(--ui-space-2);
}

.text-input,
.code-input,
.select,
.number-input {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--ui-control-border-color);
    background: transparent;
    color: var(--ui-text-color);
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
}
.text-input:focus,
.code-input:focus,
.select:focus,
.number-input:focus {
    border-color: var(--ui-primary-color);
}
.text-input::placeholder {
    color: var(--ui-control-placeholder-color);
}

.parse-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--ui-space-2) 0 0;
    font-size: 12px;
    color: var(--ui-muted-text-color);
    min-height: 18px;
}
.parse-hint.is-error {
    color: var(--ui-danger-color);
}

.examples {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: var(--ui-space-3);
}
.examples-label {
    font-size: 12px;
    color: var(--ui-muted-text-color);
}
.chip {
    border: 1px solid var(--ui-control-border-color);
    background: transparent;
    color: var(--ui-secondary-text-color);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 12px;
    cursor: pointer;
    transition:
        border-color 0.2s,
        color 0.2s;
}
.chip:hover {
    border-color: var(--ui-control-border-hover-color);
    color: var(--ui-primary-color);
}

.options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-space-4);
    align-items: center;
}
.option {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--ui-secondary-text-color);
}
.option-check {
    cursor: pointer;
}
.option-check input {
    accent-color: var(--ui-primary-color);
    cursor: pointer;
}
.option-label {
    font-size: 13px;
    color: var(--ui-secondary-text-color);
}
.option-number {
    gap: 6px;
}
.select,
.number-input {
    flex: none;
    width: auto;
    min-width: 96px;
    padding: 5px 8px;
    font-size: 13px;
}
.number-input {
    width: 88px;
}

.code-row {
    display: flex;
    gap: var(--ui-space-2);
    align-items: stretch;
}
.code-block {
    position: relative;
    background: var(--ui-code-background-color);
    border-radius: 6px;
    padding: var(--ui-space-3) 92px var(--ui-space-3) var(--ui-space-3);
    overflow: hidden;
}
.code-pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: var(--ui-secondary-text-color);
}

.copy-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex-shrink: 0;
    min-width: 84px;
    border: 1px solid var(--ui-control-border-color);
    background: var(--ui-card-color);
    color: var(--ui-secondary-text-color);
    border-radius: 4px;
    padding: 0 12px;
    font-size: 12px;
    cursor: pointer;
    transition:
        border-color 0.2s,
        color 0.2s;
}
.code-block .copy-button {
    position: absolute;
    top: 8px;
    right: 8px;
    height: 28px;
}
.copy-button:hover {
    border-color: var(--ui-control-border-hover-color);
    color: var(--ui-primary-color);
}
.copy-button.copied {
    color: var(--ui-prize-green-color);
    border-color: var(--ui-prize-green-color);
}

.ghost-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--ui-muted-text-color);
}
.ghost-link:hover {
    color: var(--ui-primary-color);
}

.note {
    margin: var(--ui-space-3) 0 0;
    font-size: 12px;
    color: var(--ui-muted-text-color);
    overflow-wrap: anywhere;
}

.preview-frame {
    border: 1px solid var(--ui-border-color);
    border-radius: 6px;
    overflow: hidden;
    transition: height 0.2s ease;
    background: var(--ui-card-color);
}
.preview-iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
    color-scheme: light dark;
}

.footer {
    margin-top: var(--ui-space-2);
    font-size: 12px;
    color: var(--ui-muted-text-color);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.6;
}

code {
    background: var(--ui-code-background-color);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
}

@media (max-width: 640px) {
    .home {
        padding: var(--ui-space-5) var(--ui-space-4) var(--ui-space-8);
    }
    .code-block {
        padding-right: var(--ui-space-3);
        padding-bottom: 44px;
    }
    .code-block .copy-button {
        top: auto;
        bottom: 8px;
    }
}
</style>

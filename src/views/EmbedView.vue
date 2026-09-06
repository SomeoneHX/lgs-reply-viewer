<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MessageSquareWarning } from 'lucide-vue-next';
import CommentPanel from '@/components/CommentPanel.vue';
import { useFrameHeight } from '@/composables/useFrameHeight';
import { applyTheme, isThemeMode, watchSystemTheme, type ThemeMode } from '@/utils/theme';

const route = useRoute();

const FIRST_PARAM_KEYS = ['article', 'id', 'articleId', 'lid'] as const;

function readFirst(keys: readonly string[]): string | null {
    for (const key of keys) {
        const value = route.query[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
}

function readBool(key: string, fallback: boolean): boolean {
    const value = route.query[key];
    if (value === undefined) return fallback;
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
    return fallback;
}

const articleId = computed(() => {
    const raw = readFirst(FIRST_PARAM_KEYS);
    return raw && /^[A-Za-z0-9]{1,8}$/.test(raw) ? raw : null;
});

const rawId = computed(() => readFirst(FIRST_PARAM_KEYS));
const hasInvalidId = computed(() => !!rawId.value && !articleId.value);

const themeMode = computed<ThemeMode>(() => {
    const value = route.query.theme;
    return isThemeMode(value) ? value : 'auto';
});

const showRefresh = computed(() => readBool('refresh', true));
const showTitle = computed(() => readBool('title', true));
const showNote = computed(() => readBool('note', true));
const showFloor = computed(() => readBool('floor', true));

const maxComments = computed(() => {
    const value = Number(route.query.max);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
});

const collapse = computed(() => {
    const value = Number(route.query.collapse);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
});

const resolvedTheme = ref<'light' | 'dark'>('light');

function syncTheme() {
    resolvedTheme.value = applyTheme(themeMode.value);
}

// Auto height reporting so the host iframe can shrink-wrap the widget.
useFrameHeight(() => document.getElementById('embed-root'));

let stopSystemWatch: (() => void) | null = null;

onMounted(() => {
    document.body.classList.add('is-embed');
    syncTheme();
    stopSystemWatch = watchSystemTheme(syncTheme);
});

onUnmounted(() => {
    document.body.classList.remove('is-embed');
    stopSystemWatch?.();
    stopSystemWatch = null;
});

watch(themeMode, syncTheme);
</script>

<template>
    <div id="embed-root" class="embed-root">
        <CommentPanel
            v-if="articleId"
            :key="articleId"
            :article-id="articleId"
            variant="flat"
            :show-refresh="showRefresh"
            :show-title="showTitle"
            :show-source-note="showNote"
            :show-floor="showFloor"
            :max-comments="maxComments"
            :collapse="collapse"
        />

        <div v-else-if="hasInvalidId" class="embed-notice">
            <MessageSquareWarning :size="16" aria-hidden="true" />
            <span>文章 ID 无效：{{ rawId }}（应为 1–8 位字母数字）</span>
        </div>

        <div v-else class="embed-notice">
            <MessageSquareWarning :size="16" aria-hidden="true" />
            <span>缺少文章参数，例如 <code>#/embed?article=lwr2bdre</code></span>
        </div>
    </div>
</template>

<style scoped>
.embed-root {
    /* Flat: no card chrome, but a small left/right inset so headings, avatars,
       floors and timestamps aren't pressed against the iframe edge. */
    margin: 0;
    padding: 0 var(--ui-space-4);
    background: transparent;
    color: var(--ui-text-color);
    font-size: 14px;
    overflow-wrap: break-word;
}

.embed-notice {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--ui-space-3) 0;
    font-size: 13px;
    color: var(--ui-muted-text-color);
}

.embed-notice code {
    background: var(--ui-code-background-color);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
}
</style>

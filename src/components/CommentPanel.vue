<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { MessageSquare, RefreshCw } from 'lucide-vue-next';
import CommentList from './CommentList.vue';
import CommentSkeleton from './CommentSkeleton.vue';
import { useComments } from '@/composables/useComments';
import { formatRelative } from '@/utils/time';
import { toLuoguUrl } from '@/utils/article-id';

const props = withDefaults(
    defineProps<{
        articleId: string | null;
        /**
         * flat   -> iframe embed: no card, no shadow, transparent surface
         * panel  -> home page preview: bordered surface
         */
        variant?: 'flat' | 'panel';
        showRefresh?: boolean;
        showSourceNote?: boolean;
        showTitle?: boolean;
        showFloor?: boolean;
        /** Hard cap on rendered comments; 0 = unlimited. */
        maxComments?: number;
        /**
         * When > 0 and the list is longer, only the first `collapse` entries
         * render plus a "展开剩余" button. Keeps iframe height manageable.
         */
        collapse?: number;
    }>(),
    {
        variant: 'flat',
        showRefresh: true,
        showSourceNote: true,
        showTitle: true,
        showFloor: true,
        maxComments: 0,
        collapse: 0
    }
);

const { state, errorMessage, comments, fetchedAtMs, stale, refreshing, article, load, refresh } =
    useComments(() => props.articleId);

const expanded = ref(false);

const cappedComments = computed(() => {
    const list = comments.value;
    if (props.maxComments > 0 && list.length > props.maxComments) {
        return list.slice(0, props.maxComments);
    }
    return list;
});

const isCollapsed = computed(
    () => !expanded.value && props.collapse > 0 && cappedComments.value.length > props.collapse
);

const visibleComments = computed(() =>
    isCollapsed.value ? cappedComments.value.slice(0, props.collapse) : cappedComments.value
);

const hiddenCount = computed(() => cappedComments.value.length - visibleComments.value.length);

const syncedText = computed(() => (fetchedAtMs.value ? formatRelative(fetchedAtMs.value) : ''));

const articleUrl = computed(() => (props.articleId ? toLuoguUrl(props.articleId) : ''));

onMounted(() => {
    void load();
});

watch(
    () => props.articleId,
    () => {
        void load();
    }
);

defineExpose({ load, refresh });
</script>

<template>
    <section class="comment-panel" :class="`is-${variant}`">
        <header v-if="showTitle" class="panel-header">
            <div class="panel-heading">
                <MessageSquare :size="16" class="heading-icon" aria-hidden="true" />
                <span class="heading-text">评论</span>
                <span v-if="state === 'ready'" class="heading-count">{{ comments.length }}</span>
                <a
                    v-if="article?.title && articleId"
                    class="heading-article"
                    :href="articleUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="article.title"
                >
                    {{ article.title }}
                </a>
            </div>
            <button
                v-if="showRefresh && articleId"
                type="button"
                class="refresh-button"
                :disabled="refreshing"
                :title="refreshing ? '正在请求刷新…' : '请求重新抓取评论'"
                @click="refresh"
            >
                <RefreshCw :size="13" :class="{ spin: refreshing }" aria-hidden="true" />
                <span>{{ refreshing ? '刷新中' : '刷新' }}</span>
            </button>
        </header>

        <div class="panel-body">
            <CommentSkeleton v-if="state === 'loading' || state === 'idle'" />

            <div v-else-if="state === 'error'" class="state-block state-error">
                <p class="state-title">加载失败</p>
                <p class="state-desc">{{ errorMessage || '无法获取评论数据' }}</p>
                <button type="button" class="retry-button" @click="load()">重试</button>
            </div>

            <div v-else-if="comments.length === 0" class="state-block state-empty">
                <p class="state-desc">暂无评论</p>
            </div>

            <template v-else>
                <CommentList :comments="visibleComments" :show-floor="showFloor" />
                <button
                    v-if="isCollapsed"
                    type="button"
                    class="expand-button"
                    @click="expanded = true"
                >
                    展开剩余 {{ hiddenCount }} 条评论
                </button>
                <p v-else-if="hiddenCount > 0" class="more-hint">
                    另有 {{ hiddenCount }} 条评论未显示
                </p>
            </template>
        </div>

        <footer v-if="showSourceNote && state === 'ready' && comments.length > 0" class="panel-footer">
            <span class="footer-source">
                评论来源于
                <a :href="articleUrl" target="_blank" rel="noopener noreferrer">洛谷</a>
                <template v-if="stale"> · 正在后台更新</template>
                <template v-if="syncedText">，最后同步于 {{ syncedText }}</template>
            </span>
            <span class="footer-support">
                由 <a href="https://www.luogu.me" target="_blank" rel="noopener noreferrer">洛谷保存站</a> 提供支持
            </span>
        </footer>
    </section>
</template>

<style scoped>
.comment-panel {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    color: var(--ui-text-color);
}

/* flat: the iframe surface — no card, no shadow, no radius */
.comment-panel.is-flat {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
}

/* panel: home page preview — a real surface */
.comment-panel.is-panel {
    background: var(--ui-card-color);
    border: 1px solid var(--ui-border-color);
    border-radius: 8px;
    padding: var(--ui-space-4);
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ui-space-3);
    padding-bottom: var(--ui-space-2);
    border-bottom: 1px solid var(--ui-border-color);
    margin-bottom: var(--ui-space-1);
    min-width: 0;
}

.panel-heading {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    /* Take the leftover width next to the refresh button so the article
       title isn't squeezed into a percentage of a self-sized flex item. */
    flex: 1 1 auto;
}

.heading-icon {
    color: var(--ui-primary-color);
    flex-shrink: 0;
}

.heading-text {
    font-weight: 700;
    font-size: 15px;
    color: var(--ui-card-title-color);
}

.heading-count {
    font-size: 12px;
    font-weight: 600;
    color: var(--ui-muted-text-color);
    background: var(--ui-panel-color);
    border-radius: 8px;
    padding: 0 6px;
    line-height: 18px;
}

.heading-article {
    font-size: 12px;
    color: var(--ui-muted-text-color);
    /* Grow inside .panel-heading to use real leftover space instead of a
       percentage of the flex container's self-sized width. */
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.refresh-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid var(--ui-control-border-color);
    background: transparent;
    color: var(--ui-secondary-text-color);
    font-size: 12px;
    line-height: 1;
    padding: 5px 9px;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition:
        border-color 0.2s,
        color 0.2s;
}
.refresh-button:hover:not(:disabled) {
    border-color: var(--ui-control-border-hover-color);
    color: var(--ui-primary-color);
}
.refresh-button:disabled {
    cursor: default;
    opacity: 0.6;
}

.spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.panel-body {
    min-height: 24px;
}

.state-block {
    padding: var(--ui-space-5) 0;
    text-align: center;
}
.state-title {
    margin: 0 0 4px;
    font-weight: 600;
    color: var(--ui-danger-color);
}
.state-desc {
    margin: 0;
    font-size: 13px;
    color: var(--ui-muted-text-color);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.state-error {
    background: var(--ui-danger-soft);
    border-radius: 6px;
}

.retry-button {
    margin-top: 10px;
    border: 1px solid var(--ui-control-border-color);
    background: transparent;
    color: var(--ui-secondary-text-color);
    font-size: 12px;
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
}
.retry-button:hover {
    border-color: var(--ui-control-border-hover-color);
    color: var(--ui-primary-color);
}

.expand-button {
    display: block;
    width: 100%;
    margin: var(--ui-space-3) 0 0;
    padding: 8px 12px;
    border: 1px solid var(--ui-control-border-color);
    border-radius: 4px;
    background: transparent;
    color: var(--ui-primary-color);
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.2s;
}
.expand-button:hover {
    border-color: var(--ui-control-border-hover-color);
}

.more-hint {
    margin: var(--ui-space-3) 0 0;
    font-size: 12px;
    color: var(--ui-muted-text-color);
    text-align: center;
}

.panel-footer {
    margin: var(--ui-space-3) 0 0;
    padding-top: var(--ui-space-2);
    border-top: 1px solid var(--ui-border-color);
    font-size: 12px;
    color: var(--ui-muted-text-color);
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.6;
}

.footer-support a {
    font-weight: 600;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import UserLink from './UserLink.vue';
import { formatDateTime, formatFull, formatRelative } from '@/utils/time';
import type { NormalisedComment } from '@/composables/useComments';

const props = defineProps<{
    comment: NormalisedComment;
    /** Sort position shown as a floor number, like Luogu does. */
    floor?: number;
}>();

const timeText = computed(() => formatDateTime(props.comment.timeMs));
const relativeText = computed(() => formatRelative(props.comment.timeMs));
const fullText = computed(() => formatFull(props.comment.timeMs));
</script>

<template>
    <li class="comment-item">
        <div class="comment-head">
            <UserLink
                :id="comment.author.id"
                :name="comment.author.name"
                :color="comment.author.color"
                :ccf-level="comment.author.ccfLevel"
                :xcpc-level="comment.author.xcpcLevel"
                :show-avatar="true"
            />
            <span v-if="floor" class="comment-floor">#{{ floor }}</span>
            <time class="comment-time" :datetime="fullText" :title="fullText">
                {{ timeText }}
                <template v-if="relativeText"> · {{ relativeText }}</template>
            </time>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
    </li>
</template>

<style scoped>
.comment-item {
    padding: var(--ui-space-3) 0;
    border-bottom: 1px solid var(--ui-border-color);
}
.comment-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
.comment-head {
    display: flex;
    align-items: center;
    gap: var(--ui-space-2);
    flex-wrap: wrap;
    min-width: 0;
}
.comment-floor {
    font-size: 12px;
    color: var(--ui-muted-text-color);
    flex-shrink: 0;
}
.comment-time {
    font-size: 12px;
    color: var(--ui-muted-text-color);
    flex-shrink: 0;
    margin-left: auto;
    white-space: nowrap;
}
.comment-content {
    margin-top: var(--ui-space-2);
    padding: var(--ui-space-2) var(--ui-space-3);
    /* indent the body slightly past the avatar so it lines up under the name
       instead of touching the left edge when the widget is embedded in a page
       with no surrounding chrome */
    margin-left: 28px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--ui-text-color);
    /* preserve newlines from plain-text comments; wrap long content */
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
}
@media (max-width: 480px) {
    .comment-content {
        margin-left: var(--ui-space-3);
    }
}
</style>

<script setup lang="ts">
import CommentItem from './CommentItem.vue';
import type { NormalisedComment } from '@/composables/useComments';

withDefaults(
    defineProps<{
        comments: NormalisedComment[];
        /** Show Luogu-style floor numbers (#1, #2, ...). */
        showFloor?: boolean;
    }>(),
    { showFloor: true }
);
</script>

<template>
    <ul class="comment-list">
        <CommentItem
            v-for="(comment, index) in comments"
            :key="comment.id"
            :comment="comment"
            :floor="showFloor ? index + 1 : undefined"
        />
    </ul>
</template>

<style scoped>
.comment-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
}
</style>

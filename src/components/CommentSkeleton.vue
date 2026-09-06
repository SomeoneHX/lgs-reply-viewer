<script setup lang="ts">
withDefaults(
    defineProps<{
        repeat?: number;
        label?: string;
    }>(),
    { repeat: 3, label: '正在加载评论…' }
);
</script>

<template>
    <div class="skeleton" role="status" :aria-label="label">
        <div v-for="index in repeat" :key="index" class="skeleton-row">
            <span class="skeleton-avatar shimmer" />
            <div class="skeleton-lines">
                <span class="skeleton-line shimmer" style="width: 30%" />
                <span class="skeleton-line shimmer" />
                <span class="skeleton-line shimmer" style="width: 62%" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-4);
    padding: var(--ui-space-2) 0;
}
.skeleton-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}
.skeleton-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
}
.skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding-top: 2px;
}
.skeleton-line {
    height: 11px;
    border-radius: 4px;
    display: block;
}
.shimmer {
    background: var(--ui-code-background-color);
    position: relative;
    overflow: hidden;
}
.shimmer::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
        90deg,
        transparent,
        var(--ui-panel-color),
        transparent
    );
    animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import UserPrizeBadge from './UserPrizeBadge.vue';

const props = withDefaults(
    defineProps<{
        id: number;
        name: string;
        color?: string;
        ccfLevel?: number;
        xcpcLevel?: number;
        showAvatar?: boolean;
        /** Open the Luogu profile in a new tab (default inside an iframe). */
        external?: boolean;
    }>(),
    {
        color: 'Gray',
        ccfLevel: 0,
        xcpcLevel: 0,
        showAvatar: true,
        external: true
    }
);

const avatarUrl = computed(
    () => `https://cdn.luogu.com.cn/upload/usericon/${props.id || 3}.png`
);
const profileUrl = computed(() => `https://www.luogu.com.cn/user/${props.id}`);
</script>

<template>
    <span class="user-link-container">
        <img
            v-if="showAvatar"
            class="user-avatar"
            :src="avatarUrl"
            :alt="name"
            width="24"
            height="24"
            loading="lazy"
            referrerpolicy="no-referrer"
        />
        <a
            class="user-name"
            :class="`user-${color || 'Gray'}`"
            :href="profileUrl"
            :target="external ? '_blank' : undefined"
            :rel="external ? 'noopener noreferrer' : undefined"
        >
            {{ name }}
        </a>
        <UserPrizeBadge :ccf-level="ccfLevel" :xcpc-level="xcpcLevel" :size="16" />
    </span>
</template>

<style scoped>
.user-link-container {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}
.user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--ui-panel-color);
}
.user-name {
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
    transition: opacity 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.user-name:hover {
    opacity: 0.8;
    text-decoration: none;
}
</style>

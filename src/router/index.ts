import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import EmbedView from '@/views/EmbedView.vue';

/**
 * Hash history is deliberate: GitHub Pages has no rewrite rules, so path based
 * routes would 404 on a hard refresh. Hash routing keeps every entry point on
 * a single index.html and works under any base path.
 */
const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { title: 'LGS Reply Viewer' }
    },
    {
        path: '/embed',
        name: 'embed',
        component: EmbedView,
        meta: { title: '评论' }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
});

router.afterEach(to => {
    const title = (to.meta.title as string | undefined) || 'LGS Reply Viewer';
    document.title = to.name === 'home' ? title : `${title} · LGS Reply Viewer`;
});

export default router;

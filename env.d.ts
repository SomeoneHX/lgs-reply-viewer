/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

interface ImportMetaEnv {
    /** Override the upstream API origin, e.g. https://api.luogu.me */
    readonly VITE_API_BASE?: string;
    /** Override the Vite base, e.g. /lgs-reply-viewer/ */
    readonly VITE_BASE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Relative base so the same build works at https://<user>.github.io/,
    // https://<user>.github.io/<repo>/ and on a custom domain without a rebuild.
    // Routing is hash based (see src/router), so relative asset URLs are safe.
    const base = env.VITE_BASE || './';

    return {
        base,
        plugins: [vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        build: {
            // public/embed.js must stay untranspiled and unhashed at the root.
            assetsDir: 'assets',
            target: 'es2020'
        }
    };
});

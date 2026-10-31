import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { env } from 'node:process';
import { defineConfig } from 'vite';

export default defineConfig({
  base: env.GITHUB_ACTIONS ? '/pulse/' : '/',
  plugins: [tailwindcss(), svelte()],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: true,
  },
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
});

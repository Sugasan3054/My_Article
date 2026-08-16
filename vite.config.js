import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        article: resolve(__dirname, 'article.html'),
        summarize: resolve(__dirname, 'summarize.html'),
      },
    },
  },
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
  },
});

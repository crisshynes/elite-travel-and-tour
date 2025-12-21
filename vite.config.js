import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',              // project root is trav/
  publicDir: 'public',    // serve static assets from /public
  server: {
    port: 5173,
    open: true
  }
});

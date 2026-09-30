import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/android-manifest-stig-checker/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});

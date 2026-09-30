import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/android-manifest-stig-checker/',
  define: {
    __SOURCE_COMMIT__: JSON.stringify(execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim()),
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});

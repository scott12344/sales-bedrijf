import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// De build levert bewust één enkel index.html op: de complete app (code, stijl,
// 3D-engine) zit daarin. Zo draait het systeem offline vanaf een USB-stick of
// map op de tablet, en kan een klantpresentatie als één bestand gemaild worden.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 4000,
  },
});

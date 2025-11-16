import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin-tanstack-start';
import { nitro } from 'nitro/vite'


export default defineConfig({
  server: {},
  plugins: [
    nitro(),
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    tanstackStart(),
    viteReact(),
    netlify()
  ]
});

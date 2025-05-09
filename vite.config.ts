import { fileURLToPath, URL } from 'node:url'
import VueDevTools from 'vite-plugin-vue-devtools'
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import Fonts from 'unplugin-fonts/vite'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        allowedHosts: ['localhost', '127.0.0.1'],
        strictPort: true,
        port: 5173,
    },
    css: {
      preprocessorOptions: {
        sass: {
          api: 'modern-compiler',
        },
        scss: {
          api: 'modern-compiler',
        },
      },
          devSourcemap: true,
    },
    plugins: [
        Vue({
          template: { transformAssetUrls },
        }),
        VueDevTools(),
        // Docs: https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin
        Vuetify({
            styles: {
                configFile: 'src/styles/variables/_vuetify.scss',
            },
        }),
        Components({
            dirs: ['src/@core/components'],
            dts: true,
        }),
        Fonts({
          fontsource: {
            families: [
              {
                name: 'Roboto',
                weights: [100, 300, 400, 500, 700, 900],
                styles: ['normal', 'italic'],
              },
            ],
          },
        }),
    ],
    define: { 'process.env': {} },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
            '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
            '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
            '@images': fileURLToPath(new URL('./src/assets/images', import.meta.url)),
            '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
            '@configured-variables': fileURLToPath(new URL('./src/styles/variables/_template.scss', import.meta.url)),
            '@axios': fileURLToPath(new URL('./src/plugins/axios', import.meta.url)),
            'apexcharts': fileURLToPath(new URL('node_modules/apexcharts-clevision', import.meta.url)),
        },
        extensions: [
          '.js',
          '.json',
          '.jsx',
          '.mjs',
          '.ts',
          '.tsx',
          '.vue',
        ],
    },
    build: {
        chunkSizeWarningLimit: 5000,
    },
    optimizeDeps: {
        exclude: ['vuetify'],
        entries: [
            './src/**/*.vue',
        ],
    },
})
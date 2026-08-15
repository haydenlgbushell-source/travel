import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Wayfare',
        short_name: 'Wayfare',
        description: 'A trip itinerary that stays with the group.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F2F1EC',
        theme_color: '#F2F1EC',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The itinerary itself is already offline-first via localStorage —
        // this just makes the shell, fonts and map tiles survive a reload
        // with no signal too.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          {
            // CARTO map tiles: once panned into view, they stay available —
            // a trip's geography doesn't change, so there's no reason to
            // ever refetch a tile that's already been seen.
            urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Weather is time-sensitive, so always try the network first —
            // but the last good forecast is better than nothing offline.
            urlPattern: /^https:\/\/api\.open-meteo\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 6 },
            },
          },
          {
            // Wikipedia photo lookups resolve once and rarely change.
            urlPattern: /\/\.netlify\/functions\/(wiki-photo|unfurl)/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'trip-functions' },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})

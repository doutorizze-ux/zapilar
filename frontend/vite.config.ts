import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-z-green.png', 'logo-dark.png'],
      manifest: {
        name: 'Zapilar - Corretor Digital',
        short_name: 'Zapilar',
        description: 'Consultora IA imobiliaria. Automacao de leads, WhatsApp inteligente e CRM completo.',
        theme_color: '#0B2B26',
        background_color: '#0B2B26',
        display: 'standalone',
        scope: '/',
        start_url: '/dashboard',
        orientation: 'portrait',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/logo-z-green.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo-z-green.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    }),
  ],
})

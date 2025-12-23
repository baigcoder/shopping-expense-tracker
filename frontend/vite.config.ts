import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    // Performance optimizations
    build: {
        // Split chunks for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunk - core React
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // UI libraries
                    'vendor-ui': ['framer-motion', 'lucide-react'],
                    // Supabase
                    'vendor-supabase': ['@supabase/supabase-js'],
                    // Charting
                    'vendor-charts': ['recharts'],
                    // Utilities
                    'vendor-utils': ['date-fns', 'zustand'],
                },
            },
        },
        // Enable minification with esbuild (built-in, faster)
        minify: 'esbuild',
        // Generate source maps for debugging (disable in production if needed)
        sourcemap: false,
        // Reduce chunk size warnings threshold
        chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            '@supabase/supabase-js',
            'zustand',
            'date-fns',
        ],
    },
    // Enable caching
    cacheDir: 'node_modules/.vite',
});

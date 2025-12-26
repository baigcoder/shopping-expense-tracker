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
    // Production optimizations for Vercel
    build: {
        // Target modern browsers for smaller bundles
        target: 'es2020',
        // CSS code splitting
        cssCodeSplit: true,
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
                    // PDF/OCR (lazy loaded)
                    'vendor-pdf': ['pdfjs-dist'],
                },
                // Optimize chunk filenames for caching
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        // Use esbuild for fast minification
        minify: 'esbuild',
        // Disable source maps in production for smaller bundle
        sourcemap: false,
        // Reduce chunk size warnings threshold
        chunkSizeWarningLimit: 1000,
        // Enable CSS minification
        cssMinify: true,
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
        // Exclude heavy libraries from pre-bundling
        exclude: ['pdfjs-dist'],
    },
    // Enable caching
    cacheDir: 'node_modules/.vite',
    // Ignore unnecessary files
    esbuild: {
        drop: ['console', 'debugger'], // Remove console.logs in production
        legalComments: 'none', // Remove license comments
    },
});


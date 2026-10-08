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
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (/[\\/]node_modules[\\/]pdfjs-dist[\\/]/.test(id)) {
                            return 'vendor-pdf';
                        }
                        if (/[\\/]node_modules[\\/](recharts|d3-[a-z]+|victory-vendor)[\\/]/.test(id)) {
                            return 'vendor-charts';
                        }
                        if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) {
                            return 'vendor-supabase';
                        }
                        if (/[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/.test(id)) {
                            return 'vendor-ui';
                        }
                        if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
                            return 'vendor-react';
                        }
                        if (/[\\/]node_modules[\\/](clsx|tailwind-merge|date-fns|zustand)[\\/]/.test(id)) {
                            return 'vendor-utils';
                        }
                    }
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
        drop: ['debugger'],     // Keep console.error/warn for debugging
        pure: ['console.log'],  // Only remove console.log, keep error/warn
        legalComments: 'none', // Remove license comments
    },
});


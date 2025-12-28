// vite.config.ts
import { defineConfig } from "file:///D:/BSSE/Projects/New%20folder/shopping-expense-tracker/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/BSSE/Projects/New%20folder/shopping-expense-tracker/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///D:/BSSE/Projects/New%20folder/shopping-expense-tracker/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "D:\\BSSE\\Projects\\New folder\\shopping-expense-tracker\\frontend";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  // Production optimizations for Vercel
  build: {
    // Target modern browsers for smaller bundles
    target: "es2020",
    // CSS code splitting
    cssCodeSplit: true,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - core React
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "vendor-ui": ["framer-motion", "lucide-react"],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          // Charting
          "vendor-charts": ["recharts"],
          // Utilities
          "vendor-utils": ["date-fns", "zustand"],
          // PDF/OCR (lazy loaded)
          "vendor-pdf": ["pdfjs-dist"]
        },
        // Optimize chunk filenames for caching
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    // Use esbuild for fast minification
    minify: "esbuild",
    // Disable source maps in production for smaller bundle
    sourcemap: false,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1e3,
    // Enable CSS minification
    cssMinify: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "@supabase/supabase-js",
      "zustand",
      "date-fns"
    ],
    // Exclude heavy libraries from pre-bundling
    exclude: ["pdfjs-dist"]
  },
  // Enable caching
  cacheDir: "node_modules/.vite",
  // Ignore unnecessary files
  esbuild: {
    drop: ["console", "debugger"],
    // Remove console.logs in production
    legalComments: "none"
    // Remove license comments
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCU1NFXFxcXFByb2plY3RzXFxcXE5ldyBmb2xkZXJcXFxcc2hvcHBpbmctZXhwZW5zZS10cmFja2VyXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxCU1NFXFxcXFByb2plY3RzXFxcXE5ldyBmb2xkZXJcXFxcc2hvcHBpbmctZXhwZW5zZS10cmFja2VyXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9CU1NFL1Byb2plY3RzL05ldyUyMGZvbGRlci9zaG9wcGluZy1leHBlbnNlLXRyYWNrZXIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBwb3J0OiA1MTczLFxyXG4gICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIFByb2R1Y3Rpb24gb3B0aW1pemF0aW9ucyBmb3IgVmVyY2VsXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAgIC8vIFRhcmdldCBtb2Rlcm4gYnJvd3NlcnMgZm9yIHNtYWxsZXIgYnVuZGxlc1xyXG4gICAgICAgIHRhcmdldDogJ2VzMjAyMCcsXHJcbiAgICAgICAgLy8gQ1NTIGNvZGUgc3BsaXR0aW5nXHJcbiAgICAgICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgICAgIC8vIFNwbGl0IGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVmVuZG9yIGNodW5rIC0gY29yZSBSZWFjdFxyXG4gICAgICAgICAgICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVUkgbGlicmFyaWVzXHJcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci11aSc6IFsnZnJhbWVyLW1vdGlvbicsICdsdWNpZGUtcmVhY3QnXSxcclxuICAgICAgICAgICAgICAgICAgICAvLyBTdXBhYmFzZVxyXG4gICAgICAgICAgICAgICAgICAgICd2ZW5kb3Itc3VwYWJhc2UnOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYXJ0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci1jaGFydHMnOiBbJ3JlY2hhcnRzJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXRpbGl0aWVzXHJcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci11dGlscyc6IFsnZGF0ZS1mbnMnLCAnenVzdGFuZCddLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBERi9PQ1IgKGxhenkgbG9hZGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICd2ZW5kb3ItcGRmJzogWydwZGZqcy1kaXN0J10sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gT3B0aW1pemUgY2h1bmsgZmlsZW5hbWVzIGZvciBjYWNoaW5nXHJcbiAgICAgICAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBVc2UgZXNidWlsZCBmb3IgZmFzdCBtaW5pZmljYXRpb25cclxuICAgICAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgICAgICAvLyBEaXNhYmxlIHNvdXJjZSBtYXBzIGluIHByb2R1Y3Rpb24gZm9yIHNtYWxsZXIgYnVuZGxlXHJcbiAgICAgICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgICAgICAvLyBSZWR1Y2UgY2h1bmsgc2l6ZSB3YXJuaW5ncyB0aHJlc2hvbGRcclxuICAgICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgICAgICAgLy8gRW5hYmxlIENTUyBtaW5pZmljYXRpb25cclxuICAgICAgICBjc3NNaW5pZnk6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgICBpbmNsdWRlOiBbXHJcbiAgICAgICAgICAgICdyZWFjdCcsXHJcbiAgICAgICAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAgICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICAgICAgICdmcmFtZXItbW90aW9uJyxcclxuICAgICAgICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycsXHJcbiAgICAgICAgICAgICd6dXN0YW5kJyxcclxuICAgICAgICAgICAgJ2RhdGUtZm5zJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vIEV4Y2x1ZGUgaGVhdnkgbGlicmFyaWVzIGZyb20gcHJlLWJ1bmRsaW5nXHJcbiAgICAgICAgZXhjbHVkZTogWydwZGZqcy1kaXN0J10sXHJcbiAgICB9LFxyXG4gICAgLy8gRW5hYmxlIGNhY2hpbmdcclxuICAgIGNhY2hlRGlyOiAnbm9kZV9tb2R1bGVzLy52aXRlJyxcclxuICAgIC8vIElnbm9yZSB1bm5lY2Vzc2FyeSBmaWxlc1xyXG4gICAgZXNidWlsZDoge1xyXG4gICAgICAgIGRyb3A6IFsnY29uc29sZScsICdkZWJ1Z2dlciddLCAvLyBSZW1vdmUgY29uc29sZS5sb2dzIGluIHByb2R1Y3Rpb25cclxuICAgICAgICBsZWdhbENvbW1lbnRzOiAnbm9uZScsIC8vIFJlbW92ZSBsaWNlbnNlIGNvbW1lbnRzXHJcbiAgICB9LFxyXG59KTtcclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVgsU0FBUyxvQkFBb0I7QUFDcFosT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNILFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUE7QUFBQSxFQUVBLE9BQU87QUFBQTtBQUFBLElBRUgsUUFBUTtBQUFBO0FBQUEsSUFFUixjQUFjO0FBQUE7QUFBQSxJQUVkLGVBQWU7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNKLGNBQWM7QUFBQTtBQUFBLFVBRVYsZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUEsVUFFekQsYUFBYSxDQUFDLGlCQUFpQixjQUFjO0FBQUE7QUFBQSxVQUU3QyxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQTtBQUFBLFVBRTNDLGlCQUFpQixDQUFDLFVBQVU7QUFBQTtBQUFBLFVBRTVCLGdCQUFnQixDQUFDLFlBQVksU0FBUztBQUFBO0FBQUEsVUFFdEMsY0FBYyxDQUFDLFlBQVk7QUFBQSxRQUMvQjtBQUFBO0FBQUEsUUFFQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNwQjtBQUFBLElBQ0o7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBO0FBQUEsSUFFUixXQUFXO0FBQUE7QUFBQSxJQUVYLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsV0FBVztBQUFBLEVBQ2Y7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1YsU0FBUztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBQUE7QUFBQSxJQUVBLFNBQVMsQ0FBQyxZQUFZO0FBQUEsRUFDMUI7QUFBQTtBQUFBLEVBRUEsVUFBVTtBQUFBO0FBQUEsRUFFVixTQUFTO0FBQUEsSUFDTCxNQUFNLENBQUMsV0FBVyxVQUFVO0FBQUE7QUFBQSxJQUM1QixlQUFlO0FBQUE7QUFBQSxFQUNuQjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

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
  // Performance optimizations
  build: {
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
          "vendor-utils": ["date-fns", "zustand"]
        }
      }
    },
    // Enable minification with esbuild (built-in, faster)
    minify: "esbuild",
    // Generate source maps for debugging (disable in production if needed)
    sourcemap: false,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1e3
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
    ]
  },
  // Enable caching
  cacheDir: "node_modules/.vite"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCU1NFXFxcXFByb2plY3RzXFxcXE5ldyBmb2xkZXJcXFxcc2hvcHBpbmctZXhwZW5zZS10cmFja2VyXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxCU1NFXFxcXFByb2plY3RzXFxcXE5ldyBmb2xkZXJcXFxcc2hvcHBpbmctZXhwZW5zZS10cmFja2VyXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9CU1NFL1Byb2plY3RzL05ldyUyMGZvbGRlci9zaG9wcGluZy1leHBlbnNlLXRyYWNrZXIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBwb3J0OiA1MTczLFxyXG4gICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIFBlcmZvcm1hbmNlIG9wdGltaXphdGlvbnNcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgLy8gU3BsaXQgY2h1bmtzIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBWZW5kb3IgY2h1bmsgLSBjb3JlIFJlYWN0XHJcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICAgICAgICAgICAvLyBVSSBsaWJyYXJpZXNcclxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLXVpJzogWydmcmFtZXItbW90aW9uJywgJ2x1Y2lkZS1yZWFjdCddLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFN1cGFiYXNlXHJcbiAgICAgICAgICAgICAgICAgICAgJ3ZlbmRvci1zdXBhYmFzZSc6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhcnRpbmdcclxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLWNoYXJ0cyc6IFsncmVjaGFydHMnXSxcclxuICAgICAgICAgICAgICAgICAgICAvLyBVdGlsaXRpZXNcclxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLXV0aWxzJzogWydkYXRlLWZucycsICd6dXN0YW5kJ10sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gRW5hYmxlIG1pbmlmaWNhdGlvbiB3aXRoIGVzYnVpbGQgKGJ1aWx0LWluLCBmYXN0ZXIpXHJcbiAgICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgc291cmNlIG1hcHMgZm9yIGRlYnVnZ2luZyAoZGlzYWJsZSBpbiBwcm9kdWN0aW9uIGlmIG5lZWRlZClcclxuICAgICAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgICAgIC8vIFJlZHVjZSBjaHVuayBzaXplIHdhcm5pbmdzIHRocmVzaG9sZFxyXG4gICAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIH0sXHJcbiAgICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICAgIGluY2x1ZGU6IFtcclxuICAgICAgICAgICAgJ3JlYWN0JyxcclxuICAgICAgICAgICAgJ3JlYWN0LWRvbScsXHJcbiAgICAgICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcclxuICAgICAgICAgICAgJ2ZyYW1lci1tb3Rpb24nLFxyXG4gICAgICAgICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcclxuICAgICAgICAgICAgJ3p1c3RhbmQnLFxyXG4gICAgICAgICAgICAnZGF0ZS1mbnMnLFxyXG4gICAgICAgIF0sXHJcbiAgICB9LFxyXG4gICAgLy8gRW5hYmxlIGNhY2hpbmdcclxuICAgIGNhY2hlRGlyOiAnbm9kZV9tb2R1bGVzLy52aXRlJyxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVgsU0FBUyxvQkFBb0I7QUFDcFosT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNILFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUE7QUFBQSxFQUVBLE9BQU87QUFBQTtBQUFBLElBRUgsZUFBZTtBQUFBLE1BQ1gsUUFBUTtBQUFBLFFBQ0osY0FBYztBQUFBO0FBQUEsVUFFVixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUE7QUFBQSxVQUV6RCxhQUFhLENBQUMsaUJBQWlCLGNBQWM7QUFBQTtBQUFBLFVBRTdDLG1CQUFtQixDQUFDLHVCQUF1QjtBQUFBO0FBQUEsVUFFM0MsaUJBQWlCLENBQUMsVUFBVTtBQUFBO0FBQUEsVUFFNUIsZ0JBQWdCLENBQUMsWUFBWSxTQUFTO0FBQUEsUUFDMUM7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBO0FBQUEsSUFFQSxRQUFRO0FBQUE7QUFBQSxJQUVSLFdBQVc7QUFBQTtBQUFBLElBRVgsdUJBQXVCO0FBQUEsRUFDM0I7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1YsU0FBUztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBO0FBQUEsRUFFQSxVQUFVO0FBQ2QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/jobicy': {
        target: 'https://jobicy.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jobicy/, '/api/v2'),
      },
      '/api/remoteok': {
        target: 'https://remoteok.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/remoteok/, '/api'),
      },
      '/api/remotive': {
        target: 'https://remotive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/remotive/, '/api'),
      },
      '/api/himalayas': {
        target: 'https://himalayas.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/himalayas/, '/jobs/api'),
      },
      '/api/weworkremotely': {
        target: 'https://weworkremotely.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weworkremotely/, ''),
      },
      '/api/arbeitnow': {
        target: 'https://www.arbeitnow.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/arbeitnow/, '/api'),
      },
      '/api/workingnomads': {
        target: 'https://www.workingnomads.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/workingnomads/, '/api'),
      },
      '/api/remotewx': {
        target: 'https://remotewx.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/remotewx/, '/api/v1'),
      },
      '/api/jobspresso': {
        target: 'https://jobspresso.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jobspresso/, '/api'),
      },
      '/api/4dayweek': {
        target: 'https://4dayweek.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/4dayweek/, '/api'),
      },
      '/api/nodesk': {
        target: 'https://nodesk.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nodesk/, '/remote-jobs.json'),
      },
      '/api/justremote': {
        target: 'https://justremote.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/justremote/, '/api/v1/all-jobs'),
      },
    },
  },
});
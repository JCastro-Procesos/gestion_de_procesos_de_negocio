import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/gestion_de_procesos_de_negocio/',
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '0.0.0.0', port: 3000, strictPort: true },
});

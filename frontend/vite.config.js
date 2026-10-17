import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite. "fs.allow" permite importar la carpeta ../shared
// (semilla y reglas compartidas con el backend).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: ['..'] },
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Ładujemy zmienne środowiskowe z pliku .env.[mode] lub .env
    const env = loadEnv(mode, process.cwd(), '');

    // Używamy zmiennej VITE_API_BASE_URL (którą ustawimy w Dockerze)
    const API_TARGET = env.VITE_API_BASE_URL || 'http://localhost:6543';

    return {
        plugins: [react()],
        server: {
            proxy: {
                // Konfiguracja dla ścieżek /api
                '/api': {
                    target: API_TARGET,
                    changeOrigin: true,
                    secure: false,
                },
                // Konfiguracja dla ścieżek /auth
                '/auth': {
                    target: API_TARGET,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        // Definiujemy zmienną globalnie, aby była dostępna w kodzie JS po zbudowaniu
        define: {
            'process.env.VITE_API_BASE_URL': JSON.stringify(API_TARGET)
        }
    };
});
// vite.config.js

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => { // <--- Używamy trybu
    // Ładujemy zmienne środowiskowe
    const env = loadEnv(mode, process.cwd(), '');
    
    // 1. Definicja celu API
    // Adres docelowy dla proxy w DEV
    const DEV_API_TARGET = 'http://localhost:6543'; 
    
    // Adres docelowy dla PRODUCTION (pobierany ze zmiennej środowiskowej Coolify)
    const PROD_API_TARGET = env.VITE_API_BASE_URL;

    // 2. Ustawienie celu proxy w zależności od TRYBU
    const PROXY_TARGET = mode === 'development' ? DEV_API_TARGET : PROD_API_TARGET;

    // 3. Sprawdź, czy target jest pusty (np. w buildzie bez zmiennej)
    if (!PROXY_TARGET) {
        console.error("BŁĄD KONFIGURACJI: Nie ustawiono VITE_API_BASE_URL dla trybu produkcyjnego!");
    }


    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
                    // W DEV użyje localhost:6543, w PROD użyje http://api_hackathon:6543
                    target: PROXY_TARGET, 
                    changeOrigin: true,
                    secure: false,
                },
                '/auth': {
                    target: PROXY_TARGET,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        // 4. Definicja dla kodu aplikacji
        define: {
            'process.env.VITE_API_BASE_URL': JSON.stringify(PROXY_TARGET || DEV_API_TARGET)
        }
    };
});
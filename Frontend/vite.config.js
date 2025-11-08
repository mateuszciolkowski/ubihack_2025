// vite.config.js

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => { 
    // Ładujemy zmienne środowiskowe
    const env = loadEnv(mode, process.cwd(), '');
    
    // Adres API dla trybu development (lokalne proxy)
    const DEV_API_TARGET = 'http://localhost:6543';
    
    // W trybie produkcyjnym MUSIMY mieć ustawiony VITE_API_BASE_URL
    const PROD_API_TARGET = env.VITE_API_BASE_URL;
    
    // Ustawiamy cel proxy tylko dla trybu development
    const PROXY_TARGET = mode === 'development' ? DEV_API_TARGET : PROD_API_TARGET;
    
    // Sprawdź czy mamy ustawiony adres API w trybie produkcyjnym
    if (mode === 'production' && !PROD_API_TARGET) {
        console.error('BŁĄD: W trybie produkcyjnym wymagana jest zmienna VITE_API_BASE_URL wskazująca na adres backendu!');
    }

    // ... (reszta kodu bez zmian)

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
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
        // Definiujemy zmienną środowiskową dla kodu JS
        // W trybie dev używamy proxy, w produkcji używamy zmiennej środowiskowej lub względnej ścieżki
        define: {
            'process.env.VITE_API_BASE_URL': JSON.stringify(mode === 'development' ? '' : PROD_API_TARGET)
        }
    };
});
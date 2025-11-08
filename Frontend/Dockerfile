# ------------------------------------
# ETAP 1: Budowanie Aplikacji (Build Stage)
# ------------------------------------
FROM node:20-alpine AS build

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików pakietów dla lepszego cachowania
COPY package.json ./
COPY package-lock.json ./

# Instalacja zależności
RUN npm ci --silent

# Kopiowanie kodu źródłowego
COPY . .

# Budowanie aplikacji dla produkcji (wynik w katalogu 'dist')
# W tym kroku następuje wbudowanie zmiennej VITE_API_BASE_URL (jeśli jest podana)
RUN npm run build

# ------------------------------------
# ETAP 2: Produkcja i Serwowanie (Production Stage)
# ------------------------------------
# Używamy node:20-alpine jako środowiska uruchomieniowego
FROM node:20-alpine

# Instalacja 'serve' globalnie
RUN npm install -g serve

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie zbudowanej aplikacji z etapu 'build'
COPY --from=build /app/dist ./dist

# Tworzenie użytkownika nie-root (dla bezpieczeństwa)
RUN addgroup -S nodejs && adduser -S nodejs -u 1001 nodejs

# Zmiana właściciela katalogu aplikacji
RUN chown -R nodejs:nodejs /app

# Przełączenie na użytkownika nie-root
USER nodejs

# Ustawienie zmiennej środowiskowej
ENV NODE_ENV=production

# Wystawienie portu na 5175
EXPOSE 5175 🎯

# Dodanie Health Check na porcie 5175
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5175/ || exit 1

# Uruchomienie aplikacji za pomocą 'serve' na porcie 5175
CMD ["serve", "-s", "dist", "-l", "5175"]
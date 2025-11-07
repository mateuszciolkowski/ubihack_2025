# Dokumentacja API - Klasyfikacja Stresu

## Wprowadzenie

Ten dokument opisuje strukturę danych JSON generowanych przez system klasyfikacji stresu. Dane zawierają szczegółowe informacje o poziomie stresu wykrytym w analizowanych sygnałach biometrycznych.

## Struktura danych

JSON składa się z 5 głównych sekcji:

```typescript
interface StressAnalysisData {
  metadata: Metadata;
  summary: Summary;
  statistics: Statistics;
  segments: Segment[];
  stress_moments: StressMoment[];
}
```

---

## 1. Metadata

Zawiera informacje o analizie i parametrach technicznych.

```typescript
interface Metadata {
  analysis_date: string;           // ISO 8601 - data i czas analizy
  start_timestamp: string;          // ISO 8601 - timestamp początku nagrania
  total_duration_seconds: number;   // Całkowity czas analizy w sekundach
  total_duration_minutes: number;    // Całkowity czas analizy w minutach
  num_segments: number;             // Liczba segmentów (okien czasowych)
  window_size_seconds: number;       // Długość okna czasowego (30s)
  step_size_seconds: number;        // Przesunięcie okna (10s)
}
```

### Przykład:
```json
{
  "metadata": {
    "analysis_date": "2025-11-07T22:22:27.764764",
    "start_timestamp": "2025-11-07T22:22:27.761766",
    "total_duration_seconds": 5210,
    "total_duration_minutes": 86.83,
    "num_segments": 521,
    "window_size_seconds": 30,
    "step_size_seconds": 10
  }
}
```

---

## 2. Summary

Podsumowanie ogólnych wyników analizy stresu.

```typescript
interface Summary {
  overall_stress_level: "Brak" | "Niski" | "Średni" | "Wysoki";
  overall_stress_value: number;        // 0-3 (0=Brak, 1=Niski, 2=Średni, 3=Wysoki)
  stress_percentage: number;           // Procent czasu ze stresem (0-100)
  stress_segments_count: number;       // Liczba segmentów ze stresem
  dominant_class: string;              // Dominująca klasa: "Baseline" | "Stress" | "Amusement" | "Meditation"
  dominant_class_percentage: number;   // Procent czasu dominującej klasy
}
```

### Przykład:
```json
{
  "summary": {
    "overall_stress_level": "Niski",
    "overall_stress_value": 1,
    "stress_percentage": 22.07,
    "stress_segments_count": 115,
    "dominant_class": "Baseline",
    "dominant_class_percentage": 46.64
  }
}
```

### Interpretacja poziomów stresu:
- **Brak** (0): `stress_percentage = 0%`
- **Niski** (1): `0% < stress_percentage < 25%`
- **Średni** (2): `25% ≤ stress_percentage < 50%`
- **Wysoki** (3): `stress_percentage ≥ 50%`

---

## 3. Statistics

Statystyki rozkładu klas i prawdopodobieństw.

```typescript
interface Statistics {
  class_distribution: ClassStatistic[];
  mean_probabilities: {
    Baseline: number;
    Stress: number;
    Amusement: number;
    Meditation: number;
  };
}

interface ClassStatistic {
  class_id: number;           // 0=Baseline, 1=Stress, 2=Amusement, 3=Meditation
  class_name: string;
  count: number;              // Liczba segmentów tej klasy
  percentage: number;        // Procent czasu (0-100)
  mean_probability: number;  // Średnie prawdopodobieństwo (0-1)
}
```

### Przykład:
```json
{
  "statistics": {
    "class_distribution": [
      {
        "class_id": 0,
        "class_name": "Baseline",
        "count": 243,
        "percentage": 46.64,
        "mean_probability": 0.477
      },
      {
        "class_id": 1,
        "class_name": "Stress",
        "count": 115,
        "percentage": 22.07,
        "mean_probability": 0.215
      }
    ],
    "mean_probabilities": {
      "Baseline": 0.477,
      "Stress": 0.215,
      "Amusement": 0.033,
      "Meditation": 0.275
    }
  }
}
```

---

## 4. Segments

Lista wszystkich segmentów czasowych z pełnymi danymi.

```typescript
interface Segment {
  timestamp: string;              // ISO 8601 - początek segmentu
  timestamp_end: string;           // ISO 8601 - koniec segmentu
  time_seconds: number;           // Czas w sekundach od początku nagrania
  duration_seconds: number;       // Długość segmentu (zazwyczaj 30s)
  class_id: number;               // 0=Baseline, 1=Stress, 2=Amusement, 3=Meditation
  class_name: string;             // Nazwa klasy
  stress_level: number;           // Poziom stresu: 0 (brak) lub 3 (wysoki)
  stress_level_name: string;      // "Brak stresu" | "Wysoki stres"
  probabilities: {                // Prawdopodobieństwa dla wszystkich klas
    Baseline: number;
    Stress: number;
    Amusement: number;
    Meditation: number;
  };
  confidence: number;             // Pewność predykcji (0-1)
}
```

### Przykład:
```json
{
  "timestamp": "2025-11-07T22:22:27.761766",
  "timestamp_end": "2025-11-07T22:22:57.761766",
  "time_seconds": 0,
  "duration_seconds": 30,
  "class_id": 0,
  "class_name": "Baseline",
  "stress_level": 0,
  "stress_level_name": "Brak stresu",
  "probabilities": {
    "Baseline": 0.915,
    "Stress": 0.065,
    "Amusement": 0.019,
    "Meditation": 0.001
  },
  "confidence": 0.915
}
```

### Uwagi:
- Segmenty są przesunięte o 10 sekund (overlap 20s)
- Każdy segment reprezentuje 30 sekund danych
- `time_seconds` to czas początku segmentu od startu nagrania

---

## 5. Stress Moments

Lista wszystkich momentów, w których wykryto stres.

```typescript
interface StressMoment {
  timestamp: string;              // ISO 8601 - początek momentu stresu
  timestamp_end: string;          // ISO 8601 - koniec momentu stresu
  time_seconds: number;          // Czas w sekundach od początku nagrania
  duration_seconds: number;      // Długość momentu (zazwyczaj 30s)
  stress_level: number;         // Zawsze 3 (wysoki stres)
  confidence: number;           // Pewność wykrycia stresu (0-1)
  probabilities: {              // Prawdopodobieństwa dla wszystkich klas
    Baseline: number;
    Stress: number;
    Amusement: number;
    Meditation: number;
  };
}
```

### Przykład:
```json
{
  "timestamp": "2025-11-07T22:52:47.761766",
  "timestamp_end": "2025-11-07T22:53:17.761766",
  "time_seconds": 1820,
  "duration_seconds": 30,
  "stress_level": 3,
  "confidence": 0.545,
  "probabilities": {
    "Baseline": 0.438,
    "Stress": 0.545,
    "Amusement": 0.013,
    "Meditation": 0.004
  }
}
```

---

## Przykłady użycia w JavaScript/TypeScript

### 1. Ładowanie i parsowanie danych

```typescript
// TypeScript
async function loadStressData(filePath: string): Promise<StressAnalysisData> {
  const response = await fetch(filePath);
  const data: StressAnalysisData = await response.json();
  return data;
}

// JavaScript
async function loadStressData(filePath) {
  const response = await fetch(filePath);
  const data = await response.json();
  return data;
}
```

### 2. Wyświetlanie podsumowania

```typescript
function displaySummary(data: StressAnalysisData) {
  const summary = data.summary;
  
  console.log(`Poziom stresu: ${summary.overall_stress_level}`);
  console.log(`Procent czasu ze stresem: ${summary.stress_percentage.toFixed(1)}%`);
  console.log(`Liczba momentów stresu: ${summary.stress_segments_count}`);
  console.log(`Dominujący stan: ${summary.dominant_class} (${summary.dominant_class_percentage.toFixed(1)}%)`);
}
```

### 3. Filtrowanie segmentów ze stresem

```typescript
function getStressSegments(data: StressAnalysisData): Segment[] {
  return data.segments.filter(segment => segment.class_id === 1);
}

// Lub użyj gotowej listy
function getStressMoments(data: StressAnalysisData): StressMoment[] {
  return data.stress_moments;
}
```

### 4. Obliczanie statystyk w czasie rzeczywistym

```typescript
function calculateTimeRangeStats(
  data: StressAnalysisData, 
  startSeconds: number, 
  endSeconds: number
) {
  const segmentsInRange = data.segments.filter(
    segment => 
      segment.time_seconds >= startSeconds && 
      segment.time_seconds < endSeconds
  );
  
  const stressCount = segmentsInRange.filter(s => s.class_id === 1).length;
  const stressPercentage = (stressCount / segmentsInRange.length) * 100;
  
  return {
    totalSegments: segmentsInRange.length,
    stressSegments: stressCount,
    stressPercentage: stressPercentage,
    duration: endSeconds - startSeconds
  };
}
```

### 5. Tworzenie wykresu czasowego

```typescript
function prepareTimeSeriesData(data: StressAnalysisData) {
  return data.segments.map(segment => ({
    time: segment.time_seconds,
    timestamp: segment.timestamp,
    class: segment.class_name,
    stressLevel: segment.stress_level,
    confidence: segment.confidence,
    stressProbability: segment.probabilities.Stress
  }));
}

// Przykład użycia z Chart.js
function renderStressChart(data: StressAnalysisData) {
  const timeSeries = prepareTimeSeriesData(data);
  
  const chartData = {
    labels: timeSeries.map(d => new Date(d.timestamp)),
    datasets: [{
      label: 'Poziom stresu',
      data: timeSeries.map(d => d.stressLevel),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.1
    }, {
      label: 'Prawdopodobieństwo stresu',
      data: timeSeries.map(d => d.stressProbability * 3), // Skalowanie do 0-3
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.1
    }]
  };
  
  // Renderuj wykres używając Chart.js lub innej biblioteki
}
```

### 6. Formatowanie czasu

```typescript
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
```

### 7. Wykrywanie trendów

```typescript
function detectStressTrends(data: StressAnalysisData, windowSize: number = 10) {
  const trends = [];
  
  for (let i = 0; i < data.segments.length - windowSize; i += windowSize) {
    const window = data.segments.slice(i, i + windowSize);
    const stressCount = window.filter(s => s.class_id === 1).length;
    const avgStressProb = window.reduce((sum, s) => sum + s.probabilities.Stress, 0) / window.length;
    
    trends.push({
      startTime: window[0].time_seconds,
      endTime: window[window.length - 1].time_seconds + window[window.length - 1].duration_seconds,
      stressCount: stressCount,
      stressPercentage: (stressCount / window.length) * 100,
      avgStressProbability: avgStressProb
    });
  }
  
  return trends;
}
```

### 8. Alerty o wysokim poziomie stresu

```typescript
function checkStressAlerts(data: StressAnalysisData) {
  const alerts = [];
  
  // Sprawdź ogólny poziom stresu
  if (data.summary.overall_stress_value >= 2) {
    alerts.push({
      type: 'high_stress',
      level: data.summary.overall_stress_level,
      message: `Wykryto ${data.summary.overall_stress_level.toLowerCase()} poziom stresu (${data.summary.stress_percentage.toFixed(1)}% czasu)`,
      severity: data.summary.overall_stress_value === 3 ? 'critical' : 'warning'
    });
  }
  
  // Sprawdź ciągłe okresy stresu (np. więcej niż 5 segmentów z rzędu)
  let consecutiveStress = 0;
  for (const segment of data.segments) {
    if (segment.class_id === 1) {
      consecutiveStress++;
      if (consecutiveStress >= 5) {
        alerts.push({
          type: 'prolonged_stress',
          startTime: segment.time_seconds - (consecutiveStress * 10),
          duration: consecutiveStress * 10,
          message: `Długotrwały okres stresu: ${consecutiveStress * 10} sekund`,
          severity: 'warning'
        });
        consecutiveStress = 0;
      }
    } else {
      consecutiveStress = 0;
    }
  }
  
  return alerts;
}
```

---

## Mapowanie klas i poziomów stresu

### Klasy emocjonalne:
- **0 - Baseline**: Stan neutralny, brak szczególnego stresu ani relaksu
- **1 - Stress**: Wykryto stres, zwiększona aktywność fizjologiczna
- **2 - Amusement**: Rozbawienie, pozytywny stan emocjonalny
- **3 - Meditation**: Relaksacja, obniżona aktywność, stan spokoju

### Poziomy stresu:
- **0**: Brak stresu (Baseline, Amusement, Meditation)
- **3**: Wysoki stres (tylko klasa Stress)

---

## Najlepsze praktyki

### 1. Caching danych
```typescript
// Cache'uj dane po załadowaniu, aby uniknąć wielokrotnych fetchów
let cachedData: StressAnalysisData | null = null;

async function getStressData(forceRefresh = false): Promise<StressAnalysisData> {
  if (cachedData && !forceRefresh) {
    return cachedData;
  }
  
  cachedData = await loadStressData('/api/stress-analysis');
  return cachedData;
}
```

### 2. Walidacja danych
```typescript
function validateStressData(data: any): data is StressAnalysisData {
  return (
    data?.metadata &&
    data?.summary &&
    data?.statistics &&
    Array.isArray(data?.segments) &&
    Array.isArray(data?.stress_moments)
  );
}
```

### 3. Obsługa dużych zbiorów danych
```typescript
// Dla dużych plików, rozważ wirtualizację lub paginację
function getSegmentsPage(
  data: StressAnalysisData, 
  page: number, 
  pageSize: number = 100
): Segment[] {
  const start = page * pageSize;
  const end = start + pageSize;
  return data.segments.slice(start, end);
}
```

### 4. Formatowanie liczb
```typescript
// Formatuj procenty i prawdopodobieństwa
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatProbability(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
```

### 5. Kolory dla wizualizacji
```typescript
const STRESS_COLORS = {
  Baseline: '#4CAF50',      // Zielony
  Stress: '#F44336',         // Czerwony
  Amusement: '#FF9800',     // Pomarańczowy
  Meditation: '#2196F3'     // Niebieski
};

const STRESS_LEVEL_COLORS = {
  0: '#4CAF50',  // Zielony - brak stresu
  3: '#F44336'   // Czerwony - wysoki stres
};
```

---

## Przykłady komponentów React

### Komponent podsumowania
```tsx
interface SummaryProps {
  data: StressAnalysisData;
}

function StressSummary({ data }: SummaryProps) {
  const { summary } = data;
  
  return (
    <div className="stress-summary">
      <h2>Podsumowanie analizy stresu</h2>
      <div className="summary-grid">
        <div className="summary-item">
          <label>Ogólny poziom stresu</label>
          <span className={`level-${summary.overall_stress_value}`}>
            {summary.overall_stress_level}
          </span>
        </div>
        <div className="summary-item">
          <label>Czas ze stresem</label>
          <span>{summary.stress_percentage.toFixed(1)}%</span>
        </div>
        <div className="summary-item">
          <label>Momentów stresu</label>
          <span>{summary.stress_segments_count}</span>
        </div>
        <div className="summary-item">
          <label>Dominujący stan</label>
          <span>{summary.dominant_class}</span>
        </div>
      </div>
    </div>
  );
}
```

### Komponent listy momentów stresu
```tsx
function StressMomentsList({ data }: { data: StressAnalysisData }) {
  return (
    <div className="stress-moments">
      <h3>Moment stresu ({data.stress_moments.length})</h3>
      <ul>
        {data.stress_moments.map((moment, index) => (
          <li key={index} className="stress-moment-item">
            <div className="moment-time">
              {formatTimestamp(moment.timestamp)}
            </div>
            <div className="moment-confidence">
              Pewność: {(moment.confidence * 100).toFixed(1)}%
            </div>
            <div className="moment-probabilities">
              Stress: {(moment.probabilities.Stress * 100).toFixed(1)}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Format dat i czasów

Wszystkie timestampy są w formacie **ISO 8601**:
- Format: `YYYY-MM-DDTHH:mm:ss.ssssss`
- Przykład: `2025-11-07T22:22:27.761766`
- Timezone: UTC (lub lokalny, w zależności od konfiguracji)

### Parsowanie w JavaScript:
```typescript
const timestamp = "2025-11-07T22:22:27.761766";
const date = new Date(timestamp);
```

---

## Obsługa błędów

```typescript
async function loadStressDataSafe(filePath: string): Promise<StressAnalysisData | null> {
  try {
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!validateStressData(data)) {
      throw new Error('Invalid data structure');
    }
    
    return data;
  } catch (error) {
    console.error('Error loading stress data:', error);
    return null;
  }
}
```

---

## Wsparcie

W razie pytań lub problemów, skontaktuj się z zespołem Machine Learning Service.

---

**Ostatnia aktualizacja**: 2025-11-07


# Microservice Klasyfikacji Stresu

Microservice Django do klasyfikacji poziomu stresu na podstawie sygnałów biometrycznych używający wytrenowanego modelu CNN-LSTM.

## Opis

Ten microservice analizuje sygnały biometryczne (ACC, BVP, EDA, TEMP) i zwraca szczegółową klasyfikację poziomu stresu w formacie JSON zgodnym z `results.json`.

## Endpoint

### POST `/api/stress-classification/`

Klasyfikuje poziom stresu na podstawie sygnałów biometrycznych.

#### Request Body (JSON)

```json
{
  "use_simulation": true,  // Opcjonalne, domyślnie true
  "acc": [[0.1, 0.2, 0.3], [0.2, 0.3, 0.4], ...],  // Opcjonalne - akcelerometr [x, y, z]
  "bvp": [0.5, 0.6, 0.7, ...],  // Opcjonalne - Blood Volume Pulse
  "eda": [0.3, 0.4, 0.5, ...],  // Opcjonalne - Electrodermal Activity
  "temp": [36.5, 36.6, 36.7, ...],  // Opcjonalne - Temperatura
  "start_timestamp": "2025-11-07T10:00:00"  // Opcjonalne - timestamp początku
}
```

#### Response (200 OK)

Zwraca JSON w formacie zgodnym z `results.json`:

```json
{
  "metadata": {
    "analysis_date": "2025-11-07T22:22:27.764764",
    "start_timestamp": "2025-11-07T22:22:27.761766",
    "total_duration_seconds": 5210,
    "num_segments": 521
  },
  "summary": {
    "overall_stress_level": "Niski",
    "overall_stress_value": 1,
    "stress_percentage": 22.07,
    "stress_segments_count": 115
  },
  "statistics": {
    "class_distribution": [...],
    "mean_probabilities": {...}
  },
  "segments": [...],
  "stress_moments": [...]
}
```

## Przykłady użycia

### 1. Użycie symulowanych danych (domyślnie)

```bash
curl -X POST http://localhost:8000/api/stress-classification/ \
  -H "Content-Type: application/json" \
  -d '{"use_simulation": true}'
```

### 2. Użycie rzeczywistych danych

```bash
curl -X POST http://localhost:8000/api/stress-classification/ \
  -H "Content-Type: application/json" \
  -d '{
    "use_simulation": false,
    "acc": [[0.1, 0.2, 0.3], [0.2, 0.3, 0.4]],
    "bvp": [0.5, 0.6, 0.7],
    "eda": [0.3, 0.4, 0.5],
    "temp": [36.5, 36.6, 36.7],
    "start_timestamp": "2025-11-07T10:00:00"
  }'
```

### 3. Użycie z JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:8000/api/stress-classification/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    use_simulation: true
  })
});

const data = await response.json();
console.log(data);
```

## Wymagania

- Model: `MachineLearningService/stress_classifier_multi_subject.pth`
- Parametry normalizacji: `MachineLearningService/normalization_params.npz`

## Struktura projektu

```
stress_classification/
├── __init__.py
├── apps.py
├── models.py
├── admin.py
├── tests.py
├── ml_service.py          # Główna logika ML
├── data_simulator.py      # Generator symulowanych danych
├── serializers.py         # DRF serializers
├── views.py               # API views
├── urls.py                # URL routing
└── README.md              # Ta dokumentacja
```

## Autentykacja

Domyślnie endpoint jest dostępny bez autentykacji (`AllowAny`). Aby wymagać autentykacji, zmień w `views.py`:

```python
from rest_framework.permissions import IsAuthenticated

class StressClassificationView(APIView):
    permission_classes = [IsAuthenticated]
```

## Dokumentacja API

Pełna dokumentacja API dostępna jest w Swagger UI:
- `/api/schema/swagger-ui/`

## Logowanie

Serwis loguje informacje o:
- Ładowaniu modelu
- Użyciu symulowanych vs rzeczywistych danych
- Błędach podczas klasyfikacji


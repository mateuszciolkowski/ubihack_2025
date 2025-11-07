import pickle
import numpy as np
import pandas as pd
from scipy import signal
from collections import Counter
import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
import argparse
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, List

# --- KONFIGURACJA PRZETWARZANIA ---
TARGET_RATE = 4    # Hz - Docelowa częstotliwość próbkowania
WINDOW_SEC = 30    # Sekundy - Długość okna czasowego
STEP_SEC = 10      # Sekundy - Przesunięcie okna (overlap: 20 sekund)

# --- KONFIGURACJA MODELU ---
BATCH_SIZE = 32
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
NUM_CLASSES = 4  # 0: Baseline, 1: Stress, 2: Amusement, 3: Meditation

# Nazwy klas
CLASS_NAMES = ['Baseline', 'Stress', 'Amusement', 'Meditation']
CLASS_DESCRIPTIONS = {
    0: {
        'name': 'Baseline',
        'description': 'Stan neutralny - brak szczególnego stresu ani relaksu',
        'stress_level': 0,
        'level_name': 'Brak stresu'
    },
    1: {
        'name': 'Stress',
        'description': 'Wykryto stres - zwiększona aktywność fizjologiczna',
        'stress_level': 3,
        'level_name': 'Wysoki stres'
    },
    2: {
        'name': 'Amusement',
        'description': 'Rozbawienie - pozytywny stan emocjonalny',
        'stress_level': 0,
        'level_name': 'Brak stresu'
    },
    3: {
        'name': 'Meditation',
        'description': 'Relaksacja - obniżona aktywność, stan spokoju',
        'stress_level': 0,
        'level_name': 'Brak stresu'
    }
}

# Etykiety docelowe (1, 2, 3, 4) - przekodowane na 0, 1, 2, 3
TARGET_LABELS = [1, 2, 3, 4]

# --- FUNKCJE PRZETWARZANIA DANYCH ---

def resample_signal(df_signal, original_rate, target_rate):
    """Unifikuje częstotliwość próbkowania (downsampling) za pomocą SciPy resample."""
    if original_rate == target_rate:
        return df_signal
    
    num_samples_target = int(len(df_signal) * (target_rate / original_rate))
    resampled_data = signal.resample(df_signal, num_samples_target)
    return pd.DataFrame(resampled_data, columns=df_signal.columns)


def segment_data(df_combined, target_rate, window_sec, step_sec):
    """Segmentuje dane na okna czasowe (bez etykiet - dla predykcji)."""
    window_samples = window_sec * target_rate
    step_samples = step_sec * target_rate
    
    segments = []
    
    for start in range(0, len(df_combined) - window_samples + 1, step_samples):
        end = start + window_samples
        data_segment = df_combined.iloc[start:end].values
        segments.append(data_segment)
    
    return np.array(segments)


def preprocess_from_pkl(file_path: str) -> Optional[Tuple[np.ndarray, Optional[np.ndarray]]]:
    """Przetwarza plik .pkl i zwraca dane gotowe do klasyfikacji."""
    subject_id = os.path.basename(file_path).split('.')[0]
    print(f"Przetwarzanie pliku: {subject_id}")

    try:
        with open(file_path, 'rb') as file:
            data = pickle.load(file, encoding='latin1')
        
        wrist_signals = data['signal']['wrist']
        labels_700hz = data.get('label', None)  # Opcjonalne - może nie być etykiet
        
        df_acc = pd.DataFrame(wrist_signals['ACC'], columns=['ACC_x', 'ACC_y', 'ACC_z'])
        df_bvp = pd.DataFrame(wrist_signals['BVP'], columns=['BVP'])
        df_eda = pd.DataFrame(wrist_signals['EDA'], columns=['EDA'])
        df_temp = pd.DataFrame(wrist_signals['TEMP'], columns=['TEMP'])
        
    except FileNotFoundError:
        print(f"Błąd: Plik {file_path} nie został znaleziony.")
        return None
    except Exception as e:
        print(f"Błąd podczas przetwarzania {file_path}: {e}")
        return None
    
    # Downsampling do 4 Hz
    df_acc_resampled = resample_signal(df_acc, 32, TARGET_RATE)
    df_bvp_resampled = resample_signal(df_bvp, 64, TARGET_RATE)
    df_eda_resampled = resample_signal(df_eda, 4, TARGET_RATE)
    df_temp_resampled = resample_signal(df_temp, 4, TARGET_RATE)

    # Ujednolicanie długości i połączenie
    min_len = min(len(df_acc_resampled), len(df_bvp_resampled), len(df_eda_resampled), len(df_temp_resampled))
    
    df_combined = pd.concat([
        df_acc_resampled.iloc[:min_len],
        df_bvp_resampled.iloc[:min_len],
        df_eda_resampled.iloc[:min_len],
        df_temp_resampled.iloc[:min_len]
    ], axis=1)

    # Segmentacja danych
    X_segments = segment_data(df_combined, TARGET_RATE, WINDOW_SEC, STEP_SEC)
    
    if len(X_segments) == 0:
        print(f"  Ostrzeżenie: {subject_id} - za mało danych do segmentacji (wymagane minimum {WINDOW_SEC * TARGET_RATE} próbek)")
        return None
    
    print(f"  Utworzono {len(X_segments)} segmentów (okien 30s)")
    
    return X_segments, labels_700hz if labels_700hz is not None else None


def preprocess_from_raw_signals(acc: np.ndarray, bvp: np.ndarray, eda: np.ndarray, temp: np.ndarray) -> Optional[np.ndarray]:
    """Przetwarza surowe sygnały i zwraca dane gotowe do klasyfikacji."""
    # Konwersja do DataFrame
    if acc.shape[1] != 3:
        print("Błąd: ACC powinien mieć 3 kolumny (x, y, z)")
        return None
    
    df_acc = pd.DataFrame(acc, columns=['ACC_x', 'ACC_y', 'ACC_z'])
    df_bvp = pd.DataFrame(bvp, columns=['BVP'])
    df_eda = pd.DataFrame(eda, columns=['EDA'])
    df_temp = pd.DataFrame(temp, columns=['TEMP'])
    
    # Downsampling do 4 Hz (zakładamy oryginalne częstotliwości)
    df_acc_resampled = resample_signal(df_acc, 32, TARGET_RATE)
    df_bvp_resampled = resample_signal(df_bvp, 64, TARGET_RATE)
    df_eda_resampled = resample_signal(df_eda, 4, TARGET_RATE)
    df_temp_resampled = resample_signal(df_temp, 4, TARGET_RATE)

    # Ujednolicanie długości i połączenie
    min_len = min(len(df_acc_resampled), len(df_bvp_resampled), len(df_eda_resampled), len(df_temp_resampled))
    
    df_combined = pd.concat([
        df_acc_resampled.iloc[:min_len],
        df_bvp_resampled.iloc[:min_len],
        df_eda_resampled.iloc[:min_len],
        df_temp_resampled.iloc[:min_len]
    ], axis=1)

    # Segmentacja danych
    X_segments = segment_data(df_combined, TARGET_RATE, WINDOW_SEC, STEP_SEC)
    
    if len(X_segments) == 0:
        print(f"  Ostrzeżenie: za mało danych do segmentacji (wymagane minimum {WINDOW_SEC * TARGET_RATE} próbek)")
        return None
    
    print(f"  Utworzono {len(X_segments)} segmentów (okien 30s)")
    
    return X_segments


def normalize_data(X, mean, std):
    """Normalizuje dane X używając zapisanych parametrów normalizacji (Z-Score)."""
    num_channels = X.shape[-1]
    X_flat = X.reshape(-1, num_channels)
    
    # Normalizacja używając zapisanych parametrów
    X_normalized = (X_flat - mean) / std
    X_normalized = X_normalized.reshape(X.shape)
    
    return X_normalized


# --- KLASY PYTORCH ---

class WESADDataset(Dataset):
    """Niestandardowy Dataset dla przetworzonych danych WESAD."""
    def __init__(self, X):
        # X: (próbki, kroki_czasowe, kanały) -> (N, 120, 6)
        # Przekształcamy do (próbki, kanały, kroki_czasowe), co jest standardem dla CNN
        self.X = torch.from_numpy(X).float().permute(0, 2, 1) 
        
    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx]


class CNNLSTMClassifier(nn.Module):
    """Łączona architektura CNN-LSTM dla szeregów czasowych."""
    
    def __init__(self, num_channels, seq_len, num_classes):
        super(CNNLSTMClassifier, self).__init__()
        
        self.cnn_layers = nn.Sequential(
            nn.Conv1d(num_channels, 32, kernel_size=8, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2, stride=2),
            
            nn.Conv1d(32, 64, kernel_size=4, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2, stride=2)
        )
        
        lstm_input_size = 64
        
        self.lstm = nn.LSTM(
            input_size=lstm_input_size, 
            hidden_size=64, 
            num_layers=2, 
            batch_first=True, 
            bidirectional=False
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        x = self.cnn_layers(x)
        x = x.transpose(1, 2)
        lstm_out, (hn, cn) = self.lstm(x)
        final_state = hn[-1]
        logits = self.classifier(final_state)
        return logits


def predict(model, dataloader):
    """Wykonuje predykcje i zwraca prawdopodobieństwa oraz klasy."""
    model.eval()
    all_predictions = []
    all_probabilities = []
    
    with torch.no_grad():
        for inputs in dataloader:
            inputs = inputs.to(DEVICE)
            outputs = model(inputs)
            
            # Oblicz prawdopodobieństwa (softmax)
            probabilities = torch.softmax(outputs, dim=1)
            _, predicted = torch.max(outputs.data, 1)
            
            all_predictions.extend(predicted.cpu().numpy())
            all_probabilities.extend(probabilities.cpu().numpy())
    
    return np.array(all_predictions), np.array(all_probabilities)


def analyze_stress_level(predictions: np.ndarray, probabilities: np.ndarray, start_timestamp: Optional[datetime] = None) -> Dict:
    """Analizuje poziom stresu na podstawie predykcji."""
    num_segments = len(predictions)
    
    # Rozkład klas
    class_counts = Counter(predictions)
    
    # Oblicz średnie prawdopodobieństwa dla każdej klasy
    mean_probs = probabilities.mean(axis=0)
    
    # Znajdź dominującą klasę
    dominant_class = class_counts.most_common(1)[0][0]
    dominant_count = class_counts[dominant_class]
    dominant_percentage = (dominant_count / num_segments) * 100
    
    # Analiza stresu
    stress_segments = class_counts.get(1, 0)  # Klasa 1 = Stress
    stress_percentage = (stress_segments / num_segments) * 100
    
    # Określ ogólny poziom stresu
    if stress_percentage >= 50:
        overall_stress_level = "Wysoki"
        stress_value = 3
    elif stress_percentage >= 25:
        overall_stress_level = "Średni"
        stress_value = 2
    elif stress_percentage > 0:
        overall_stress_level = "Niski"
        stress_value = 1
    else:
        overall_stress_level = "Brak"
        stress_value = 0
    
    # Znajdź momenty stresu (indeksy segmentów)
    stress_indices = np.where(predictions == 1)[0]
    stress_times = [idx * STEP_SEC for idx in stress_indices]  # Czas w sekundach
    
    return {
        'num_segments': num_segments,
        'dominant_class': dominant_class,
        'dominant_class_name': CLASS_NAMES[dominant_class],
        'dominant_percentage': dominant_percentage,
        'class_distribution': dict(class_counts),
        'mean_probabilities': {CLASS_NAMES[i]: mean_probs[i] for i in range(4)},
        'stress_segments': stress_segments,
        'stress_percentage': stress_percentage,
        'overall_stress_level': overall_stress_level,
        'stress_value': stress_value,
        'stress_times': stress_times,
        'total_time_seconds': num_segments * STEP_SEC,
        'start_timestamp': start_timestamp.isoformat() if start_timestamp else None
    }


def generate_json_output(predictions: np.ndarray, probabilities: np.ndarray, results: Dict, 
                        start_timestamp: Optional[datetime] = None) -> Dict:
    """Generuje strukturę JSON z wynikami klasyfikacji dla frontendu."""
    
    # Jeśli nie podano timestampu, użyj aktualnego czasu
    if start_timestamp is None:
        start_timestamp = datetime.now()
    
    # Generuj listę wszystkich segmentów z timestampami
    segments = []
    stress_moments = []
    
    for i in range(len(predictions)):
        segment_start_time = start_timestamp + timedelta(seconds=i * STEP_SEC)
        segment_end_time = segment_start_time + timedelta(seconds=WINDOW_SEC)
        
        predicted_class = int(predictions[i])
        class_name = CLASS_NAMES[predicted_class]
        stress_level = CLASS_DESCRIPTIONS[predicted_class]['stress_level']
        
        segment_data = {
            'timestamp': segment_start_time.isoformat(),
            'timestamp_end': segment_end_time.isoformat(),
            'time_seconds': i * STEP_SEC,
            'duration_seconds': WINDOW_SEC,
            'class_id': predicted_class,
            'class_name': class_name,
            'stress_level': stress_level,
            'stress_level_name': CLASS_DESCRIPTIONS[predicted_class]['level_name'],
            'probabilities': {
                CLASS_NAMES[j]: float(probabilities[i][j]) for j in range(4)
            },
            'confidence': float(probabilities[i][predicted_class])
        }
        segments.append(segment_data)
        
        # Jeśli to segment ze stresem, dodaj do stress_moments
        if predicted_class == 1:  # Stress
            stress_moments.append({
                'timestamp': segment_start_time.isoformat(),
                'timestamp_end': segment_end_time.isoformat(),
                'time_seconds': i * STEP_SEC,
                'duration_seconds': WINDOW_SEC,
                'stress_level': stress_level,
                'confidence': float(probabilities[i][predicted_class]),
                'probabilities': {
                    CLASS_NAMES[j]: float(probabilities[i][j]) for j in range(4)
                }
            })
    
    # Statystyki rozkładu klas
    class_statistics = []
    for class_id in range(4):
        count = results['class_distribution'].get(class_id, 0)
        percentage = (count / results['num_segments']) * 100 if results['num_segments'] > 0 else 0
        class_statistics.append({
            'class_id': class_id,
            'class_name': CLASS_NAMES[class_id],
            'count': int(count),
            'percentage': float(percentage),
            'mean_probability': float(results['mean_probabilities'][CLASS_NAMES[class_id]])
        })
    
    # Struktura JSON
    json_output = {
        'metadata': {
            'analysis_date': datetime.now().isoformat(),
            'start_timestamp': start_timestamp.isoformat(),
            'total_duration_seconds': results['total_time_seconds'],
            'total_duration_minutes': results['total_time_seconds'] / 60,
            'num_segments': results['num_segments'],
            'window_size_seconds': WINDOW_SEC,
            'step_size_seconds': STEP_SEC
        },
        'summary': {
            'overall_stress_level': results['overall_stress_level'],
            'overall_stress_value': results['stress_value'],
            'stress_percentage': float(results['stress_percentage']),
            'stress_segments_count': results['stress_segments'],
            'dominant_class': results['dominant_class_name'],
            'dominant_class_percentage': float(results['dominant_percentage'])
        },
        'statistics': {
            'class_distribution': class_statistics,
            'mean_probabilities': {
                CLASS_NAMES[i]: float(results['mean_probabilities'][CLASS_NAMES[i]]) 
                for i in range(4)
            }
        },
        'segments': segments,
        'stress_moments': stress_moments
    }
    
    return json_output


def print_classification_results(results: Dict, predictions: np.ndarray, probabilities: np.ndarray):
    """Wyświetla szczegółowe wyniki klasyfikacji."""
    print("\n" + "="*70)
    print("WYNIKI KLASYFIKACJI STRESU")
    print("="*70)
    
    print(f"\n📊 PODSUMOWANIE OGÓLNE:")
    print(f"  Analizowany czas: {results['total_time_seconds'] // 60} minut {results['total_time_seconds'] % 60} sekund")
    print(f"  Liczba segmentów: {results['num_segments']}")
    print(f"  Dominujący stan: {results['dominant_class_name']} ({results['dominant_percentage']:.1f}% czasu)")
    
    print(f"\n🎯 POZIOM STRESU: {results['overall_stress_level']}")
    print(f"  Wykryto stres w {results['stress_segments']} segmentach ({results['stress_percentage']:.1f}% czasu)")
    
    if results['stress_times']:
        print(f"  Moment stresu (sekundy): {', '.join(map(str, results['stress_times'][:10]))}")
        if len(results['stress_times']) > 10:
            print(f"  ... i {len(results['stress_times']) - 10} więcej")
    
    print(f"\n📈 ROZKŁAD STANÓW:")
    for class_id in range(4):
        count = results['class_distribution'].get(class_id, 0)
        percentage = (count / results['num_segments']) * 100 if results['num_segments'] > 0 else 0
        prob = results['mean_probabilities'][CLASS_NAMES[class_id]]
        print(f"  {CLASS_NAMES[class_id]:<12}: {count:>4} segmentów ({percentage:>5.1f}%) | Średnie prawdopodobieństwo: {prob:.3f}")
    
    print(f"\n💡 INTERPRETACJA:")
    class_info = CLASS_DESCRIPTIONS[results['dominant_class']]
    print(f"  Stan: {class_info['name']}")
    print(f"  Opis: {class_info['description']}")
    print(f"  Poziom stresu: {class_info['level_name']}")
    
    if results['stress_value'] > 0:
        print(f"\n⚠️  UWAGA: Wykryto okresy stresu!")
        print(f"  Zalecane działania:")
        print(f"    - Przerwa na relaksację")
        print(f"    - Ćwiczenia oddechowe")
        print(f"    - Sprawdzenie czynników stresogennych")
    else:
        print(f"\n✅ Brak wykrytego stresu - stan w normie")


def classify_file(file_path: str, model_path: str, norm_params_path: str, 
                 output_json: Optional[str] = None, start_timestamp: Optional[datetime] = None,
                 return_json: bool = False) -> Optional[Dict]:
    """Główna funkcja klasyfikująca plik .pkl.
    
    Args:
        file_path: Ścieżka do pliku .pkl
        model_path: Ścieżka do modelu
        norm_params_path: Ścieżka do parametrów normalizacji
        output_json: Opcjonalna ścieżka do zapisu JSON (jeśli None, nie zapisuje)
        start_timestamp: Opcjonalny timestamp początku nagrania
        return_json: Czy zwrócić JSON jako string w wynikach
    
    Returns:
        Dict z wynikami klasyfikacji i opcjonalnie JSON
    """
    # Ładowanie modelu
    base_dir = Path(__file__).parent
    model_full_path = base_dir / model_path if not Path(model_path).is_absolute() else Path(model_path)
    norm_full_path = base_dir / norm_params_path if not Path(norm_params_path).is_absolute() else Path(norm_params_path)
    
    if not model_full_path.exists():
        print(f"Błąd: Nie znaleziono modelu: {model_full_path}")
        return None
    
    if not norm_full_path.exists():
        print(f"Błąd: Nie znaleziono parametrów normalizacji: {norm_full_path}")
        return None
    
    print(f"Ładowanie modelu z: {model_full_path}")
    norm_params = np.load(norm_full_path)
    mean = norm_params['mean']
    std = norm_params['std']
    
    # Inicjalizacja modelu
    num_channels = 6
    seq_len = 120
    
    model = CNNLSTMClassifier(
        num_channels=num_channels,
        seq_len=seq_len,
        num_classes=NUM_CLASSES
    ).to(DEVICE)
    
    model.load_state_dict(torch.load(model_full_path, map_location=DEVICE))
    model.eval()
    print(f"Model załadowany pomyślnie na urządzeniu: {DEVICE}")
    
    # Przetwarzanie pliku
    result = preprocess_from_pkl(file_path)
    if result is None:
        return None
    
    X_segments, _ = result
    
    # Normalizacja
    X_normalized = normalize_data(X_segments, mean, std)
    
    # Tworzenie datasetu i dataloadera
    dataset = WESADDataset(X_normalized)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    # Predykcja
    print("Wykonywanie predykcji...")
    predictions, probabilities = predict(model, dataloader)
    
    # Analiza wyników
    results = analyze_stress_level(predictions, probabilities, start_timestamp)
    
    # Wyświetlanie wyników
    print_classification_results(results, predictions, probabilities)
    
    # Generowanie JSON
    json_output = generate_json_output(predictions, probabilities, results, start_timestamp)
    
    # Zapis JSON do pliku jeśli podano ścieżkę
    if output_json:
        output_path = Path(output_json)
        if not output_path.is_absolute():
            output_path = base_dir / output_json
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(json_output, f, indent=2, ensure_ascii=False)
        print(f"\n✅ JSON zapisany do: {output_path}")
    
    # Przygotowanie wyniku
    result_dict = {
        'predictions': predictions,
        'probabilities': probabilities,
        'analysis': results,
        'json': json_output  # Zawsze zwracaj JSON dla łatwego dostępu z frontendu
    }
    
    if return_json:
        result_dict['json_string'] = json.dumps(json_output, indent=2, ensure_ascii=False)
    
    return result_dict


def main():
    parser = argparse.ArgumentParser(description='Klasyfikacja poziomu stresu używając wytrenowanej sieci')
    parser.add_argument('input_file', type=str, help='Ścieżka do pliku .pkl do klasyfikacji')
    parser.add_argument('--model', type=str, default='stress_classifier_multi_subject.pth',
                       help='Ścieżka do wytrenowanego modelu (domyślnie: stress_classifier_multi_subject.pth)')
    parser.add_argument('--norm', type=str, default='normalization_params.npz',
                       help='Ścieżka do parametrów normalizacji (domyślnie: normalization_params.npz)')
    parser.add_argument('--output-json', type=str, default=None,
                       help='Ścieżka do zapisu wyników w formacie JSON (opcjonalne)')
    parser.add_argument('--start-timestamp', type=str, default=None,
                       help='Timestamp początku nagrania w formacie ISO (np. 2024-01-01T10:00:00). Jeśli nie podano, używa aktualnego czasu.')
    parser.add_argument('--json-only', action='store_true',
                       help='Wyświetl tylko JSON (bez szczegółowego raportu tekstowego)')
    
    args = parser.parse_args()
    
    # Sprawdzenie czy plik istnieje
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Błąd: Plik {input_path} nie istnieje")
        return
    
    # Parsowanie timestampu
    start_timestamp = None
    if args.start_timestamp:
        try:
            start_timestamp = datetime.fromisoformat(args.start_timestamp)
        except ValueError:
            print(f"Ostrzeżenie: Nieprawidłowy format timestampu: {args.start_timestamp}")
            print("Używam aktualnego czasu jako timestamp początkowy")
    
    # Jeśli --json-only, nie wyświetlaj szczegółowego raportu
    if args.json_only:
        import sys
        # Tymczasowo przekieruj stdout, aby ukryć szczegółowy output
        original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
    
    # Klasyfikacja
    result = classify_file(
        str(input_path), 
        args.model, 
        args.norm,
        output_json=args.output_json,
        start_timestamp=start_timestamp,
        return_json=args.json_only
    )
    
    if args.json_only:
        sys.stdout.close()
        sys.stdout = original_stdout
        if result and 'json_string' in result:
            print(result['json_string'])
        elif result and 'json' in result:
            print(json.dumps(result['json'], indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()


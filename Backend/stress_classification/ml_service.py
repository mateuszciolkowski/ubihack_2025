"""
Microservice do klasyfikacji stresu używający wytrenowanego modelu CNN-LSTM.
"""
import numpy as np
import pandas as pd
from scipy import signal
from collections import Counter
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict
import os

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


def resample_signal(df_signal, original_rate, target_rate):
    """Unifikuje częstotliwość próbkowania (downsampling) za pomocą SciPy resample."""
    if original_rate == target_rate:
        return df_signal
    
    num_samples_target = int(len(df_signal) * (target_rate / original_rate))
    resampled_data = signal.resample(df_signal, num_samples_target)
    return pd.DataFrame(resampled_data, columns=df_signal.columns)


def segment_data(df_combined, target_rate, window_sec, step_sec):
    """Segmentuje dane na okna czasowe."""
    window_samples = window_sec * target_rate
    step_samples = step_sec * target_rate
    
    segments = []
    
    for start in range(0, len(df_combined) - window_samples + 1, step_samples):
        end = start + window_samples
        data_segment = df_combined.iloc[start:end].values
        segments.append(data_segment)
    
    return np.array(segments)


def normalize_data(X, mean, std):
    """Normalizuje dane X używając zapisanych parametrów normalizacji (Z-Score)."""
    num_channels = X.shape[-1]
    X_flat = X.reshape(-1, num_channels)
    
    # Normalizacja używając zapisanych parametrów
    X_normalized = (X_flat - mean) / std
    X_normalized = X_normalized.reshape(X.shape)
    
    return X_normalized


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


class StressClassificationService:
    """Serwis do klasyfikacji stresu."""
    
    def __init__(self):
        self.model = None
        self.mean = None
        self.std = None
        self.model_loaded = False
        
    def _get_model_path(self):
        """Zwraca ścieżkę do modelu z folderu cnn w serwisie."""
        base_dir = Path(__file__).resolve().parent  # folder serwisu, gdzie jest ten plik
        model_path = base_dir / 'cnn' / 'stress_classifier_multi_subject.pth'
        return model_path
    
    def _get_norm_params_path(self):
        """Zwraca ścieżkę do parametrów normalizacji z folderu cnn w serwisie."""
        base_dir = Path(__file__).resolve().parent
        norm_path = base_dir / 'cnn' / 'normalization_params.npz'
        return norm_path
    
    def load_model(self):
        """Ładuje model i parametry normalizacji."""
        if self.model_loaded:
            return
        
        model_path = self._get_model_path()
        norm_path = self._get_norm_params_path()
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model nie znaleziony: {model_path}")
        
        if not norm_path.exists():
            raise FileNotFoundError(f"Parametry normalizacji nie znalezione: {norm_path}")
        
        # Ładowanie parametrów normalizacji
        norm_params = np.load(norm_path)
        self.mean = norm_params['mean']
        self.std = norm_params['std']
        
        # Inicjalizacja modelu
        num_channels = 6
        seq_len = 120
        
        self.model = CNNLSTMClassifier(
            num_channels=num_channels,
            seq_len=seq_len,
            num_classes=NUM_CLASSES
        ).to(DEVICE)
        
        # Ładowanie wag modelu
        self.model.load_state_dict(torch.load(model_path, map_location=DEVICE))
        self.model.eval()
        self.model_loaded = True
    
    def preprocess_signals(self, acc: np.ndarray, bvp: np.ndarray, eda: np.ndarray, temp: np.ndarray) -> np.ndarray:
        """Przetwarza surowe sygnały i zwraca dane gotowe do klasyfikacji."""
        # Konwersja do DataFrame
        if acc.shape[1] != 3:
            raise ValueError("ACC powinien mieć 3 kolumny (x, y, z)")
        
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
        min_len = min(len(df_acc_resampled), len(df_bvp_resampled), 
                     len(df_eda_resampled), len(df_temp_resampled))
        
        df_combined = pd.concat([
            df_acc_resampled.iloc[:min_len],
            df_bvp_resampled.iloc[:min_len],
            df_eda_resampled.iloc[:min_len],
            df_temp_resampled.iloc[:min_len]
        ], axis=1)

        # Segmentacja danych
        X_segments = segment_data(df_combined, TARGET_RATE, WINDOW_SEC, STEP_SEC)
        
        if len(X_segments) == 0:
            raise ValueError(f"Za mało danych do segmentacji (wymagane minimum {WINDOW_SEC * TARGET_RATE} próbek)")
        
        return X_segments
    
    def predict(self, X_segments: np.ndarray) -> tuple:
        """Wykonuje predykcje dla segmentów."""
        if not self.model_loaded:
            self.load_model()
        
        # Normalizacja
        X_normalized = normalize_data(X_segments, self.mean, self.std)
        
        # Tworzenie datasetu i dataloadera
        dataset = WESADDataset(X_normalized)
        dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)
        
        # Predykcja
        all_predictions = []
        all_probabilities = []
        
        with torch.no_grad():
            for inputs in dataloader:
                inputs = inputs.to(DEVICE)
                outputs = self.model(inputs)
                
                # Oblicz prawdopodobieństwa (softmax)
                probabilities = torch.softmax(outputs, dim=1)
                _, predicted = torch.max(outputs.data, 1)
                
                all_predictions.extend(predicted.cpu().numpy())
                all_probabilities.extend(probabilities.cpu().numpy())
        
        return np.array(all_predictions), np.array(all_probabilities)
    
    def analyze_stress_level(self, predictions: np.ndarray, probabilities: np.ndarray, 
                            start_timestamp: Optional[datetime] = None) -> Dict:
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
        
        return {
            'num_segments': num_segments,
            'dominant_class': int(dominant_class),
            'dominant_class_name': CLASS_NAMES[dominant_class],
            'dominant_percentage': float(dominant_percentage),
            'class_distribution': {int(k): int(v) for k, v in class_counts.items()},
            'mean_probabilities': {CLASS_NAMES[i]: float(mean_probs[i]) for i in range(4)},
            'stress_segments': int(stress_segments),
            'stress_percentage': float(stress_percentage),
            'overall_stress_level': overall_stress_level,
            'stress_value': int(stress_value),
            'total_time_seconds': int(num_segments * STEP_SEC)
        }
    
    def generate_json_output(self, predictions: np.ndarray, probabilities: np.ndarray, 
                           results: Dict, start_timestamp: Optional[datetime] = None) -> Dict:
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
    
    def classify(self, acc: np.ndarray, bvp: np.ndarray, eda: np.ndarray, temp: np.ndarray,
                start_timestamp: Optional[datetime] = None) -> Dict:
        """Główna metoda klasyfikacji - przetwarza sygnały i zwraca JSON z wynikami."""
        # Przetwarzanie sygnałów
        X_segments = self.preprocess_signals(acc, bvp, eda, temp)
        
        # Predykcja
        predictions, probabilities = self.predict(X_segments)
        
        # Analiza wyników
        results = self.analyze_stress_level(predictions, probabilities, start_timestamp)
        
        # Generowanie JSON
        json_output = self.generate_json_output(predictions, probabilities, results, start_timestamp)
        
        return json_output


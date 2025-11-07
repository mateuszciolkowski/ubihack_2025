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
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, f1_score, precision_score, recall_score

# --- KONFIGURACJA PRZETWARZANIA ---
TARGET_RATE = 4    # Hz - Docelowa częstotliwość próbkowania
WINDOW_SEC = 30    # Sekundy - Długość okna czasowego
STEP_SEC = 10      # Sekundy - Przesunięcie okna (overlap: 20 sekund)

# --- KONFIGURACJA TESTÓW ---
BATCH_SIZE = 32
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
NUM_CLASSES = 4  # 0: Baseline, 1: Stress, 2: Amusement, 3: Meditation

# Słownik konwersji etykiet
LABEL_MAP = {
    0: 'transient/not_defined',
    1: 'baseline',
    2: 'stress',
    3: 'amusement',
    4: 'meditation'
}

CLASS_NAMES = ['Baseline', 'Stress', 'Amusement', 'Meditation']

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


def segment_and_label(df_combined, labels_700hz, target_rate, window_sec, step_sec):
    """Segmentuje dane, redukuje etykiety i przypisuje dominującą etykietę do każdego okna."""
    
    window_samples = window_sec * target_rate
    step_samples = step_sec * target_rate
    
    num_samples_target = len(df_combined)
    labels_resampled = signal.resample(labels_700hz.astype(float), num_samples_target).round().astype(int)
    
    segments = []
    segment_labels = []
    
    for start in range(0, len(df_combined) - window_samples + 1, step_samples):
        end = start + window_samples
        
        data_segment = df_combined.iloc[start:end].values
        label_segment = labels_resampled[start:end]
        
        valid_labels = label_segment[label_segment != 0]
        
        if len(valid_labels) == 0:
            dominant_label = 0 
        else:
            dominant_label = Counter(valid_labels).most_common(1)[0][0]
        
        segments.append(data_segment)
        segment_labels.append(dominant_label)
        
    return np.array(segments), np.array(segment_labels)


def preprocess_single_file(file_path):
    """Główna funkcja przetwarzająca pojedynczy plik .pkl."""
    subject_id = os.path.basename(file_path).split('.')[0]

    try:
        with open(file_path, 'rb') as file:
            data = pickle.load(file, encoding='latin1')
        
        wrist_signals = data['signal']['wrist']
        labels_700hz = data['label']
        
        df_acc = pd.DataFrame(wrist_signals['ACC'], columns=['ACC_x', 'ACC_y', 'ACC_z'])
        df_bvp = pd.DataFrame(wrist_signals['BVP'], columns=['BVP'])
        df_eda = pd.DataFrame(wrist_signals['EDA'], columns=['EDA'])
        df_temp = pd.DataFrame(wrist_signals['TEMP'], columns=['TEMP'])
        
    except FileNotFoundError:
        print(f"Błąd: Plik {file_path} nie został znaleziony.")
        return None, None
    except Exception as e:
        print(f"Błąd podczas przetwarzania {file_path}: {e}")
        return None, None
    
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

    # Segmentacja i etykietowanie
    X_segments, Y_labels = segment_and_label(
        df_combined, labels_700hz, TARGET_RATE, WINDOW_SEC, STEP_SEC
    )

    # Filtracja etykiet (tylko 1, 2, 3, 4)
    mask = np.isin(Y_labels, TARGET_LABELS)
    X_filtered = X_segments[mask]
    Y_filtered = Y_labels[mask]
    
    if len(X_filtered) == 0:
        print(f"  Ostrzeżenie: {subject_id} nie zawiera żadnych docelowych etykiet.")
        return None, None
    
    return X_filtered, Y_filtered


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
    def __init__(self, X, Y):
        # X: (próbki, kroki_czasowe, kanały) -> (N, 120, 6)
        # Przekształcamy do (próbki, kanały, kroki_czasowe), co jest standardem dla CNN
        self.X = torch.from_numpy(X).float().permute(0, 2, 1) 
        self.Y = torch.from_numpy(Y).long()
        
    def __len__(self):
        return len(self.Y)

    def __getitem__(self, idx):
        return self.X[idx], self.Y[idx]


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


def evaluate_model(model, dataloader):
    """Ewaluuje model i zwraca predykcje oraz prawdziwe etykiety."""
    model.eval()
    all_predictions = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(DEVICE)
            outputs = model(inputs)
            _, predicted = torch.max(outputs.data, 1)
            
            all_predictions.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())
    
    return np.array(all_predictions), np.array(all_labels)


def print_metrics(y_true, y_pred, subject_id):
    """Wyświetla szczegółowe metryki dla danego pliku."""
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2, 3])
    
    print(f"\n{'='*60}")
    print(f"WYNIKI DLA {subject_id}")
    print(f"{'='*60}")
    print(f"Liczba próbek: {len(y_true)}")
    print(f"\nMetryki ogólne:")
    print(f"  Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    
    print(f"\nMacierz pomyłek:")
    print(f"{'':>12}", end="")
    for name in CLASS_NAMES:
        print(f"{name:>12}", end="")
    print()
    for i, name in enumerate(CLASS_NAMES):
        print(f"{name:>12}", end="")
        for j in range(4):
            print(f"{cm[i, j]:>12}", end="")
        print()
    
    # Rozkład klas
    true_counts = Counter(y_true)
    pred_counts = Counter(y_pred)
    print(f"\nRozkład prawdziwych etykiet:")
    for label in range(4):
        count = true_counts.get(label, 0)
        print(f"  {CLASS_NAMES[label]}: {count}")
    
    print(f"\nRozkład predykcji:")
    for label in range(4):
        count = pred_counts.get(label, 0)
        print(f"  {CLASS_NAMES[label]}: {count}")
    
    # Raport klasyfikacji
    print(f"\nSzczegółowy raport klasyfikacji:")
    report = classification_report(y_true, y_pred, target_names=CLASS_NAMES, zero_division=0)
    print(report)
    
    return {
        'subject_id': subject_id,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'num_samples': len(y_true),
        'confusion_matrix': cm
    }


def main():
    # Ścieżki do plików
    base_dir = Path(__file__).parent
    data_dir = base_dir / 'data'
    test_dir = data_dir / 'test'
    model_path = base_dir / 'stress_classifier_multi_subject.pth'
    norm_params_path = base_dir / 'normalization_params.npz'
    
    # Sprawdzenie czy pliki istnieją
    if not model_path.exists():
        print(f"Błąd: Nie znaleziono modelu: {model_path}")
        print("Najpierw wytrenuj model używając train_on_multiple_files.py")
        return
    
    if not norm_params_path.exists():
        print(f"Błąd: Nie znaleziono parametrów normalizacji: {norm_params_path}")
        return
    
    if not test_dir.exists():
        print(f"Błąd: Folder testowy nie istnieje: {test_dir}")
        return
    
    # Ładowanie modelu
    print("="*60)
    print("ŁADOWANIE MODELU")
    print("="*60)
    print(f"Ładowanie modelu z: {model_path}")
    
    # Ładowanie parametrów normalizacji
    norm_params = np.load(norm_params_path)
    mean = norm_params['mean']
    std = norm_params['std']
    print(f"Parametry normalizacji załadowane (mean shape: {mean.shape}, std shape: {std.shape})")
    
    # Znajdź wszystkie pliki testowe
    pkl_files = sorted(test_dir.glob('S*.pkl'))
    
    if len(pkl_files) == 0:
        print(f"Błąd: Nie znaleziono żadnych plików .pkl w folderze {test_dir}")
        return
    
    print(f"\nZnaleziono {len(pkl_files)} plików testowych:")
    for f in pkl_files:
        print(f"  - {f.name}")
    
    # Inicjalizacja modelu (musimy znać parametry architektury)
    # Zakładamy standardowe wartości z treningu
    num_channels = 6
    seq_len = 120
    
    model = CNNLSTMClassifier(
        num_channels=num_channels,
        seq_len=seq_len,
        num_classes=NUM_CLASSES
    ).to(DEVICE)
    
    # Ładowanie wag modelu
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.eval()
    print(f"\nModel załadowany pomyślnie na urządzeniu: {DEVICE}")
    
    # Przetwarzanie i testowanie każdego pliku
    print("\n" + "="*60)
    print("PRZETWARZANIE I TESTOWANIE PLIKÓW")
    print("="*60)
    
    all_results = []
    all_y_true = []
    all_y_pred = []
    
    for pkl_file in pkl_files:
        subject_id = pkl_file.stem
        
        # Przetwarzanie pliku
        print(f"\nPrzetwarzanie: {subject_id}...")
        X, Y = preprocess_single_file(str(pkl_file))
        
        if X is None or Y is None:
            print(f"  Pominięto {subject_id} - brak danych")
            continue
        
        # Normalizacja używając zapisanych parametrów
        X_normalized = normalize_data(X, mean, std)
        
        # Przekodowanie etykiet z 1,2,3,4 na 0,1,2,3
        Y_final = Y - 1
        
        # Tworzenie datasetu i dataloadera
        dataset = WESADDataset(X_normalized, Y_final)
        dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)
        
        print(f"  Liczba próbek: {len(dataset)}")
        
        # Ewaluacja
        y_pred, y_true = evaluate_model(model, dataloader)
        
        # Obliczanie metryk
        result = print_metrics(y_true, y_pred, subject_id)
        all_results.append(result)
        all_y_true.extend(y_true)
        all_y_pred.extend(y_pred)
    
    # Podsumowanie dla wszystkich plików
    if len(all_y_true) > 0:
        print("\n" + "="*60)
        print("PODSUMOWANIE WSZYSTKICH PLIKÓW TESTOWYCH")
        print("="*60)
        
        overall_accuracy = accuracy_score(all_y_true, all_y_pred)
        overall_precision = precision_score(all_y_true, all_y_pred, average='weighted', zero_division=0)
        overall_recall = recall_score(all_y_true, all_y_pred, average='weighted', zero_division=0)
        overall_f1 = f1_score(all_y_true, all_y_pred, average='weighted', zero_division=0)
        
        print(f"Łączna liczba próbek: {len(all_y_true)}")
        print(f"\nMetryki ogólne (wszystkie pliki):")
        print(f"  Accuracy:  {overall_accuracy:.4f} ({overall_accuracy*100:.2f}%)")
        print(f"  Precision: {overall_precision:.4f}")
        print(f"  Recall:    {overall_recall:.4f}")
        print(f"  F1-Score:  {overall_f1:.4f}")
        
        # Macierz pomyłek dla wszystkich plików
        cm_all = confusion_matrix(all_y_true, all_y_pred, labels=[0, 1, 2, 3])
        print(f"\nMacierz pomyłek (wszystkie pliki):")
        print(f"{'':>12}", end="")
        for name in CLASS_NAMES:
            print(f"{name:>12}", end="")
        print()
        for i, name in enumerate(CLASS_NAMES):
            print(f"{name:>12}", end="")
            for j in range(4):
                print(f"{cm_all[i, j]:>12}", end="")
            print()
        
        # Tabela wyników dla każdego pliku
        print(f"\n{'='*60}")
        print("TABELA WYNIKÓW DLA POSZCZEGÓLNYCH PLIKÓW")
        print(f"{'='*60}")
        print(f"{'Plik':<10} {'Próbki':<10} {'Accuracy':<12} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
        print("-" * 60)
        for result in all_results:
            print(f"{result['subject_id']:<10} {result['num_samples']:<10} "
                  f"{result['accuracy']:<12.4f} {result['precision']:<12.4f} "
                  f"{result['recall']:<12.4f} {result['f1']:<12.4f}")
        
        print(f"\n{'='*60}")
        print("ŚREDNIE WYNIKI (ważone liczbą próbek)")
        print(f"{'='*60}")
        weighted_accuracy = sum(r['accuracy'] * r['num_samples'] for r in all_results) / sum(r['num_samples'] for r in all_results)
        weighted_precision = sum(r['precision'] * r['num_samples'] for r in all_results) / sum(r['num_samples'] for r in all_results)
        weighted_recall = sum(r['recall'] * r['num_samples'] for r in all_results) / sum(r['num_samples'] for r in all_results)
        weighted_f1 = sum(r['f1'] * r['num_samples'] for r in all_results) / sum(r['num_samples'] for r in all_results)
        
        print(f"  Accuracy:  {weighted_accuracy:.4f} ({weighted_accuracy*100:.2f}%)")
        print(f"  Precision: {weighted_precision:.4f}")
        print(f"  Recall:    {weighted_recall:.4f}")
        print(f"  F1-Score:  {weighted_f1:.4f}")
    
    print("\n" + "="*60)
    print("TESTOWANIE ZAKOŃCZONE")
    print("="*60)


if __name__ == '__main__':
    main()


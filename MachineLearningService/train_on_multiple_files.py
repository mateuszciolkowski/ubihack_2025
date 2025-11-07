import pickle
import numpy as np
import pandas as pd
from scipy import signal
from collections import Counter
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from pathlib import Path

# --- KONFIGURACJA PRZETWARZANIA ---
TARGET_RATE = 4    # Hz - Docelowa częstotliwość próbkowania
WINDOW_SEC = 30    # Sekundy - Długość okna czasowego
STEP_SEC = 10      # Sekundy - Przesunięcie okna (overlap: 20 sekund)

# --- KONFIGURACJA TRENINGU ---
BATCH_SIZE = 16
NUM_EPOCHS = 30
LEARNING_RATE = 0.001
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
    print(f"--- PRZETWARZANIE: {subject_id} ---")

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
    
    print(f"  {subject_id}: {len(X_filtered)} próbek po filtracji")
    return X_filtered, Y_filtered


def normalize_data(X_all):
    """Normalizuje dane X (Z-Score Normalization)."""
    print("\nNormalizacja danych (Z-Score)...")
    
    num_channels = X_all.shape[-1]
    X_flat = X_all.reshape(-1, num_channels)
    
    mean = X_flat.mean(axis=0)
    std = X_flat.std(axis=0)
    
    std[std == 0] = 1.0
    
    X_normalized = (X_flat - mean) / std
    X_normalized = X_normalized.reshape(X_all.shape)
    
    print("Normalizacja zakończona.")
    return X_normalized, mean, std


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


def create_weighted_sampler(dataset):
    """Tworzy sampler, który równoważy niezbalansowane klasy."""
    
    class_counts = Counter(dataset.Y.numpy())
    print(f"\nRozkład klas przed samplowaniem: {class_counts}")
    
    num_samples = len(dataset)
    class_weights = {cls: num_samples / count for cls, count in class_counts.items()}
    
    weights = [class_weights[label.item()] for label in dataset.Y]
    
    sampler = WeightedRandomSampler(
        weights=weights,
        num_samples=num_samples,
        replacement=True
    )
    return sampler


def train_model(model, dataloader, criterion, optimizer, num_epochs):
    """Pętla treningowa modelu."""
    model.train()
    
    for epoch in range(num_epochs):
        running_loss = 0.0
        correct_predictions = 0
        total_predictions = 0

        for inputs, labels in dataloader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()

        epoch_loss = running_loss / len(dataloader)
        epoch_accuracy = correct_predictions / total_predictions
        
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss:.4f}, Accuracy: {epoch_accuracy:.4f}")
        
    print("Trening zakończony!")


# --- GŁÓWNA FUNKCJA ---

def main():
    # Ścieżka do folderu z danymi
    data_dir = Path(__file__).parent / 'data'
    
    # Znajdź wszystkie pliki Sx.pkl (gdzie x to liczba od 1 do 10)
    pkl_files = []
    for i in range(1, 11):
        pkl_file = data_dir / f'S{i}.pkl'
        if pkl_file.exists():
            pkl_files.append(pkl_file)
    
    if len(pkl_files) == 0:
        print("Błąd: Nie znaleziono żadnych plików Sx.pkl w folderze data/")
        return
    
    print(f"Znaleziono {len(pkl_files)} plików .pkl do przetworzenia:")
    for f in pkl_files:
        print(f"  - {f.name}")
    
    # Przetwarzanie wszystkich plików
    print("\n" + "="*60)
    print("ETAP 1: PRZETWARZANIE PLIKÓW .pkl")
    print("="*60)
    
    all_X = []
    all_Y = []
    
    for pkl_file in pkl_files:
        X, Y = preprocess_single_file(str(pkl_file))
        if X is not None and Y is not None:
            all_X.append(X)
            all_Y.append(Y)
    
    if len(all_X) == 0:
        print("Błąd: Nie udało się przetworzyć żadnych plików.")
        return
    
    # Łączenie danych ze wszystkich plików
    print("\n" + "="*60)
    print("ETAP 2: ŁĄCZENIE DANYCH")
    print("="*60)
    
    X_combined = np.concatenate(all_X, axis=0)
    Y_combined = np.concatenate(all_Y, axis=0)
    
    print(f"Łączna liczba próbek przed normalizacją: {len(X_combined)}")
    print(f"Kształt X: {X_combined.shape}")
    print(f"Kształt Y: {Y_combined.shape}")
    
    # Normalizacja
    print("\n" + "="*60)
    print("ETAP 3: NORMALIZACJA")
    print("="*60)
    
    X_normalized, mean, std = normalize_data(X_combined)
    
    # Przekodowanie etykiet z 1,2,3,4 na 0,1,2,3
    Y_final = Y_combined - 1
    
    print(f"\nKształt danych X (znormalizowane): {X_normalized.shape}")
    print(f"Kształt etykiet Y (przekodowane): {Y_final.shape}")
    
    label_counts = Counter(Y_final)
    print("\nRozkład etykiet (po przekodowaniu):")
    for label, count in sorted(label_counts.items()):
        label_name = ['Baseline', 'Stress', 'Amusement', 'Meditation'][label]
        print(f"  {label} ({label_name}): {count}")
    
    # Tworzenie datasetu PyTorch
    print("\n" + "="*60)
    print("ETAP 4: PRZYGOTOWANIE DATASETU PYTORCH")
    print("="*60)
    
    dataset = WESADDataset(X_normalized, Y_final)
    print(f"Kształt danych X w PyTorch Dataset: {dataset.X.shape}")
    
    # Tworzenie samplera i dataloadera
    sampler = create_weighted_sampler(dataset)
    dataloader = DataLoader(
        dataset, 
        batch_size=BATCH_SIZE, 
        sampler=sampler, 
        drop_last=True
    )
    
    # Inicjalizacja modelu
    print("\n" + "="*60)
    print("ETAP 5: INICJALIZACJA MODELU")
    print("="*60)
    
    num_channels = dataset.X.shape[1]  # 6
    seq_len = dataset.X.shape[2]  # 120
    
    model = CNNLSTMClassifier(
        num_channels=num_channels,
        seq_len=seq_len,
        num_classes=NUM_CLASSES
    ).to(DEVICE)
    
    print(f"Model utworzony na urządzeniu: {DEVICE}")
    print(f"Liczba parametrów: {sum(p.numel() for p in model.parameters()):,}")
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # Trening
    print("\n" + "="*60)
    print("ETAP 6: TRENING MODELU")
    print("="*60)
    print(f"Batch size: {BATCH_SIZE}, Epochs: {NUM_EPOCHS}, Learning rate: {LEARNING_RATE}")
    
    train_model(model, dataloader, criterion, optimizer, NUM_EPOCHS)
    
    # Zapis modelu
    model_path = data_dir.parent / 'stress_classifier_multi_subject.pth'
    torch.save(model.state_dict(), model_path)
    print(f"\nModel zapisany jako: {model_path}")
    
    # Zapis parametrów normalizacji (przydatne do późniejszego użycia)
    norm_params_path = data_dir.parent / 'normalization_params.npz'
    np.savez_compressed(norm_params_path, mean=mean, std=std)
    print(f"Parametry normalizacji zapisane jako: {norm_params_path}")
    
    print("\n" + "="*60)
    print("WSZYSTKIE ETAPY ZAKOŃCZONE POMYŚLNIE!")
    print("="*60)


if __name__ == '__main__':
    main()


import pickle
import numpy as np
import pandas as pd
from scipy import signal
from collections import Counter
import os

# --- KONFIGURACJA PRZETWARZANIA ---
TARGET_RATE = 4    # Hz - Docelowa częstotliwość próbkowania (jak EDA i TEMP)
WINDOW_SEC = 30    # Sekundy - Długość okna czasowego
STEP_SEC = 10      # Sekundy - Przesunięcie okna (overlap: 20 sekund)
SAVE_PROCESSED_DATA = True # Czy zapisać przetworzone dane do pliku .npz

# [cite_start]Słownik konwersji etykiet (dla czytelności) [cite: 61, 62]
LABEL_MAP = {
    0: 'transient/not_defined',
    1: 'baseline',
    2: 'stress',
    3: 'amusement',
    4: 'meditation'
}

def resample_signal(df_signal, original_rate, target_rate):
    """Unifikuje częstotliwość próbkowania (downsampling) za pomocą SciPy resample."""
    if original_rate == target_rate:
        return df_signal
    
    # Obliczenie docelowej liczby próbek
    num_samples_target = int(len(df_signal) * (target_rate / original_rate))
    
    # Resampling z wbudowaną filtracją antyaliasingową
    resampled_data = signal.resample(df_signal, num_samples_target)
    
    return pd.DataFrame(resampled_data, columns=df_signal.columns)


def segment_and_label(df_combined, labels_700hz, target_rate, window_sec, step_sec):
    """Segmentuje dane, redukuje etykiety i przypisuje dominującą etykietę do każdego okna."""
    
    window_samples = window_sec * target_rate
    step_samples = step_sec * target_rate
    
    # Redukcja etykiet (700Hz) do TARGET_RATE
    num_samples_target = len(df_combined)
    # Etykiety muszą być skalowane, a następnie zaokrąglone do int
    labels_resampled = signal.resample(labels_700hz.astype(float), num_samples_target).round().astype(int)
    
    segments = []
    segment_labels = []
    
    for start in range(0, len(df_combined) - window_samples + 1, step_samples):
        end = start + window_samples
        
        data_segment = df_combined.iloc[start:end].values
        label_segment = labels_resampled[start:end]
        
        # Wyznaczanie dominującej etykiety
        # [cite_start]Ignorujemy etykietę 0 ('transient/not defined') przy liczeniu [cite: 61]
        valid_labels = label_segment[label_segment != 0]
        
        if len(valid_labels) == 0:
            # Okno zawiera tylko etykiety "przejściowe" (0)
            dominant_label = 0 
        else:
            # Najczęściej występująca etykieta
            dominant_label = Counter(valid_labels).most_common(1)[0][0]
        
        segments.append(data_segment)
        segment_labels.append(dominant_label)
        
    return np.array(segments), np.array(segment_labels)


def preprocess_single_file(file_path):
    """Główna funkcja przetwarzająca pojedynczy plik .pkl."""
    subject_id = os.path.basename(file_path).split('.')[0]
    print(f"--- ROZPOCZĘCIE PRZETWARZANIA: {subject_id} ---")

    # [cite_start]Krok 1: Ładowanie i ekstrakcja danych [cite: 57-62]
    try:
        with open(file_path, 'rb') as file:
            data = pickle.load(file, encoding='latin1')
        
        wrist_signals = data['signal']['wrist']
        labels_700hz = data['label']
        
        # Tworzenie DataFrame dla sygnałów z nadgarstka (E4)
        df_acc = pd.DataFrame(wrist_signals['ACC'], columns=['ACC_x', 'ACC_y', 'ACC_z'])
        df_bvp = pd.DataFrame(wrist_signals['BVP'], columns=['BVP'])
        df_eda = pd.DataFrame(wrist_signals['EDA'], columns=['EDA'])
        df_temp = pd.DataFrame(wrist_signals['TEMP'], columns=['TEMP'])
        
    except FileNotFoundError:
        print(f"Błąd: Plik {file_path} nie został znaleziony.")
        return None, None
    
    # Krok 2: Downsampling i unifikacja częstotliwości (do 4 Hz)
    print(f"Krok 2: Downsampling sygnałów do {TARGET_RATE} Hz...")
    
    # [cite_start]Częstotliwości próbkowania E4: ACC (32 Hz), BVP (64 Hz), EDA (4 Hz), TEMP (4 Hz) [cite: 49, 51-53]
    df_acc_resampled = resample_signal(df_acc, 32, TARGET_RATE)
    df_bvp_resampled = resample_signal(df_bvp, 64, TARGET_RATE)
    df_eda_resampled = resample_signal(df_eda, 4, TARGET_RATE)
    df_temp_resampled = resample_signal(df_temp, 4, TARGET_RATE)

    # Ujednolicanie długości i połączenie DataFrame
    min_len = min(len(df_acc_resampled), len(df_bvp_resampled), len(df_eda_resampled), len(df_temp_resampled))
    
    df_combined = pd.concat([
        df_acc_resampled.iloc[:min_len],
        df_bvp_resampled.iloc[:min_len],
        df_eda_resampled.iloc[:min_len],
        df_temp_resampled.iloc[:min_len]
    ], axis=1)

    print(f"  Połączony DataFrame ma kształt: {df_combined.shape}")

    # Krok 3: Segmentacja i etykietowanie
    print(f"Krok 3: Segmentacja na okna {WINDOW_SEC}s z przesunięciem {STEP_SEC}s...")
    X_segments, Y_labels = segment_and_label(
        df_combined, labels_700hz, TARGET_RATE, WINDOW_SEC, STEP_SEC
    )

    # --- PODSUMOWANIE ---
    print("\n--- PODSUMOWANIE WYNIKÓW ---")
    print(f"Gotowe dane (X): Kształt = {X_segments.shape}")
    print(f"Gotowe etykiety (Y): Kształt = {Y_labels.shape}")
    print(f"Długość sekwencji (punktów): {X_segments.shape[1]}") 
    
    label_counts = Counter(Y_labels)
    print("\nRozkład etykiet (klas):")
    for label, count in label_counts.items():
        print(f"  {label} ({LABEL_MAP.get(label, 'Nieznana')}): {count}")

    # Krok 4: Zapis danych (opcjonalny, ale zalecany)
    if SAVE_PROCESSED_DATA:
        output_filename = f'processed_wesad_{subject_id}.npz'
        np.savez_compressed(output_filename, X=X_segments, Y=Y_labels)
        print(f"\nDane zapisane pomyślnie do: {output_filename}")
        
    print(f"--- KONIEC PRZETWARZANIA: {subject_id} ---")
    return X_segments, Y_labels

if __name__ == '__main__':
    # Zmień tę ścieżkę na właściwą dla Twojego pliku .pkl
    # Upewnij się, że plik S2.pkl istnieje w folderze, w którym uruchamiasz skrypt
    file_to_process = '../data/S3.pkl' 
    
    # Analiza i przetworzenie pojedynczego pliku
    X_final, Y_final = preprocess_single_file(file_to_process)
    
    if X_final is not None:
        print("\nPrzetworzone dane są gotowe do użycia w PyTorch.")
        # Możesz teraz wczytać plik processed_wesad_S2.npz i utworzyć z niego Tensory.
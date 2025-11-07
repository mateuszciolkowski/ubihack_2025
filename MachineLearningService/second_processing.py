import numpy as np
import os

# --- KONFIGURACJA ---
INPUT_FILE = 'processed_wesad_S3.npz'
OUTPUT_FILE = 'final_pytorch_S3.npz'

# Etykiety, które chcemy ZACHOWAĆ (nasze klasy docelowe: 1, 2, 3, 4)
# 1: baseline, 2: stress, 3: amusement, 4: meditation
TARGET_LABELS = [1, 2, 3, 4]

# Słownik etykiet dla lepszej czytelności
LABEL_MAP = {
    1: 'Baseline',
    2: 'Stress',
    3: 'Amusement',
    4: 'Meditation'
}

def load_and_filter_data(input_file):
    """Wczytuje, filtruje dane, usuwając niepożądane etykiety (0, -1, 6, 7)."""
    
    print(f"Ładowanie danych z: {input_file}...")
    try:
        data = np.load(input_file)
        X = data['X']  # Dane segmentów (605, 120, 6)
        Y = data['Y']  # Etykiety (605,)
    except FileNotFoundError:
        print(f"Błąd: Plik {input_file} nie został znaleziony.")
        return None, None

    # Tworzenie maski filtrującej etykiety
    print(f"Początkowa liczba próbek: {len(Y)}")
    
    # Maska: True dla etykiet znajdujących się w TARGET_LABELS
    mask = np.isin(Y, TARGET_LABELS)
    
    X_filtered = X[mask]
    Y_filtered = Y[mask]
    
    print(f"Liczba próbek po filtracji (klasy 1, 2, 3, 4): {len(Y_filtered)}")
    return X_filtered, Y_filtered


def normalize_data(X_filtered):
    """Normalizuje dane X (Z-Score Normalization)."""
    
    print("Normalizacja danych (Z-Score)...")
    
    # Kształt X_filtered to (próbki, kroki_czasowe, kanały)
    
    # 1. Zmiana kształtu: wszystkie dane w jeden duży zbiór (próbki * kroki_czasowe, kanały)
    # Umożliwia to obliczenie globalnej średniej i odchylenia dla każdego kanału.
    # Używamy X_filtered.shape[-1] jako liczby kanałów (6)
    num_channels = X_filtered.shape[-1]
    X_flat = X_filtered.reshape(-1, num_channels)
    
    # 2. Obliczenie średniej (mean) i odchylenia standardowego (std) dla każdego kanału
    # Oś 0 to wszystkie punkty danych
    mean = X_flat.mean(axis=0)
    std = X_flat.std(axis=0)
    
    # Zapobieganie dzieleniu przez zero
    std[std == 0] = 1.0
    
    # 3. Normalizacja: (X - mean) / std
    X_normalized = (X_flat - mean) / std
    
    # 4. Przywrócenie pierwotnego kształtu (próbki, kroki_czasowe, kanały)
    X_normalized = X_normalized.reshape(X_filtered.shape)
    
    print("Normalizacja zakończona.")
    # Zwracamy również średnią i odchylenie, co będzie potrzebne, jeśli będziesz chciał normalizować
    # nowe dane (np. od konkretnego klienta)
    return X_normalized, mean, std


def final_prep_pipeline(input_file):
    """Główna funkcja wykonująca finalne czyszczenie i normalizację."""
    
    # Krok 1: Ładowanie i filtracja
    X, Y = load_and_filter_data(input_file)
    if X is None:
        return None, None

    # Krok 2: Normalizacja Z-Score
    X_norm, mean, std = normalize_data(X)
    
    # Krok 3: Przekodowanie etykiet (PyTorch preferuje etykiety od 0, 1, 2...)
    # Nasze etykiety to 1, 2, 3, 4. Przekodowujemy je na 0, 1, 2, 3.
    Y_final = Y - 1 
    print(f"Etykiety przekodowane z 1,2,3,4 na 0,1,2,3.")
    
    # Krok 4: Zapis ostatecznego pliku
    np.savez_compressed(
        OUTPUT_FILE, 
        X=X_norm, 
        Y=Y_final,
        mean=mean,
        std=std
    )

    print("\n--- PODSUMOWANIE OSTATECZNE ---")
    print(f"Kształt danych X (znormalizowane): {X_norm.shape}")
    print(f"Kształt etykiet Y (przekodowane): {Y_final.shape}")
    print(f"Dane zapisane do: {OUTPUT_FILE}")
    print("Teraz można je wczytać bezpośrednio do PyTorch!")
    
    return X_norm, Y_final

if __name__ == '__main__':
    X_pytorch_ready, Y_pytorch_ready = final_prep_pipeline(INPUT_FILE)
    
    # Przykład, jak załadować do PyTorch:
    # import torch
    # X_tensor = torch.from_numpy(X_pytorch_ready).float()
    # Y_tensor = torch.from_numpy(Y_pytorch_ready).long()
    # print(f"Kształt Tensora X: {X_tensor.shape}, Typ: {X_tensor.dtype}")
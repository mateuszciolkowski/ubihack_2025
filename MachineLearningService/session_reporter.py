import torch
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader
from modellearning import CNNLSTMClassifier, WESADDataset, BATCH_SIZE

# --- KONFIGURACJA ---
MODEL_PATH = 'stress_classifier_S2.pth'
DATA_PATH = 'final_pytorch_S2.npz'
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Etykiety (Przekodowane w programie do przygotowania danych)
CLASS_NAMES = {
    0: "Baseline (Neutralny)",
    1: "Stress (Stres)",
    2: "Amusement (Rozbawienie)",
    3: "Meditation (Relaksacja)"
}
WINDOW_SEC = 30 # Długość okna (segmentu)
STEP_SEC = 10   # Przesunięcie okna

def generate_predictions(model, dataset):
    """Generuje predykcje dla całego zbioru danych."""
    model.eval()
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)
    all_preds = []
    
    with torch.no_grad():
        for inputs, _ in dataloader:
            inputs = inputs.to(DEVICE)
            outputs = model(inputs)
            _, predicted = torch.max(outputs.data, 1)
            all_preds.extend(predicted.cpu().numpy())
            
    return np.array(all_preds)

def analyze_session_report(preds, labels):
    """
    Analizuje predykcje, oblicza czas trwania stanów i identyfikuje kluczowe momenty.
    
    Args:
        preds (np.array): Predykcje modelu (np. 0, 1, 2, 3).
        labels (np.array): Prawdziwe etykiety (do weryfikacji).
    """
    num_segments = len(preds)
    
    # 1. Analiza Czasu Trwania Stanów
    
    # Obliczanie efektywnego czasu: Tylko raz na krok (10 sekund)
    time_per_segment = STEP_SEC # Czas kroku, nie okna
    
    print("\n--- RAPORT 1: ROZKŁAD CZASOWY STANÓW W SESJI ---")
    
    # DataFrame do łatwego zliczania
    df_results = pd.DataFrame({'prediction': preds})
    
    # Zliczanie całkowitego czasu
    time_distribution = {}
    total_effective_time = 0
    
    for class_id, count in df_results['prediction'].value_counts().items():
        state_name = CLASS_NAMES.get(class_id, f"Klasa {class_id} (Nieznana)")
        total_time_sec = count * time_per_segment
        time_distribution[state_name] = total_time_sec
        total_effective_time += total_time_sec

    # Prezentacja wyników
    print(f"Całkowity czas analizowanych próbek: {total_effective_time // 60} minut i {total_effective_time % 60} sekund.")
    print("\n| Stan | Czas Trwania | Udział % |")
    print("| :--- | :--- | :--- |")
    
    for state, time_sec in sorted(time_distribution.items(), key=lambda item: item[1], reverse=True):
        percent = (time_sec / total_effective_time) * 100 if total_effective_time else 0
        print(f"| {state} | {time_sec // 60}m {time_sec % 60}s | {percent:.1f}% |")

    # 2. Analiza Krytycznych Momentów (Stres)
    
    print("\n--- RAPORT 2: KLUCZOWE MOMENTY STRESU (Dla psychologa) ---")
    
    # Znajdujemy indeksy, w których model przewidział STRES (klasa 1)
    stress_indices = np.where(preds == 1)[0]
    
    if len(stress_indices) == 0:
        print("Brak wykrytych momentów intensywnego stresu.")
        return

    # Generowanie czytelnej listy momentów
    for i in stress_indices:
        # Czas rozpoczęcia segmentu
        start_time_sec = i * STEP_SEC
        
        minutes = start_time_sec // 60
        seconds = start_time_sec % 60
        
        # Prawdziwa etykieta dla porównania (tylko w celach ewaluacyjnych, psycholog tego nie widzi)
        true_label_name = CLASS_NAMES.get(labels[i].item(), "N/A")
        
        # Wyliczanie 'momentu' z uwzględnieniem, że sesja zaczyna się od zera
        print(f"-> STRES WYKRYTY (Moment {i+1})")
        print(f"   * Czas Sesji: **{minutes}m {seconds}s**")
        print(f"   * Wskazówka dla psychologa: 'To jest okno 30s, w którym doszło do aktywacji autonomicznej.'")
        # Jeśli zbiór treningowy byłby cały sesją, można by tu dodać opis co się działo w tym momencie
        
        # Możesz dodać dalszą analizę wskaźników fizjologicznych dla tego segmentu (średnie EDA, tętno)
        
    print("\n--- KONIEC RAPORTU DLA PSYCHOLOGA ---")


# --- GŁÓWNA FUNKCJA ANALIZUJĄCA ---
def main():
    # 1. Wczytanie modelu i danych
    dataset = WESADDataset(DATA_PATH)
    
    num_channels = dataset.X.shape[1] 
    seq_len = dataset.X.shape[2] 
    
    model = CNNLSTMClassifier(
        num_channels=num_channels,
        seq_len=seq_len,
        num_classes=4
    ).to(DEVICE)
    
    try:
        model.load_state_dict(torch.load(MODEL_PATH))
    except Exception as e:
        print(f"BŁĄD: Nie można wczytać modelu z {MODEL_PATH}. Upewnij się, że uruchomiłeś trening.")
        print(f"Szczegóły: {e}")
        return

    # 2. Generowanie predykcji
    predictions = generate_predictions(model, dataset)
    
    # 3. Generowanie Raportu
    analyze_session_report(predictions, dataset.Y.numpy())

if __name__ == '__main__':
    main()
import torch
import numpy as np
import random
import os
import math
from scipy import signal

# --- KONFIGURACJA STAŁYCH ---
DATA_PATH = 'final_pytorch_S2.npz' # Wymagane tylko do wczytania parametrów normalizacji

TIME_STEPS = 120 # Długość sekwencji (30 sekund * 4 Hz)
NUM_CHANNELS = 6
WINDOW_SEC = 30 
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- A. KLASA KONFIGURACYJNA (Wzorce do manipulowania) ---
class SimulationConfig:
    """Kontrola parametrów symulacji dla pojedynczego 30-sekundowego segmentu."""
    
    def __init__(self, name: str, eda_level: float, bvp_noise: float, heart_rate: float, movement_level: float):
        """
        Args:
            name (str): Opis stanu.
            eda_level (float): Średnia aktywność EDA (potliwość). Wyższa = większe pobudzenie.
            bvp_noise (float): Zmienność BVP/HRV. Niższa = większa stabilność/relaks.
            heart_rate (float): Względna częstotliwość tętna (np. 1.2 = przyspieszone).
            movement_level (float): Poziom szumu/artefaktów ruchu w ACC.
        """
        self.name = name
        self.eda_level = eda_level
        self.bvp_noise = bvp_noise
        self.heart_rate = heart_rate
        self.movement_level = movement_level

# --- B. FUNKCJE PRZETWARZANIA DANYCH ---

def load_normalization_params(data_path):
    """Wczytuje średnią i odchylenie standardowe z pliku treningowego."""
    try:
        data = np.load(data_path)
        return data['mean'], data['std']
    except Exception as e:
        print(f"Błąd wczytywania parametrów normalizacji: {e}")
        return None, None

def simulate_raw_segment(config: SimulationConfig):
    """Generuje 30-sekundowy segment surowych danych na podstawie konfiguracji."""
    
    simulated_data = np.zeros((TIME_STEPS, NUM_CHANNELS))
    t = np.linspace(0, WINDOW_SEC, TIME_STEPS, endpoint=False)
    
    for i in range(NUM_CHANNELS):
        # ACC (indeks 0, 1, 2): Ruch / Artefakty
        if i < 3:
            # Ruch jest symulowany przez szum wokół 0.5 (typowa wartość)
            simulated_data[:, i] = np.random.normal(loc=0.5, scale=config.movement_level * 0.2, size=TIME_STEPS)
        
        # BVP (indeks 3): Sygnał tętna
        elif i == 3:
            # Symulacja fali tętna. Częstotliwość skalowana przez config.heart_rate
            base_freq = 0.9 * config.heart_rate 
            amplitude = np.random.uniform(0.8, 1.2) * (2 - config.bvp_noise)
            
            # Tworzenie fali sinusoidalnej
            simulated_data[:, i] = amplitude * np.sin(t * 2 * np.pi / base_freq) 
            
            # Dodanie szumu (zmienności/HRV)
            simulated_data[:, i] += np.random.normal(loc=0, scale=0.1 * config.bvp_noise, size=TIME_STEPS)
        
        # EDA (indeks 4): Aktywność Elektrodermalna
        elif i == 4:
            # Symulujemy EDA (musi być > 0)
            simulated_data[:, i] = np.abs(np.random.normal(loc=config.eda_level, scale=0.5, size=TIME_STEPS))
        
        # TEMP (indeks 5): Temperatura (stabilna)
        elif i == 5:
            simulated_data[:, i] = np.random.normal(loc=31.0, scale=0.1, size=TIME_STEPS)
            
    return simulated_data

def generate_pytorch_tensor_from_config(config: SimulationConfig):
    """
    Generuje przetworzony Tensor PyTorch (1, 6, 120) gotowy do użycia w modelu.
    """
    
    # 1. Ładowanie parametrów normalizacji
    mean, std = load_normalization_params(DATA_PATH)
    if mean is None:
        raise FileNotFoundError(f"Nie znaleziono parametrów normalizacji w {DATA_PATH}. Uruchom preprocessing.")
    
    # 2. Symulacja surowych danych
    raw_data = simulate_raw_segment(config)
    
    # 3. Normalizacja Z-Score (używając parametrów z treningu!)
    X_normalized = (raw_data - mean) / std
    
    # 4. Konwersja na Tensor
    X_tensor = torch.from_numpy(X_normalized).float()
    
    # 5. Zmiana kształtu na wymagany przez model: [1, Kanały, Czas]
    # Kształt wejściowy: [Czas, Kanały] -> [1, Kanały, Czas]
    X_tensor = X_tensor.permute(1, 0).unsqueeze(0).to(DEVICE)
    
    print(f"\n--- GENERACJA DANYCH DLA STANU: {config.name} ---")
    print(f"   * WZORZEC: EDA~{config.eda_level:.1f}µS, HR(skala)~{config.heart_rate:.1f}, BVP_szum~{config.bvp_noise:.1f}")
    print(f"   -> Wymagany kształt Tensora: {tuple(X_tensor.shape)}")
    
    return X_tensor

# --- C. DEFINICJA I GENEROWANIE WZORCÓW TESTOWYCH ---

if __name__ == '__main__':
    
    # WZORZEC 1: BASELINE / NEUTRALNY
    baseline_config = SimulationConfig(
        name="NEUTRALNY BASELINE",
        eda_level=4.5,
        bvp_noise=0.5,
        heart_rate=1.0,
        movement_level=0.1
    )

    # WZORZEC 2: STRES (Wysokie Pobudzenie + Niska HRV)
    stress_config = SimulationConfig(
        name="SILNY STRES",
        eda_level=9.5,         # Bardzo wysoka potliwość
        bvp_noise=0.8,         # Niska zmienność (mała HRV)
        heart_rate=1.3,        # Znacznie przyspieszone tętno
        movement_level=0.1
    )

    # WZORZEC 3: RELAKSACJA (Niskie Pobudzenie + Wysoka HRV)
    meditation_config = SimulationConfig(
        name="GŁĘBOKA RELAKSACJA",
        eda_level=2.0,         # Niska potliwość
        bvp_noise=0.3,         # Wysoka zmienność (duża HRV)
        heart_rate=0.9,        # Uspokojone tętno
        movement_level=0.1
    )
    
    # --- GENEROWANIE TENSORÓW ---
    
    baseline_tensor = generate_pytorch_tensor_from_config(baseline_config)
    stress_tensor = generate_pytorch_tensor_from_config(stress_config)
    meditation_tensor = generate_pytorch_tensor_from_config(meditation_config)
    
    # Możesz teraz użyć tych Tensorów do testowania swojego modelu:
    # with torch.no_grad():
    #     outputs = model(stress_tensor)
    #     # dalsza analiza...
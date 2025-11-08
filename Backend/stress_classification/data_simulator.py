"""
Generator symulowanych danych biometrycznych do testowania klasyfikacji stresu.
"""
import numpy as np
from typing import Tuple

# Częstotliwości próbkowania (przed downsamplingiem)
ACC_RATE = 32  # Hz
BVP_RATE = 64  # Hz
EDA_RATE = 4   # Hz
TEMP_RATE = 4  # Hz

# Długość symulacji w sekundach
DEFAULT_DURATION_SEC = 300  # 5 minut


def generate_simulated_data(duration_sec: int = DEFAULT_DURATION_SEC) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Generuje symulowane dane biometryczne z różnymi klasami:
    - Baseline: stan neutralny
    - Stress: zwiększona aktywność fizjologiczna
    - Amusement: pozytywny stan emocjonalny
    - Meditation: relaksacja i spokój
    
    Args:
        duration_sec: Długość symulacji w sekundach
        
    Returns:
        Tuple (acc, bvp, eda, temp) - numpy arrays z danymi
    """
    # Generuj dane dla każdego sygnału z odpowiednią częstotliwością próbkowania
    t_acc = np.linspace(0, duration_sec, int(ACC_RATE * duration_sec))
    t_bvp = np.linspace(0, duration_sec, int(BVP_RATE * duration_sec))
    t_eda = np.linspace(0, duration_sec, int(EDA_RATE * duration_sec))
    t_temp = np.linspace(0, duration_sec, int(TEMP_RATE * duration_sec))
    
    # Określ okresy dla różnych klas (zwiększona częstotliwość innych klas)
    # Baseline: 0-30, 90-120, 240-270 (30% czasu)
    # Stress: 30-60, 150-180, 270-300 (30% czasu)
    # Amusement: 60-90, 210-240 (20% czasu)
    # Meditation: 120-150 (20% czasu)
    
    stress_periods = [
        (30, 60),   # 30-60 sekunda
        (150, 180), # 150-180 sekunda
        (270, 300), # 270-300 sekunda
    ]
    
    amusement_periods = [
        (60, 90),   # 60-90 sekunda
        (210, 240), # 210-240 sekunda
    ]
    
    meditation_periods = [
        (120, 150), # 120-150 sekunda
    ]
    
    # ACC - akcelerometr (3 osie: x, y, z)
    # Bazowa aktywność (Baseline)
    acc_x = 0.5 + 0.3 * np.sin(2 * np.pi * 0.1 * t_acc) + 0.1 * np.random.randn(len(t_acc))
    acc_y = 0.3 + 0.2 * np.cos(2 * np.pi * 0.15 * t_acc) + 0.1 * np.random.randn(len(t_acc))
    acc_z = 0.8 + 0.4 * np.sin(2 * np.pi * 0.12 * t_acc) + 0.1 * np.random.randn(len(t_acc))
    
    # STRESS: Zwiększona aktywność, nieregularny ruch
    for start, end in stress_periods:
        mask = (t_acc >= start) & (t_acc <= end)
        acc_x[mask] += 0.8 * np.random.randn(np.sum(mask))  # Większa zmienność
        acc_y[mask] += 0.8 * np.random.randn(np.sum(mask))
        acc_z[mask] += 0.8 * np.random.randn(np.sum(mask))
        # Dodaj szybkie oscylacje (drżenie)
        acc_x[mask] += 0.3 * np.sin(2 * np.pi * 2.0 * t_acc[mask])
        acc_y[mask] += 0.3 * np.sin(2 * np.pi * 2.0 * t_acc[mask])
        acc_z[mask] += 0.3 * np.sin(2 * np.pi * 2.0 * t_acc[mask])
    
    # AMUSEMENT: Rytmiczny, energiczny ruch (pozytywna aktywność)
    for start, end in amusement_periods:
        mask = (t_acc >= start) & (t_acc <= end)
        # Rytmiczne, regularne ruchy (np. śmiech, kiwanie)
        acc_x[mask] += 0.4 * np.sin(2 * np.pi * 0.5 * t_acc[mask])
        acc_y[mask] += 0.4 * np.cos(2 * np.pi * 0.5 * t_acc[mask])
        acc_z[mask] += 0.3 * np.sin(2 * np.pi * 0.6 * t_acc[mask])
        acc_x[mask] += 0.2 * np.random.randn(np.sum(mask))
        acc_y[mask] += 0.2 * np.random.randn(np.sum(mask))
        acc_z[mask] += 0.2 * np.random.randn(np.sum(mask))
    
    # MEDITATION: Minimalna aktywność, bardzo stabilny
    for start, end in meditation_periods:
        mask = (t_acc >= start) & (t_acc <= end)
        # Zmniejsz aktywność - bardzo małe, powolne ruchy
        acc_x[mask] *= 0.3  # Zmniejsz amplitudę
        acc_y[mask] *= 0.3
        acc_z[mask] *= 0.3
        acc_x[mask] += 0.05 * np.sin(2 * np.pi * 0.02 * t_acc[mask])  # Bardzo wolne ruchy
        acc_y[mask] += 0.05 * np.cos(2 * np.pi * 0.02 * t_acc[mask])
        acc_z[mask] += 0.05 * np.sin(2 * np.pi * 0.02 * t_acc[mask])
        acc_x[mask] += 0.03 * np.random.randn(np.sum(mask))  # Mniejszy szum
        acc_y[mask] += 0.03 * np.random.randn(np.sum(mask))
        acc_z[mask] += 0.03 * np.random.randn(np.sum(mask))
    
    acc = np.column_stack([acc_x, acc_y, acc_z])
    
    # BVP - Blood Volume Pulse
    # Bazowy puls ~1 Hz (60 bpm)
    base_heart_rate = 1.0  # Hz
    bvp = 0.5 + 0.3 * np.sin(2 * np.pi * base_heart_rate * t_bvp)
    hrv = 0.05 * np.sin(2 * np.pi * 0.1 * t_bvp)
    bvp += hrv
    
    # STRESS: Zwiększony puls, nieregularny rytm
    for start, end in stress_periods:
        mask = (t_bvp >= start) & (t_bvp <= end)
        bvp[mask] += 0.3 * np.sin(2 * np.pi * 1.4 * t_bvp[mask])  # Wyższy puls (~84 bpm)
        bvp[mask] += 0.15 * np.random.randn(np.sum(mask))  # Większa nieregularność
        # Zmniejszona HRV (zmienność rytmu serca)
        hrv_stress = 0.02 * np.sin(2 * np.pi * 0.15 * t_bvp[mask])
        bvp[mask] += hrv_stress
    
    # AMUSEMENT: Umiarkowanie zwiększony puls, regularny rytm
    for start, end in amusement_periods:
        mask = (t_bvp >= start) & (t_bvp <= end)
        bvp[mask] += 0.2 * np.sin(2 * np.pi * 1.2 * t_bvp[mask])  # Lekko wyższy puls (~72 bpm)
        bvp[mask] += 0.08 * np.random.randn(np.sum(mask))
        # Zwiększona HRV (pozytywna zmienność)
        hrv_amusement = 0.08 * np.sin(2 * np.pi * 0.12 * t_bvp[mask])
        bvp[mask] += hrv_amusement
    
    # MEDITATION: Obniżony puls, bardzo regularny rytm
    for start, end in meditation_periods:
        mask = (t_bvp >= start) & (t_bvp <= end)
        bvp[mask] += -0.15 * np.sin(2 * np.pi * 0.85 * t_bvp[mask])  # Niższy puls (~51 bpm)
        bvp[mask] += 0.03 * np.random.randn(np.sum(mask))  # Bardzo mały szum
        # Zwiększona HRV (głęboka relaksacja)
        hrv_meditation = 0.1 * np.sin(2 * np.pi * 0.08 * t_bvp[mask])
        bvp[mask] += hrv_meditation
    
    bvp += 0.05 * np.random.randn(len(t_bvp))
    bvp = np.clip(bvp, 0, 1)
    
    # EDA - Electrodermal Activity
    # Bazowa aktywność
    eda = 0.3 + 0.1 * np.sin(2 * np.pi * 0.05 * t_eda)
    
    # STRESS: Znaczny wzrost EDA
    for start, end in stress_periods:
        mask = (t_eda >= start) & (t_eda <= end)
        # EDA wzrasta podczas stresu (eksponencjalny wzrost i spadek)
        eda[mask] += 0.4 * np.exp(-(t_eda[mask] - start) / 8)
        eda[mask] += 0.15 * np.random.randn(np.sum(mask))
        # Dodaj szybkie skoki
        eda[mask] += 0.2 * np.sin(2 * np.pi * 0.3 * t_eda[mask])
    
    # AMUSEMENT: Umiarkowany wzrost EDA (pozytywne pobudzenie)
    for start, end in amusement_periods:
        mask = (t_eda >= start) & (t_eda <= end)
        eda[mask] += 0.2 * np.sin(2 * np.pi * 0.2 * t_eda[mask])  # Rytmiczne wzrosty
        eda[mask] += 0.08 * np.random.randn(np.sum(mask))
    
    # MEDITATION: Obniżona EDA (głęboka relaksacja)
    for start, end in meditation_periods:
        mask = (t_eda >= start) & (t_eda <= end)
        eda[mask] *= 0.6  # Zmniejsz bazową aktywność
        eda[mask] += 0.05 * np.sin(2 * np.pi * 0.03 * t_eda[mask])  # Bardzo wolne zmiany
        eda[mask] += 0.03 * np.random.randn(np.sum(mask))  # Minimalny szum
    
    eda += 0.05 * np.random.randn(len(t_eda))
    eda = np.clip(eda, 0, 1)
    
    # TEMP - Temperatura
    # Bazowa temperatura
    temp = 36.5 + 0.2 * np.sin(2 * np.pi * 0.01 * t_temp)
    
    # STRESS: Wzrost temperatury
    for start, end in stress_periods:
        mask = (t_temp >= start) & (t_temp <= end)
        temp[mask] += 0.4 * (1 - np.exp(-(t_temp[mask] - start) / 12))
        temp[mask] += 0.12 * np.random.randn(np.sum(mask))
    
    # AMUSEMENT: Lekki wzrost temperatury
    for start, end in amusement_periods:
        mask = (t_temp >= start) & (t_temp <= end)
        temp[mask] += 0.15 * np.sin(2 * np.pi * 0.05 * t_temp[mask])
        temp[mask] += 0.08 * np.random.randn(np.sum(mask))
    
    # MEDITATION: Lekki spadek temperatury
    for start, end in meditation_periods:
        mask = (t_temp >= start) & (t_temp <= end)
        temp[mask] += -0.2 * (1 - np.exp(-(t_temp[mask] - start) / 20))
        temp[mask] += 0.05 * np.random.randn(np.sum(mask))
    
    temp += 0.1 * np.random.randn(len(t_temp))
    temp = np.clip(temp, 35.0, 38.0)
    
    return acc, bvp, eda, temp


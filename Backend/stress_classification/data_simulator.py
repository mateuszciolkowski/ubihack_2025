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
    Generuje symulowane dane biometryczne.
    
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
    
    # ACC - akcelerometr (3 osie: x, y, z)
    # Symuluj ruch z różnymi poziomami aktywności
    acc_x = 0.5 + 0.3 * np.sin(2 * np.pi * 0.1 * t_acc) + 0.1 * np.random.randn(len(t_acc))
    acc_y = 0.3 + 0.2 * np.cos(2 * np.pi * 0.15 * t_acc) + 0.1 * np.random.randn(len(t_acc))
    acc_z = 0.8 + 0.4 * np.sin(2 * np.pi * 0.12 * t_acc) + 0.1 * np.random.randn(len(t_acc))
    
    # Dodaj okresy zwiększonej aktywności (stres)
    stress_periods = [
        (60, 90),   # 60-90 sekunda
        (180, 210), # 180-210 sekunda
    ]
    
    for start, end in stress_periods:
        mask = (t_acc >= start) & (t_acc <= end)
        acc_x[mask] += 0.5 * np.random.randn(np.sum(mask))
        acc_y[mask] += 0.5 * np.random.randn(np.sum(mask))
        acc_z[mask] += 0.5 * np.random.randn(np.sum(mask))
    
    acc = np.column_stack([acc_x, acc_y, acc_z])
    
    # BVP - Blood Volume Pulse
    # Symuluj puls z podstawową częstotliwością ~1 Hz (60 bpm)
    base_heart_rate = 1.0  # Hz
    bvp = 0.5 + 0.3 * np.sin(2 * np.pi * base_heart_rate * t_bvp)
    
    # Dodaj zmienność (HRV)
    hrv = 0.05 * np.sin(2 * np.pi * 0.1 * t_bvp)
    bvp += hrv
    
    # Zwiększ puls w okresach stresu
    for start, end in stress_periods:
        mask = (t_bvp >= start) & (t_bvp <= end)
        bvp[mask] += 0.2 * np.sin(2 * np.pi * 1.3 * t_bvp[mask])  # Wyższy puls
        bvp[mask] += 0.1 * np.random.randn(np.sum(mask))
    
    bvp += 0.05 * np.random.randn(len(t_bvp))
    bvp = np.clip(bvp, 0, 1)  # Normalizuj do [0, 1]
    
    # EDA - Electrodermal Activity
    # Symuluj bazową aktywność z okresowymi skokami (stres)
    eda = 0.3 + 0.1 * np.sin(2 * np.pi * 0.05 * t_eda)
    
    # Dodaj skoki w okresach stresu
    for start, end in stress_periods:
        mask = (t_eda >= start) & (t_eda <= end)
        # EDA wzrasta podczas stresu
        eda[mask] += 0.3 * np.exp(-(t_eda[mask] - start) / 10)  # Eksponencjalny spadek
        eda[mask] += 0.1 * np.random.randn(np.sum(mask))
    
    eda += 0.05 * np.random.randn(len(t_eda))
    eda = np.clip(eda, 0, 1)
    
    # TEMP - Temperatura
    # Symuluj stabilną temperaturę z małymi wahaniami
    temp = 36.5 + 0.2 * np.sin(2 * np.pi * 0.01 * t_temp)
    
    # Lekki wzrost temperatury podczas stresu
    for start, end in stress_periods:
        mask = (t_temp >= start) & (t_temp <= end)
        temp[mask] += 0.3 * (1 - np.exp(-(t_temp[mask] - start) / 15))
        temp[mask] += 0.1 * np.random.randn(np.sum(mask))
    
    temp += 0.1 * np.random.randn(len(t_temp))
    temp = np.clip(temp, 35.0, 38.0)
    
    return acc, bvp, eda, temp


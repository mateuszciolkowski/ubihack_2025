import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import numpy as np
from collections import Counter

# --- KONFIGURACJA TRENINGU ---
INPUT_FILE = 'final_pytorch_S2.npz'
BATCH_SIZE = 16
NUM_EPOCHS = 30
LEARNING_RATE = 0.001
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
NUM_CLASSES = 4 # 0: Baseline, 1: Stress, 2: Amusement, 3: Meditation

# --- 1. PYTORCH DATASET ---
class WESADDataset(Dataset):
    """Niestandardowy Dataset dla przetworzonych danych WESAD."""
    def __init__(self, npz_file):
        data = np.load(npz_file)
        # X: (próbki, kroki_czasowe, kanały) -> (304, 120, 6)
        # Przekształcamy do (próbki, kanały, kroki_czasowe), co jest standardem dla CNN
        self.X = torch.from_numpy(data['X']).float().permute(0, 2, 1) 
        self.Y = torch.from_numpy(data['Y']).long()
        
    def __len__(self):
        return len(self.Y)

    def __getitem__(self, idx):
        return self.X[idx], self.Y[idx]

# --- 2. IMPLEMENTACJA MODELU CNN-LSTM ---
class CNNLSTMClassifier(nn.Module):
    """Łączona architektura CNN-LSTM dla szeregów czasowych."""
    
    def __init__(self, num_channels, seq_len, num_classes):
        super(CNNLSTMClassifier, self).__init__()
        
        # 1. WARSTWY KONWOLUCYJNE (CNN) - Automatyczna ekstrakcja cech
        # CNN redukuje sekwencję (120) do abstrakcyjnych cech.
        self.cnn_layers = nn.Sequential(
            # Wejście: [Batch, 6 kanałów, 120 kroków]
            nn.Conv1d(num_channels, 32, kernel_size=8, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2, stride=2), # Output: [Batch, 32, 59]
            
            nn.Conv1d(32, 64, kernel_size=4, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2, stride=2) # Output: [Batch, 64, 29]
        )
        
        # Obliczenie rozmiaru wejściowego LSTM
        # Ostatnia długość sekwencji to 29
        lstm_input_size = 64 # Liczba kanałów wyjściowych z CNN
        
        # 2. WARSTWY REKURENCYJNE (LSTM) - Modelowanie zależności czasowych
        self.lstm = nn.LSTM(
            input_size=lstm_input_size, 
            hidden_size=64, 
            num_layers=2, 
            batch_first=True, 
            bidirectional=False
        )
        
        # 3. WARSTWA KLASYFIKACYJNA
        # Wejście: 64 (z ostatniej ukrytej warstwy LSTM)
        self.classifier = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        # 1. Przetwarzanie CNN (konwolucja odbywa się wzdłuż osi czasu)
        x = self.cnn_layers(x)
        
        # 2. Transpozycja do formatu LSTM: [Batch, Długość Sekwencji, Cechy]
        # X ma teraz kształt [Batch, 64 (Features), 29 (Time)]
        x = x.transpose(1, 2) # Nowy kształt: [Batch, 29, 64]
        
        # 3. Przetwarzanie LSTM
        # output zawiera wszystkie ukryte stany, hn to ostatni stan ukryty
        lstm_out, (hn, cn) = self.lstm(x)
        
        # Używamy ostatniego ukrytego stanu z ostatniej warstwy do klasyfikacji
        # hn ma kształt: [num_layers, Batch, hidden_size]
        final_state = hn[-1] # Kształt: [Batch, 64]
        
        # 4. Klasyfikacja
        logits = self.classifier(final_state)
        return logits

# --- 3. FUNKCJA BALANSOWANIA KLAS (Weighted Random Sampler) ---
def create_weighted_sampler(dataset):
    """Tworzy sampler, który równoważy niezbalansowane klasy."""
    
    # 1. Zliczenie wystąpień każdej klasy
    class_counts = Counter(dataset.Y.numpy())
    
    # Etykiety: 0 (Baseline), 1 (Stress), 2 (Amusement), 3 (Meditation)
    print(f"\nRozkład klas przed samplowaniem: {class_counts}")
    
    # 2. Obliczenie wag dla każdej klasy
    # Waga = 1.0 / Liczba wystąpień. Mniejsze klasy dostają większą wagę.
    num_samples = len(dataset)
    class_weights = {cls: num_samples / count for cls, count in class_counts.items()}
    
    # 3. Przypisanie wagi każdemu punktowi danych
    weights = [class_weights[label.item()] for label in dataset.Y]
    
    # 4. Tworzenie samplera
    sampler = WeightedRandomSampler(
        weights=weights,
        num_samples=num_samples, # Ilość próbek w każdej epoce pozostaje taka sama
        replacement=True # Wylosowane z zastąpieniem (umożliwia wielokrotne wylosowanie mniejszej klasy)
    )
    return sampler


# --- 4. FUNKCJA TRENINGOWA ---
def train_model(model, dataloader, criterion, optimizer, num_epochs):
    """Pętla treningowa modelu."""
    model.train()
    
    for epoch in range(num_epochs):
        running_loss = 0.0
        correct_predictions = 0
        total_predictions = 0

        for inputs, labels in dataloader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)

            # Zerowanie gradientów
            optimizer.zero_grad()

            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            # Backward pass i optymalizacja
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            
            # Obliczenie dokładności
            _, predicted = torch.max(outputs.data, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()

        epoch_loss = running_loss / len(dataloader)
        epoch_accuracy = correct_predictions / total_predictions
        
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss:.4f}, Accuracy: {epoch_accuracy:.4f}")
        
    print("Trening zakończony!")

# --- GŁÓWNA FUNKCJA ---
if __name__ == '__main__':
    # 1. Ładowanie i przygotowanie danych
    dataset = WESADDataset(INPUT_FILE)
    
    # Sprawdzenie wymiarów danych
    # Oczekiwany kształt X: [304, 6, 120] (próbki, kanały, kroki_czasowe)
    print(f"Kształt danych X w Pytorch Dataset: {dataset.X.shape}")
    
    # 2. Tworzenie Samplera i DataLoadera (z balansowaniem)
    sampler = create_weighted_sampler(dataset)
    dataloader = DataLoader(
        dataset, 
        batch_size=BATCH_SIZE, 
        sampler=sampler, 
        # shuffle=False - wyłączamy, bo sampler sam miesza
        drop_last=True
    )
    
    # 3. Inicjalizacja Modelu, Funkcji Straty i Optymalizatora
    # Długość sekwencji (120) jest używana w obliczeniach warstw CNN, 
    # ale nie jest przekazywana bezpośrednio do konstruktora, jeśli używamy MaxPool.
    num_channels = dataset.X.shape[1] # 6
    seq_len = dataset.X.shape[2] # 120
    
    model = CNNLSTMClassifier(
        num_channels=num_channels,
        seq_len=seq_len,
        num_classes=NUM_CLASSES
    ).to(DEVICE)
    
    # Funkcja straty dla klasyfikacji wieloklasowej
    criterion = nn.CrossEntropyLoss() 
    # Optymalizator Adam jest dobrym wyborem startowym
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # 4. Trening
    print("\n--- ROZPOCZĘCIE TRENINGU ---")
    train_model(model, dataloader, criterion, optimizer, NUM_EPOCHS)
    
    # Zapis modelu
    torch.save(model.state_dict(), 'stress_classifier_S2.pth')
    print("Model zapisany jako 'stress_classifier_S2.pth'")
import os
import django
from datetime import date, timedelta
from django.utils import timezone
import random
from openai import OpenAI
from faker import Faker
from dotenv import load_dotenv
load_dotenv()


# --- WAŻNE: Ustawienie środowiska Django ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
django.setup()

# --- Import Twoich Modeli ---
from patient_management.models import Patient, Visit # Zmień na faktyczną nazwę Twojej aplikacji!

# Konfiguracja Faker
fake = Faker('pl_PL')

# Stałe definiujące ilość danych
NUM_PATIENTS = 5
MIN_VISITS = 2
MAX_VISITS = 3
MIN_STRESS_ENTRIES = 15
MAX_STRESS_ENTRIES = 40
# Nowa stała: interwał między pomiarami
TIME_INTERVAL = timedelta(seconds=10) 

def generate_stress_history(visit_date):
    """Generuje losową tablicę historii stresu z wpisami co 10 sekund."""
    history = []
    num_entries = random.randint(MIN_STRESS_ENTRIES, MAX_STRESS_ENTRIES)
    
    # 1. Obliczamy całkowity czas trwania historii na podstawie liczby wpisów i interwału
    total_duration = (num_entries - 1) * TIME_INTERVAL
    
    # 2. Ustawiamy czas startowy (najstarszy wpis)
    # Zapewniamy, że czas startowy jest nie wcześniej niż 7 dni przed wizytą
    max_start_offset = timedelta(days=7)
    
    # Losowy offset od 0 do 7 dni
    random_days_offset = timedelta(days=random.uniform(0, 7))
    
    # Czas startowy: data wizyty minus cały czas trwania historii i minus losowy offset
    start_time = visit_date - total_duration - random_days_offset 
    
    
    # 3. Iteracyjne dodawanie wpisów co 10 sekund
    current_time = start_time
    for _ in range(num_entries):
        
        # Tworzenie wpisu
        history.append({
            "timestamp": current_time.isoformat(),
            "stress_level": random.randint(1, 10)  # Poziom stresu 1-10
        })
        
        # Inkrementacja czasu o 10 sekund
        current_time += TIME_INTERVAL
    
    # Sortowanie nie jest już konieczne, ponieważ czas jest inkrementowany w porządku
    return history

def generate_openai_text(prompt, max_tokens=300):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Jesteś psychologiem analizującym dane o poziomie stresu pacjenta."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Błąd OpenAI: {e}")
        return "Opis wygenerowany automatycznie."

def create_prompts_from_stress_data(stress_data):
    levels = [entry["stress_level"] for entry in stress_data]
    timestamps = [entry["timestamp"] for entry in stress_data]

    avg = sum(levels) / len(levels)
    max_level = max(levels)
    min_level = min(levels)
    spikes = sum(1 for i in range(1, len(levels)) if levels[i] - levels[i-1] >= 4)

    summary_prompt = (
        f"Na podstawie danych o poziomie stresu pacjenta:\n"
        f"- Średni poziom stresu: {avg:.1f}\n"
        f"- Maksymalny poziom: {max_level}\n"
        f"- Minimalny poziom: {min_level}\n"
        f"- Liczba gwałtownych skoków stresu: {spikes}\n"
        f"Stwórz krótkie podsumowanie sesji w 2-3 zdaniach."
    )

    notes_prompt = (
        f"Analizujesz dane stresu pacjenta z sesji terapeutycznej. Dane obejmują {len(levels)} pomiarów "
        f"od {timestamps[0]} do {timestamps[-1]} z poziomami stresu od {min_level} do {max_level}, "
        f"średnia wynosi {avg:.1f}, a liczba skoków stresu to {spikes}. "
        f"Napisz notatkę psychologiczną (4-5 zdań) opisującą możliwe przyczyny, obserwacje i zalecenia."
    )

    return summary_prompt, notes_prompt


def run_seed():
    """Główna funkcja do dodawania losowych danych."""
    print(f"--- Rozpoczynam dodawanie {NUM_PATIENTS} pacjentów z {MIN_VISITS}-{MAX_VISITS} wizytami ---")
    
    # Opcjonalnie: usuń stare dane przed startem
    Patient.objects.all().delete() 
    Visit.objects.all().delete() 

    for i in range(NUM_PATIENTS):
        # 1. Tworzenie losowego pacjenta
        gender_choice = random.choice(['M', 'F'])
        first_name = fake.first_name_male() if gender_choice == 'M' else fake.first_name_female()
        
        # Tworzymy unikalny PESEL
        pesel_base = str(random.randint(40, 99)) + str(random.randint(10, 12)) + str(random.randint(10, 31))
        # Zapewnienie, że PESEL ma 11 cyfr
        pesel = pesel_base + str(random.randint(1000, 99999)).zfill(5)
        
        try:
            patient = Patient.objects.create(
                first_name=first_name,
                last_name=fake.last_name(),
                dob=fake.date_of_birth(minimum_age=18, maximum_age=85),
                gender=gender_choice,
                # Faker.unique.numerify('###########') byłby bezpieczniejszy dla unikalności
                pesel=pesel,
                notes=fake.paragraph(nb_sentences=2, variable_nb_sentences=True)
            )
            print(f"✅ Utworzono Pacjenta {i+1}/{NUM_PATIENTS}: {patient.first_name} {patient.last_name}")
            
        except Exception as e:
            print(f"❌ Błąd przy tworzeniu pacjenta: {e}")
            continue

        # 2. Tworzenie wizyt dla pacjenta
        num_visits = random.randint(MIN_VISITS, MAX_VISITS)
        
        for v in range(num_visits):
            # Ustawienie daty wizyty na losowy dzień z ostatnich 365 dni
            visit_date = timezone.now() - timedelta(days=random.randint(1, 365), hours=random.randint(0, 23))
            
            # Generowanie struktury dla pola JSONField z dużą ilością danych co 10 sekund
            stress_data = generate_stress_history(visit_date)
            
            try:
                
                summary_prompt, notes_prompt = create_prompts_from_stress_data(stress_data)

                Visit.objects.create(
                    patient=patient,
                    visit_date=visit_date,
                    stress_history=stress_data,
                    psychologist_notes=generate_openai_text(notes_prompt),
                    ai_summary=generate_openai_text(summary_prompt, max_tokens=150)
                )

                print(f"   -> Dodano wizytę {v+1}/{num_visits} z {len(stress_data)} wpisami stresu (co 10s).")
            
            except Exception as e:
                print(f"   ❌ Błąd przy tworzeniu wizyty: {e}")

    print("\n*** Pomyślnie zakończono dodawanie danych! ***")


if __name__ == '__main__':
    run_seed()
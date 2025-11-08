import os
import django
from datetime import date, timedelta
from django.utils import timezone
import random
from openai import OpenAI
from faker import Faker
from dotenv import load_dotenv
load_dotenv()

# --- Ustawienie środowiska Django ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

# --- OpenAI klient ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Import modeli ---
from patient_management.models import Patient, Visit

# --- Konfiguracja Faker ---
fake = Faker('pl_PL')

# --- Stałe ---
NUM_PATIENTS = 5
MIN_VISITS = 2
MAX_VISITS = 3
MIN_STRESS_ENTRIES = 15
MAX_STRESS_ENTRIES = 40
TIME_INTERVAL = timedelta(seconds=10)

# --- Generowanie historii stresu ---
def generate_stress_history(visit_date):
    history = []
    num_entries = random.randint(MIN_STRESS_ENTRIES, MAX_STRESS_ENTRIES)
    total_duration = (num_entries - 1) * TIME_INTERVAL
    random_days_offset = timedelta(days=random.uniform(0, 7))
    start_time = visit_date - total_duration - random_days_offset
    current_time = start_time

    for _ in range(num_entries):
        history.append({
            "timestamp": current_time.isoformat(),
            "stress_level": random.randint(1, 4)
        })
        current_time += TIME_INTERVAL

    return history

# --- Prompt na podstawie danych pacjenta ---
def generate_patient_notes_prompt(first_name, last_name, dob, gender, pesel):
    age = (date.today() - dob).days // 365
    gender_text = "mężczyzną" if gender == "M" else "kobietą"

    prompt = (
        f"Jesteś psychologiem prowadzącym dokumentację pacjenta. Pacjent nazywa się {first_name} {last_name}, "
        f"jest {gender_text} w wieku {age} lat (urodzony/a {dob}), PESEL: {pesel}. "
        f"Napisz krótką notatkę psychologiczną (4-5 zdań), która może pojawić się w dokumentacji po pierwszym spotkaniu. "
        f"Uwzględnij ogólne wrażenie, styl komunikacji, ewentualne trudności adaptacyjne lub emocjonalne, oraz zalecenia do dalszej pracy."
    )
    return prompt

# --- Prompt na podstawie danych stresu ---
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

# --- Wywołanie OpenAI ---
def generate_openai_text(prompt, max_tokens=300):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Jesteś psychologiem analizującym dane pacjenta."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Błąd OpenAI: {e}")
        return "Opis wygenerowany automatycznie."

# --- Główna funkcja seedująca ---
def run_seed():
    print(f"--- Rozpoczynam dodawanie {NUM_PATIENTS} pacjentów z {MIN_VISITS}-{MAX_VISITS} wizytami ---")
    Patient.objects.all().delete()
    Visit.objects.all().delete()

    for i in range(NUM_PATIENTS):
        gender_choice = random.choice(['M', 'F'])
        first_name = fake.first_name_male() if gender_choice == 'M' else fake.first_name_female()
        last_name = fake.last_name()
        dob = fake.date_of_birth(minimum_age=18, maximum_age=85)
        pesel_base = str(random.randint(40, 99)) + str(random.randint(10, 12)) + str(random.randint(10, 31))
        pesel = pesel_base + str(random.randint(1000, 99999)).zfill(5)

        notes_prompt = generate_patient_notes_prompt(first_name, last_name, dob, gender_choice, pesel)

        try:
            patient = Patient.objects.create(
                first_name=first_name,
                last_name=last_name,
                dob=dob,
                gender=gender_choice,
                pesel=pesel,
                notes=generate_openai_text(notes_prompt)
            )
            print(f"✅ Utworzono Pacjenta {i+1}/{NUM_PATIENTS}: {patient.first_name} {patient.last_name}")
        except Exception as e:
            print(f"❌ Błąd przy tworzeniu pacjenta: {e}")
            continue

        num_visits = random.randint(MIN_VISITS, MAX_VISITS)
        for v in range(num_visits):
            visit_date = timezone.now() - timedelta(days=random.randint(1, 365), hours=random.randint(0, 23))
            stress_data = generate_stress_history(visit_date)
            summary_prompt, notes_prompt = create_prompts_from_stress_data(stress_data)

            try:
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

"""
Serwisy do symulacji sesji i analizy AI
"""
import os
from typing import List, Dict, Any, Tuple
from openai import OpenAI
import numpy as np
from stress_classification.data_simulator import generate_simulated_data
from stress_classification.views import get_stress_service


def create_session_simulation(
    duration_sec: int = 300
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Generuje symulowane dane sesji używając generate_simulated_data i klasyfikacji stresu.
    
    Args:
        duration_sec: Długość symulacji w sekundach (domyślnie 300)
    
    Returns:
        Tuple zawierający:
        - timeline_data: Lista słowników reprezentujących punkty czasowe
        - metadata: Słownik z metadanymi (step_size, total_duration_seconds, procenty stanów)
    """
    # Generuj symulowane dane biometryczne
    acc, bvp, eda, temp = generate_simulated_data(duration_sec=duration_sec)
    
    # Użyj serwisu klasyfikacji stresu do analizy danych
    stress_service = get_stress_service()
    classification_result = stress_service.classify(acc, bvp, eda, temp)
    
    # Przetwórz wyniki klasyfikacji na format timeline_data
    timeline = []
    segments = classification_result.get('segments', [])
    
    # Mapowanie klas na nazwy
    class_names = ['Baseline', 'Stress', 'Amusement', 'Meditation']
    
    # Pobierz step_size z metadanych klasyfikacji
    metadata_classification = classification_result.get('metadata', {})
    step_size = metadata_classification.get('step_size_seconds', 10.0)  # Domyślnie 10.0 (STEP_SEC)
    
    # Przetwórz segmenty na timeline
    for segment in segments:
        timestamp = segment.get('time_seconds', 0)  # Użyj time_seconds z segmentu
        class_id = segment.get('class_id', 0)  # Użyj class_id zamiast predicted_class
        feeling = class_names[class_id] if class_id < len(class_names) else 'Baseline'
        
        # Użyj stress_level z segmentu jeśli dostępny, w przeciwnym razie oblicz
        stress_level = segment.get('stress_level', 2)
        if stress_level == 0:
            # Mapuj stress_level na skalę 1-10
            if feeling == 'Baseline':
                stress_level = 2
            elif feeling == 'Stress':
                stress_level = 8
            elif feeling == 'Amusement':
                stress_level = 1
            elif feeling == 'Meditation':
                stress_level = 1
            else:
                stress_level = 2
        
        timeline.append({
            "timestamp_seconds": int(timestamp),
            "stress_level": stress_level,
            "feeling": feeling
        })
    
    # Oblicz procenty stanów na podstawie rzeczywistych danych
    total_points = len(timeline)
    if total_points == 0:
        baseline_percentage = 100.0
        stress_percentage = 0.0
        amusement_percentage = 0.0
        meditation_percentage = 0.0
    else:
        baseline_count = sum(1 for point in timeline if point['feeling'] == 'Baseline')
        stress_count = sum(1 for point in timeline if point['feeling'] == 'Stress')
        amusement_count = sum(1 for point in timeline if point['feeling'] == 'Amusement')
        meditation_count = sum(1 for point in timeline if point['feeling'] == 'Meditation')
        
        baseline_percentage = (baseline_count / total_points) * 100.0
        stress_percentage = (stress_count / total_points) * 100.0
        amusement_percentage = (amusement_count / total_points) * 100.0
        meditation_percentage = (meditation_count / total_points) * 100.0
    
    # Przygotuj metadata
    metadata = {
        'step_size': step_size,
        'total_duration_seconds': duration_sec,
        'baseline_percentage': baseline_percentage,
        'stress_percentage': stress_percentage,
        'amusement_percentage': amusement_percentage,
        'meditation_percentage': meditation_percentage
    }
    
    return timeline, metadata


def analyze_long_term_progress(visits_data: List[Dict[str, Any]]) -> str:
    """
    Analizuje długoterminowe postępy pacjenta na podstawie wszystkich wizyt i sesji.
    
    Args:
        visits_data: Lista słowników zawierających dane wszystkich wizyt pacjenta wraz z sesjami
    
    Returns:
        Długoterminowa analiza postępów i wnioski dla terapii
    """
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY nie jest ustawiony w zmiennych środowiskowych")
    
    client = OpenAI(api_key=api_key)
    
    # Przygotuj dane do analizy długoterminowej
    visits_summary = []
    total_sessions = 0

    for visit_idx, visit in enumerate(visits_data, 1):
        # Jeśli w wizycie są sesje (stare podejście), agreguj je
        visit_sessions = visit.get('sessions') or []

        if visit_sessions:
            visit_stats = {
                'stress_levels': [],
                'stress_percentage': 0,
                'meditation_percentage': 0,
                'amusement_percentage': 0
            }

            for session in visit_sessions:
                timeline = session.get('timeline_data', [])
                stress_levels = [point.get('stress_level', 0) for point in timeline]
                visit_stats['stress_levels'].extend(stress_levels)
                visit_stats['stress_percentage'] += session.get('stress_percentage', 0)
                visit_stats['meditation_percentage'] += session.get('meditation_percentage', 0)
                visit_stats['amusement_percentage'] += session.get('amusement_percentage', 0)

            num_sessions = len(visit_sessions)
            avg_stress = sum(visit_stats['stress_levels']) / len(visit_stats['stress_levels']) if visit_stats['stress_levels'] else 0
            visit_stats['stress_percentage'] /= num_sessions
            visit_stats['meditation_percentage'] /= num_sessions
            visit_stats['amusement_percentage'] /= num_sessions

        else:
            # Nowe podejście: wizyta zawiera bezpośrednio timeline_data i procenty
            timeline = visit.get('timeline_data') or visit.get('stress_history') or []
            stress_levels = [point.get('stress_level', 0) for point in timeline] if isinstance(timeline, list) else []
            avg_stress = sum(stress_levels) / len(stress_levels) if stress_levels else 0
            num_sessions = 1 if timeline else 0

            visit_stats = {
                'stress_percentage': visit.get('stress_percentage', 0) or 0,
                'meditation_percentage': visit.get('meditation_percentage', 0) or 0,
                'amusement_percentage': visit.get('amusement_percentage', 0) or 0
            }

        visits_summary.append({
            'visit_number': visit_idx,
            'date': visit.get('date') or visit.get('visit_date'),
            'avg_stress': avg_stress,
            'stress_percentage': visit_stats.get('stress_percentage', 0),
            'meditation_percentage': visit_stats.get('meditation_percentage', 0),
            'amusement_percentage': visit_stats.get('amusement_percentage', 0),
            'psychologist_notes': visit.get('psychologist_notes', ''),
            'ai_summary': visit.get('ai_summary') or visit.get('ai_summary_story', ''),
            'num_sessions': num_sessions
        })

        total_sessions += num_sessions

    # Przygotuj prompt dla długoterminowej analizy
    long_term_prompt = f"""Jako doświadczony psycholog, przeanalizuj postępy pacjenta na podstawie {len(visits_summary)} wizyt (łącznie {total_sessions} sesji terapeutycznych).

Historia wizyt:
{chr(10).join([f'Wizyta {v["visit_number"]} ({v["date"]}):' + 
               f' Liczba sesji: {v["num_sessions"]},' +
               f' Średni stres: {v["avg_stress"]:.1f}/10,' +
               f' Stres: {v["stress_percentage"]:.1f}%,' +
               f' Medytacja: {v["meditation_percentage"]:.1f}%,' +
               f' Rozrywka: {v["amusement_percentage"]:.1f}%' +
               (f'\\nNotatki psychologa: {v["psychologist_notes"]}' if v["psychologist_notes"] else '') +
               (f'\\nPodsumowanie AI: {v["ai_summary"]}' if v["ai_summary"] else '')
               for v in visits_summary])}

Stwórz kompleksową analizę długoterminową w języku polskim, która zawiera:
1. Ogólny trend w radzeniu sobie ze stresem
2. Wzorce reakcji na różne sytuacje stresowe
3. Skuteczność stosowanych technik relaksacyjnych
4. Konkretne rekomendacje do dalszej terapii
5. Obszary wymagające szczególnej uwagi
6. Zaobserwowane postępy i sukcesy

Odpowiedź powinna być szczegółowa i profesjonalna, skupiając się na długoterminowych wzorcach i rekomendacjach."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",  # Używamy GPT-4 dla lepszej analizy długoterminowej
            messages=[
                {"role": "system", "content": "Jesteś doświadczonym psychologiem specjalizującym się w długoterminowej terapii i analizie postępów pacjentów. Twoje analizy są szczegółowe, profesjonalne i ukierunkowane na praktyczne rekomendacje."},
                {"role": "user", "content": long_term_prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        raise Exception(f"Błąd podczas generowania długoterminowej analizy AI: {str(e)}")


def ai_analysis_service(session_data: Dict[str, Any]) -> str:
    """
    Generuje narracyjne podsumowanie sesji używając OpenAI.
    
    Args:
        session_data: Słownik zawierający dane sesji:
            - timeline_data: Lista punktów czasowych
            - total_duration_seconds: Całkowity czas trwania
            - baseline_percentage: Procent Baseline
            - stress_percentage: Procent Stress
            - amusement_percentage: Procent Amusement
            - meditation_percentage: Procent Meditation
    
    Returns:
        Wygenerowana historia/podsumowanie sesji
    """
    # Pobierz klucz API z zmiennych środowiskowych
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY nie jest ustawiony w zmiennych środowiskowych")
    
    client = OpenAI(api_key=api_key)
    
    # Przygotuj dane do analizy
    timeline = session_data.get('timeline_data', [])
    total_duration = session_data.get('total_duration_seconds', 0)
    
    # Oblicz statystyki z timeline
    stress_levels = [point.get('stress_level', 0) for point in timeline]
    feelings_distribution = {}
    for point in timeline:
        feeling = point.get('feeling', 'Baseline')
        feelings_distribution[feeling] = feelings_distribution.get(feeling, 0) + 1
    
    avg_stress = sum(stress_levels) / len(stress_levels) if stress_levels else 0
    max_stress = max(stress_levels) if stress_levels else 0
    min_stress = min(stress_levels) if stress_levels else 0
    
    # Znajdź okresy wysokiego stresu
    high_stress_periods = []
    for i, point in enumerate(timeline):
        if point.get('stress_level', 0) >= 7:
            high_stress_periods.append({
                'time': point.get('timestamp_seconds', 0),
                'level': point.get('stress_level', 0),
                'feeling': point.get('feeling', 'Unknown')
            })
    
    # Przygotuj prompt dla OpenAI
    prompt = f"""Jako psycholog, przeanalizuj następujące dane z sesji terapeutycznej i stwórz narracyjne podsumowanie:

Czas trwania sesji: {total_duration} sekund ({total_duration/60:.1f} minut)

Rozkład stanów emocjonalnych:
- Baseline: {session_data.get('baseline_percentage', 0):.1f}%
- Stress: {session_data.get('stress_percentage', 0):.1f}%
- Amusement: {session_data.get('amusement_percentage', 0):.1f}%
- Meditation: {session_data.get('meditation_percentage', 0):.1f}%

Statystyki poziomu stresu:
- Średni poziom: {avg_stress:.1f}/10
- Maksymalny poziom: {max_stress}/10
- Minimalny poziom: {min_stress}/10

Liczba punktów pomiarowych: {len(timeline)}

Stwórz profesjonalne, narracyjne podsumowanie sesji w języku polskim, które:
1. Opisuje ogólny przebieg sesji
2. Wskazuje kluczowe momenty (szczególnie okresy wysokiego stresu)
3. Interpretuje zmiany stanów emocjonalnych
4. Zawiera wnioski i obserwacje

Odpowiedź powinna być napisana w formie ciągłej narracji, jak notatka psychologa po sesji."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Można zmienić na gpt-4 dla lepszej jakości
            messages=[
                {"role": "system", "content": "Jesteś doświadczonym psychologiem analizującym dane z sesji terapeutycznej. Twoje podsumowania są profesjonalne, empatyczne i pomocne."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        raise Exception(f"Błąd podczas generowania analizy AI: {str(e)}")


from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Visit
from .services import analyze_long_term_progress, ai_analysis_service


@receiver(post_save, sender=Visit)
def update_patient_long_term_analysis(sender, instance, created, **kwargs):
    """
    Signal handler do aktualizacji długoterminowej analizy pacjenta po dodaniu lub aktualizacji wizyty.
    - Generuje analizę AI dla samej wizyty, jeśli wizyta ma timeline/metricę
    - Zbiera wszystkie wizyty pacjenta (używając albo visit-level data, albo sesji powiązanych)
    - Generuje/aktualizuje long_term_summary w modelu Patient
    """
    patient = instance.patient
    if not patient:
        return

    # Jeśli wizyta zawiera dane timeline (nowe podejście), wygeneruj dla niej analizę AI
    try:
        if instance.timeline_data or instance.stress_history:
            # Przygotuj dane sesji do analizy
            session_data = {
                'timeline_data': instance.timeline_data or instance.stress_history or [],
                'total_duration_seconds': instance.total_duration_seconds or 0,
                'baseline_percentage': instance.baseline_percentage or 0,
                'stress_percentage': instance.stress_percentage or 0,
                'amusement_percentage': instance.amusement_percentage or 0,
                'meditation_percentage': instance.meditation_percentage or 0
            }

            ai_summary = ai_analysis_service(session_data)
            # Zapisz narracyjne podsumowanie dla wizyty
            instance.ai_summary_story = ai_summary
            # zachowaj też w polu ai_summary dla kompatybilności
            instance.ai_summary = ai_summary
            instance.save(update_fields=['ai_summary_story', 'ai_summary'])
    except Exception as e:
        # Nie przerywamy procesu na błędach AI; logujemy i kontynuujemy
        print(f"Błąd podczas generowania analizy AI dla wizyty: {str(e)}")

    # Zebranie wszystkich wizyt pacjenta
    visits = Visit.objects.filter(patient=patient).order_by('visit_date')
    visits_data = []

    for visit in visits:
        # Jeśli wizyta ma bezpośrednio timeline (nowe podejście), użyj go
        if getattr(visit, 'timeline_data', None) or getattr(visit, 'stress_history', None):
            visits_data.append({
                'date': visit.visit_date,
                'psychologist_notes': visit.psychologist_notes,
                'ai_summary': visit.ai_summary or visit.ai_summary_story or '',
                'timeline_data': visit.timeline_data or visit.stress_history,
                'stress_percentage': visit.stress_percentage,
                'meditation_percentage': visit.meditation_percentage,
                'amusement_percentage': visit.amusement_percentage,
            })
        else:
            # Jeśli wizyta nie posiada danych timeline, pomiń ją w analizie długoterminowej
            continue

    # Wykonaj analizę długoterminową i zapisz wynik w modelu Patient
    try:
        long_term_analysis = analyze_long_term_progress(visits_data)
        patient.long_term_summary = long_term_analysis
        patient.save(update_fields=['long_term_summary'])
    except Exception as e:
        print(f"Błąd podczas generowania długoterminowej analizy pacjenta: {str(e)}")
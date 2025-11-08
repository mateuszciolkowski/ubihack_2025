from django.db import models
from django.conf import settings

class Patient(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    gender = models.CharField(max_length=10)
    pesel = models.CharField(max_length=11, unique=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Visit(models.Model):
    patient = models.ForeignKey(Patient, related_name='visits', on_delete=models.CASCADE)
    visit_date = models.DateTimeField()
    stress_history = models.JSONField(blank=True, null=True)
    psychologist_notes = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)


class Session(models.Model):
    """Model przechowujący dane sesji z symulacji i analizy"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sessions', on_delete=models.CASCADE)
    visit = models.ForeignKey(Visit, related_name='sessions', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Parametry symulacji
    step_size = models.FloatField(blank=True, null=True, help_text="Interwał czasowy między kolejnymi punktami pomiarowymi (w sekundach)")
    total_duration_seconds = models.IntegerField(blank=True, null=True, help_text="Całkowity czas trwania sesji (w sekundach)")
    
    # Procentowe rozkłady stanów emocjonalnych
    baseline_percentage = models.FloatField(blank=True, null=True, help_text="Procent czasu przypisany do stanu Baseline (0.0-100.0)")
    stress_percentage = models.FloatField(blank=True, null=True, help_text="Procent czasu przypisany do stanu Stress (0.0-100.0)")
    amusement_percentage = models.FloatField(blank=True, null=True, help_text="Procent czasu przypisany do stanu Amusement (0.0-100.0)")
    meditation_percentage = models.FloatField(blank=True, null=True, help_text="Procent czasu przypisany do stanu Meditation (0.0-100.0)")
    
    # Dane symulacji
    timeline_data = models.JSONField(blank=True, null=True, help_text="Lista punktów czasowych tworzących oś czasu sesji")
    
    # Analiza AI
    ai_summary_story = models.TextField(blank=True, null=True, help_text="Historia wygenerowana przez model AI podsumowująca sesję")
    
    class Meta:
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Session {self.id} - {self.total_duration_seconds}s"
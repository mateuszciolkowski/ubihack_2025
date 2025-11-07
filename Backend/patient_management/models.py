from django.db import models

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


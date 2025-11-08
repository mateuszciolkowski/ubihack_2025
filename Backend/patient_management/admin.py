from django.contrib import admin
from .models import Patient, Visit


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'pesel', 'dob', 'gender']
    search_fields = ['first_name', 'last_name', 'pesel']


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['patient', 'visit_date', 'id']
    list_filter = ['visit_date']
    search_fields = ['patient__first_name', 'patient__last_name']


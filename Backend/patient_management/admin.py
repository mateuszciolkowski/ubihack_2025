from django.contrib import admin
from .models import Patient, Visit, Session


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'pesel', 'dob', 'gender']
    search_fields = ['first_name', 'last_name', 'pesel']


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['patient', 'visit_date', 'id']
    list_filter = ['visit_date']
    search_fields = ['patient__first_name', 'patient__last_name']


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'visit', 'total_duration_seconds', 'step_size', 'created_at']
    list_filter = ['created_at', 'visit', 'user']
    search_fields = ['id', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']

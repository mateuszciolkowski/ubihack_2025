from rest_framework import serializers
from .models import Patient, Visit


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = '__all__'


class PatientSerializer(serializers.ModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'dob', 'gender', 'pesel', 'notes', 'long_term_summary', 'visits']


class VisitSimulationInputSerializer(serializers.Serializer):
    """Serializer dla danych wejściowych do symulacji tworzącej wizytę"""
    duration_sec = serializers.IntegerField(min_value=1, required=False, default=300, help_text="Długość symulacji w sekundach (domyślnie 300)")
    # opcjonalnie można podać datę wizyty w ISO lub zostanie użyta teraz
    visit_date = serializers.DateTimeField(required=False, allow_null=True)

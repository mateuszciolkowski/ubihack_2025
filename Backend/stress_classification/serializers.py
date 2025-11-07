from rest_framework import serializers
from datetime import datetime


class StressClassificationRequestSerializer(serializers.Serializer):
    """Serializer dla żądania klasyfikacji stresu."""
    
    # Opcjonalne - jeśli nie podano, użyjemy symulowanych danych
    acc = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField(), min_length=3, max_length=3),
        required=False,
        help_text="Dane akcelerometru (ACC) - lista list [x, y, z]"
    )
    bvp = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="Dane BVP (Blood Volume Pulse)"
    )
    eda = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="Dane EDA (Electrodermal Activity)"
    )
    temp = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="Dane temperatury"
    )
    start_timestamp = serializers.DateTimeField(
        required=False,
        help_text="Timestamp początku nagrania (ISO format). Jeśli nie podano, używa aktualnego czasu."
    )
    use_simulation = serializers.BooleanField(
        default=True,
        required=False,
        help_text="Czy użyć symulowanych danych (domyślnie True)"
    )


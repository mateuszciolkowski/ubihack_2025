#!/bin/bash
set -e
# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h db_hackathon -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB; do
    sleep 1
done
echo "PostgreSQL started"

# Run migrations
echo "Running migrations..."
# python manage.py makemigrations
# python manage.py migrate

python manage.py migrate security --noinput
python manage.py migrate patient_management --noinput
python manage.py migrate --noinput

# Start server
echo "Starting server..."
exec gunicorn api.wsgi:application -b 0.0.0.0:6543
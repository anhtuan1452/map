#!/bin/bash
set -e

# Create database directory if it doesn't exist
mkdir -p /app/db

echo "Running migrations..."
python manage.py migrate --noinput --skip-checks

echo "Starting server..."
# Execute the CMD from docker-compose or Dockerfile
exec "$@"

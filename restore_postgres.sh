#!/bin/bash

# Restore PostgreSQL database
if [ -z "$1" ]; then
    echo "Usage: ./restore_postgres.sh <backup_file.sql> or <backup_file.sql.gz>"
    echo "Example: ./restore_postgres.sh backup_postgres_20250110_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ File not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will DROP and recreate the database!"
read -p "Are you sure? Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo "🔄 Restoring database from: $BACKUP_FILE"

# Check if file is gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Decompressing..."
    gunzip -c $BACKUP_FILE | docker-compose -f docker-compose.production.yml exec -T db psql -U ${POSTGRES_USER:-heritage_user} ${POSTGRES_DB:-heritage_db}
else
    cat $BACKUP_FILE | docker-compose -f docker-compose.production.yml exec -T db psql -U ${POSTGRES_USER:-heritage_user} ${POSTGRES_DB:-heritage_db}
fi

echo "♻️  Restarting API container..."
docker-compose -f docker-compose.production.yml restart api

echo "✅ Database restored successfully!"

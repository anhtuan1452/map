#!/bin/bash

# Restore database script
if [ -z "$1" ]; then
    echo "Usage: ./restore_db.sh <backup_file.sqlite3>"
    echo "Example: ./restore_db.sh backup_db_20250110_120000.sqlite3"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ File not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo "🔄 Restoring database from: $BACKUP_FILE"
docker-compose exec -T api sh -c "cat > /app/db/db.sqlite3" < $BACKUP_FILE

echo "♻️  Restarting API container..."
docker-compose restart api

echo "✅ Database restored successfully!"

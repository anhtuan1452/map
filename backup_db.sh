#!/bin/bash

# Backup database script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_db_${DATE}.sqlite3"

echo "📦 Backing up database..."
docker-compose exec -T api cat /app/db/db.sqlite3 > $BACKUP_FILE

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup saved to: $BACKUP_FILE"
    echo "📊 Size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

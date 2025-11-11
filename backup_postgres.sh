#!/bin/bash

# Backup PostgreSQL database
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_postgres_${DATE}.sql"

echo "📦 Backing up PostgreSQL database..."
docker-compose -f docker-compose.production.yml exec -T db pg_dump -U ${POSTGRES_USER:-heritage_user} ${POSTGRES_DB:-heritage_db} > $BACKUP_FILE

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup saved to: $BACKUP_FILE"
    echo "📊 Size: $(du -h $BACKUP_FILE | cut -f1)"
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "🗜️  Compressed to: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

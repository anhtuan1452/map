#!/bin/bash

# Backup PostgreSQL database
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_postgres_${DATE}"

echo "📦 Backing up PostgreSQL database..."
docker-compose -f docker-compose.production.yml exec -T db pg_basebackup -D /tmp/$BACKUP_DIR -P

# Copy backup directory from container to host
CONTAINER_ID=$(docker-compose -f docker-compose.production.yml ps -q db)
docker cp $CONTAINER_ID:/tmp/$BACKUP_DIR ./$BACKUP_DIR

if [ -d "$BACKUP_DIR" ]; then
    echo "✅ Backup saved to: $BACKUP_DIR"
    echo "📊 Size: $(du -sh $BACKUP_DIR | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

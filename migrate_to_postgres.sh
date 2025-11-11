#!/bin/bash

# Migrate from SQLite (api_db volume) to PostgreSQL
echo "================================================"
echo "   SQLITE → POSTGRESQL MIGRATION TOOL"
echo "================================================"
echo ""
echo "⚠️  WARNING: This will migrate ~60 users from SQLite to PostgreSQL"
echo "📁 Source: Docker volume 'api_db' (/app/db/db.sqlite3)"
echo "🎯 Target: PostgreSQL service 'db' (heritage_db database)"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

# 1. Make sure we're using SQLite first
echo ""
echo "📝 Step 1: Ensuring SQLite is active..."
sed -i.bak "s/^USE_POSTGRES=.*/USE_POSTGRES=False/" .env
rm .env.bak 2>/dev/null
docker-compose restart api
sleep 3

# 2. Export data from SQLite (api_db volume)
echo "📤 Step 2: Exporting data from SQLite (api_db volume)..."
docker-compose exec -T api python manage.py dumpdata \
  --natural-foreign --natural-primary \
  -e contenttypes -e auth.Permission \
  --indent 2 > data_export_$(date +%Y%m%d_%H%M%S).json

EXPORT_FILE=$(ls -t data_export_*.json | head -n1)

if [ ! -f "$EXPORT_FILE" ]; then
    echo "❌ Export failed!"
    exit 1
fi

echo "✅ Exported to $EXPORT_FILE ($(wc -l < "$EXPORT_FILE") lines)"

# 3. Count users in export
USER_COUNT=$(grep -o '"model": "auth.user"' "$EXPORT_FILE" | wc -l)
echo "� Found $USER_COUNT users in export"

# 4. Switch to PostgreSQL
echo ""
echo "🔄 Step 3: Switching to PostgreSQL..."
sed -i.bak "s/^USE_POSTGRES=.*/USE_POSTGRES=True/" .env
rm .env.bak 2>/dev/null

# 5. Start PostgreSQL
echo "🐘 Step 4: Starting PostgreSQL service..."
docker-compose up -d db
sleep 5

# 6. Restart API with PostgreSQL
echo "� Step 5: Restarting API with PostgreSQL..."
docker-compose restart api
sleep 3

# 7. Run migrations on PostgreSQL
echo "🗄️  Step 6: Running migrations on PostgreSQL..."
docker-compose exec api python manage.py migrate

# 8. Import data
echo ""
echo "📥 Step 7: Importing data to PostgreSQL..."
echo "⏳ This may take a few minutes for $USER_COUNT users..."
docker-compose exec -T api python manage.py loaddata "$EXPORT_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✅ MIGRATION SUCCESSFUL!"
    echo "================================================"
    echo "📊 Stats:"
    echo "  - Users migrated: $USER_COUNT"
    echo "  - Export file: $EXPORT_FILE"
    echo "  - Database: PostgreSQL (heritage_db)"
    echo ""
    echo "🗑️  Cleanup options:"
    echo "  1. Keep SQLite backup: Leave api_db volume"
    echo "  2. Delete export: rm $EXPORT_FILE"
    echo ""
    echo "🔍 Verify migration:"
    echo "  docker-compose exec api python manage.py shell"
    echo "  >>> from django.contrib.auth.models import User"
    echo "  >>> User.objects.count()"
    echo ""
else
    echo ""
    echo "================================================"
    echo "❌ MIGRATION FAILED!"
    echo "================================================"
    echo "🔙 Rolling back to SQLite..."
    sed -i.bak "s/^USE_POSTGRES=.*/USE_POSTGRES=False/" .env
    rm .env.bak 2>/dev/null
    docker-compose restart api
    echo "✅ Rolled back to SQLite"
    echo "📁 Your data is safe in:"
    echo "  - Docker volume: api_db"
    echo "  - Export backup: $EXPORT_FILE"
    exit 1
fi

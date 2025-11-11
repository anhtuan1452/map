#!/bin/bash
# Script to easily switch between SQLite and PostgreSQL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Function to update USE_POSTGRES in .env
update_postgres_flag() {
    local new_value=$1
    sed -i.bak "s/^USE_POSTGRES=.*/USE_POSTGRES=$new_value/" "$ENV_FILE"
    rm "$ENV_FILE.bak" 2>/dev/null
}

# Main menu
echo "================================================"
echo "   DATABASE SWITCH TOOL"
echo "================================================"
echo ""
echo "Current settings:"
grep "USE_POSTGRES=" "$ENV_FILE"
echo ""
echo "1) Switch to SQLite (api_db volume - ~60 users)"
echo "2) Switch to PostgreSQL (db service)"
echo "3) Show current database status"
echo "4) Test database connection"
echo "0) Exit"
echo ""
read -p "Choose option: " choice

case $choice in
    1)
        echo "🔄 Switching to SQLite..."
        update_postgres_flag "False"
        echo "✅ Database switched to SQLite"
        echo "📝 Restart docker containers: docker-compose restart api"
        ;;
    2)
        echo "🔄 Switching to PostgreSQL..."
        update_postgres_flag "True"
        echo "✅ Database switched to PostgreSQL"
        echo "📝 Restart docker containers: docker-compose restart api"
        echo "⚠️  Remember to run migrations: docker-compose exec api python manage.py migrate"
        ;;
    3)
        echo "📊 Current Database Configuration:"
        echo ""
        grep "USE_POSTGRES=" "$ENV_FILE"
        current=$(grep "^USE_POSTGRES=" "$ENV_FILE" | cut -d'=' -f2)
        if [ "$current" = "True" ]; then
            echo "➡️  Using: PostgreSQL (db service)"
        else
            echo "➡️  Using: SQLite (api_db volume)"
        fi
        ;;
    4)
        echo "🔍 Testing database connection..."
        docker-compose exec api python manage.py check --database default
        if [ $? -eq 0 ]; then
            echo "✅ Database connection successful!"
        else
            echo "❌ Database connection failed!"
        fi
        ;;
    0)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option!"
        exit 1
        ;;
esac

echo ""
echo "================================================"

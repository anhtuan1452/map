#!/bin/bash
# Health check script for Heritage Map services

echo "🔍 Checking Heritage Map services..."

# Check if containers are running
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "🌐 Service Health Checks:"

# Check API health
echo "API (http://localhost:8000):"
if curl -s -f http://localhost:8000/api/heritage/sites/ > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API is not responding"
fi

# Check Web health
echo "Web (http://localhost:5173):"
if curl -s -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Web is healthy"
else
    echo "❌ Web is not responding"
fi

# Check Database connection (if using PostgreSQL)
echo "Database:"
if docker-compose exec -T db pg_isready -U heritage_user -d heritage_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "⚠️  Database check failed (might be SQLite or not running)"
fi

echo ""
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🔧 Recent Logs (last 10 lines):"
echo "API logs:"
docker-compose logs --tail=5 api 2>/dev/null || echo "No API logs available"
echo ""
echo "Web logs:"
docker-compose logs --tail=5 web 2>/dev/null || echo "No web logs available"
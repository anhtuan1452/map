# Backup PostgreSQL database
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "backup_postgres_$DATE"

Write-Host "Backing up PostgreSQL database..."
$POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { 'heritage_user' }
docker-compose -f docker-compose.production.yml exec -T db pg_basebackup -U $POSTGRES_USER -D /tmp/$BACKUP_DIR -P

# Copy backup directory from container to host
$CONTAINER_ID = docker-compose -f docker-compose.production.yml ps -q db
docker cp ${CONTAINER_ID}:/tmp/$BACKUP_DIR ./$BACKUP_DIR

if (Test-Path $BACKUP_DIR) {
    Write-Host "Backup saved to: $BACKUP_DIR"
    $size = (Get-ChildItem $BACKUP_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Size: $([math]::Round($size, 2)) MB"
} else {
    Write-Host "Backup failed!"
    exit 1
}
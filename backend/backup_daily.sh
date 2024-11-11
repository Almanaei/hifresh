#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
DB_NAME="booking_system"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Load environment variables if needed
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create SQL backup
echo "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

# Create JSON backup using Node.js utility
echo "Creating JSON backup..."
JSON_BACKUP_FILE="$BACKUP_DIR/json_backup_$TIMESTAMP.json"
node utils/backup.js full "$JSON_BACKUP_FILE"

# Compress backups
echo "Compressing backups..."
gzip "$BACKUP_FILE"
gzip "$JSON_BACKUP_FILE"

# Delete old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "json_backup_*.json.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully!"
echo "Location: $BACKUP_DIR"
echo "Files:"
echo "- $(basename "$BACKUP_FILE.gz")"
echo "- $(basename "$JSON_BACKUP_FILE.gz")" 
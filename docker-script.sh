LOG_FILE="docker-compose_logs.txt"

echo "Stopping containers..." > "$LOG_FILE"
docker-compose down >> "$LOG_FILE" 2>&1

echo "Building containers..." >> "$LOG_FILE"
docker-compose build >> "$LOG_FILE" 2>&1

echo "Starting containers in detached mode..." >> "$LOG_FILE"
docker-compose up -d >> "$LOG_FILE" 2>&1

echo "Operations completed. Check $LOG_FILE for more details."
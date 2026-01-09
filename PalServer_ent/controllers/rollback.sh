#!/bin/bash
set -e

BACKUP_PATH=$1
INSTANCE=$2
BASE_DIR=$(dirname "$0")/..

if [[ -z "$BACKUP_PATH" || -z "$INSTANCE" ]]; then
  echo "Usage: paladmin rollback <backup_path> <instance>"
  exit 1
fi

TARGET_DIR="$BASE_DIR/instances/$INSTANCE"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "[ERROR] Instance does not exist: $INSTANCE"
  exit 1
fi

if [[ ! -d "$BACKUP_PATH" ]]; then
  echo "[ERROR] Backup path does not exist: $BACKUP_PATH"
  exit 1
fi

rm -rf "$TARGET_DIR/Saved" 

cp -r "$BACKUP_PATH/Saved" "$TARGET_DIR/" 

echo "[ROLLBACK] Restore complete for instance '$INSTANCE'"
echo "[ROLLBACK] Restart server:"
docker compose -f docker-compose-$INSTANCE.yml restart
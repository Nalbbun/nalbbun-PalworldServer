#!/bin/bash
set -e
source "$(dirname "$0")/../env/env.load.sh"

BACKUP_NAME=$1
INSTANCE=$2

if [[ -z "$BACKUP_NAME" || -z "$INSTANCE" ]]; then
  echo "Usage: paladmin rollback <backup_name> <instance>"
  exit 1
fi

TARGET_PATH="$INSTANCE_ROOT/$INSTANCE"
BACKUP_PATH="$BACKUP_ROOT/$BACKUP_NAME"

if [[ ! -d "$TARGET_PATH" ]]; then
  echo "[ERROR] Instance does not exist: $INSTANCE"
  exit 1
fi

if [[ ! -d "$BACKUP_PATH" ]]; then
  echo "[ERROR] Backup path does not exist: $BACKUP_PATH"
  exit 1
fi

rm -rf "$TARGET_PATH/$SAVED_DIR" 

cp -r "$BACKUP_PATH/$SAVED_DIR" "$TARGET_PATH/" 

echo "[ROLLBACK] Restore complete for instance '$INSTANCE'"
echo "[ROLLBACK] Restart server:"

COMPOSE_FILE="$SERVER_ROOT/docker-compose-$INSTANCE.yml"

docker compose -f "$COMPOSE_FILE" restart
#!/bin/bash
set -e

INSTANCE=$1
BASE_DIR=$(dirname "$0")/..

if [[ -z "$INSTANCE" ]]; then
  echo "Usage: paladmin backup <instance>"
  exit 1
fi

SRC_DIR="$BASE_DIR/instances/$INSTANCE"
BACKUP_DIR="$BASE_DIR/backup/${INSTANCE}-$(date +%Y%m%d-%H%M)"

mkdir -p "$BACKUP_DIR"

cp -r "$SRC_DIR/Saved" "$BACKUP_DIR/" 

echo "[BACKUP] Created backup at: $BACKUP_DIR"
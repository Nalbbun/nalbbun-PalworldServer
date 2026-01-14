#!/bin/bash
set -e
source "$(dirname "$0")/../env/env.load.sh"

INSTANCE=$1
 
if [[ -z "$INSTANCE" ]]; then
  echo "Usage: paladmin backup <instance>"
  exit 1
fi

SRC_DIR="$INSTANCE_ROOT/$INSTANCE"
BACKUP_DIR="$BACKUP_ROOT/${INSTANCE}-$(date +%Y%m%d-%H%M)"

mkdir -p "$BACKUP_DIR"

cp -r "$SRC_DIR" "$BACKUP_DIR/" 

echo "[BACKUP] Created backup at: $BACKUP_DIR"
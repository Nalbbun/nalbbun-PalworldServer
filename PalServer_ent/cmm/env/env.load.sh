#!/bin/bash
set -e

# ---------------------------------------------
# Resolve BASE_DIR (symlink-safe)
# ---------------------------------------------
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done

# env.load.sh → cmm/env → cmm → BASE
# /PalServer_ent 가 베이스 경로 이다.
BASE_DIR="$(cd -P "$(dirname "$SOURCE")/../.." && pwd)"

export BASE_DIR

# ---------------------------------------------
# Load static env values
# ---------------------------------------------
ENV_FILE="$BASE_DIR/cmm/env/paladmin.env"
[[ ! -f "$ENV_FILE" ]] && {
  echo "[FATAL] paladmin.env not found"
  exit 1
}

set -a
source "$ENV_FILE"
set +a

# ---------------------------------------------
# Derived paths (ALL exported)
# --------------------------------------------- 

export CMM_ROOT="$BASE_DIR/$COMMAND_DIR"
export CTRL_ROOT="$CMM_ROOT/$CONTROL_DIR"
export MKIMG_ROOT="$CMM_ROOT/$MAKEIMG_DIR"

export SERVER_ROOT="$BASE_DIR/$SERVER_DIR"
export INSTANCE_ROOT="$SERVER_ROOT/$INSTANCE_DIR" 
export BACKUP_ROOT="$SERVER_ROOT/$BACKUP_DIR"
export REPO_ROOT="$SERVER_ROOT/$REPO_DIR"
export REPO_ROOT="$SERVER_ROOT/$REPO_DIR"

# ==========================================================
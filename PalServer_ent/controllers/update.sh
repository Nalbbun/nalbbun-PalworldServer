#!/bin/bash
set -euo pipefail

VERSION=${1:-}
TARGET=${2:-}   # empty | instance | all

BASE_DIR=$(dirname "$0")/..
REPO_BASE="$BASE_DIR/offline_repo"
REPO_DIR="$REPO_BASE/$VERSION"


# ----------------------------------------
# resolve latest -> real version
# ----------------------------------------
if [[ "$VERSION" == "latest" ]]; then
  if [[ ! -L "$REPO_BASE/latest" ]]; then
    echo "[ERROR] latest symlink not found in offline_repo"
    exit 1
  fi

  REAL_VERSION=$(readlink "$REPO_BASE/latest")
  echo "[INFO] latest resolved to $REAL_VERSION"
  VERSION="$REAL_VERSION"
fi


IMAGE_FILE="$REPO_DIR/palworld_server_steam_$VERSION.tar"
ROLLBACK_TAG="palworld_server_steam:rollback_backup"

usage() {
  echo "Usage:"
  echo "  paladmin update <version>"
  echo "  paladmin update <version> <instance>"
  echo "  paladmin update <version> all"
  exit 1
}

[[ -z "$VERSION" ]] && usage
[[ ! -d "$REPO_DIR" ]] && { echo "[ERROR] Repo not found: $REPO_DIR"; exit 1; }
[[ ! -f "$IMAGE_FILE" ]] && { echo "[ERROR] Image tar missing: $IMAGE_FILE"; exit 1; }

echo "===================================================="
echo "[UPDATE] version=$VERSION target=${TARGET:-image-only}"
echo "===================================================="
 

# ---------- IMAGE ONLY ----------
if [[ -z "$TARGET" ]]; then
  echo "[DONE] Image loaded only. (no compose change)"
  exit 0
fi


# helper: update one compose safely
update_one() {
  local compose="$1"
  local inst
  inst=$(basename "$compose" | sed 's/docker-compose-\(.*\)\.yml/\1/')

  echo "[INSTANCE] $inst"

  # backup compose
  cp -a "$compose" "$compose.bak"

  # capture current image tag for rollback
  local old_img
  old_img=$(grep -E '^\s*image:\s*palworld_server_steam:' "$compose" | awk -F: '{print $3}')
  old_img=${old_img:-latest}

  echo "[BACKUP] compose + image=$old_img"
  docker tag "palworld_server_steam:$old_img" "$ROLLBACK_TAG" 2>/dev/null || true

  # set compose image to target version
  sed -i "s|^\(\s*image:\s*palworld_server_steam:\).*|\1$VERSION|" "$compose"

  # recreate
  if docker compose -f "$compose" down && \
     docker compose -f "$compose" up -d --force-recreate; then
    echo "[OK] $inst -> $VERSION"
    rm -f "$compose.bak"
  else
    echo "[FAIL] $inst update failed. ROLLING BACK..."
    mv -f "$compose.bak" "$compose"
    docker tag "$ROLLBACK_TAG" "palworld_server_steam:$old_img" || true
    docker compose -f "$compose" up -d --force-recreate
    echo "[ROLLBACK DONE] $inst restored to $old_img"
    exit 1
  fi
}

# ---------- ALL ----------
if [[ "$TARGET" == "all" ]]; then
  shopt -s nullglob
  for c in "$BASE_DIR"/docker-compose-*.yml; do
    update_one "$c"
  done
  echo "[SUCCESS] All instances updated to $VERSION"
  exit 0
fi

# ---------- SINGLE ----------
COMPOSE_FILE="$BASE_DIR/docker-compose-$TARGET.yml"
[[ ! -f "$COMPOSE_FILE" ]] && { echo "[ERROR] Compose not found: $COMPOSE_FILE"; exit 1; }
update_one "$COMPOSE_FILE"

echo "[SUCCESS] Instance '$TARGET' updated to $VERSION"
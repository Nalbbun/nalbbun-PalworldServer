#!/bin/bash
set -e

VERSION=$1
AUTO_YES=$2   

OFFLINE_REPO="../../server/repo"

# ---------------------------------------------------
# Helper: Ask or Auto-yes
# ---------------------------------------------------
ask_confirm() {
  local prompt="$1"
  if [[ "$AUTO_YES" == "-y" ]]; then
    echo "$prompt -> [AUTO-YES]"
    return 0
  fi
  
  echo "$prompt (y/n)"
  read -r ANSWER
  if [[ "$ANSWER" != "y" ]]; then
    return 1
  fi
  return 0
}
# ===================================================
# 1.    Validation
# ===================================================
if [[ -z "$VERSION" ]]; then
  echo "Usage: ./build.sh <version> [-y]"
  exit 1
fi

# ===================================================
# 2.    v0.0.0 
# ===================================================
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[ERROR] Invalid version format: $VERSION"
  echo "Expected format: v0.0.0"
  exit 1
fi

# ===================================================
# 3.    Check Exists
# ===================================================
TARGET_DIR="$OFFLINE_REPO/$VERSION"

if [[ -d "$TARGET_DIR" ]]; then
  echo "[WARNING] Version $VERSION already exists."
  if ! ask_confirm "Do you want to overwrite it?"; then
     echo "[CANCEL] Build cancelled."
     exit 0
  fi
  echo "[INFO] Removing existing version directory..."
  rm -rf "$TARGET_DIR"
fi

# ===================================================
# 4.    (optional but recommended)
# ===================================================
LATEST=$(ls -1 $OFFLINE_REPO | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)

if [[ "$LATEST" != "" && "$VERSION" < "$LATEST" ]]; then
  echo "[WARNING] Version $VERSION is older than latest: $LATEST"
  if ! ask_confirm "Continue?"; then
     exit 0
  fi
fi
 
# ===================================================
# 5. Build Docker Image
# ===================================================
echo "[BUILD] Building Palworld Docker Image... (palworld_server_steam:$VERSION)..."
docker build -t palworld_server_steam:$VERSION -f Dockerfile .

# ===================================================
# 5-1. Tag Latest
# ===================================================
if ask_confirm "Tag this version as 'latest'?"; then
  docker tag palworld_server_steam:$VERSION palworld_server_steam:latest
else
  echo "[SKIP] latest tag skipped"
fi

# ===================================================
# 6.    
# ===================================================
mkdir -p "$TARGET_DIR"

# ===================================================
#  . Export & Manifest & Link
# ===================================================
mkdir -p "$TARGET_DIR"
echo "[EXPORT] Saving docker image..."
docker save -o "$TARGET_DIR/palworld_server_steam_$VERSION.tar" palworld_server_steam:$VERSION

cat <<EOF > "$TARGET_DIR/manifest.json"
{
  "version": "$VERSION",
  "built": "$(date)",
  "docker_image": "palworld_server_steam:$VERSION"
}
EOF

echo "[LINK] Updating 'latest' symlink..."
rm -rf "$OFFLINE_REPO/latest"
ln -s "$VERSION" "$OFFLINE_REPO/latest"

echo "[DONE] Build complete for version $VERSION"
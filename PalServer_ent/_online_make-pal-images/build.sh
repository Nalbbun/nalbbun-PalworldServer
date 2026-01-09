#!/bin/bash
set -e

VERSION=$1
OFFLINE_REPO="../offline_repo"

# ===================================================
# 1.    
# ===================================================
if [[ -z "$VERSION" ]]; then
  echo "Usage: ./build.sh <version>"
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
# 3.    
# ===================================================
TARGET_DIR="$OFFLINE_REPO/$VERSION"

if [[ -d "$TARGET_DIR" ]]; then
  echo "[WARNING] Version $VERSION already exists at:"
  echo "  $TARGET_DIR"
  echo "Do you want to overwrite it? (y/n)"
  read -r ANSWER

  if [[ "$ANSWER" != "y" ]]; then
    echo "[CANCEL] Build cancelled by user."
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
  echo "[WARNING] Building version $VERSION, which is older than the latest version: $LATEST"
  echo "Continue? (y/n)"
  read -r ANSWER2
  if [[ "$ANSWER2" != "y" ]]; then
    echo "[CANCEL] Build cancelled by user."
    exit 0
  fi
fi

# ===================================================
# 5. Docker  
# ===================================================
echo "[BUILD] Building Palworld Docker Image (palworld_server_steam:$VERSION)..."

docker build -t palworld_server_steam:$VERSION -f Dockerfile .

# ===================================================
# 6.    
# ===================================================
mkdir -p "$TARGET_DIR"

# ===================================================
# 7. Docker  
# ===================================================
echo "[EXPORT] Saving docker image to offline repo..."
docker save -o "$TARGET_DIR/palworld_server_steam_$VERSION.tar" palworld_server_steam:$VERSION

# ===================================================
# 8. manifest.json 
# ===================================================
cat <<EOF > "$TARGET_DIR/manifest.json"
{
  "version": "$VERSION",
  "built": "$(date)",
  "docker_image": "palworld_server_steam:$VERSION"
}
EOF

# ===================================================
# 9. latest   
# ===================================================
echo "[LINK] Updating 'latest' symlink..."

rm -rf "$OFFLINE_REPO/latest"
ln -s "$VERSION" "$OFFLINE_REPO/latest"

echo "[DONE] Build complete for version $VERSION"
echo "Path: $TARGET_DIR"
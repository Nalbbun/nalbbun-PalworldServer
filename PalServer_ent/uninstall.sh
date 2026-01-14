#!/bin/bash
set -e

# --------------------------------------------------
# BASE_DIR (script location 기준)
# --------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR"

echo "=============================================="
echo " Palworld Enterprise Server Uninstaller"
echo "=============================================="
echo "[INFO] Base Dir : $BASE_DIR"
echo "[WARNING] This will stop and remove Web UI containers."
echo "          Save files under instances/ will NOT be deleted."
echo ""

read -p "Are you sure you want to uninstall? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Uninstall cancelled."
  exit 0
fi

echo "----------------------------------------------------"
echo "[1] Stopping and removing Docker services..." 

docker compose -f "$BASE_DIR/UI/docker-compose.yml" down --remove-orphans|| true

echo " - Docker instance services stopped and removed."

docker stop ui-paladmin-frontend|| true
docker stop ui-paladmin-backend|| true 
docker stop nginx:alpine || true
docker rm ui-paladmin-frontend|| true
docker rm ui-paladmin-backend|| true 
docker rm nginx:alpine || true

echo " - Docker services stopped and removed."


echo "----------------------------------------------------"
echo "[2] Removing Docker images (optional)..."
read -p "Remove paladmin-related docker images? (yes/no): " RMIMG
if [[ "$RMIMG" == "yes" ]]; then
  docker rmi ui-paladmin-frontend || true
  docker rmi ui-paladmin-backend || true
  docker rmi nginx:alpine || true
  
  echo " - Removing Palworld server images (palworld_server_steam:*)..."

  docker images --format "{{.Repository}}:{{.Tag}}" \
    | grep '^palworld_server_steam:' \
    | xargs -r docker rmi -f

  echo " - images removed"
else
  echo " - keeping docker images"
fi
 
echo "----------------------------------------------------"
echo "[3]Removing paladmin CLI..."
if [[ -f "/usr/local/bin/paladmin" ]]; then
  sudo rm -f /usr/local/bin/paladmin
  echo " - removed /usr/local/bin/paladmin"
else
  echo " - paladmin not found, skipping"
fi

echo ""
echo "[DONE] Palworld Enterprise Server has been uninstalled."
echo "======================================================="

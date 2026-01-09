#!/bin/bash
set -e

BASE_DIR=$(pwd)

#!/bin/bash
set -e

BASE_DIR=$(pwd)
 

LOG_FILE="./log/palserver-install.log"

#############################################
# 0. 로그 초기화
#############################################
mkdir -p log
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================="
echo " Palworld Enterprise Server Installer"
echo "=============================================="
echo "[INFO] Start Time : $(date)"
echo "[INFO] Executed By: $USER"
echo "[INFO] Base Dir   : $BASE_DIR"
echo "----------------------------------------------"

#############################################
# 0. OS 체크
#############################################
if ! grep -qiE "debian|ubuntu" /etc/os-release; then
  echo "[ERROR] This installer supports Debian/Ubuntu only."
  exit 1
fi

#############################################
# 1. Docker 설치 확인
#############################################
if ! command -v docker >/dev/null 2>&1; then
  echo "[INSTALL] Docker not found. Installing docker.io..."

  sudo apt-get update
  sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    docker.io

  sudo systemctl enable docker
  sudo systemctl start docker

  echo "[OK] Docker installed."
else
  echo "[OK] Docker already installed."
fi

#############################################
# 2. Docker Compose (v2 plugin) 확인
#############################################
if ! docker compose version >/dev/null 2>&1; then
  echo "[INSTALL] Docker Compose plugin not found. Installing..."

  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin

  echo "[OK] Docker Compose plugin installed."
else
  echo "[OK] Docker Compose already available."
fi

#############################################
# 3. docker 그룹 권한 (선택)
#############################################
if ! groups "$USER" | grep -q docker; then
  echo "[INFO] Adding user '$USER' to docker group..."
  sudo usermod -aG docker "$USER"
  echo "[WARN] You must logout/login once to apply docker group permission."
fi

#############################################
# 4. paladmin 설치
#############################################
SOURCE_FILE="$BASE_DIR/bin/paladmin.sh"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "[ERROR] paladmin.sh not found at: $SOURCE_FILE"
  exit 1
fi

# /usr/local/bin    
sudo ln -sf "$SOURCE_FILE" /usr/local/bin/paladmin

sudo chmod +x "$SOURCE_FILE"
sudo chmod +x /usr/local/bin/paladmin

echo "[INFO] paladmin is now available system-wide."
echo "[INFO] Installed -> /usr/local/bin/paladmin"
echo "[INFO] Source     -> $SOURCE_FILE"

#############################################
# 5. Web UI 실행
#############################################
echo "[INSTALL] Starting Web UI (Frontend + Backend)..."
export PALSERVER_BASE_DIR="$BASE_DIR"
docker compose -f UI/docker-compose.yml up -d --build --force-recreate --remove-orphans


#############################################
# 6. (선택) Palworld 이미지 생성
#############################################
echo "----------------------------------------------"
read -r -p "Do you want to build Palworld server image now? (y/N): " BUILD_IMAGE

if [[ "$BUILD_IMAGE" =~ ^[Yyyes]$ ]]; then
  IMAGE_DIR="$BASE_DIR/_online_make-pal-images"

  if [[ ! -d "$IMAGE_DIR" ]]; then
    echo "[ERROR] Image build directory not found: $IMAGE_DIR"
    exit 1
  fi

  read -r -p "Enter image version (ex: v0.0.1): " IMAGE_VERSION

  if [[ -z "$IMAGE_VERSION" ]]; then
    echo "[ERROR] Version is required."
    exit 1
  fi

  echo "[BUILD] Building Palworld image version: $IMAGE_VERSION"
  cd "$IMAGE_DIR"
  chmod +x build.sh
  ./build.sh "$IMAGE_VERSION"

  echo "[OK] Image build completed."
else
  echo "[SKIP] Image build skipped."
fi



#############################################
# DONE
#############################################
echo "----------------------------------------------"
echo "[SUCCESS] Installation completed successfully."
echo "[INFO] End Time : $(date)"
echo "=============================================="
echo " - Admin CLI : paladmin"
echo " - Web UI    : http://<your-server-ip>:8443"
echo " - Log File  : $LOG_FILE"
echo "=============================================="

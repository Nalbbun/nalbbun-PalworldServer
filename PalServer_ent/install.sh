#!/bin/bash
set -e 

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR"
export PALSERVER_BASE_DIR="$BASE_DIR"

LOG_FILE="$BASE_DIR/log/palserver-install.log"

#############################################
# 0. 로그 초기화
#############################################
mkdir -p "$BASE_DIR/log"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================="
echo " Palworld Enterprise Server Installer"
echo "=============================================="
echo "[INFO] Start Time : $(date)"
echo "[INFO] Executed By: $USER"
echo "[INFO] PalServer Base Dir : $BASE_DIR"
echo "----------------------------------------------"

#############################################
# 0. OS 체크
#############################################
if ! grep -qiE "debian|ubuntu" /etc/os-release; then
  echo "[ERROR] This installer supports Debian/Ubuntu only."
  exit 1
fi
#############################################
# 1. ENV 구조 확인
#############################################
ENV_LOADER="$BASE_DIR/cmm/env/env.load.sh"
ENV_FILE="$BASE_DIR/cmm/env/paladmin.env"

[[ ! -f "$ENV_LOADER" ]] && { echo "[ERROR] env.load.sh missing"; exit 1; }
[[ ! -f "$ENV_FILE" ]]   && { echo "[ERROR] paladmin.env missing"; exit 1; }


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
SOURCE_FILE="$BASE_DIR/cmm/bin/paladmin.sh"

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
# 6. (선택) Palworld 이미지 생성
#############################################
echo "----------------------------------------------"
read -r -p "Do you want to build Palworld server image now? (y/N): " BUILD_IMAGE

if [[ "$BUILD_IMAGE" =~ ^[Yyyes]$ ]]; then
  IMAGE_DIR="$BASE_DIR/cmm/make-pal-images"

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
# Network: pal-public-net 초기화
#############################################
NET="pal-public-net"
echo "[Network] Preparing docker network: $NET"

# 기존 네트워크 존재 여부 확인
if docker network inspect "$NET" >/dev/null 2>&1; then
  echo "[WARN] Network '$NET' already exists."

  # 연결된 컨테이너 확인
  CONNECTED_CONTAINERS=$(docker network inspect "$NET" \
    --format '{{ range .Containers }}{{ .Name }} {{ end }}')

  if [[ -n "$CONNECTED_CONTAINERS" ]]; then
    echo "[INFO] Connected containers:"
    echo "       $CONNECTED_CONTAINERS"
    echo "[INFO] Removing connected containers first is required."
  fi

  echo "[INFO] Removing existing network '$NET'..."
  docker network rm "$NET" || {
    echo "[ERROR] Failed to remove network '$NET'."
    echo "[HINT] Stop related containers and retry."
    exit 1
  }
else
  echo "[INFO] Network '$NET' does not exist. Creating new one."
fi

# 네트워크 재생성
docker network create "$NET"
echo "[OK] Network '$NET' created."

#############################################
# 5. Web UI 실행
#############################################

echo "[INSTALL] Starting Web UI (Frontend + Backend)..." 
docker compose -f "$BASE_DIR/UI/docker-compose.yml" up -d --build --force-recreate --remove-orphans

#############################################
# 7. (선택) Palworld cmd 자동완성
#############################################
echo "----------------------------------------------"
read -r -p "Do you want to Palworld cmd completion? (y/N): " CMD_COMP
if [[ "$CMD_COMP" =~ ^[Yyyes]$ ]]; then
  sudo cp "$BASE_DIR/cmm/completion/paladmin.bash" /etc/bash_completion.d/paladmin
  sudo chmod 644 /etc/bash_completion.d/paladmin
  source /etc/bash_completion

  echo "[OK] Command completion installed."
else
  echo "[SKIP] Command completion skipped."
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

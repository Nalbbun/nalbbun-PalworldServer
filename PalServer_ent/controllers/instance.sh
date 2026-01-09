#!/bin/bash
set -e

CMD=$1
INSTANCE=$2
PORT=$3
QUERY=$4
VERSION=$5

PUID=1000
PGID=1000

BASE_DIR=$(dirname "$0")/..

PALSERVER_BASE_DIR="${PALSERVER_BASE_DIR}"

echo "[INFO] Base Dir = $PALSERVER_BASE_DIR"
echo "[INFO] app Base Dir = $BASE_DIR"

APP_BASE="$BASE_DIR"
BACKUP_BASE="$APP_BASE/backup"
INST_DIR="$APP_BASE/instances/$INSTANCE"

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

case "$CMD" in
  create)
    if [[ -z "$INSTANCE" || -z "$PORT" || -z "$QUERY" || -z "$VERSION" ]]; then
      echo "Usage: paladmin create <instance> <port> <query> <version>"
      exit 1
    fi

    SAVE_DIR="$APP_BASE/instances/$INSTANCE/Saved" 

    mkdir -p "$SAVE_DIR" 

chown -R ${PUID}:${PGID} "$APP_BASE/instances/$INSTANCE" 

REST_PORT=$((QUERY + 1000))

cat <<EOF > "$APP_BASE/docker-compose-$INSTANCE.yml"
version: "3.9"
services:
  $INSTANCE:
    image: palworld_server_steam:$VERSION
    container_name: $INSTANCE
    restart: always
    environment:
      - PORT=$PORT
      - QUERY=$QUERY
      - RESTAPI=$REST_PORT
    ports:
      - "$PORT:8211/udp"
      - "$QUERY:27015/udp"
      - "$REST_PORT:8212/tcp"
    volumes:
      - $PALSERVER_BASE_DIR/instances/$INSTANCE/Saved:/home/steam/palworld/Pal/Saved
EOF

    echo "[INSTANCE] $INSTANCE created (port=$PORT)(query=$QUERY)(version=$VERSION)"
    echo "[INSTANCE] docker-compose file: docker-compose-$INSTANCE.yml"
    ;;

delete)
    if [[ -z "$INSTANCE" ]]; then
      echo "Usage: paladmin delete <instance>"
      exit 1
    fi

    COMPOSE_FILE="$APP_BASE/docker-compose-$INSTANCE.yml"

    echo "[DELETE] instance=$INSTANCE"

    # 
    if [[ -f "$COMPOSE_FILE" ]]; then
      echo "[DELETE] stopping container..."
      docker-compose -f "$COMPOSE_FILE" down || true
    fi

    #
    if [[ -d "$INST_DIR" ]]; then
      TS=$(timestamp)
      BACKUP_DIR="$BACKUP_BASE/$INSTANCE-$TS"

      echo "[DELETE] backup -> $BACKUP_DIR"
      mkdir -p "$BACKUP_BASE"
      cp -a "$INST_DIR" "$BACKUP_DIR"
      chown -R ${PUID}:${PGID} "$BACKUP_DIR"
    else
      echo "[WARN] instance dir not found: $INST_DIR"
    fi

    # 
    echo "[DELETE] removing instance directory"
    rm -rf "$INST_DIR"

    echo "[DELETE] removing compose file"
    rm -f "$COMPOSE_FILE"

    echo "[DELETE] completed: $INSTANCE"
    ;; 

  *)
    echo "Unknown instance command"
    ;;
esac
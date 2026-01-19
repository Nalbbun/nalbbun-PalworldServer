#!/bin/bash
set -e
source "$(dirname "$0")/../env/env.load.sh"

CMD=$1
INSTANCE=$2
PORT=$3
QUERY=$4
VERSION=$5
OVERWRITE=${6:-false}
  
echo "[INFO] Base Dir = $PALSERVER_BASE_DIR"
echo "[INFO] app Base Dir = $BASE_DIR"
 
BACKUP_BASE="$BASE_DIR/backup"
INST_PATH="$INSTANCE_ROOT/$INSTANCE"
COMPOSE_FILE="$SERVER_ROOT/docker-compose-$INSTANCE.yml"

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

case "$CMD" in
  create)
    if [[ -z "$INSTANCE" || -z "$PORT" || -z "$QUERY" || -z "$VERSION" ]]; then
      echo "Usage: paladmin create <instance> <port> <query> <version>"
      exit 1
    fi

    if [[ -d "$INST_PATH" || -f "$COMPOSE_FILE" ]]; then
      if [[ "$OVERWRITE" != "true" ]]; then
        echo "[ERROR] Instance already exists: $INSTANCE"
        exit 2
      fi
      echo "[WARN] Overwrite enabled. Removing existing instance..."
      bash "$0" filedelete "$INSTANCE"
    fi

    SAVED_PATH="$INST_PATH/$SAVE_DIR"
    mkdir -p "$SAVED_PATH" 
    chown -R ${PUID}:${PGID} "$INST_PATH" 

    REST_PORT=$((QUERY + PAL_REST_PORT_OFFSET))

cat <<EOF > "$SERVER_ROOT/docker-compose-$INSTANCE.yml"
version: "3.9"
services:
  $INSTANCE:
    image: $PAL_IMAGE:$VERSION
    container_name: $INSTANCE
    restart: always
    environment:
      - PORT=$PORT
      - QUERY=$QUERY
      - RESTAPI=$REST_PORT      
    networks:
      - $PAL_EXNETWORKS
    ports:
      - "$PORT:$PAL_GAME_PORT/udp"
      - "$QUERY:$PAL_QUERY_PORT/udp"
      - "$REST_PORT:$PAL_RESTAPI_PORT/tcp"
    volumes:
      - $PALSERVER_BASE_DIR/$SERVER_DIR/$INSTANCE_DIR/$INSTANCE/$SAVE_DIR:/home/steam/palworld/Pal/Saved
networks:
  $PAL_EXNETWORKS:
    external: true
  $PAL_INNETWORKS:
    external: true
EOF

    echo "[INSTANCE] $INSTANCE created (port=$PORT)(query=$QUERY)(version=$VERSION)"
    echo "[INSTANCE] docker-compose file: docker-compose-$INSTANCE.yml"
    ;;

delete)
    if [[ -z "$INSTANCE" ]]; then
      echo "Usage: paladmin delete <instance>"
      exit 1
    fi

    COMPOSE_FILE="$SERVER_ROOT/docker-compose-$INSTANCE.yml"

    echo "[DELETE] instance=$INSTANCE"

    # 
    if [[ -f "$COMPOSE_FILE" ]]; then
      echo "[DELETE] stopping container..."
      docker-compose -f "$COMPOSE_FILE" down || true
    fi

    #
    if [[ -d "$INST_PATH" ]]; then
      TS=$(timestamp)
      BACKUP_PATH="$BACKUP_ROOT/$INSTANCE-$TS"

      echo "[DELETE] backup -> $BACKUP_PATH"
      mkdir -p "$BACKUP_PATH"
      cp -a "$INST_PATH" "$BACKUP_PATH"
      chown -R ${PUID}:${PGID} "$BACKUP_PATH"
    else
      echo "[WARN] instance dir not found: $INST_PATH"
    fi

    # 
    echo "[DELETE] removing instance directory"
    rm -rf "$INST_PATH"

    echo "[DELETE] removing compose file"
    rm -f "$COMPOSE_FILE"

    echo "[DELETE] completed: $INSTANCE"
    ;; 

filedelete)
    if [[ -z "$INSTANCE" ]]; then
      echo "Usage: paladmin file delete <instance>"
      exit 1
    fi

    COMPOSE_FILE="$SERVER_ROOT/docker-compose-$INSTANCE.yml"

    echo "[DELETE] instance file =$INSTANCE" 

    echo "[DELETE] removing compose file"
    rm -f "$COMPOSE_FILE"

    echo "[DELETE] file completed: $INSTANCE"
    ;; 

  *)
    echo "Unknown instance command"
    ;;
esac
#!/bin/bash
BASE_DIR=$(pwd)
export PALSERVER_BASE_DIR="$BASE_DIR"
echo " => docker compose -f $BASE_DIR/UI/docker-compose.yml down  --remove-orphans"
docker compose -f $BASE_DIR/UI/docker-compose.yml down

echo " => docker compose -f $BASE_DIR/UI/docker-compose.yml build --no-cache "
docker compose -f $BASE_DIR/UI/docker-compose.yml build --no-cache

echo " => docker compose -f $BASE_DIR/UI/docker-compose.yml up -d --force-recreate"
docker compose -f $BASE_DIR/UI/docker-compose.yml up -d

echo " => curl -vf https://서버IP:8443/admin/"
curl -vk https://192.168.1.150:8443/admin/

echo " => docker logs paladmin-backend"
docker logs paladmin-backend
echo " => docker logs paladmin-frontend-proxy"
docker logs paladmin-frontend-proxy



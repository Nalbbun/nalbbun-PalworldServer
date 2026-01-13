#!/bin/bash
set -e

SERVER="/home/steam/palworld"

PORT="${PORT:-8211}"
QUERY="${QUERY:-27015}"

echo "[INFO] PORT=$PORT"
echo "[INFO] QUERY=$QUERY" 

############################################
# Palworld 
############################################
cd "$SERVER"
exec /bin/bash PalServer.sh -useperfthreads -NoAsyncLoadingThread -UseMultithreadForDS


#!/bin/bash
set -e
source "$(dirname "$0")/../env/env.load.sh"
 

echo "[CLEAN] Removing SteamCMD cache..."

rm -rf $STEAM_HOME/.steam/*
rm -rf $STEAM_HOME/Steam/*
rm -rf $STEAM_HOME/.local/share/Steam/*
rm -rf $STEAM_HOME/steamcmd/steamapps/downloading/*
rm -rf $STEAM_HOME/steamcmd/package/*

echo "[CLEAN] Done."
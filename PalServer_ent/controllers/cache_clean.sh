#!/bin/bash
set -e

STEAM_HOME="/home/steam"

echo "[CLEAN] Removing SteamCMD cache..."

rm -rf $STEAM_HOME/.steam/*
rm -rf $STEAM_HOME/Steam/*
rm -rf $STEAM_HOME/.local/share/Steam/*
rm -rf $STEAM_HOME/steamcmd/steamapps/downloading/*
rm -rf $STEAM_HOME/steamcmd/package/*

echo "[CLEAN] Done."
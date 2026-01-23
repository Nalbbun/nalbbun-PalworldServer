# mng/core/config.py
import os
import logging
import sys

# ---------------------------------------------------------
# 1. 로그 레벨 설정 (Env에서 가져옴, 기본값: INFO)
# ---------------------------------------------------------
# docker-compose에서 LOG_LEVEL=DEBUG 로 설정하면 디버그 모드 작동
LOG_LEVEL_STR = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL = getattr(logging, LOG_LEVEL_STR, logging.INFO)

# ---------------------------------------------------------
# 2. 로거 포맷 정의
# ---------------------------------------------------------
# 포맷: [시간] [레벨] [모듈명] 메시지
logging.basicConfig(
    level=LOG_LEVEL,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)

log = logging.getLogger("PalServer")
log.setLevel(LOG_LEVEL)

BASE_DIR = os.getenv("PALSERVER_BASE_DIR", "/PALSERVER_ENT")
APP_BASE_DIR = os.path.join("/app", BASE_DIR.lstrip("/"))
COMD_ROOT = os.path.join(APP_BASE_DIR, "cmm")
CONTROLLER_DIR = os.path.join(COMD_ROOT, "controllers")
SERVER_ROOT = os.path.join(APP_BASE_DIR, "server")
INSTANCE_DIR = os.path.join(SERVER_ROOT, "instances")

ADIM_USERNAME = "admin"


# print("[BOOT] Backend starting...")
# print(f"[BOOT] BASE_DIR      = {BASE_DIR}")
# print(f"[BOOT] APP_BASE_DIR      = {APP_BASE_DIR}")
# print(f"[BOOT] INSTANCE_DIR  = {INSTANCE_DIR}")
# print(f"[BOOT] CONTROLLER_DIR = {CONTROLLER_DIR}")

from fastapi import HTTPException
import os, subprocess, logging

log = logging.getLogger("[auth]")
logging.basicConfig(level=logging.INFO)

BASE_DIR = os.getenv("PALSERVER_BASE_DIR", "/PALSERVER_ENT")
APP_BASE_DIR = os.path.join("/app", BASE_DIR.lstrip("/"))
COMD_ROOT = os.path.join(APP_BASE_DIR, "cmm")
CONTROLLER_DIR = os.path.join(COMD_ROOT, "controllers")
SERVER_ROOT = os.path.join(APP_BASE_DIR, "server")
INSTANCE_DIR = os.path.join(SERVER_ROOT, "instances")

# print("[BOOT] Backend starting...")
# print(f"[BOOT] BASE_DIR      = {BASE_DIR}")
# print(f"[BOOT] APP_BASE_DIR      = {APP_BASE_DIR}")
# print(f"[BOOT] INSTANCE_DIR  = {INSTANCE_DIR}")
# print(f"[BOOT] CONTROLLER_DIR = {CONTROLLER_DIR}")


def run_cmd(cmd: str) -> str:
    try:
        print("[cmd] cmd:")
        out = subprocess.check_output(
            cmd, shell=True, stderr=subprocess.STDOUT, text=True
        )
        # print("[RESULT] Output:")
        # print(out)

        return out.strip()
    except subprocess.CalledProcessError as e:
        print("[CMD ERROR]")
        print(e.output)
        raise HTTPException(status_code=500, detail=e.output)

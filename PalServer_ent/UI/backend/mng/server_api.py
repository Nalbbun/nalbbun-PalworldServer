from mng.com import log, INSTANCE_DIR
from mng.docker_utils import is_instance_running
from mng.auth import require_auth
from mng.config_api import parse_option_settings
from fastapi import HTTPException, Depends, APIRouter
from requests.auth import HTTPBasicAuth
from pydantic import BaseModel
import requests, os

router = APIRouter(prefix="/api/server", tags=["server"])

ADIM_USERNAME = "admin"


class NoticeRequest(BaseModel):
    message: str


def get_admin_password(instance: str) -> str:
    path = f"{INSTANCE_DIR}/{instance}/Config/LinuxServer/PalWorldSettings.ini"
    if not os.path.exists(path):
        raise FileNotFoundError("PalWorldSettings.ini not found")

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    options = parse_option_settings(text)
    raw = options.get("AdminPassword")
    if not raw:
        raise ValueError("AdminPassword not set in config")
    # "admin" → admin
    return raw.strip('"')


def get_pal_rest_endpoint(instance: str) -> str:
    return f"http://{instance}:8212"


def get_pal_rest_url(instance: str, reatapi: str) -> str:
    base = get_pal_rest_endpoint(instance)
    url = f"{base}/v1/api/{reatapi}"
    return url


def get_notice(instance: str, message: str):
    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "announce")

    print(f"[announce URL] = {url} {ADIM_USERNAME} {password}")

    resp = requests.post(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={"Accept": "application/json"},
        json={
            "message": message,
        },
        timeout=3,
    )

    resp.raise_for_status()
    # Palworld returns plain 'true'
    return {"ok": True, "raw": resp.text}


def get_players(instance: str):
    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "players")

    # print(f"[players URL] = {url} {ADIM_USERNAME} {password}")

    resp = requests.get(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={"Accept": "application/json"},
        timeout=3,
    )

    # print(f"[players status] = {resp.status_code}")
    # print(f"[players body] = {resp.text}")

    resp.raise_for_status()
    return resp.json()


def get_server_info(instance: str):
    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "info")

    # print(f"[info URL] = {url} {ADIM_USERNAME} {password}")

    resp = requests.get(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={"Accept": "application/json"},
        timeout=3,
    )

    # print(f"[info status] = {resp.status_code}")
    # print(f"[info body] = {resp.text}")

    resp.raise_for_status()
    return resp.json()


def get_svrSave(instance: str):

    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "save")

    # print(f"[save URL] = {url} {ADIM_USERNAME} {password}")

    resp = requests.get(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={"Accept": "application/json"},
        json={
            "data": "",
        },
        timeout=3,
    )

    # print(f"[save status] = {resp.status_code}")
    # print(f"[save body] = {resp.text}")

    resp.raise_for_status()
    return resp.json()


@router.get("/players/{name}")
def players(name: str, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "players": None}

    # 2. call Palworld REST API
    try:
        raw = get_players(name)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Palworld REST API error: {e}")

    return {
        "status": "RUNNING",
        "count": len(raw.get("players", [])),
        "players": raw.get("players", []),
    }


@router.post("/notice/{name}")
def players(name: str, body: NoticeRequest, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "message": None}

    # 2. call Palworld REST API
    try:
        get_notice(name, body.message)

    except requests.exceptions.RequestException as e:
        log.error(f"[NOTICE ERROR] {e}")
        raise HTTPException(502, "Palworld REST API error")

    # 3. response
    return {
        "status": "RUNNING",
        "sent": True,
        "message": body.message,
    }


@router.post("/svrsave/{name}")
def serverSave(name: str, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "message": None}

    # 2. call Palworld REST API
    try:
        raw = get_svrSave(name)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Palworld REST API error: {e}")

    return {
        "status": "RUNNING",
        "message": raw,
    }


@router.post("/svrinfo/{name}")
def serverInfo(name: str, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "message": None}

    # 2. call Palworld REST API
    try:
        raw = get_svrSave(name)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Palworld REST API error: {e}")

    return {
        "status": "RUNNING",
        "message": raw,
    }

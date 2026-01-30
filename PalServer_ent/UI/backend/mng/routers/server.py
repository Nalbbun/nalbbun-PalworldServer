from fastapi import HTTPException, Depends, APIRouter
from requests.auth import HTTPBasicAuth
from pydantic import BaseModel
import requests, os

from mng.core.config import log, INSTANCE_DIR, ADIM_USERNAME
from mng.utils.docker import is_instance_running
from mng.routers.auth import require_auth
from mng.routers.config import parse_option_settings


router = APIRouter(prefix="/api/server", tags=["server"])


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

    log.debug(f"[announce URL] = {url}")

    resp = requests.post(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={
            "message": message,
        },
        timeout=3,
    )

    resp.raise_for_status()

    return {"ok": True, "raw": resp.text}

def get_server_info(instance: str):
    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "info")

    log.debug(f"[info URL] = {url}")

    resp = requests.get(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        timeout=3,
    )

    resp.raise_for_status()
    return resp.json()


def get_svrSave(instance: str):
    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "save")

    log.debug(f"[save URL] = {url}")

    try:
        resp = requests.post(
            url,
            auth=HTTPBasicAuth(ADIM_USERNAME, password),
            headers={
                "Content-Length": "1",
            },
            data="0",
            timeout=5,
            stream=True,
        )
    except requests.exceptions.RequestException as e:
        log.warning(f"[save warning] protocol error ignored: {e}")
        return {"result": "sent"}

    # status_code 접근만 (body 읽지 않음)
    log.debug(f"[save status] = {resp.status_code}")
    return {"result": "sent"}


# ==========================
# API Endpoints
# ==========================

@router.post("/notice/{name}")
def notice(name: str, body: NoticeRequest, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "message": None}

    # 2. call Palworld REST API
    try:
        msg = get_notice(name, body.message)

    except requests.exceptions.RequestException as e:
        log.error(f"[NOTICE ERROR] {e}")
        raise HTTPException(502, "Palworld REST API error")

    # 3. response
    return {
        "status": "RUNNING",
        "sent": True,
        "message": msg,
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
        "result": raw,
    }


@router.post("/svrinfo/{name}")
def serverInfo(name: str, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "info": None}

    # 2. call Palworld REST API
    try:
        raw = get_server_info(name)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Palworld REST API error: {e}")

    return {
        "status": "RUNNING",
        "info": raw,
    }

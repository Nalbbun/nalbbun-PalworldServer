from mng.com import log
from mng.docker_utils import is_instance_running
from mng.auth import require_auth
from fastapi import HTTPException, Depends, APIRouter
from requests.auth import HTTPBasicAuth
from pydantic import BaseModel
import requests

router = APIRouter(prefix="/api/server", tags=["server"])

# =========================================================
# Models
# =========================================================


class NoticeRequest(BaseModel):
    message: str


# =========================================================
# Utils
# =========================================================


def get_pal_rest_endpoint(instance: str) -> str:
    # instance == docker container name
    return f"http://{instance}:8212"


def get_notice(instance: str, message: str, username: str, password: str):

    base = get_pal_rest_endpoint(instance)
    url = f"{base}/v1/api/announce"

    print(f"[announce URL] = {url} {username} {password}")

    resp = requests.post(
        url,
        auth=HTTPBasicAuth(username, password),
        headers={"Accept": "application/json"},
        json={
            "message": message,
        },
        timeout=3,
    )

    resp.raise_for_status()

    # Palworld returns plain 'true'
    return {"ok": True, "raw": resp.text}


@router.post("/notice/{name}")
def players(name: str, body: NoticeRequest, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "message": None}

    # 2. call Palworld REST API
    try:
        get_notice(name, body.message, "admin", "admin")
    except requests.exceptions.RequestException as e:
        log.error(f"[NOTICE ERROR] {e}")
        raise HTTPException(502, "Palworld REST API error")

    # 3. response
    return {
        "status": "RUNNING",
        "sent": True,
        "message": body.message,
    }

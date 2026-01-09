from mng.com import log
from mng.docker_utils import is_instance_running, get_rest_port
from mng.auth import require_auth
from fastapi import HTTPException, Depends, APIRouter
from requests.auth import HTTPBasicAuth
import requests

router = APIRouter(prefix="/api/players", tags=["players"])

# =========================================================
# Players (placeholder)
# =========================================================


def get_pal_rest_endpoint(instance: str) -> str:
    port = get_rest_port(instance)
    return f"http://127.0.0.1:{port}"


def get_players(instance: str, username: str, password: str):

    base = get_pal_rest_endpoint(instance)
    url = f"{base}/v1/api/players"

    print(url)
    resp = requests.get(url, auth=HTTPBasicAuth(username, password), timeout=3)

    print(resp)
    resp.raise_for_status()
    return resp.json()


@router.get("/{name}")
def players(name: str, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {"status": "STOPPED", "raw": None}

    # 2. call Palworld REST API
    try:
        print("[players] Output:")

        raw = get_players(name, "admin", "admin")

        print(raw)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Palworld REST API error: {e}")

    return {"status": "RUNNING", "raw": raw}

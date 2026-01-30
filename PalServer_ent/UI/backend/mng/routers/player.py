from fastapi import HTTPException, Depends, APIRouter
from requests.auth import HTTPBasicAuth
from pydantic import BaseModel
from mng.core.config import log, INSTANCE_DIR, ADIM_USERNAME 
from mng.routers.server import get_admin_password, get_pal_rest_url, router
from mng.utils.docker import is_instance_running
from mng.routers.auth import require_auth
import requests

# [요청 모델] Kick/Ban/Unban용
class PlayerActionReq(BaseModel):
    instance: str
    userid: str
    message: str = "Kicked by Admin"

# [공통 함수] Palworld API 호출
def execute_player_action(instance: str, action: str, payload: dict):
    password = get_admin_password(instance)
    # action url 예: http://.../v1/api/kick
    url = get_pal_rest_url(instance, action)

    log.debug(f"[{action.upper()}] URL={url} | Payload={payload}")

    try:
        resp = requests.post(
            url,
            auth=HTTPBasicAuth(ADIM_USERNAME, password),
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        log.error(f"[{action}] Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Palworld API Error: {str(e)}")

def get_players_raw(instance: str):
    password = get_admin_password(instance)
    url = get_pal_rest_url(instance, "players")
    
    log.debug(f"[--------] URL={url}")
    
    resp = requests.get(
        url,
        auth=HTTPBasicAuth(ADIM_USERNAME, password),
        headers={"Accept": "application/json"},
        timeout=3,
    )
    
    log.debug(f"[======= ] = {resp}")
    
    resp.raise_for_status()
    return resp.json()

# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@router.get("/players/{name}")
def players(name: str, user=Depends(require_auth)):
    """
    플레이어 목록 조회 (모든 필드 포함)
    """
    if not is_instance_running(name):
        return {"status": "STOPPED", "players": []}

    try:
        raw = get_players_raw(name)
        # raw["players"] 안에 name, accountName, ip, ping, location 등 모든 정보가 들어있음
        # 백엔드에서는 필터링 없이 그대로 전달
        
        log.debug(f"[sget_players_raw] = {raw})")
                
        return {
            "status": "RUNNING",
            "count": len(raw.get("players", [])),
            "players": raw.get("players", []),
        }
        
    except requests.exceptions.RequestException as e:
        # 서버 기동 직후에는 API가 응답하지 않을 수 있음
        return {"status": "RUNNING", "players": [], "error": str(e)}


@router.post("/players/kick")
def kick_player(req: PlayerActionReq, user=Depends(require_auth)):
    if not is_instance_running(req.instance):
        raise HTTPException(status_code=400, detail="Instance is not running")
    
    return execute_player_action(req.instance, "kick", {
        "userid": req.userid,
        "message": req.message
    })


@router.post("/players/ban")
def ban_player(req: PlayerActionReq, user=Depends(require_auth)):
    if not is_instance_running(req.instance):
        raise HTTPException(status_code=400, detail="Instance is not running")
    
    return execute_player_action(req.instance, "ban", {
        "userid": req.userid,
        "message": req.message
    })


@router.post("/players/unban")
def unban_player(req: PlayerActionReq, user=Depends(require_auth)):
    if not is_instance_running(req.instance):
        raise HTTPException(status_code=400, detail="Instance is not running")
    
    return execute_player_action(req.instance, "unban", {
        "userid": req.userid
    })
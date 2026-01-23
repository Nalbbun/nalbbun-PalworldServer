from mng.com import log
from mng.auth import verify_access
import subprocess, asyncio
from fastapi import WebSocket, WebSocketDisconnect, APIRouter

router = APIRouter(prefix="/api/ws/logs", tags=["logs"])

# =========================================================
# Logs WebSocket (Ring-buffer FE )
# ========================================================= 

@router.websocket("/{name}")
async def ws_logs(ws: WebSocket, name: str):
    token = ws.query_params.get("token")
    proc = None

    if not token or not verify_access(token):
        await ws.close(code=1008)
        return

    await ws.accept()
    log.info(f"[WS] accepted: {name}")

    try:
        await ws.send_text("[WS] connected, waiting for logs...\n")
    except WebSocketDisconnect:
        log.info("[WS] client disconnected immediately")
        return

    proc = subprocess.Popen(
        ["docker", "logs", "-f", name],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    async def read_logs():
        try:
            while True:
                line = await asyncio.to_thread(proc.stdout.readline)
                if not line:
                    break
                await ws.send_text(line)
        except WebSocketDisconnect:
            log.info("[WS] client disconnected")
        except Exception as e:
            log.error(f"[WS] error: {e}")

    try:
        await read_logs()
    finally:
        log.info(f"[WS] closing: {name}")
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

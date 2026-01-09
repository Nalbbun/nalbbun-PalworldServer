from fastapi import FastAPI, HTTPException, Depends, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from auth import (
    authenticate,
    create_access_token,
    create_refresh_token,
    verify_access,
    verify_refresh, 
    decode_token,
)
from pydantic import BaseModel
from datetime import datetime
from jose import jwt, JWTError
import os, subprocess, logging
import re, shutil, asyncio
import requests, json
from requests.auth import HTTPBasicAuth

app = FastAPI()

log = logging.getLogger("[auth]")
logging.basicConfig(level=logging.INFO)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.getenv("PALSERVER_BASE_DIR", "/PALSERVER_ENT")
APP_BASE_DIR = os.path.join("/app", BASE_DIR.lstrip("/"))
INSTANCE_DIR = os.path.join(APP_BASE_DIR, "instances")
CONTROLLER_DIR = os.path.join(APP_BASE_DIR, "controllers")

print("[BOOT] Backend starting...")
print(f"[BOOT] BASE_DIR      = {BASE_DIR}")
print(f"[BOOT] APP_BASE_DIR      = {APP_BASE_DIR}")
print(f"[BOOT] INSTANCE_DIR  = {INSTANCE_DIR}")
print(f"[BOOT] CONTROLLER_DIR = {CONTROLLER_DIR}")


def run_cmd(cmd: str) -> str:
    try:
        out = subprocess.check_output(
            cmd, shell=True, stderr=subprocess.STDOUT, text=True
        )
        print("[RESULT] Output:")
        print(out)
        return out.strip()
    except subprocess.CalledProcessError as e:
        print("[CMD ERROR]")
        print(e.output)
        raise HTTPException(status_code=500, detail=e.output)


# ---------------------------
# Auth Dependency
# ---------------------------
def require_auth(authorization: str = Header(None)):
    #    log.info(f"[AUTH] Authorization Header = {authorization}")

    if not authorization:
        log.warning("[AUTH] No Authorization header")
        raise HTTPException(status_code=401, detail="No Authorization header")

    if not authorization.startswith("Bearer "):
        log.warning("[AUTH] Invalid scheme")
        raise HTTPException(status_code=401, detail="Invalid auth scheme")

    token = authorization.split(" ", 1)[1]
    user = verify_access(token)

    if not user:
        log.warning("[AUTH] Token verification failed")
        raise HTTPException(status_code=401, detail="Invalid token")

    #    log.info(f"[AUTH] Authenticated user={user}")
    return user


# ---------------------------
# Auth API
# ---------------------------
@app.post("/api/auth/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    user = authenticate(username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token(username),
        "refresh_token": create_refresh_token(username),
        "token_type": "bearer",
    }


@app.post("/api/auth/refresh")
def refresh(data: dict):
    refresh_token = data.get("refresh_token")
    #    log.info(f"[REFRESH] refresh_token={refresh_token}")

    if not refresh_token:
        log.warning("[REFRESH] No refresh token")
        raise HTTPException(status_code=401)

    user = verify_refresh(refresh_token)
    if not user:
        log.warning("[REFRESH] Invalid refresh token")
        raise HTTPException(status_code=401)

    access = create_access_token(user)
    log.info(f"[REFRESH] New access token issued for {user}")

    return {"access_token": access}


@app.post("/api/auth/logout")
def logout():
    #
    return {"status": "success"}


# ---------------------------
# Protected APIs
# ---------------------------


@app.get("/api/instance/{name}/version")
def get_instance_version(name: str, user=Depends(require_auth)):
    if not re.match(r"^[a-zA-Z0-9_-]+$", name):
        raise HTTPException(400, "Invalid instance name")
    compose = os.path.join(APP_BASE_DIR, f"docker-compose-{name}.yml")
    if not os.path.isfile(compose):
        raise HTTPException(404, "Compose not found")

    version = "unknown"
    with open(compose, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("image: palworld_server_steam:"):
                version = line.split(":")[-1]
                break

    return {"instance": name, "version": version}


# instances version list
@app.get("/api/instances/versions")
def list_instances_versions(user=Depends(require_auth)):
    result = {}
    for fn in os.listdir(APP_BASE_DIR):
        if fn.startswith("docker-compose-") and fn.endswith(".yml"):
            name = fn.replace("docker-compose-", "").replace(".yml", "")
            try:
                v = get_instance_version(name, user)["version"]
                result[name] = v
            except:
                result[name] = "unknown"
    return result


# instance select version list
@app.get("/api/instance/versions")
def list_versions(user=Depends(require_auth)):
    repo_dir = os.path.join(APP_BASE_DIR, "offline_repo")

    if not os.path.isdir(repo_dir):
        return {"versions": []}

    versions = []

    for name in sorted(os.listdir(repo_dir)):
        full = os.path.join(repo_dir, name)
        if os.path.isdir(full) or os.path.islink(full):
            versions.append(name)

    if "latest" in versions:
        versions.remove("latest")
        versions.insert(0, "latest")
    return {"versions": versions}


@app.get("/api/instances")
def list_instances(user=Depends(require_auth)):
    if not os.path.isdir(INSTANCE_DIR):
        return {"instances": []}

    instances = sorted(
        [
            d
            for d in os.listdir(INSTANCE_DIR)
            if os.path.isdir(os.path.join(INSTANCE_DIR, d))
        ]
    )

    #    log.info(f"[instances] instances={instances}")
    return {"instances": instances}


@app.get("/api/instance/{name}/status")
def instance_status(name: str, user=Depends(require_auth)):
    cmd = (
        "docker ps --filter "
        f"'name=^{name}$' "
        "--format '{{.Status}}|{{.Ports}}|{{.RunningFor}}'"
    )

    out = run_cmd(cmd).strip()

    if not out:
        return {
            "instance": name,
            "status": "STOPPED",
            "ports": [],
            "uptime": None,
        }

    status, ports_raw, running_for = out.split("|")

    #
    ports = []
    if ports_raw:
        # : 0.0.0.0:18211->8211/udp
        for p in ports_raw.split(","):
            p = p.strip()
            ports.append(p)

    return {
        "instance": name,
        "status": status,
        "ports": ports,
        "uptime": running_for,  # : "2 hours"
    }


@app.post("/api/instance/{name}/start")
def start_instance(name: str, user=Depends(require_auth)):
    compose = f"{APP_BASE_DIR}/docker-compose-{name}.yml"

    log.info(f"[instances] start={compose}")

    if not os.path.exists(compose):
        raise HTTPException(404, "compose file not found")
    cmd = f"docker-compose -f {compose} up -d"
    result = run_cmd(cmd)
    return {"result": result}


@app.post("/api/instance/{name}/stop")
def stop_instance(name: str, user=Depends(require_auth)):
    compose = f"{APP_BASE_DIR}/docker-compose-{name}.yml"

    log.info(f"[instances] stop={compose}")

    if not os.path.exists(compose):
        raise HTTPException(404, "compose file not found")
    cmd = f"docker-compose -f {compose} down"
    result = run_cmd(cmd)
    return {"result": result}


class InstanceCreateRequest(BaseModel):
    name: str
    port: str
    query: str
    version: str


@app.post("/api/instance/create")
def create_instance(req: InstanceCreateRequest, user=Depends(require_auth)):
    script = os.path.join(CONTROLLER_DIR, "instance.sh")

    if not os.path.exists(script):
        raise HTTPException(500, "instance.sh not found")

    cmd = f"bash {script} create {req.name} {req.port} {req.query} {req.version}"

    log.info(f"[instances] create={script}/{cmd}")

    output = run_cmd(cmd)

    return {"status": "created", "output": output}


@app.post("/api/instance/{name}/delete")
def delete_instance(name: str, user=Depends(require_auth)):
    if not re.match(r"^[a-zA-Z0-9_-]+$", name):
        raise HTTPException(400, "Invalid instance name")

    script = os.path.join(CONTROLLER_DIR, "instance.sh")
    cmd = f"bash {script} delete {name}"

    log.info(f"[instances] delete={cmd}")

    output = run_cmd(cmd)
    return {"result": "deleted", "output": output}


class InstanceUpdateRequest(BaseModel):
    name: str
    version: str


@app.post("/api/instance/update")
def update_offline(req: InstanceUpdateRequest, user=Depends(require_auth)):
    name = req.name
    version = req.version

    script = os.path.join(CONTROLLER_DIR, "update.sh")
    cmd = f"bash {script} {version} {name}"

    log.info(f"[instances] update={cmd}")

    result = run_cmd(cmd)
    return {"result": result}


@app.post("/api/instance/{name}/backup")
def backup_instance(name: str, user=Depends(require_auth)):
    script = os.path.join(CONTROLLER_DIR, "backup.sh")
    cmd = f"bash {script} {name} "

    log.info(f"[instances] backup={cmd}")

    result = run_cmd(cmd)
    return {"result": result}


# =========================================================
# Metrics (placeholder   )
# =========================================================
@app.get("/api/metrics/{name}")
def metrics(name: str, user=Depends(require_auth)):
    # : docker stats 1
    cmd = (
        "docker stats --no-stream --format "
        "'{{.Name}} {{.CPUPerc}} {{.MemUsage}}' "
        f"| awk '$1 == \"{name}\" {{print}}'"
    )

    log.info(f"[instances] metrics={cmd}")

    out = run_cmd(cmd).strip()
    if not out:
        return {"cpu": 0, "ram": 0}

    try:
        # : nal 9.96% 1.441GiB / 15.61GiB
        parts = out.split(None, 2)
        cpu_raw = parts[1]  # 9.96%
        mem_raw = parts[2]  # 1.441GiB / 15.61GiB

        cpu_val = float(cpu_raw.replace("%", ""))

        #
        m = re.search(r"([\d\.]+)(KiB|MiB|GiB)", mem_raw)
        if not m:
            ram_val = 0
        else:
            value, unit = m.groups()
            value = float(value)

            # MiB
            if unit == "GiB":
                ram_val = value * 1024
            elif unit == "KiB":
                ram_val = value / 1024
            else:
                ram_val = value

    except Exception as e:
        print("[METRICS PARSE ERROR]", e)
        cpu_val, ram_val = 0, 0

    return {"cpu": round(cpu_val, 2), "ram": round(ram_val, 2)}  # MiB


# =========================================================
# Pal Config APIs
# =========================================================


class ConfigUpdateRequest(BaseModel):
    options: dict


def extract_option_settings_block(text: str) -> tuple[str, int, int] | None:
    key = "OptionSettings=("
    start = text.find(key)
    if start == -1:
        return None

    i = start + len(key)
    depth = 1
    buf = []

    while i < len(text) and depth > 0:
        c = text[i]
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1

        if depth > 0:
            buf.append(c)
        i += 1

    end = i  # ')'
    body = "".join(buf).strip()
    return body, start, end


def parse_option_settings(text: str) -> dict:
    result = extract_option_settings_block(text)
    if not result:
        return {}

    body, _, _ = result

    items = []
    buf = []
    depth = 0

    for c in body:
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1

        if c == "," and depth == 0:
            items.append("".join(buf))
            buf = []
        else:
            buf.append(c)

    if buf:
        items.append("".join(buf))

    data = {}
    for item in items:
        if "=" in item:
            k, v = item.split("=", 1)
            data[k.strip()] = v.strip()

    return data


def render_option_settings(options: dict) -> str:
    pairs = [f"{k}={v}" for k, v in options.items()]
    return "OptionSettings=(" + ",".join(pairs) + ")"


def replace_option_settings(text: str, new_block: str) -> str:
    result = extract_option_settings_block(text)
    if not result:
        raise ValueError("OptionSettings block not found")

    _, start, end = result
    return text[:start] + new_block + text[end:]


@app.get("/api/instance/{name}/config")
def get_config(name: str, user=Depends(require_auth)):
    path = f"{INSTANCE_DIR}/{name}/Saved/Config/LinuxServer/PalWorldSettings.ini"
 
    if not os.path.exists(path):
        log.info(f"[instances] config not found, using default")
        return get_default_config(name, user)
 
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
 
    if not text.strip():
        log.warning(f"[instances] config empty or whitespace-only, using default")
        return get_default_config(name, user)

    #log.info(f"[instances] config config={path}")

    text = open(path).read()
    options = parse_option_settings(text)
    
    #log.info(f"[instances] config text={text}") 

    return {"options": options, "isDefault": False}


@app.get("/api/instance/{name}/defaultconf")
def get_default_config(name: str, user=Depends(require_auth)):
    default_path = f"{INSTANCE_DIR}/DefaultPalWorldSettings.ini"

    #log.info(f"[instances] config defaultconf={default_path}")

    if not os.path.exists(default_path):
        raise HTTPException(404, "Default config not found")

    text = open(default_path).read()
    options = parse_option_settings(text)

    return {"options": options, "isDefault": True}


@app.post("/api/instance/{name}/config")
def update_config(name: str, req: ConfigUpdateRequest, user=Depends(require_auth)):
    path = f"{INSTANCE_DIR}/{name}/Saved/Config/LinuxServer/PalWorldSettings.ini"

    #log.info(f"[instances] config save={path}")

    # config
    os.makedirs(os.path.dirname(path), exist_ok=True)

    original = ""
    if os.path.exists(path):
        original = open(path).read()

    new_block = render_option_settings(req.options)

    # -------------------------------
    #
    # -------------------------------
    if "OptionSettings=(" in original:
        #
        updated = replace_option_settings(original, new_block)
    else:
        #
        updated = "[/Script/Pal.PalGameWorldSettings]\n" f"{new_block}\n"

    # backup (   )
    if os.path.exists(path) and os.stat(path).st_size > 0:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = f"{path}.bak.{ts}"
        shutil.copy(path, backup)
    else:
        backup = None

    with open(path, "w") as f:
        f.write(updated)

    return {"result": "updated", "backup": backup}


@app.post("/api/instance/{name}/config/apply")
def apply_config(name: str, user=Depends(require_auth)):
    compose = f"{APP_BASE_DIR}/docker-compose-{name}.yml"

    #log.info(f"[instances] config apply={compose}")

    if not os.path.exists(compose):
        raise HTTPException(404, "compose file not found")

    #
    status = run_cmd(
        "docker ps --format '{{.Names}}' " f"| awk '$1 == \"{name}\" {{print}}'"
    )

    if not status:
        raise HTTPException(400, "Instance is not running")

    run_cmd(f"docker-compose -f {compose} restart")

    log.info(f"[config] applied (restart) {name}")
    return {"result": "restarted"}

# =========================================================
# Logs WebSocket (Ring-buffer FE )
# ========================================================= 
    
@app.websocket("/api/ws/logs/{name}")
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
     

# =========================================================
# Players (placeholder)
# =========================================================
def is_instance_running(name: str) -> bool:
    out = run_cmd(
        f"docker inspect -f '{{{{.State.Running}}}}' {name} 2>/dev/null"
    )
    return out.strip() == "true"

def get_rest_port(instance: str) -> int:
    cmd = (
        "docker inspect "
        f"{instance} "
        "--format '{{json .NetworkSettings.Ports}}'"
    )

    out = run_cmd(cmd)
    ports = json.loads(out)

    # in 8212/tcp → out port searche 
    if "8212/tcp" not in ports or not ports["8212/tcp"]:
        raise RuntimeError("REST port not exposed")

    return int(ports["8212/tcp"][0]["HostPort"])

def get_pal_rest_endpoint(instance: str) -> str:
    port = get_rest_port(instance)
    return f"http://127.0.0.1:{port}"
 
def get_players(instance : str,username : str, password : str):
    
    base = get_pal_rest_endpoint(instance)
    url = f"{base}/v1/api/players" 

    print(url) 
    resp = requests.get(
        url,
        auth=HTTPBasicAuth(username, password),
        timeout=3
    )
    
    print(resp) 
    resp.raise_for_status()
    return resp.json()

@app.get("/api/players/{name}")
def players(name: str, user=Depends(require_auth)):
    # 1. instance run?
    if not is_instance_running(name):
        return {
            "status": "STOPPED",
            "raw": None
        }
    # 2. call Palworld REST API
    try:
        print("[players] Output:") 
        raw = get_players(name, "admin", "admin")        
        print(raw) 
    except requests.exceptions.RequestException as e: 
        raise HTTPException(
            status_code=502,
            detail=f"Palworld REST API error: {e}"
        )
        
    return {
        "status": "RUNNING",
        "raw": raw
    }
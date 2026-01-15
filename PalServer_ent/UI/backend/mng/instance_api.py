from mng.com import INSTANCE_DIR, SERVER_ROOT, CONTROLLER_DIR, log, run_cmd
from mng.server_api import get_server_info
from mng.docker_utils import (
    is_instance_stop,
    is_instance_start,
    is_instance_state,
)
from mng.auth import require_auth
from fastapi import HTTPException, Depends, APIRouter
import os, re
from pydantic import BaseModel


router = APIRouter(prefix="/api/instance", tags=["instance"])


# instance version
@router.get("/{name}/version")
def get_instance_version(name: str, user=Depends(require_auth)):

    if not re.match(r"^[a-zA-Z0-9_-]+$", name):
        raise HTTPException(400, "Invalid instance name")

    compose = os.path.join(SERVER_ROOT, f"docker-compose-{name}.yml")

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
@router.get("/insversions")
def list_instances_versions(user=Depends(require_auth)):
    result = {}
    for fn in os.listdir(SERVER_ROOT):
        if fn.startswith("docker-compose-") and fn.endswith(".yml"):
            name = fn.replace("docker-compose-", "").replace(".yml", "")
            try:
                v = get_instance_version(name, user)["version"]
                result[name] = v
            except:
                result[name] = "unknown"
    return result


# instance select version list
@router.get("/selectversions")
def list_versions(user=Depends(require_auth)):
    repo_dir = os.path.join(SERVER_ROOT, "repo")

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


@router.get("/instancelist")
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


@router.get("/{name}/status")
def instance_status(name: str, user=Depends(require_auth)):

    out = is_instance_state(name)

    status, ports_raw, running_for = out.split("|")
    #
    ports = []
    if ports_raw:
        for p in ports_raw.split(","):
            p = p.strip()
            ports.append(p)

    #
    info = None
    try:
        info = get_server_info(name)
    except Exception:
        info = None

    #
    if not out:
        return {
            "instance": name,
            "status": "STOPPED",
            "uptime": None,
            "ports": [],
            "info": None,
        }

    return {
        "instance": name,
        "status": status,
        "uptime": running_for,
        "ports": ports,
        "info": info,
    }


@router.post("/{name}/start")
def start_instance(name: str, user=Depends(require_auth)):
    compose = f"{SERVER_ROOT}/docker-compose-{name}.yml"

    log.info(f"[instances] start={compose}")

    if not os.path.exists(compose):
        raise HTTPException(404, "compose file not found")

    result = is_instance_start(compose)
    return {"result": result}


@router.post("/{name}/stop")
def stop_instance(name: str, user=Depends(require_auth)):
    compose = f"{SERVER_ROOT}/docker-compose-{name}.yml"

    log.info(f"[instances] stop={compose}")

    if not os.path.exists(compose):
        raise HTTPException(404, "compose file not found")

    result = is_instance_stop(compose)
    return {"result": result}


class InstanceCreateRequest(BaseModel):
    name: str
    port: str
    query: str
    version: str


@router.post("/create")
def create_instance(req: InstanceCreateRequest, user=Depends(require_auth)):
    script = os.path.join(CONTROLLER_DIR, "instance.sh")

    if not os.path.exists(script):
        raise HTTPException(500, "instance.sh not found")

    cmd = f"bash {script} create {req.name} {req.port} {req.query} {req.version}"

    log.info(f"[instances] create={script}/{cmd}")

    output = run_cmd(cmd)

    return {"status": "created", "output": output}


@router.post("/{name}/delete")
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


@router.post("/update")
def update_offline(req: InstanceUpdateRequest, user=Depends(require_auth)):
    name = req.name
    version = req.version

    script = os.path.join(CONTROLLER_DIR, "update.sh")
    cmd = f"bash {script} {version} {name}"

    log.info(f"[instances] update={cmd}")

    result = run_cmd(cmd)
    return {"result": result}


@router.post("/{name}/backup")
def backup_instance(name: str, user=Depends(require_auth)):
    script = os.path.join(CONTROLLER_DIR, "backup.sh")
    cmd = f"bash {script} {name} "

    log.info(f"[instances] backup={cmd}")

    result = run_cmd(cmd)
    return {"result": result}

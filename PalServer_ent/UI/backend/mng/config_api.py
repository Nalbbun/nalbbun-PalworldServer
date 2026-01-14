from mng.com import INSTANCE_DIR, SERVER_ROOT, log
from mng.auth import require_auth
from mng.docker_utils import is_instance_status, is_instance_restart
from fastapi import HTTPException, Depends, APIRouter
from pydantic import BaseModel
from datetime import datetime
import os, shutil

router = APIRouter(prefix="/api/config", tags=["config"])


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


@router.get("/{name}")
def get_config(name: str, user=Depends(require_auth)):
    path = f"{INSTANCE_DIR}/{name}/Config/LinuxServer/PalWorldSettings.ini"

    if not os.path.exists(path):
        log.info(f"[instances] config not found, using default")
        return get_default_config(name, user)

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    if not text.strip():
        log.warning(f"[instances] config empty or whitespace-only, using default")
        return get_default_config(name, user)

    # log.info(f"[instances] config config={path}")

    text = open(path).read()
    options = parse_option_settings(text)

    # log.info(f"[instances] config text={text}")

    return {"options": options, "isDefault": False}


@router.get("/defalut/{name}/")
def get_default_config(name: str, user=Depends(require_auth)):
    default_path = f"{INSTANCE_DIR}/DefaultPalWorldSettings.ini"

    # log.info(f"[instances] config defaultconf={default_path}")

    if not os.path.exists(default_path):
        raise HTTPException(404, "Default config not found")

    text = open(default_path).read()
    options = parse_option_settings(text)

    return {"options": options, "isDefault": True}


@router.post("/{name}")
def update_config(name: str, req: ConfigUpdateRequest, user=Depends(require_auth)):
    path = f"{INSTANCE_DIR}/{name}/Config/LinuxServer/PalWorldSettings.ini"

    # log.info(f"[instances] config save={path}")

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


@router.post("/apply/{name}")
def apply_config(name: str, user=Depends(require_auth)):
    compose = f"{SERVER_ROOT}/docker-compose-{name}.yml"

    # log.info(f"[instances] config apply={compose}")

    if not os.path.exists(compose):
        raise HTTPException(404, "compose file not found")

    # instancd status
    status = is_instance_status(name)

    if not status:
        raise HTTPException(400, "Instance is not running")

    # restart instance
    is_instance_restart(compose)

    log.info(f"[config] applied (restart) {name}")

    return {"result": "restarted"}

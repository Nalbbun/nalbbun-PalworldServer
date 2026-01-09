from mng.com import log
from mng.auth import require_auth
from mng.docker_utils import is_instance_resource
from fastapi import Depends, APIRouter
import re


router = APIRouter(prefix="/api/metrics", tags=["metrics"])


# =========================================================
# Metrics (placeholder   )
# =========================================================
@router.get("/{name}")
def metrics(name: str, user=Depends(require_auth)):
    # : docker stats 1

    out = is_instance_resource(name)

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

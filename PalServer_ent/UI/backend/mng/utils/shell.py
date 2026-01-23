# mng/utils/shell.py
import subprocess
from fastapi import HTTPException
from mng.core.config import log


def run_cmd(cmd: str) -> str:
    try:
        log.debug(f"[CMD EXEC] {cmd}")

        out = subprocess.check_output(
            cmd, shell=True, stderr=subprocess.STDOUT, text=True
        )

        log.debug(f"[CMD RESULT] : {out} ")

        return out.strip()
    except subprocess.CalledProcessError as e:
        log.error(f"[CMD FAILED] {cmd}")
        log.error(f"[CMD ERROR OUT] {e.output}")
        raise HTTPException(status_code=500, detail=e.output)

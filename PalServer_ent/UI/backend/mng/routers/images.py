import os
import shutil
import re
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from mng.core.config import SERVER_ROOT, COMD_ROOT, log
from mng.routers.auth import require_auth
from mng.utils.shell import run_cmd

router = APIRouter(prefix="/api/images", tags=["images"])

REPO_DIR = os.path.join(SERVER_ROOT, "repo")
MAKE_IMG_DIR = os.path.join(COMD_ROOT, "make-pal-images")


class ImageReq(BaseModel):
    version: str


@router.get("/list")
def list_images(user=Depends(require_auth)):
    """repo 폴더의 manifest.json을 읽어 이미지 목록 반환"""
    if not os.path.exists(REPO_DIR):
        return {"images": [], "latest": ""}

    images = []

    # 1. 폴더 순회
    for name in sorted(os.listdir(REPO_DIR), reverse=True):
        path = os.path.join(REPO_DIR, name)

        # 버전 폴더인지 확인 (v숫자...)
        if os.path.isdir(path) and name.startswith("v"):
            manifest_path = os.path.join(path, "manifest.json")
            info = {
                "version": name,
                "built": "Unknown",
                "docker_image": "",
                "path": path,
            }

            # 2. manifest.json 파싱
            if os.path.exists(manifest_path):
                try:
                    with open(manifest_path, "r") as f:
                        data = json.load(f)
                        info["built"] = data.get("built", "Unknown")
                        info["docker_image"] = data.get("docker_image", "")
                except Exception as e:
                    log.error(f"[IMAGE] Failed to read manifest for {name}: {e}")

            images.append(info)

    # 3. Latest 심볼릭 링크 확인
    latest_path = os.path.join(REPO_DIR, "latest")
    latest_ver = ""
    if os.path.islink(latest_path):
        target = os.readlink(latest_path)
        latest_ver = os.path.basename(target)

    return {"images": images, "latest": latest_ver}


@router.post("/build")
def build_image(req: ImageReq, user=Depends(require_auth)):
    """이미지 빌드 실행"""
    version = req.version
    if not re.match(r"^v[0-9]+\.[0-9]+\.[0-9]+$", version):
        raise HTTPException(400, "Invalid version format (ex: v1.0.0)")

    # build.sh
    cmd = f"cd {MAKE_IMG_DIR} && /bin/bash build.sh {version}"

    log.info(f"[IMAGE] Build start: {version} by {user}")

    try:
        # 빌드 시간이 길 수 있으므로 주의 (Nginx 타임아웃 넉넉히 설정 필요)
        output = run_cmd(cmd)
        return {"result": "success", "output": output}
    except Exception as e:
        log.error(f"[IMAGE BUILD ERROR] {e}")
        # 실패 시 에러 메시지 반환
        raise HTTPException(500, f"Build failed. Check logs.")


@router.post("/delete")
def delete_image(req: ImageReq, user=Depends(require_auth)):
    """이미지 및 폴더 삭제"""
    version = req.version
    target_dir = os.path.join(REPO_DIR, version)

    if not os.path.exists(target_dir):
        raise HTTPException(404, "Version not found")

    # 1. Docker 이미지 삭제 시도 (manifest 참조)
    manifest_path = os.path.join(target_dir, "manifest.json")
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r") as f:
                data = json.load(f)
                img_tag = data.get("docker_image")
                if img_tag:
                    run_cmd(f"docker rmi {img_tag}")
        except:
            pass  # 이미지가 없거나 사용 중이면 무시

    # 2. 폴더 삭제
    try:
        shutil.rmtree(target_dir)
        log.info(f"[IMAGE] Deleted {version}")
        return {"result": "deleted", "version": version}
    except Exception as e:
        raise HTTPException(500, f"Delete failed: {e}")

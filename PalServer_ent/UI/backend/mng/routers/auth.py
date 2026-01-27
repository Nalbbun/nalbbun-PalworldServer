from fastapi import HTTPException, Header, APIRouter, Depends
from pydantic import BaseModel
from jose import JWTError, jwt
import json, os
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from mng.core.config import (
    log,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from mng.db.database import get_db
from mng.db.db_crud import get_user_by_username, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

# =========================
# JWT CONFIG (단일 소스)
# =========================

if not isinstance(SECRET_KEY, str):
    raise RuntimeError("SECRET_KEY must be a string")


class PasswordVerifyReq(BaseModel):
    password: str


# ---------------------------
# Token Create
# ---------------------------
def _create_token(payload: dict, expires_delta: timedelta):
    expire = datetime.utcnow() + expires_delta
    payload = payload.copy()
    payload.update({"exp": expire})

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(username: str, role: str = "op") -> str:
    return _create_token(
        {"sub": username, "type": "access", "role": role}, 
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

def create_refresh_token(username: str) -> str:
    return _create_token(
        {"sub": username, "type": "refresh"},
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


# ---------------------------
# Token Validation (공용)
# ---------------------------
def decode_token(token: str) -> dict | None:
    if not isinstance(token, str):
        return None

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        return None


def verify_access(token: str) -> str | None:
    payload = decode_token(token)
    if not payload:
        return None

    if payload.get("type") != "access":
        return None

    return payload.get("sub")


def verify_refresh(token: str) -> str | None:
    payload = decode_token(token)
    if not payload:
        return None

    if payload.get("type") != "refresh":
        return None

    return payload.get("sub")


# ---------------------------
# Auth Dependency
# ---------------------------
def require_auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    #    log.info(f"[AUTH] Authorization Header = {authorization}")

    if not authorization:
        log.warning("[AUTH] No Authorization header")
        raise HTTPException(status_code=401, detail="No Authorization header")

    if not authorization.startswith("Bearer "):
        log.warning("[AUTH] Invalid scheme")
        raise HTTPException(status_code=401, detail="Invalid auth scheme")

    token = authorization.split(" ", 1)[1]
    userToken = verify_access(token)

    if not userToken:
        log.warning("[AUTH] Token verification failed")
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_username(db, userToken)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ---------------------------
# Auth API
# ---------------------------
@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    user = get_user_by_username(db, username)

    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    log.info(f"[Login] User '{username}' logged in.")
    # role 정보가 있다면 반환, 없으면 기본값(op) 처리 (DB 스키마 확인 필요)
    user_role = getattr(user, "role", "op") 
    if not user_role: 
        user_role = "op"

    log.debug(f"[Login] User '{username}' logged in as '{user_role}' ")

    return {
        "access_token": create_access_token(username),
        "refresh_token": create_refresh_token(username),
        "token_type": "bearer",
        "username": username,  
        "role": user_role      
    }


@router.post("/refresh")
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


@router.post("/verify-password")
def verify_password_api(
    body: PasswordVerifyReq,
    user=Depends(require_auth),
):
    # 1. require_auth가 이미 유저를 찾아왔으므로,
    #    get_user_by_username()을 다시 호출할 필요가 없습니다. (코드 삭제)

    # 2. 바로 검증 수행 (user.password에는 DB의 해시값이 들어있습니다)
    ok = verify_password(body.password, user.password)

    return {
        "verified": ok,
        "reason": None if ok else "invalid_password",
    }


@router.post("/logout")
def logout(user=Depends(require_auth)):
    log.info(f"[logout] User '{user}' logged out.")
    return {"status": "success"}

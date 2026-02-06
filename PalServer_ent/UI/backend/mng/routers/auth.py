from fastapi import HTTPException, Header, APIRouter, Depends
from pydantic import BaseModel
from jose import JWTError, jwt
import json, os
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from mng.core.config import (
    log,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from mng.db.database import get_db, User
from mng.db import db_crud

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RefreshTokenReq(BaseModel):
    refresh_token: str


class UserCreateReq(BaseModel):
    username: str
    password: str
    role: str = "operator"  # admin or operator


class UserListResp(BaseModel):
    id: int
    username: str
    role: str


class UserUpdateReq(BaseModel):
    password: Optional[str] = None  # 비워두면 변경 안 함
    role: Optional[str] = None  # 비워두면 변경 안 함


class Config:
    orm_mode = True


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


def create_access_token(username: str, role: str) -> str:
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

    user = db_crud.get_user_by_username(db, userToken)

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

    user = db_crud.get_user_by_username(db, username)

    if not user or not db_crud.verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    log.info(f"[Login] User '{username}' logged in.")
    # role 정보가 있다면 반환, 없으면 기본값(operator) 처리 (DB 스키마 확인 필요)
    user_role = getattr(user, "role", "operator")
    if not user_role:
        user_role = "operator"

    log.debug(f"[Login] User '{username}' logged in as '{user_role}' ")

    return {
        "access_token": create_access_token(username, user_role),
        "refresh_token": create_refresh_token(username),
        "token_type": "bearer",
        "username": username,
        "role": user_role,
    }


@router.post("/refresh")
def refresh(req: RefreshTokenReq, db: Session = Depends(get_db)):
    # 1. 리프레시 토큰 검증
    username = verify_refresh(req.refresh_token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # 2. [추가] DB에서 최신 사용자 정보(Role 포함) 조회
    # 토큰 갱신 시점의 최신 권한을 반영하기 위해 DB 조회가 안전합니다.
    user = db_crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # 3. [수정] role 인자 추가하여 액세스 토큰 생성
    # 기존: access_token = create_access_token(username)
    access_token = create_access_token(username, role=user.role)

    return {
        "access_token": access_token,
        "refresh_token": req.refresh_token,  # 리프레시 토큰은 재사용 (또는 로테이션 정책에 따라 재발급 가능)
        "token_type": "bearer",
        "role": user.role,  # [선택] 클라이언트 편의를 위해 role도 같이 반환하면 좋음
    }


@router.post("/verify-password")
def verify_password_api(
    body: PasswordVerifyReq,
    user=Depends(require_auth),
):
    # 1. require_auth가 이미 유저를 찾아왔으므로,
    #    get_user_by_username()을 다시 호출할 필요가 없습니다. (코드 삭제)

    # 2. 바로 검증 수행 (user.password에는 DB의 해시값이 들어있습니다)
    ok = db_crud.verify_password(body.password, user.password)

    return {
        "verified": ok,
        "reason": None if ok else "invalid_password",
    }


@router.post("/logout")
def logout(user=Depends(require_auth)):
    log.info(f"[logout] User '{user}' logged out.")
    return {"status": "success"}


# =========================
# [추가] User Management API
# =========================


@router.post("/register")
def register_user(
    req: UserCreateReq,
    current_user=Depends(require_auth),
    db: Session = Depends(get_db),
):
    # 관리자만 생성 가능
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    # 중복 확인
    existing = db_crud.get_user_by_username(db, req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # 해싱 및 저장
    hashed_pw = db_crud.pwd_context.hash(req.password)

    # DB 모델 객체 생성 (프로젝트 구조에 맞게 수정 필요)
    new_user = User(username=req.username, password=hashed_pw, role=req.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log.debug(
        f"[UserMgmt] Admin '{current_user.username}' created user '{req.username}' ({req.role})"
    )
    return {"status": "success", "username": new_user.username}


@router.get("/user")
def list_users(current_user=Depends(require_auth), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # crud 함수 호출
    return db_crud.get_users(db)


@router.delete("/delete/{username}")
def delete_user_api(
    username: str, current_user=Depends(require_auth), db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # crud 함수 호출
    success = db_crud.delete_user(db, username)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    return {"status": "deleted"}


@router.get("/users", response_model=List[UserListResp])
def get_all_users(current_user=Depends(require_auth), db: Session = Depends(get_db)):
    # 관리자만 조회 가능
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    # 혹은 Raw SQL 사용 가능
    users = db.query(User).all()
    return users


@router.put("/update/{username}")
def modify_user(
    username: str,
    req: UserUpdateReq,
    current_user=Depends(require_auth),
    db: Session = Depends(get_db),
):
    # 관리자만 수행 가능
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    # DB 업데이트 수행
    result = db_crud.update_user(db, username, password=req.password, role=req.role)

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    log.debug(f"[UserMgmt] Admin '{current_user.username}' updated user '{username}'")

    return {"status": "success", "username": username}

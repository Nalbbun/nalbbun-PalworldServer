from mng.com import log
from datetime import datetime, timedelta
from fastapi import HTTPException, Header, APIRouter, Depends
from pydantic import BaseModel
from jose import JWTError, jwt
import json, os

router = APIRouter(prefix="/api/auth", tags=["auth"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_DB = f"/app/users.json"

# =========================
# JWT CONFIG (단일 소스)
# =========================
SECRET_KEY = os.getenv("SECRET_KEY", "nalbbun-palworld-secret-key")
ALGORITHM = "HS256"

if not isinstance(SECRET_KEY, str):
    raise RuntimeError("SECRET_KEY must be a string")

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


class PasswordVerifyReq(BaseModel):
    password: str


# ---------------------------
# User DB Loader
# ---------------------------
def load_users():
    if not os.path.exists(USER_DB):
        raise RuntimeError(f"User DB missing: {USER_DB}")

    with open(USER_DB, "r") as f:
        return json.load(f)


# ---------------------------
# Authentication
# ---------------------------
def authenticate(username: str, password: str):
    users = load_users()
    for user in users:
        if user["username"] == username and user["password"] == password:
            return user
    return None


def verify_password(username: str, password: str) -> bool:
    return authenticate(username, password) is not None


# ---------------------------
# Token Create
# ---------------------------
def _create_token(payload: dict, expires_delta: timedelta):
    expire = datetime.utcnow() + expires_delta
    payload = payload.copy()
    payload.update({"exp": expire})

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(username: str) -> str:
    return _create_token(
        {"sub": username, "type": "access"},
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
@router.post("/login")
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
def verify_password_api(body: PasswordVerifyReq, user=Depends(require_auth)):
    if not verify_password(user, body.password):
        raise HTTPException(401, "Invalid password")
    return {"ok": True}


@router.post("/logout")
def logout():
    #
    return {"status": "success"}

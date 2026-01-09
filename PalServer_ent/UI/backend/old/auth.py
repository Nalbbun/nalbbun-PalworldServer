import json
import os
from datetime import datetime, timedelta
from jose import jwt, JWTError

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_DB = os.path.join(BASE_DIR, "users.json")

# =========================
# JWT CONFIG (단일 소스)
# =========================
SECRET_KEY = os.getenv("SECRET_KEY", "palworld-secret-key")
ALGORITHM = "HS256"

if not isinstance(SECRET_KEY, str):
    raise RuntimeError("SECRET_KEY must be a string")

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


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
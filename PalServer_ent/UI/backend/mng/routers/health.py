from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "service": "paladmin-backend"}


@router.get("/ready")
def ready():
    return {"status": "ready", "service": "paladmin-backend"}


@router.get("/ping")
def ping():
    return {"status": "pong", "service": "paladmin-backend"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mng.core.config import log
from mng.routers.health import router as health_router
from mng.routers.logs import router as logs_router
from mng.routers.auth import router as auth_router
from mng.routers.metrics import router as metrics_router
from mng.routers.config import router as config_router
from mng.routers.instance import router as instance_router
from mng.routers.server import router as server_router
from mng.routers.images import router as images_router
from mng.db.db_init import init_db

app = FastAPI()


@app.on_event("startup")
def startup_event():
    # 분리된 초기화 로직 호출
    init_db("/app/users.json")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(instance_router)
app.include_router(logs_router)
app.include_router(metrics_router)
app.include_router(config_router)
app.include_router(server_router)
app.include_router(images_router)

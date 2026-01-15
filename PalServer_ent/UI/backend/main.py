from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mng.com import log
from mng.health import router as health_router
from mng.logs import router as logs_router
from mng.auth import router as auth_router
from mng.metrics import router as metrics_router
from mng.config_api import router as config_router
from mng.instance_api import router as instance_router
from mng.server_api import router as server_router


app = FastAPI()
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

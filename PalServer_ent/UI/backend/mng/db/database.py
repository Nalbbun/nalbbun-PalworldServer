import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from mng.core.config import log

# ---------------------------------------------------------
# 1. SQLite Connection Config
# ---------------------------------------------------------
BASE_DIR = os.getenv("PALSERVER_BASE_DIR", "PalServer_ent")
# DB 파일 경로: /app/PalServer_ent/server/paladmin.db
DB_PATH = f"/app/{BASE_DIR}/server/sqldb/paladmin.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLite Thread Check 비활성화 (FastAPI 비동기 처리를 위해 필수)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------
# 2. Models (Table Schema)
# ---------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)


class PlayerEvent(Base):
    __tablename__ = "player_events"

    id = Column(Integer, primary_key=True, index=True)
    instance = Column(String, index=True)  # 인스턴스 이름
    userid = Column(String, index=True)  # SteamID
    name = Column(String)  # 플레이어 이름 (기록용)
    action = Column(String)  # "KICK", "BAN", "UNBAN"
    reason = Column(String)  # 사유
    timestamp = Column(DateTime, default=datetime.now)

    # 밴의 경우 현재 유효한지 여부 (Unban하면 False로 변경)
    is_active = Column(Boolean, default=True)


# ---------------------------------------------------------
# 3. Dependency (FastAPI용)
# ---------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

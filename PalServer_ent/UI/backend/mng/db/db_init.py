import os
import json
from mng.db.database import Base, engine, SessionLocal, DB_PATH, User
from mng.db.db_crud import create_user
from mng.core.config import log


def init_db(json_path: str = None):
    """
    1. DB 테이블 생성 (없으면)
    2. users.json 파일이 존재하면 DB로 마이그레이션
    3. 계정이 하나도 없으면 기본 admin 생성
    """
    try:
        # DB 디렉토리 생성
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

        # 테이블 생성 (Create Tables)
        Base.metadata.create_all(bind=engine)
        log.info(f"[DB] Initialized at: {DB_PATH}")

        db = SessionLocal()

        # 데이터 확인 및 마이그레이션
        if db.query(User).count() == 0:            
            # 1. JSON 마이그레이션 시도
            if json_path and os.path.exists(json_path):
                
                log.debug(f"[DB] Migrating users from {json_path}...")
                
                try:
                    with open(json_path, "r") as f:
                        users_data = json.load(f)

                    for u in users_data:
                        # db_crud의 create_user 재사용 (해싱 자동 처리)
                        create_user(db, u["username"], u["password"], u["role"])

                    log.info("[DB] Migration completed.")
                    # 마이그레이션 후 파일명 변경 (중복 실행 방지)
                    os.rename(json_path, json_path + ".migrated")

                except Exception as e:
                    log.error(f"[DB MIGRATION FAILED] {e}")

            # 2. JSON도 없고 DB도 비어있으면 -> 기본 Admin 생성
            else:
                log.info("[DB] Creating default admin user.")
                create_user(db, "admin", "admin1!", role="admin")
                create_user(db, "op", "op1!", role="operator")

        db.close()

    except Exception as e:
        log.error(f"[DB INIT FATAL ERROR] {e}")

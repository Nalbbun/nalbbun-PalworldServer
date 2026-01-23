PalServer Enterprise - Backend API
PalServer Enterprise의 백엔드 시스템은 FastAPI 프레임워크를 기반으로 구축되었으며, Palworld 데디케이티드 서버의 수명주기 관리, 설정 제어, 시스템 모니터링을 담당하는 RESTful API 서버입니다.Docker Container 제어와 리눅스 Shell Script 실행을 담당하며, SQLite 데이터베이스를 통해 사용자 및 시스템 데이터를 관리합니다.🏗 Architecture & Directory Structure이 프로젝트는 유지보수성과 확장성을 위해 Layered Architecture를 채택하고 있습니다.Bashbackend/
├── main.py                  # [Entry] 앱 실행 진입점 및 라우터 통합
├── Dockerfile               # 백엔드 컨테이너 이미지 빌드 명세
├── requirements.txt         # Python 의존성 패키지 목록
└── mng/                     # [Package Root] 메인 패키지
    ├── core/                # [Core] 전역 설정 및 공통 모듈
    │   ├── config.py        # 환경변수, 로깅 설정, 기본 경로 정의
    │   └── ...
    ├── db/                  # [Database] 데이터베이스 계층 (SQLite + SQLAlchemy)
    │   ├── database.py      # DB 연결 세션 및 모델 정의
    │   ├── db_crud.py       # CRUD 쿼리 로직
    │   └── db_init.py       # 초기화 및 JSON 마이그레이션 로직
    ├── routers/             # [Routers] API 엔드포인트 정의
    │   ├── auth.py          # JWT 로그인 및 토큰 발급
    │   ├── instance.py      # 서버 인스턴스 생성/삭제/제어
    │   ├── server.py        # Palworld REST API 연동
    │   ├── logs.py          # WebSocket 실시간 로그 스트리밍
    │   └── ...
    └── utils/               # [Utils] 비즈니스 로직 및 외부 시스템 제어
        ├── docker.py        # Docker Engine 제어 함수
        └── shell.py         # Shell Script 실행 및 결과 처리
🚀 Getting StartedPrerequisitesPython 3.9+Docker & Docker Compose (호스트의 Docker Socket 공유 필요)SQLite (내장 라이브러리 사용)Installation (Local Dev)가상환경 생성 및 활성화Bashpython -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
의존성 설치Bashpip install -r requirements.txt
환경 변수 설정 (Optional)개발 환경에 맞게 환경 변수를 설정합니다. (기본값 내장됨)Bashexport PALSERVER_BASE_DIR="PalServer_ent"
export LOG_LEVEL="DEBUG"  # INFO or DEBUG
서버 실행Bashuvicorn main:app --reload --host 0.0.0.0 --port 8000
🔑 Key Features & Modules1. Authentication (mng/routers/auth.py, mng/db)SQLite 기반 관리: 기존 users.json 파일을 자동으로 감지하여 SQLite DB(paladmin.db)로 마이그레이션합니다.JWT: Access/Refresh Token 기반의 보안 인증을 제공합니다.Security: 비밀번호는 bcrypt로 해싱되어 저장됩니다.2. Instance Management (mng/routers/instance.py, mng/utils)Docker Control: mng/utils/docker.py를 통해 컨테이너의 상태(Start/Stop/Restart)를 제어합니다.Shell Execution: mng/utils/shell.py를 통해 호스트의 스크립트(backup.sh, update.sh)를 안전하게 실행합니다.Command Injection 방지: 인스턴스 이름 등에 대한 엄격한 정규식 검증을 수행합니다.3. Server Interaction (mng/routers/server.py)Palworld REST API: 게임 서버 내부 API와 통신하여 실시간 플레이어 목록 조회, 공지사항 전송(Broadcast), 월드 저장(Save) 기능을 수행합니다.4. Monitoring & Logs (mng/routers/metrics.py, logs.py)WebSocket Logs: docker logs -f 명령의 출력을 WebSocket을 통해 프론트엔드로 실시간 스트리밍합니다.Metrics: 컨테이너의 CPU/Memory 사용량을 실시간으로 수집합니다.⚙️ Configuration (mng/core/config.py)서버의 동작 방식은 환경 변수로 제어됩니다.VariableDefaultDescriptionPALSERVER_BASE_DIRPalServer_ent호스트의 프로젝트 루트 디렉토리명LOG_LEVELINFO로깅 레벨 (DEBUG, INFO, WARNING, ERROR)DB_PATH/app/.../paladmin.dbSQLite 데이터베이스 파일 경로SECRET_KEY(Random String)JWT 서명용 비밀키 (프로덕션 필수 변경)🛠 Database Initialization서버가 시작될 때(startup_event), mng/db/db_init.py가 실행됩니다.SQLite 테이블이 없으면 자동 생성합니다.users.json 파일이 존재하면 데이터를 DB로 이관하고, 파일명을 users.json.migrated로 변경합니다.계정이 하나도 없으면 초기 관리자(admin / admin)를 생성합니다.Note: 이 백엔드는 PalServer Enterprise 프로젝트의 일부이며, 독립적으로 실행되기보다는 docker-compose 환경 내에서 Nginx 및 Frontend와 함께 동작하도록 설계되었습니다.
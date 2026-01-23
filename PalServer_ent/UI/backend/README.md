# PalServer Enterprise - Backend API

PalServer Enterprise의 백엔드 시스템은 **FastAPI**를 기반으로 구축된 RESTful API 서버입니다.
Palworld 데디케이티드 서버의 수명주기 관리, Docker 컨테이너 제어, 시스템 모니터링, 그리고 사용자 인증을 담당합니다.

본 프로젝트는 유지보수성과 확장성을 위해 **계층형 아키텍처(Layered Architecture)**로 설계되었습니다.

---

## 📂 디렉토리 구조 (Directory Structure)

소스 코드는 역할에 따라 명확하게 분리되어 있습니다.

```bash
backend/
├── main.py                  # [Entry] 앱 실행 진입점 및 라우터 통합
├── Dockerfile               # 백엔드 컨테이너 빌드 명세
├── requirements.txt         # Python 의존성 패키지 목록
└── mng/                     # [Package Root] 메인 패키지
    ├── core/                # [Core] 설정 및 공통 모듈
    │   ├── config.py        # 환경변수, 로깅 설정, 기본 경로 정의
    │   └── ...
    ├── db/                  # [Database] 데이터베이스 계층 (SQLite)
    │   ├── database.py      # DB 연결 세션 및 모델 정의
    │   ├── db_crud.py       # 데이터 처리(CRUD) 로직
    │   └── db_init.py       # 초기화 및 JSON 마이그레이션 로직
    ├── routers/             # [Routers] API 엔드포인트 (Controller)
    │   ├── auth.py          # JWT 로그인 및 인증
    │   ├── instance.py      # 서버 인스턴스 관리
    │   ├── server.py        # Palworld REST API 연동
    │   ├── logs.py          # WebSocket 로그 스트리밍
    │   └── metrics.py       # 시스템 리소스 모니터링
    └── utils/               # [Utils] 기능 구현체
        ├── docker.py        # Docker Engine 제어 함수
        └── shell.py         # Shell Script 실행 및 결과 처리

🚀 시작하기 (Getting Started)
사전 요구사항 (Prerequisites)
Python 3.11 이상
Docker & Docker Compose (호스트의 Docker Socket 마운트 필수)
설치 및 실행 
(Local Development)가상환경 생성 및 활성화
Bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
의존성 설치
Bash
pip install -r requirements.txt
환경 변수 설정 (선택 사항)
Bash
export PALSERVER_BASE_DIR="PalServer_ent"
export LOG_LEVEL="DEBUG"  # INFO 또는 DEBUG
서버 실행
Bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000

🔑 주요 기능 (Key Features)
1. 인증 및 보안 (Authentication)
SQLite 기반 관리: 서버 시작 시 users.json 파일을 감지하여 DB로 자동 마이그레이션합니다.
JWT 보안: Access/Refresh Token 방식을 사용하며, 비밀번호는 bcrypt로 암호화됩니다.

2. 인스턴스 관리 (Instance Management)
Docker 제어: 컨테이너의 시작, 중지, 재시작 상태를 실시간으로 관리합니다.
스크립트 실행: 호스트의 쉘 스크립트(backup.sh, update.sh)를 안전하게 호출합니다.
보안: 인스턴스 이름에 대한 엄격한 정규식 검증으로 Command Injection을 차단합니다.

3. 서버 연동 (Server Interaction)
REST API 통신: Palworld 내부 API와 통신하여 플레이어 목록 조회, 공지사항 전송, 월드 저장 기능을 수행합니다.

4. 모니터링 (Monitoring)
실시간 로그: WebSocket을 통해 Docker 로그를 웹 브라우저로 스트리밍합니다.
리소스 감시: 컨테이너별 CPU 및 메모리 사용량을 수집합니다.

⚙️ 설정 (Configuration)
mng/core/config.py에서 관리되며, 주요 설정은 환경 변수로 제어됩니다.
변수명 (Env Variable)기본값 
(Default)설명
PALSERVER_BASE_DIR
PalServer_ent호스트의 프로젝트 루트 디렉토리
LOG_LEVELINFO로깅 레벨 (DEBUG, INFO)
DB_PATH/app/.../paladmin.db
SQLite DB 파일 경로SECRET_KEY(Random)
JWT 서명 키 (프로덕션 환경 변경 권장)

🛠 데이터베이스 초기화 (DB Initialization)
앱이 시작될 때(startup_event) mng/db/db_init.py가 자동으로 실행됩니다.
테이블 생성: SQLite DB 파일이 없으면 자동으로 생성합니다.
마이그레이션: users.json 파일이 발견되면 데이터를 DB로 옮기고 파일명을 변경합니다.
초기 계정: 계정이 하나도 없으면 기본 관리자(admin / admin)를 생성합니다.
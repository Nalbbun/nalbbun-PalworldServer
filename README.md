PalServer  Manager (Dev 3.0)

PalServer  Manager v3.0은 Palworld 전용 서버를 위한 도커 기반의 고급 관리 솔루션입니다.
기존의 CLI 관리 기능을 포함하여, React와 FastAPI로 구축된 Web Dashboard를 통해 다중 인스턴스 관리, 실시간 모니터링, 그리고 역할 기반 접근 제어(RBAC)를 제공합니다.

🚀 v3.0 주요 변경 사항 (Key Features)
    이번 Dev 3.0 업데이트는 보안과 운영 편의성에 중점을 두었습니다.
    
    역할 기반 접근 제어 (RBAC) 시스템 도입
        Super Admin: 사용자 관리, 모든 서버 설정, 인스턴스 생성/삭제 권한.
        Operator: 할당된 인스턴스의 모니터링, 시작/정지, 제한된 설정 변경 권한.
        AdminLayout과 OperatorLayout을 분리하여 직관적인 UX 제공.모던 웹 대시보드 (Modern Web Dashboard)
        Frontend: React + Vite + TailwindCSS 기반의 반응형 UI.
        Backend: FastAPI 기반의 고성능 비동기 API 서버.
    
    다국어 지원 (한국어/영어) 및 다크 모드 지원.

    강화된 보안 및 안정성
        Nginx Reverse Proxy: SSL/TLS 인증서(selfsigned) 자동 적용 및 정적 자원 캐싱.
        안전한 설정 변경: 위험한 설정(Danger Options) 변경 시 비밀번호 재확인 및 경고 표시.
        JWT 인증: 안전한 로그인 및 세션 관리.

    강력한 인스턴스 관리Docker Compose를 활용한 독립적인 인스턴스 격리 환경.

    웹 GUI를 통한 버전 관리, 백업/롤백, 이미지 빌드 자동화.

    실시간 로그(WebSocket) 및 서버 리소스(Metrics) 모니터링.

📂 디렉토리 구조 (Directory Structure)
PalServer_ent/
├── install.sh              # 통합 설치 스크립트
├── cmm/                    # CLI 관리 도구 (Command modules)
│   ├── bin/                # 실행 바이너리 (paladmin.sh)
│   └── controllers/        # 핵심 로직 (백업, 업데이트, 인스턴스 제어)
├── server/                 # 서버 데이터 저장소
│   ├── instances/          # 개별 인스턴스 설정 및 데이터
│   └── backup/             # 백업 파일 보관소
└── UI/                     # v3.0 Web Dashboard 소스
    ├── backend/            # FastAPI 서버 (Python)
    │   ├── mng/routers/    # API 엔드포인트 (Auth, Instance, Logs 등)
    │   └── mng/db/         # SQLite DB 및 User 관리
    ├── frontend/           # React 클라이언트
    │   ├── src/pages/      # Admin/Operator/Common 페이지 분리
    │   └── src/components/ # 재사용 UI 컴포넌트
    └── proxy/              # Nginx 리버스 프록시 설정

🛠️ 설치 및 실행 (Installation)
    필수 요구 사항 (Prerequisites)
        OS: Linux (Ubuntu 20.04+ 권장) 또는 WSL2
        Docker: Docker Engine & Docker Compose (v2 이상)
        Ports: 8000(API), 8443(HTTPS Web), 8211~(Game Ports)

1. 설치 (Setup)
    디렉토리의 install.sh를 실행하여 환경 변수 설정 및 도커 이미지를 빌드합니다.
        Bashchmod +x install.sh
        ./install.sh
    참고: 윈도우에서 복사한 파일의 줄바꿈 문제가 발생할 경우 winTolinuxFile.sh를 먼저 실행하세요.

2. 웹 대시보드 실행설치가 완료되면 UI 디렉토리 내의 Docker Compose가 실행되며 서비스가 시작됩니다.
    접속 주소: https://<SERVER_IP>:8443
    초기 관리자 계정: admin / admin1! (최초 접속 후 변경 권장)

3. CLI 도구 사용웹 인터페이스 외에도 터미널에서 직접 관리할 수 있습니다.
    Bash# 명령어 자동완성 적용
    source cmm/completion/paladmin.bash

    # 관리 도구 실행
    ./cmm/bin/paladmin.sh help

💻 기술 스택 (Tech Stack)
 구분                  기술                     비고
Frontend            "React, Vite"       SPA Architecture
Styling             Tailwind CSS        Responsive Design
Backend             "Python, FastAPI"   "RESTful API, WebSocket"
Database            SQLite              "database.py, SQLAlchemy"
Proxy               Nginx (Alpine)      "SSL Termination, Static File Serving"
Infra               Docker Compose      Container Orchestration
Scripting           Bash Shell          System Control (cmm/controllers)

⚠️ 주의 사항 (Notice)
    인증서: 기본 제공되는 인증서는 사설 인증서(selfsigned)이므로 브라우저 접속 시 보안 경고가 뜰 수 있습니다.
            UI/cert/generate-cert.sh를 통해 갱신 가능합니다.
    포트 충돌: 기본 8000, 8443 포트가 사용 중인지 확인하십시오. UI/docker-compose.yml에서 변경 가능합니다.
    데이터 보존: server/ 디렉토리는 게임 데이터가 저장되는 핵심 경로이므로 삭제하지 마십시오.

📜 라이선스 (License)
Copyright © 2026 PalServer  Team. All Rights Reserved.
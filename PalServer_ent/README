PalServer_ent

Palworld Enterprise Server Management Platform

PalServer_ent는 Palworld 전용 엔터프라이즈 서버 운영을 위한 통합 관리 플랫폼입니다.
Docker 기반 멀티 인스턴스 Palworld 서버를 CLI + Web UI로 관리하며,
오프라인 이미지 배포, 설정 관리, 백업/롤백, 모니터링, 플레이어 조회까지 지원합니다.

✨ 주요 기능 (Features)
🚀 멀티 Palworld 서버 인스턴스 관리
🖥️ Web Admin UI (Dashboard / Metrics / Logs / Players)
🔧 CLI 기반 인스턴스 생성/삭제 (paladmin)
📦 Offline Docker Image Repository
🔁 버전 관리 & 롤백
💾 월드 데이터 백업
⚙️ 게임 설정(Web 기반) 수정 및 적용
🔐 JWT 인증 기반 Admin UI
🌐 Docker 내부 네트워크 기반 안정적 통신

🧱 전체 아키텍처 개요
Ubuntu Host
│
├─ Docker
│   ├─ paladmin-backend   (FastAPI, :8000)
│   ├─ paladmin-frontend  (Vite + React)
│   ├─ paladmin-proxy     (nginx, 80 / 8443)
│   └─ palworld instances (nalbbun, etc)
│        ├─ Game Port   : 8211/udp → host
│        ├─ Query Port  : 27015/udp → host
│        └─ REST API    : 8212/tcp  → internal
│
└─ PalServer_ent
    ├─ 실행 스크립트
    ├─ 설정 파일
    ├─ Offline 이미지 저장소
    └─ UI 소스


🔑 Backend ↔ Palworld 통신은 Docker internal network 기반 (container_name:8212)

📁 디렉토리 구조 설명
PalServer_ent
├── bin/                    # CLI 엔트리
│   └── paladmin.sh         # paladmin 명령어
│
├── controllers/            # 서버 제어 스크립트
│   ├── instance.sh         # 인스턴스 생성/삭제
│   ├── update.sh           # 버전 업데이트
│   ├── rollback.sh         # 롤백
│   ├── backup.sh           # 월드 백업
│   └── cache_clean.sh
│
├── instances/              # Palworld 인스턴스 데이터
│   ├── DefaultPalWorldSettings.ini
│   └── <instance_name>/
│       └── Saved/          # 실제 월드 데이터
│
├── offline_repo/           # 오프라인 Docker 이미지 저장소
│   ├── latest -> v0.0.2
│   └── v0.0.1/
│       ├── manifest.json
│       └── palworld_server_steam_v0.0.1.tar
│
├── _online_make-pal-images/ # 이미지 빌드 환경
│   ├── Dockerfile
│   ├── build.sh
│   └── entrypoint.sh
│
├── UI/
│   ├── backend/            # FastAPI backend
│   ├── frontend/           # React + Vite frontend
│   ├── proxy/              # nginx 설정
│   └── docker-compose.yml
│
├── install.sh              # 전체 설치 스크립트
├── uninstall.sh
├── test.sh
├── winTolinuxFile.sh
└── README

⚙️ 설치 방법 (Installation)
1️⃣ 요구 사항

Ubuntu 20.04+
Docker / Docker Compose
1000 UID/GID등

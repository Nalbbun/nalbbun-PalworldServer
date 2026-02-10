# PalServer  Manager (Dev 3.0)

**PalServer  Manager**는 Palworld 데디케이티드 서버를 도커(Docker) 컨테이너 기반으로 구축하고 운영하기 위한 **엔터프라이즈급 올인원 솔루션**입니다.

기존의 강력한 쉘 스크립트 제어 도구(**CMM**)에 **React**와 **FastAPI**로 구축된 **Web Dashboard**를 결합하여, 시스템 관리자와 운영자가 효율적으로 협업할 수 있는 환경을 제공합니다.

---

## 🚀 v3.0 주요 특징 (Key Features)

### 1. 웹 대시보드 (Web UI)
* **모니터링:** CPU/RAM 사용량, FPS, 업타임 등 서버 상태를 실시간으로 시각화하여 제공합니다.
* **설정 관리:** `PalWorldSettings.ini` 파일을 웹에서 직접 수정할 수 있습니다.
* **보안 접속:** Nginx 리버스 프록시를 통해 SSL(HTTPS) 환경에서 안전하게 접속합니다.

### 2. 역할 기반 접근 제어 (RBAC)
* **Super Admin (관리자):** 사용자 관리, 인스턴스 생성/삭제, 모든 설정 변경 등 시스템 전체 권한 보유.
* **Operator (운영자):** 서버 모니터링, 플레이어 제어(Kick/Ban), 서버 재시작 등 운영에 필요한 권한만 보유 (위험한 설정 변경 불가).

### 3. 고도화된 플레이어 관리 시스템
* **상세 정보:** 접속자의 IP, Ping, 게임 내 좌표(X, Y), 레벨, 건물 보유 수 등을 실시간 확인.
* **커스텀 밴 리스트 (Custom Ban List):** Palworld API가 제공하지 않는 밴 리스트를 **로컬 DB(SQLite)**에 자체 기록하여 관리합니다.
* **원클릭 언밴:** DB에 기록된 차단 내역을 조회하고, 웹에서 즉시 차단 해제(Unban)가 가능합니다.

### 4. 강력한 CLI 도구 (CMM)
* 웹 UI가 작동하지 않을 때도 터미널에서 `paladmin.sh` 스크립트를 통해 백업, 복구, 업데이트 등 모든 제어가 가능합니다.

---

## 📂 디렉토리 구조 (Directory Structure)

[cite_start]프로젝트는 크게 **핵심 관리 모듈(CMM)**, **웹 인터페이스(UI)**, **데이터 저장소(Server)**로 구성됩니다[cite: 1, 2, 3].

```text
PalServer_ent/
├── install.sh              # [Setup] 통합 설치 및 초기화 스크립트
├── uninstall.sh            # [Setup] 시스템 제거 스크립트
├── winTolinuxFile.sh       # [Util] 윈도우 작성 파일의 줄바꿈(CRLF) 변환 도구
├── README.md               # [Doc] 프로젝트 설명서
│
├── cmm/                    # [Core] CLI 관리 모듈 (Command Management Module)
[cite_start]│   ├── bin/                # 실행 바이너리 (paladmin.sh 메인 스크립트) 
[cite_start]│   ├── controllers/        # 기능별 제어 스크립트 (백업, 업데이트, 인스턴스 관리) 
[cite_start]│   ├── make-pal-images/    # Palworld 도커 이미지 빌드 환경 (Dockerfile) 
[cite_start]│   └── env/                # 환경 변수 설정 파일 
│
[cite_start]├── UI/                     # [Web] 웹 대시보드 (Docker Compose) 
[cite_start]│   ├── backend/            # API 서버 (Python FastAPI, SQLite DB) 
[cite_start]│   │   └── mng/            # API 라우터, DB 모델, 유틸리티 소스 [cite: 4]
[cite_start]│   ├── frontend/           # 클라이언트 (React, Vite, TailwindCSS) 
[cite_start]│   │   └── src/            # 페이지(Admin/Operator), 컴포넌트 소스 [cite: 10]
[cite_start]│   └── proxy/              # 리버스 프록시 (Nginx, SSL 인증서 처리) 
│
[cite_start]└── server/                 # [Data] 서버 데이터 저장소 (영구 보존 필요) 
    [cite_start]├── instances/          # 각 인스턴스별 설정(ini) 및 세이브 데이터 
    └── backup/             # 자동/수동 백업된 압축 파일(.zip) 보관

## 👥 관리자 / 운영자 기능 명세 (Role-based Access Control)

보안을 위해 계정 권한에 따라 접근 가능한 기능이 엄격히 분리되어 있습니다.

| 기능 카테고리 | 기능 상세 | 🛡️ Super Admin | 👤 Operator |
|---|---|:---:|:---:|
| 시스템 관리 | 사용자 계정 관리 | ✅ | ❌ |
|  | 인스턴스 생성 / 삭제 | ✅ | ❌ |
|  | 서버 업데이트 / 롤백 | ✅ | ❌ |
| 서버 제어 | 서버 시작 / 정지 / 재시작 | ✅ | ✅ |
| 설정 | Config 수정 | ✅ | ⚠️ 조회만 |
| 플레이어 | 접속자 모니터링 | ✅ | ✅ |
|  | Kick / Ban | ✅ | ✅ |
|  | Ban List 조회 / 해제 | ✅ | ✅ |
| 데이터 | 수동 백업 실행 | ✅ | ✅ |
| 보안 | RCON 설정 변경 | ✅ | ❌ |

---

## 🛠️ 설치 및 실행 가이드 (Getting Started)

### 1. 필수 요구사항

**OS**
- Linux (Ubuntu 22.04 LTS 권장)
- WSL2 지원

**Software**
- Docker Engine
- Docker Compose v2 이상

---

### 2. 설치 (Installation)

```bash
# 1. 실행 권한 부여
chmod +x *.sh cmm/bin/*.sh

# 2. 줄바꿈 변환 (Windows 파일 복사 시 필수)
./winTolinuxFile.sh

# 3. 설치 실행
./install.sh

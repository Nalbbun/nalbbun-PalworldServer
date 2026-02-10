# PalServer Enterprise Manager (v3.0)

**PalServer Enterprise Manager**는 Palworld 데디케이티드 서버를 위한 **엔터프라이즈급 웹 관리 솔루션**입니다.
기존의 단순한 스크립트 관리를 넘어, **React + FastAPI** 기반의 모던 웹 대시보드를 통해 **다중 인스턴스 관리**, **RBAC(역할 기반 권한 관리)**, **상세한 플레이어 제어** 기능을 제공합니다.

---

## 🚀 주요 특징 (Key Features)

### 1. 역할 기반 접근 제어 (RBAC)
관리자(Super Admin)와 운영자(Operator)의 권한을 엄격히 분리하여, 여러 명의 운영진이 안전하게 서버를 관리할 수 있습니다.

### 2. 고도화된 플레이어 관리 (Advanced Player Management)
- **상세 정보 조회:** 플레이어의 IP, Ping, 위치 좌표(X,Y), 레벨, 건물 보유 수 등을 실시간 모니터링.
- **제재 시스템 (Kick/Ban):** 웹 UI에서 즉시 추방 및 밴 처리.
- **커스텀 밴 리스트 (Shadow Ban List):** Palworld가 제공하지 않는 밴 리스트를 **로컬 DB(SQLite)**로 자체 관리하여, 언제든 웹에서 조회하고 해제(Unban)할 수 있습니다.

### 3. 보안 설정 (Security)
- **민감 정보 보호:** 운영자는 RCON 비밀번호, 포트 설정 등 치명적인 옵션을 수정할 수 없도록 잠금(Locked) 처리됩니다.
- **이중 확인:** 서버 삭제, 정지 등 중요 작업 시 비밀번호 재확인 및 경고창을 띄웁니다.
- **웹 보안:** Nginx 리버스 프록시를 통한 SSL 적용 및 비정상적인 경로 접근 차단.

---

## 👥 기능 명세 (권한별 구분)

### 🛡️ 슈퍼 관리자 (Super Admin)
**시스템의 모든 권한을 가진 마스터 계정입니다.**

| 카테고리 | 기능 | 설명 |
| :--- | :--- | :--- |
| **시스템 관리** | **사용자 관리** | 운영자(Operator) 계정 생성, 수정, 삭제 및 비밀번호 초기화 |
| | **인스턴스 생성** | 새로운 도커 컨테이너(PalServer) 생성 및 포트 할당 |
| | **서버 삭제** | 존재하는 인스턴스 및 데이터 영구 삭제 |
| **설정 관리** | **모든 옵션 수정** | RCON 비밀번호, 포트, 배율 등 **모든** `PalWorldSettings.ini` 값 수정 가능 |
| **고급 기능** | **버전 관리** | 특정 버전으로 서버 강제 업데이트 또는 다운그레이드(롤백) |
| | **이미지 관리** | 베이스 도커 이미지 빌드 및 관리 |

### 👤 운영자 (Operator)
**일상적인 서버 운영 및 유저 관리를 담당하는 실무진 계정입니다.**

| 카테고리 | 기능 | 설명 |
| :--- | :--- | :--- |
| **대시보드** | **상태 모니터링** | CPU/RAM 사용량, 서버 프레임(FPS), 업타임 실시간 확인 |
| | **전원 제어** | 서버 시작, 정지, 재시작 |
| | **백업** | 수동 백업 실행 및 백업 파일 생성 |
| **플레이어** | **접속자 감시** | 현재 접속자 목록, IP, Ping, 위치 정보 확인 |
| | **Kick / Ban** | 비매너 유저 추방 및 밴 처리 (사유 입력 가능) |
| | **Ban List** | 밴 당한 유저 목록 조회 및 **Unban(해제)** |
| **설정 조회** | **설정 보기** | 서버 설정을 조회할 수 있으나, **위험 옵션(비밀번호, 포트 등)은 수정 불가** |
| **로그** | **서버 로그** | 실시간 서버 콘솔 로그 확인 (디버깅용) |

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend:** React 18, Vite, TailwindCSS
* **Backend:** Python 3.11, FastAPI, SQLAlchemy
* **Database:** SQLite (User & Ban History Storage)
* **Infra:** Docker, Docker Compose
* **Proxy:** Nginx (SSL Termination, Security Headers)

---

## 🔧 설치 및 실행 (Installation)

### 1. 필수 요구사항
* Linux (Ubuntu 22.04 권장)
* Docker & Docker Compose v2+

### 2. 설치
```bash
# 1. 저장소 클론
git clone <repository_url>
cd PalServer_ent

# 2. 설치 스크립트 실행
chmod +x install.sh
./install.sh
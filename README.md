Nalbbun PalServer  Manager (PalAdmin)
PalServer 는 Docker 기반의 Palworld Dedicated Server를 웹 인터페이스에서 쉽고 강력하게 관리하기 위한 올인원 솔루션입니다.

여러 개의 서버 인스턴스를 생성하고, 시스템 리소스를 모니터링하며, 게임 설정을 GUI로 간편하게 수정할 수 있습니다.

✨ 주요 기능 (Key Features)
1. 🖥️ 서버 인스턴스 라이프사이클 관리
멀티 인스턴스: 하나의 머신에서 여러 개의 팰월드 서버를 독립적으로 운영.
제어: 웹 대시보드에서 서버 시작, 정지, 재시작, 삭제를 원클릭으로 수행.
백업/복원: 서버 월드 데이터의 원클릭 백업 및 관리.

2. 📊 실시간 모니터링 및 로그
리소스 차트: 각 인스턴스별 CPU 및 RAM 사용량을 실시간 그래프로 시각화.
실시간 로그: WebSocket을 통해 서버의 콘솔 로그를 웹에서 실시간으로 스트리밍 확인.
플레이어 관리: 현재 접속 중인 플레이어 목록 확인 및 관리.

3. ⚙️ 고급 설정 관리 (Config Editor)
GUI 설정 편집: 복잡한 .ini 파일을 직접 수정할 필요 없이, 웹 폼(Form) 형태로 게임 옵션 변경.
위험 옵션 감지: 서버 성능에 영향을 줄 수 있는 위험한 옵션(Danger Option)에 대한 경고 및 툴팁 제공.

4. 🐳 도커 이미지 관리 (Image Builder)
버전 관리: SteamCMD를 통해 특정 버전의 Palworld 서버 이미지를 직접 빌드하고 관리.
오프라인 리포지토리: 빌드된 이미지를 로컬에 저장하여 인터넷 연결 없이도 인스턴스 생성 가능.

5. 🎨 사용자 경험 (UX)
다크/라이트 모드: 눈이 편한 다크 모드와 가독성 높은 라이트 모드 지원.
다국어 지원 (i18n): 한국어(KO) 및 영어(EN) 완벽 지원.
반응형 디자인: Tailwind CSS 기반의 깔끔하고 현대적인 UI.

🛠️ 기술 스택 (Tech Stack)

구분	                    기술	                    설명
Frontend	                React, Vite	                관리자 대시보드 UI 
Style	                    Tailwind CSS	            반응형 디자인 및 테마 적용 
Backend	                    Python FastAPI	            REST API 서버, Docker 제어, 시스템 관리  
Database	                SQLite	                    사용자 정보 및 메타데이터 저장 
Infrastructure	            Docker, Docker Compose	    서비스 컨테이너화 및 오케스트레이션
Proxy	                    Nginx	                    리버스 프록시 및 정적 파일 서빙

🚀 설치 및 실행 (Installation)
이 프로젝트는 Linux 환경(Ubuntu/Debian 권장)에서 Docker가 설치된 환경을 기준으로 합니다.

사전 요구사항
Docker & Docker Compose

Git

1. 프로젝트 클론
git clone https://github.com/your-repo/PalServer_ent.git
cd PalServer_ent

2. 설치 스크립트 실행
자동화된 설치 스크립트를 통해 환경을 구성합니다.
chmod +x install.sh
./install.sh
이 스크립트는 필요한 디렉토리를 생성하고, Docker 이미지를 빌드하며 서비스를 시작합니다

3. 접속 방법
설치가 완료되면 브라우저를 통해 대시보드에 접속합니다.
URL: http://localhost (또는 서버 IP)
기본 계정: 최초 실행 시 backend/mng/db/db_init.py에 의해 초기 관리자 계정이 생성됩니다 (보통 admin / admin 혹은 설치 시 설정). 

📝 사용 가이드 (Usage)
이미지 빌드 (Image Build)
대시보드의 "Manage Images" 메뉴 또는 쉘 스크립트를 통해 서버 버전을 관리할 수 있습니다.
# 수동 빌드 예시
cd cmm/make-pal-images
./build.sh v0.0.1

인스턴스 생성
대시보드 상단의 "+ Create Server" 버튼 클릭.
서버 이름, 포트, 사용할 이미지 버전을 선택.
생성 후 Start 버튼을 눌러 서버 구동.


설정 변경
인스턴스 카드의 Config 버튼을 눌러 PalWorldSettings.ini 값을 GUI 환경에서 안전하게 수정할 수 있습니다.

🔒 보안 (Security)
JWT 인증: Access/Refresh Token 기반의 안전한 로그인 세션 관리.
비밀번호 암호화: bcrypt를 사용하여 사용자 비밀번호를 안전하게 해싱 저장.
 

#!/bin/bash
set -e

# ==========================================================
# 1) REAL BASE DIR 계산 (중요!)
# /usr/local/bin/paladmin → 원본 스크립트 위치로 이동
# ==========================================================
SOURCE="${BASH_SOURCE[0]}"

while [ -h "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done

BASE_DIR="$(cd -P "$(dirname "$SOURCE")/.." && pwd)"
CTRL_DIR="$BASE_DIR/controllers"

CMD=$1
ARG1=$2
ARG2=$3
ARG3=$4


# ==========================================================
# 2) HELP 문서 (전체 기능 문서화)
# ==========================================================
usage() {
cat <<EOF

Palworld Admin CLI
==============================

[기본 명령어]
 paladmin create <instance> <port> <query> <version>
      - 새로운 인스턴스 생성 (docker-compose-<instance>.yml 생성)
	  
 paladmin delete <instance>

 paladmin start <instance>
 paladmin stop  <instance>
 paladmin restart <instance>

 paladmin list
      - 인스턴스 목록 출력

[백업 & 복구]
 paladmin backup <instance>
 paladmin rollback <backup_path> <instance> 

[업데이트 시스템]
 paladmin update <version> 
      - 특정 버전 오프라인 업데이트
	  
 paladmin update <version> [instance]
      - 특정 인스턴스만 업데이트 가능
      - HealthCheck + 실패 자동 롤백 포함 

[예시]

 paladmin create world1 8211 9211 latest 
 paladmin update v0.1.0 
 paladmin start world1
 
 paladmin backup world1
 paladmin rollback backup/world2-20250201-1030 world1

EOF
}


# ==========================================================
# 3) Command dispatcher
# ==========================================================
case "$CMD" in

  create)
    bash "$CTRL_DIR/instance.sh" create "$ARG1" "$ARG2" "$ARG3" "$ARG4"
    ;;
	
  delete)
    bash "$CTRL_DIR/instance.sh" delete "$ARG1"
    ;;

  start)
    docker compose -f "$BASE_DIR/docker-compose-$ARG1.yml" up -d
    ;;

  stop)
    docker compose -f "$BASE_DIR/docker-compose-$ARG1.yml" down
    ;;

  restart)
    docker compose -f "$BASE_DIR/docker-compose-$ARG1.yml" down
    docker compose -f "$BASE_DIR/docker-compose-$ARG1.yml" up -d
    ;;

  list)
    echo "[Instances]"
    ls "$BASE_DIR/instances"
    ;;

  backup)
    bash "$CTRL_DIR/backup.sh" "$ARG1"
    ;;

  rollback)
    bash "$CTRL_DIR/rollback.sh" "$ARG1" "$ARG2"
    ;;

  clean)
    bash "$CTRL_DIR/cache_clean.sh"
    ;;

  update)
    bash "$CTRL_DIR/update.sh" "$ARG1" "$ARG2"
    ;;

  *)
    usage
    ;;
esac
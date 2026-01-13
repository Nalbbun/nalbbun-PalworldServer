#!/bin/bash
set -e
# ENV LOAD (ONLY THIS)
source "$(dirname "$0")/../env/env.load.sh"
  
# ==========================================================
# 2) Args
# ==========================================================
CMD="${1:-}"
ARG1="${2:-}"
ARG2="${3:-}"
ARG3="${4:-}"


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
# 4) Guard
# ==========================================================
[[ -z "$CMD" ]] && usage


# ==========================================================
# 3) Command dispatcher
# ==========================================================
case "$CMD" in

  create)
    bash "$CTRL_ROOT/instance.sh" create "$ARG1" "$ARG2" "$ARG3" "$ARG4"
    ;;
	
  delete)
    bash "$CTRL_ROOT/instance.sh" delete "$ARG1"
    ;;


  start|stop|restart)
    COMPOSE_FILE="$SERVER_ROOT/docker-compose-$ARG1.yml"

    [[ -z "$ARG1" ]] && { echo "[ERROR] instance name required"; exit 1; }
    [[ ! -f "$COMPOSE_FILE" ]] && { echo "[ERROR] $COMPOSE_FILE not found"; exit 1; }

    case "$CMD" in
      start)   docker compose -f "$COMPOSE_FILE" up -d ;;
      stop)    docker compose -f "$COMPOSE_FILE" down ;;
      restart)
        docker compose -f "$COMPOSE_FILE" down
        docker compose -f "$COMPOSE_FILE" up -d
        ;;
    esac
    ;;

  list)
    echo "[Instances]"
    [[ -d "$INSTANCE_ROOT" ]] || { echo "(none)"; exit 0; }
    ls "$INSTANCE_ROOT"
    ;;

  backup)
    bash "$CTRL_ROOT/backup.sh" "$ARG1"
    ;;

  rollback)
    bash "$CTRL_ROOT/rollback.sh" "$ARG1" "$ARG2"
    ;;

  clean)
    bash "$CTRL_ROOT/cache_clean.sh"
    ;;

  update)
    bash "$CTRL_ROOT/update.sh" "$ARG1" "$ARG2"
    ;;

  *)
    usage
    ;;
esac
#!/bin/bash

_paladmin()
{
  local cur prev cmd
  COMPREPLY=()

  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  cmd="${COMP_WORDS[1]}"

  # --------------------------------------------------
  # paladmin 경로 → env.load.sh 로드
  # --------------------------------------------------
  local PALADMIN_BIN BASE_DIR ENV_LOADER
  PALADMIN_BIN="$(command -v paladmin 2>/dev/null)"
  [[ -z "$PALADMIN_BIN" ]] && return

  BASE_DIR="$(cd "$(dirname "$PALADMIN_BIN")/../.." && pwd)"
  ENV_LOADER="$BASE_DIR/cmm/env/env.load.sh"

  [[ -f "$ENV_LOADER" ]] && source "$ENV_LOADER" || return

  local COMMANDS="create delete start stop restart list backup rollback update clean"

  local INSTANCES=""
  [[ -d "$INSTANCE_ROOT" ]] && INSTANCES="$(ls "$INSTANCE_ROOT" 2>/dev/null)"

  local VERSIONS=""
  [[ -d "$REPO_ROOT" ]] && VERSIONS="$(ls "$REPO_ROOT" 2>/dev/null)"

  # --------------------------------------------------
  # 첫 번째 인자: command
  # --------------------------------------------------
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$COMMANDS" -- "$cur") )
    return
  fi

  # --------------------------------------------------
  # instance가 필요한 명령
  # --------------------------------------------------
  case "$cmd" in
    start|stop|restart|delete|backup)
      COMPREPLY=( $(compgen -W "$INSTANCES" -- "$cur") )
      return
      ;;
  esac

  # --------------------------------------------------
  # rollback <backup_path> <instance>
  # --------------------------------------------------
  if [[ "$cmd" == "rollback" ]]; then
    if [[ $COMP_CWORD -eq 3 ]]; then
      COMPREPLY=( $(compgen -W "$INSTANCES" -- "$cur") )
    fi
    return
  fi

  # --------------------------------------------------
  # update <version> [instance|all]
  # --------------------------------------------------
  if [[ "$cmd" == "update" ]]; then
    if [[ $COMP_CWORD -eq 2 ]]; then
      COMPREPLY=( $(compgen -W "$VERSIONS latest" -- "$cur") )
    elif [[ $COMP_CWORD -eq 3 ]]; then
      COMPREPLY=( $(compgen -W "$INSTANCES all" -- "$cur") )
    fi
    return
  fi
}

complete -F _paladmin paladmin
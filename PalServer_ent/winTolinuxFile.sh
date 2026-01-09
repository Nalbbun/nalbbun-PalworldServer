#!/bin/bash

CONFIG_FILE="./extensions.conf"
BACKUP=true
AUTO_DELETE_BAK=false
DRY_RUN=false
SCAN_ONLY=false
ONLY_CHANGED=false
LOG_FILE=""
TARGET=""
MODE=""
MAX_SIZE_MB=0
SHOW_STATS=false

SUCCESS_COUNT=0
SKIP_COUNT=0
ERROR_COUNT=0

BINARY_EXT=("png" "jpg" "jpeg" "gif" "zip" "tar" "gz" "bz2" "xz" "jar" "exe" "dll" "so" "bin" "iso" "pdf")

log() {
    echo "$1"
    [[ -n "$LOG_FILE" ]] && echo "$1" >> "$LOG_FILE"
}

show_help() {
cat << EOF
: winTolinuxFile.sh <> <> []

[]
  -all <path>              ( )
  -a   <path>           (extensions.conf  )
  -f   <path>              

[]
  --nobak              
  --dry-run           
  --scan-only          
  --only-changed        
  --max-size <MB>        
  --log <file>        
  --stats             
  --help             

 :
  extensions.conf     
EOF
exit 0
}

load_extensions() {
    EXTENSIONS=()

    if [[ -f "$CONFIG_FILE" ]]; then
        while read LINE; do [[ -n "$LINE" ]] && EXTENSIONS+=("$LINE"); done < "$CONFIG_FILE"
        log "[INFO] Loaded extensions.conf: ${EXTENSIONS[*]}"
    else
        EXTENSIONS=(sh yaml yml json txt conf cfg ini properties env xml md dockerfile service)
        log "[INFO] Using default extensions: ${EXTENSIONS[*]}"
    fi
}

is_binary() {
    local EXT="${1##*.}"
    for B in "${BINARY_EXT[@]}"; do [[ "$EXT" == "$B" ]] && return 0; done
    return 1
}

match_extension() {
    local EXT="${1##*.}"
    for E in "${EXTENSIONS[@]}"; do [[ "$EXT" == "$E" ]] && return 0; done
    return 1
}

file_too_large() {
    [[ $MAX_SIZE_MB -eq 0 ]] && return 1
    local SIZE=$(stat -c%s "$1")
    local LIMIT=$((MAX_SIZE_MB * 1024 * 1024))
    [[ $SIZE -gt $LIMIT ]]
}

is_dirty_file() {
    grep -q $'\r' "$1" && return 0
    tr -d '\000-\011\013\014\016-\037\200-\377' < "$1" | diff -q "$1" - > /dev/null || return 0
    return 1
}

clean_file_internal() {
    local FILE="$1"

    if [[ ! -f "$FILE" ]]; then
        ((SKIP_COUNT++))
        return
    fi

    # -all     
    if [[ "$MODE" != "all" ]]; then
        if is_binary "$FILE"; then
            ((SKIP_COUNT++))
            return
        fi
        if ! match_extension "$FILE"; then
            ((SKIP_COUNT++))
            return
        fi
    fi

    if file_too_large "$FILE"; then
        ((SKIP_COUNT++))
        return
    fi

    if $SCAN_ONLY; then
        is_dirty_file "$FILE" && log "[DIRTY] $FILE"
        return
    fi

    if $DRY_RUN; then
        is_dirty_file "$FILE" && log "[DRY-RUN] Would clean: $FILE"
        return
    fi

    cp "$FILE" "${FILE}.before"

    if $BACKUP; then cp "$FILE" "$FILE.bak"; fi

    sed -i 's/\r$//' "$FILE"

    tr -d '\000-\011\013\014\016-\037\200-\377' < "$FILE" > "${FILE}.clean"
    mv "${FILE}.clean" "$FILE"

    if diff -q "${FILE}.before" "$FILE" > /dev/null; then
        rm -f "${FILE}.before"
        [[ $AUTO_DELETE_BAK == true ]] && rm -f "$FILE.bak"
        ((SKIP_COUNT++))
        return
    fi

    rm -f "${FILE}.before"
    log "[CHANGED] $FILE"
    ((SUCCESS_COUNT++))

    if $AUTO_DELETE_BAK && $BACKUP; then rm -f "$FILE.bak"; fi
}

run_recursive() {
    while IFS= read -r FILE; do
        clean_file_internal "$FILE"
    done < <(find "$TARGET" -type f)
}

run_files_only() {
    for FILE in "$TARGET"/*; do
        [[ -f "$FILE" ]] && clean_file_internal "$FILE"
    done
}

###  
while [[ $# -gt 0 ]]; do
    case "$1" in
        -all) MODE="all"; TARGET="$2"; shift 2 ;;
        -a) MODE="filter"; TARGET="$2"; shift 2 ;;
        -f) MODE="files"; TARGET="$2"; shift 2 ;;
        --nobak) BACKUP=false; AUTO_DELETE_BAK=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        --scan-only) SCAN_ONLY=true; shift ;;
        --only-changed) ONLY_CHANGED=true; shift ;;
        --max-size) MAX_SIZE_MB="$2"; shift 2 ;;
        --log) LOG_FILE="$2"; shift 2 ;;
        --stats) SHOW_STATS=true; shift ;;
        --help) show_help ;;
        *) echo "[ERROR] Invalid option: $1"; exit 1 ;;
    esac
done

[[ -z "$MODE" || -z "$TARGET" ]] && show_help
[[ ! -d "$TARGET" ]] && echo "[ERROR] Directory not found: $TARGET" && exit 1

#   -all    
[[ "$MODE" != "all" ]] && load_extensions

case "$MODE" in
    all)  run_recursive ;;
    filter) run_recursive ;;
    files) run_files_only ;;
esac

if $SHOW_STATS; then
    echo "---------------------------"
    echo "  (Changed):   $SUCCESS_COUNT"
    echo "  (Skipped):   $SKIP_COUNT"
    echo "---------------------------"
fi
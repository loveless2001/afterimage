#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
game_port="${1:-8765}"
if ! [[ "$game_port" =~ ^[0-9]{1,5}$ ]] || (( 10#$game_port < 1 || 10#$game_port > 65535 )); then
  echo 'Choose a port between 1 and 65535.' >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Python 3 is unavailable. Copy the folder to Windows and open index.html; no server is needed.' >&2
  exit 1
fi
echo "AFTERIMAGE: open http://localhost:$game_port in your browser. Stop with Ctrl+C."
exec python3 -m http.server "$game_port" --bind 127.0.0.1

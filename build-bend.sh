#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(bend --version)" != 'bend 2.0.16' ]]; then
  printf '%s\n' 'This bundle was built with Bend 2.0.16.' >&2
  exit 1
fi
build_dir="$(mktemp -d)"
trap 'rm -rf "$build_dir"' EXIT
BEND_NO_TELEMETRY=1 bend core-build.html -o "$build_dir"
chunk="$(find "$build_dir" -maxdepth 1 -name 'chunk-*.js' -type f -print -quit)"
test -n "$chunk"
if [[ "${1:-}" == '--check' ]]; then
  cmp "$chunk" bend-core.js
else
  cp "$chunk" bend-core.js
fi

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
JS_FILES=()

while IFS= read -r file; do
  JS_FILES+=("$file")
done < <(find "$ROOT_DIR/miniapp" -type f -name '*.js' | sort)

if [[ "${#JS_FILES[@]}" -eq 0 ]]; then
  echo "No miniapp JS files found" >&2
  exit 1
fi

for file in "${JS_FILES[@]}"; do
  node --check "$file"
done

echo "miniapp JS syntax check passed (${#JS_FILES[@]} files)"

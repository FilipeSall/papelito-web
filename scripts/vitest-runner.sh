#!/usr/bin/env sh
set -eu

if command -v bun >/dev/null 2>&1; then
  exec bunx --bun vitest "$@"
fi

exec node ./node_modules/vitest/vitest.mjs "$@"

#!/usr/bin/env sh
set -eu

if [ "${npm_execpath:-}" = "${BUN_INSTALL:-}/bin/bun" ]; then
  exec bunx --bun vitest "$@"
fi

exec node ./node_modules/vitest/vitest.mjs "$@"

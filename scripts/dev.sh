#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Demo explicitly restricted to development by both game and token backends.
export ALLOW_DEV_GUESTS="${ALLOW_DEV_GUESTS:-true}"
export ENABLE_DEV_DEMO_TOKENS="${ENABLE_DEV_DEMO_TOKENS:-true}"
exec npm run dev

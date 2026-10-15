#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw new Error("Use Node.js 22 ou superior")'
npm ci --cache /workspace/.npm-cache
npm run build

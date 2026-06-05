#!/usr/bin/env bash
set -euo pipefail

cd apps/client
pnpm --config.ignore-scripts=true exec playwright install --with-deps chromium firefox webkit

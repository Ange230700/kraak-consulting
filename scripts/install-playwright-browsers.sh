#!/usr/bin/env bash
set -euo pipefail

cd apps/client
pnpm --ignore-scripts exec playwright install --with-deps chromium firefox webkit

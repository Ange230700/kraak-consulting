#!/usr/bin/env bash
set -euo pipefail

cd apps/client
pnpm exec playwright install --with-deps chromium firefox webkit

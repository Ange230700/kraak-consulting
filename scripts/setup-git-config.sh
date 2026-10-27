#!/bin/bash
# scripts/setup-git-config.sh
# Configure local git repository for KRAAK workflow
# Usage: ./scripts/setup-git-config.sh [--global]

set -euo pipefail

SCOPE="${1:-local}"

if [[ "$SCOPE" == "--global" ]]; then
  echo "📋 Configuring Git globally..."
  git config --global pull.rebase true
  git config --global merge.ff only
  echo "✅ Global Git config set"
else
  echo "📋 Configuring Git locally (this repository)..."
  git config pull.rebase true
  git config merge.ff only
  echo "✅ Local Git config set"
fi

# Verify
echo ""
echo "🔍 Verification:"
scope_flag=""
[[ "$SCOPE" == "--global" ]] && scope_flag=" --global"
git config$scope_flag --get pull.rebase && echo "  ✓ pull.rebase = true"
git config$scope_flag --get merge.ff && echo "  ✓ merge.ff = only"

echo ""
echo "🚀 Ready for KRAAK development workflow!"
echo ""
echo "Next steps:"
echo "  1. Create a feature branch: git checkout -b feat/my-feature"
echo "  2. Make changes and commit: git commit -m 'feat: description'"
echo "  3. Add changeset: pnpm changeset"
echo "  4. Push and open PR: git push -u origin feat/my-feature"
echo ""
echo "See docs/engineering/CONTRIBUTION_WORKFLOW.md for full guide."

# scripts/setup-git-config.ps1
# Configure local git repository for KRAAK workflow (Windows PowerShell)
# Usage: .\scripts\setup-git-config.ps1 [-Global]

param(
    [switch]$Global
)

$scope = if ($Global) { "--global" } else { "" }

if ($Global) {
    Write-Host "📋 Configuring Git globally..." -ForegroundColor Cyan
}
else {
    Write-Host "📋 Configuring Git locally (this repository)..." -ForegroundColor Cyan
}

git config $scope pull.rebase true
git config $scope merge.ff only

Write-Host "✅ Git config set" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Verification:" -ForegroundColor Cyan

$rebase = git config $scope --get pull.rebase
$ff = git config $scope --get merge.ff

if ($rebase -eq "true") {
    Write-Host "  ✓ pull.rebase = true" -ForegroundColor Green
}
else {
    Write-Host "  ✗ pull.rebase not set" -ForegroundColor Red
}

if ($ff -eq "only") {
    Write-Host "  ✓ merge.ff = only" -ForegroundColor Green
}
else {
    Write-Host "  ✗ merge.ff not set" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Ready for KRAAK development workflow!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create a feature branch: git checkout -b feat/my-feature"
Write-Host "  2. Make changes and commit: git commit -m 'feat: description'"
Write-Host "  3. Add changeset: pnpm changeset"
Write-Host "  4. Push and open PR: git push -u origin feat/my-feature"
Write-Host ""
Write-Host "See docs/runbooks/GIT_WORKFLOW_COMPLETE.md for full guide."

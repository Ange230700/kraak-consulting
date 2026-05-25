# scripts/compose-up-with-supabase-local.ps1
# Lance Supabase local, exporte les variables requises et demarre Docker Compose.

[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ComposeArgs
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    throw "supabase CLI est requise. Installation: https://supabase.com/docs/guides/cli"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "docker est requis et doit etre disponible dans le PATH."
}

Set-Location $repoRoot

Write-Host "[compose-helper] Demarrage de Supabase local..."
supabase start | Out-Host

Write-Host "[compose-helper] Lecture des variables Supabase..."
$statusEnvOutput = supabase status -o env

$statusEnv = @{}
foreach ($line in $statusEnvOutput) {
    if ($line -match '^(?<key>[A-Z0-9_]+)=(?<value>.*)$') {
        $statusEnv[$Matches.key] = $Matches.value
    }
}

$supabaseUrl = $statusEnv["API_URL"]
$supabasePublishableKey = $statusEnv["ANON_KEY"]
$supabaseSecretKey = $statusEnv["SERVICE_ROLE_KEY"]

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or
    [string]::IsNullOrWhiteSpace($supabasePublishableKey) -or
    [string]::IsNullOrWhiteSpace($supabaseSecretKey)) {
    throw "Impossible de lire API_URL, ANON_KEY et SERVICE_ROLE_KEY depuis 'supabase status -o env'."
}

# Docker Desktop expose l'hote via host.docker.internal depuis les conteneurs.
$containerSupabaseUrl = $supabaseUrl.Replace("127.0.0.1", "host.docker.internal").Replace("localhost", "host.docker.internal")

$env:SUPABASE_URL = $containerSupabaseUrl
$env:SUPABASE_SECRET_KEY = $supabaseSecretKey
$env:SUPABASE_PUBLISHABLE_KEY = $supabasePublishableKey
$env:CLIENT_SUPABASE_URL = $env:SUPABASE_URL
$env:CLIENT_SUPABASE_PUBLISHABLE_KEY = $env:SUPABASE_PUBLISHABLE_KEY
$env:CLIENT_API_BASE_URL = "http://api:3000"

Write-Host "[compose-helper] Variables exportees. Lancement de Docker Compose..."
docker compose -f compose.local.yml up --build @ComposeArgs

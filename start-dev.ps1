param(
    [string]$BackendEnv = "py311",
    [switch]$NoBrowser
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

if (-not (Test-Path -Path $backendPath)) {
    throw "Pasta backend nao encontrada em: $backendPath"
}

if (-not (Test-Path -Path $frontendPath)) {
    throw "Pasta frontend nao encontrada em: $frontendPath"
}

$backendCmd = "Set-Location -Path '$backendPath'; conda run -n $BackendEnv python -m uvicorn app.main:app --reload"
$frontendCmd = "Set-Location -Path '$frontendPath'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd | Out-Null
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd | Out-Null

if (-not $NoBrowser) {
    Start-Process "http://127.0.0.1:5173"
}

Write-Host "Frontend e backend iniciados em janelas separadas."
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Frontend: http://127.0.0.1:5173"

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
    Start-Process "http://localhost:5173"
    Start-Process "http://localhost:8000/docs"
}

Write-Host "Frontend e backend iniciados em janelas separadas."
Write-Host "Backend: http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:5173"

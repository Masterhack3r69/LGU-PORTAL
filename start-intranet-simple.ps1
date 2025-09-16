# Simple EMS Intranet Startup Script for Windows
Write-Host "Starting EMS Intranet Application..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Test network connectivity
Write-Host "Testing network connectivity to 10.0.0.1..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet
    if ($ping) {
        Write-Host "✓ Network connectivity OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not ping 10.0.0.1 - this may be normal" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Network test inconclusive - proceeding anyway" -ForegroundColor Yellow
}

Write-Host ""

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Cyan
$backendPath = Join-Path $scriptDir "backend"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run start:intranet" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend  
Write-Host "Starting frontend server..." -ForegroundColor Cyan
$frontendPath = Join-Path $scriptDir "frontend"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev:intranet" -WindowStyle Normal

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "EMS Intranet Application Starting..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "Backend:  http://10.0.0.1:3000" -ForegroundColor White
Write-Host "Frontend: http://10.0.0.1:5173" -ForegroundColor White
Write-Host "Health:   http://10.0.0.1:3000/health" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Both services are starting in separate windows." -ForegroundColor Yellow
Write-Host "Wait a few seconds for services to fully start before accessing the application." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this launcher..." -ForegroundColor Magenta

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
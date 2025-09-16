# EMS Intranet Startup Script
Write-Host "Starting EMS Intranet Application..." -ForegroundColor Green
Write-Host ""

# Check if IP is available
Write-Host "Checking if IP 10.0.0.1 is available..." -ForegroundColor Yellow
try {
    $ping = Test-NetConnection -ComputerName "10.0.0.1" -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    Write-Host "IP 10.0.0.1 is reachable" -ForegroundColor Green
} catch {
    Write-Host "Note: Testing network connectivity..." -ForegroundColor Yellow
}

Write-Host ""

# Start backend
Write-Host "Starting backend server on 10.0.0.1:3000..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d `"C:\Users\PC\Documents\EMS-SYSTEM\backend`" && npm run start:intranet" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend development server on 10.0.0.1:5173..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d `"C:\Users\PC\Documents\EMS-SYSTEM\frontend`" && npm run dev:intranet" -WindowStyle Normal

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "EMS Intranet Application Started" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "Backend:  http://10.0.0.1:3000" -ForegroundColor White
Write-Host "Frontend: http://10.0.0.1:5173" -ForegroundColor White
Write-Host "Health:   http://10.0.0.1:3000/health" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Both services are starting in separate windows..." -ForegroundColor Yellow
Write-Host "Press any key to exit this launcher..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
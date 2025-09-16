@echo off
echo Starting EMS Intranet Application...
echo.

echo Checking if IP 10.0.0.73 is available...
ping -n 1 10.0.0.73 >nul
if errorlevel 1 (
    echo ERROR: IP address 10.0.0.73 is not reachable!
    echo Please check your ethernet connection.
    pause
    exit /b 1
)

echo.
echo Starting backend server on 10.0.0.73:3000...
start "EMS Backend" cmd /k "cd /d %~dp0backend && npm run start:intranet"

timeout /t 5 /nobreak >nul

echo Starting frontend development server on 10.0.0.73:5173...
start "EMS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev:intranet"

echo.
echo ======================================
echo EMS Intranet Application Started
echo ======================================
echo Backend:  http://10.0.0.73:3000
echo Frontend: http://10.0.0.73:5173
echo Health:   http://10.0.0.73:3000/health
echo ======================================
echo.
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /f /im node.exe 2>nul
echo Services stopped.
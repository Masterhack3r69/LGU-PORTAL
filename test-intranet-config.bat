@echo off
REM Test script to verify intranet configuration

echo Testing EMS Intranet Configuration...
echo =====================================

REM Test if the backend starts correctly
echo 1. Testing backend configuration...
cd /d "c:\Users\PC\Documents\EMS-SYSTEM\backend"

REM Check if .env file exists
if exist ".env" (
    echo ^G Backend .env file exists
) else (
    echo ^X Backend .env file missing
)

REM Check if package.json is valid
npm run >nul 2>&1
if %errorlevel% equ 0 (
    echo ^G Backend package.json is valid
) else (
    echo ^X Backend package.json has errors
)

echo.
echo 2. Testing frontend configuration...
cd /d "..\frontend"

REM Check if .env file exists
if exist ".env" (
    echo ^G Frontend .env file exists
) else (
    echo ^X Frontend .env file missing
)

echo.
echo 3. Testing startup scripts...
cd /d ".."

if exist "start-intranet.bat" (
    echo ^G Windows batch startup script exists
) else (
    echo ^X Windows batch startup script missing
)

if exist "start-intranet.ps1" (
    echo ^G PowerShell startup script exists
) else (
    echo ^X PowerShell startup script missing
)

if exist "INTRANET_SETUP_GUIDE.md" (
    echo ^G Setup guide documentation exists
) else (
    echo ^X Setup guide documentation missing
)

echo.
echo Configuration test completed!
echo You can now start the application using:
echo - start-intranet.bat (Windows)
echo - start-intranet.ps1 (PowerShell)
echo.
echo Please read INTRANET_SETUP_GUIDE.md for detailed setup instructions.
pause
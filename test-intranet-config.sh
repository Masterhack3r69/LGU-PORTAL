#!/bin/bash
# Test script to verify intranet configuration

echo "Testing EMS Intranet Configuration..."
echo "====================================="

# Test if the backend starts correctly
echo "1. Testing backend configuration..."
cd c:/Users/PC/Documents/EMS-SYSTEM/backend

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✓ Backend .env file exists"
else
    echo "✗ Backend .env file missing"
fi

# Check if package.json is valid
if npm run --silent > /dev/null 2>&1; then
    echo "✓ Backend package.json is valid"
else
    echo "✗ Backend package.json has errors"
fi

echo ""
echo "2. Testing frontend configuration..."
cd ../frontend

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✓ Frontend .env file exists"
else
    echo "✗ Frontend .env file missing"
fi

# Check if vite.config.ts is valid
if npm run build --silent > /dev/null 2>&1; then
    echo "✓ Frontend configuration is valid"
else
    echo "✗ Frontend configuration has errors"
fi

echo ""
echo "3. Testing startup scripts..."
cd ..

if [ -f "start-intranet.bat" ]; then
    echo "✓ Windows batch startup script exists"
else
    echo "✗ Windows batch startup script missing"
fi

if [ -f "start-intranet.ps1" ]; then
    echo "✓ PowerShell startup script exists"
else
    echo "✗ PowerShell startup script missing"
fi

echo ""
echo "Configuration test completed!"
echo "You can now start the application using:"
echo "- start-intranet.bat (Windows)"
echo "- start-intranet.ps1 (PowerShell)"
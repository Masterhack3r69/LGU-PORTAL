# PowerShell script to safely restart the backend server
Write-Host "Stopping backend server gracefully..." -ForegroundColor Yellow

# Find the specific node process running on port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
}

if ($processes) {
    Write-Host "Found backend process(es):" -ForegroundColor Green
    $processes | ForEach-Object {
        Write-Host "  PID: $($_.Id) - $($_.ProcessName)" -ForegroundColor Gray
        
        # Try graceful termination first
        try {
            Stop-Process -Id $_.Id -Force
            Write-Host "  Process $($_.Id) stopped successfully" -ForegroundColor Green
        } catch {
            Write-Host "  Failed to stop process $($_.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Wait a moment for cleanup
    Start-Sleep -Seconds 2
} else {
    Write-Host "No backend processes found on port 3000" -ForegroundColor Yellow
}

Write-Host "Starting backend server..." -ForegroundColor Yellow
Set-Location backend
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start"
Write-Host "Backend server start command executed" -ForegroundColor Green
$port = 8080
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Write-Host "Stopping server on port $port (PID: $process)..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force
    Write-Host "Server stopped." -ForegroundColor Green
}
else {
    Write-Host "No server found running on port $port." -ForegroundColor Red
}

# Start the local server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx -y http-server -p 8080" -WindowStyle Normal

# Wait for the server to initialize
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Open the browser
Write-Host "Opening browser at http://localhost:8080" -ForegroundColor Green
Start-Process "http://localhost:8080"

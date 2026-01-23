# GrantSignal Development Server Startup Script
# This script starts both Next.js and Inngest dev servers

Write-Host "Starting GrantSignal Development Environment..." -ForegroundColor Green
Write-Host ""

# Start Next.js dev server in a new window
Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm dev"

# Wait a moment for Next.js to start
Start-Sleep -Seconds 3

# Start Inngest dev server in a new window
Write-Host "Starting Inngest dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx inngest-cli@latest dev"

Write-Host ""
Write-Host "Development servers are starting in separate windows..." -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  - Next.js:  http://localhost:3000" -ForegroundColor White
Write-Host "  - Inngest:  http://localhost:8288" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

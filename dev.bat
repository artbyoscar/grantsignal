@echo off
echo Starting GrantSignal Development Environment...
echo.

echo Starting Next.js dev server...
start "Next.js Dev Server" cmd /k "pnpm dev"

timeout /t 3 /nobreak > nul

echo Starting Inngest dev server...
start "Inngest Dev Server" cmd /k "npx inngest-cli@latest dev"

echo.
echo Development servers are starting in separate windows...
echo.
echo Services:
echo   - Next.js:  http://localhost:3000
echo   - Inngest:  http://localhost:8288
echo.
echo Press any key to exit this script (servers will continue running)...
pause > nul

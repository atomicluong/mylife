@echo off
title TimeFlow Super App
color 0b
echo ===========================================================
echo   STARTING TIMEFLOW SUPER APP...
echo   Hot Reload is ACTIVE. Any code changes will auto-refresh.
echo ===========================================================
echo.
cd /d "%~dp0"

:: Start the Edge App window after a 2-second delay to let Vite boot up
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start msedge --app=http://localhost:5173"

:: Run Vite dev server in the foreground
npm run dev

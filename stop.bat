@echo off
title Stop SyllabusForge
echo ============================================================
echo           Stopping SyllabusForge Services
echo ============================================================
echo.
echo Terminating processes on port 5000 (Backend API / Unified Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Terminating processes on port 3000 (Vite Dev Server if active)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All SyllabusForge server processes have been stopped!
timeout /t 3 >nul


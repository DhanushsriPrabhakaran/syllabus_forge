@echo off
title SyllabusForge - Institutional Curriculum System
echo ============================================================
echo         SyllabusForge - Regulation 2026 System
echo ============================================================
echo.
echo 1. Checking MongoDB service...
net start MongoDB >nul 2>&1

echo 2. Opening SyllabusForge in your browser at http://localhost:5000 ...
timeout /t 2 >nul
start http://localhost:5000

echo 3. Starting backend server with unified client distribution...
npm start
pause


@echo off
title US Platform Launcher
echo ===================================================
echo        Launching US Platform Services
echo ===================================================

echo [1/3] Starting MySQL Server (Port 3306)...
start "MySQL Server" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.4\my.ini" --console

timeout /t 3 /nobreak >nul

echo [2/3] Starting US Backend API (Port 5001)...
cd /d "%~dp0backend"
start "US Backend API" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting US Frontend (Vite)...
cd /d "%~dp0frontend"
start "US Frontend" cmd /k "npm run dev"

echo ===================================================
echo  All services started successfully!
echo  Open your browser at: http://localhost:5173
echo ===================================================
pause


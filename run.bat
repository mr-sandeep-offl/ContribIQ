@echo off
echo ===================================================
echo Starting SyncScore AI - MERN Stack Project
echo ===================================================

echo [1/2] Launching Backend Server (Port 5000)...
start "SyncScore Backend" cmd /k "cd backend && npm install && npm run start"

echo [2/2] Launching Frontend Dev Server (Port 5173)...
start "SyncScore Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo ===================================================
echo Both services are booting up in separate windows.
echo - Backend API: http://localhost:5000
echo - Frontend App: http://localhost:5173
echo ===================================================
pause

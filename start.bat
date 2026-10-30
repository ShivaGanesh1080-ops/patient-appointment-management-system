@echo off
cd /d "%~dp0"
title Patient Appointment Management System - MediPulse
echo ==============================================================
echo    PATIENT APPOINTMENT MANAGEMENT SYSTEM (MediPulse)
echo    WTMP Course Project | Developed by Shiva Ganesh Akku
echo ==============================================================
echo.
echo Initializing Database and Starting Server...
node server.js
pause

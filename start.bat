@echo off
title Patient Appointment Management System - MediPulse
echo ==============================================================
echo    PATIENT APPOINTMENT MANAGEMENT SYSTEM (MediPulse)
echo    WTMP Course Project | Developed by Shiva Ganesh Akku
echo ==============================================================
echo.
echo Starting Express Server & Database...
start http://localhost:5000
node server.js
pause

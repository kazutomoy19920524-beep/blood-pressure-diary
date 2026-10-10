@echo off
title Blood Pressure Local Server
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\server.ps1"
pause

@echo off
title Blood Pressure Deploy
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\deploy.ps1"
pause

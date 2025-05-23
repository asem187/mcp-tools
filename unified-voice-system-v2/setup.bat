@echo off
echo ====================================
echo Voice Assistant for Claude - Setup
echo ====================================
echo.

echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To start the app, run: npm start
echo.
echo Keyboard shortcuts:
echo   Ctrl+Shift+Space - Toggle voice
echo   Ctrl+Shift+V     - Show/hide window
echo   Ctrl+T           - Quick text input
echo.
pause
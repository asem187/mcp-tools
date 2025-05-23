@echo off
echo Setting up Claude Voice Assistant...
echo.

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo ??  IMPORTANT: Add your Claude API key to main.js
echo    Open main.js and replace YOUR_CLAUDE_API_KEY
echo.
echo Press any key to start the voice assistant...
pause >nul

npm start
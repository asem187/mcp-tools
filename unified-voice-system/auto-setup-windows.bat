@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Claude Voice System - Automated Setup
echo ========================================
echo.

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Check for Node.js
echo Checking prerequisites...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js not found! Installing...
    echo.
    
    :: Download Node.js installer
    echo Downloading Node.js...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile 'node-installer.msi'"
    
    :: Install Node.js silently
    echo Installing Node.js...
    msiexec /i node-installer.msi /qn
    
    :: Add to PATH
    setx PATH "%PATH%;C:\Program Files\nodejs" /M
    
    :: Refresh environment
    call refreshenv
    
    del node-installer.msi
    echo Node.js installed successfully!
) else (
    echo ? Node.js found
)

:: Check for Git
where git >nul 2>&1
if %errorLevel% neq 0 (
    echo Git not found! Installing...
    echo.
    
    :: Download Git installer
    echo Downloading Git...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.41.0.windows.1/Git-2.41.0-64-bit.exe' -OutFile 'git-installer.exe'"
    
    :: Install Git silently
    echo Installing Git...
    git-installer.exe /VERYSILENT /NORESTART
    
    :: Refresh environment
    call refreshenv
    
    del git-installer.exe
    echo Git installed successfully!
) else (
    echo ? Git found
)

echo.
echo Setting up project directory...

:: Clone or update repository
if exist mcp-tools (
    echo Repository already exists, updating...
    cd mcp-tools
    git pull origin main
) else (
    echo Cloning repository...
    git clone https://github.com/asem187/mcp-tools.git
    cd mcp-tools
)

cd unified-voice-system

echo.
echo Installing dependencies...
call npm install

echo.
echo Running initial setup...
node setup.js

:: Create desktop shortcut
echo.
echo Creating desktop shortcut...
set desktopPath=%USERPROFILE%\Desktop
set shortcutPath=%desktopPath%\Claude Voice Assistant.lnk

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = '%CD%\node_modules\.bin\electron.cmd'; $Shortcut.Arguments = '.'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.IconLocation = '%CD%\assets\icon.png'; $Shortcut.Save()"

echo ? Desktop shortcut created

:: Check if Claude Desktop is running
echo.
echo Checking for Claude Desktop...
tasklist /FI "IMAGENAME eq Claude*" 2>nul | find /I /N "Claude">nul
if %errorLevel% eq 0 (
    echo ? Claude Desktop is running
) else (
    echo ! Claude Desktop not detected. Please start it for auto-typing to work.
)

:: Create startup option
echo.
set /p autostart="Would you like the voice assistant to start automatically with Windows? (y/n): "
if /i "%autostart%"=="y" (
    echo Creating startup entry...
    set startupPath=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
    copy "%shortcutPath%" "%startupPath%" >nul
    echo ? Voice assistant will start automatically with Windows
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo To start the voice assistant:
echo   - Double-click the desktop shortcut
echo   - OR run: npm start
echo.

set /p startnow="Would you like to start the voice assistant now? (y/n): "
if /i "%startnow%"=="y" (
    echo.
    echo Starting Claude Voice Assistant...
    start "" npm start
)

pause
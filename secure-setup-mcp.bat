@echo off
echo ========================================
echo   SECURE MCP Setup for Claude Desktop
echo ========================================
echo.

:: Create Claude directory if it doesn't exist
if not exist "%APPDATA%\Claude" (
    echo Creating Claude configuration directory...
    mkdir "%APPDATA%\Claude"
)

:: Prompt for GitHub token securely
echo Please enter your GitHub Personal Access Token
echo (It will be hidden as you type)
echo.
set /p GITHUB_TOKEN="GitHub Token: "

:: Create the config file with the token
echo Creating MCP configuration file...
(
echo {
echo   "mcpServers": {
echo     "docker": {
echo       "command": "docker",
echo       "args": ["run", "-i", "--rm", "mcp/docker:latest"],
echo       "env": {}
echo     },
echo     "github": {
echo       "command": "docker",
echo       "args": ["run", "-i", "--rm", "mcp/github-mcp-server:latest"],
echo       "env": {
echo         "GITHUB_TOKEN": "%GITHUB_TOKEN%"
echo       }
echo     },
echo     "brave-search": {
echo       "command": "docker",
echo       "args": ["run", "-i", "--rm", "mcp/brave-search:latest"],
echo       "env": {
echo         "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY"
echo       }
echo     },
echo     "puppeteer": {
echo       "command": "docker",
echo       "args": ["run", "-i", "--rm", "-v", "/tmp:/tmp", "mcp/puppeteer:latest"],
echo       "env": {}
echo     }
echo   }
echo }
) > "%APPDATA%\Claude\claude_desktop_config.json"

:: Clear the token from memory
set GITHUB_TOKEN=

echo.
echo ? Configuration complete!
echo ? Config saved to: %APPDATA%\Claude\claude_desktop_config.json
echo.
echo ? Your token has been securely added to the config.
echo.
echo Next steps:
echo 1. Restart Claude Desktop
echo 2. Look for new tools in the interface
echo.
pause
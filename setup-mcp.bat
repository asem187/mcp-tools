@echo off
echo Setting up Claude Desktop MCP Configuration...
echo.

:: Create Claude directory if it doesn't exist
if not exist "%APPDATA%\Claude" (
    echo Creating Claude configuration directory...
    mkdir "%APPDATA%\Claude"
)

:: Create the config file
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
echo         "GITHUB_TOKEN": "ghp_YOUR_TOKEN_HERE"
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

echo.
echo ? MCP configuration file created successfully!
echo ? Location: %APPDATA%\Claude\claude_desktop_config.json
echo.
echo ? IMPORTANT NEXT STEPS:
echo.
echo 1. Get a GitHub Personal Access Token:
echo    - Go to: https://github.com/settings/tokens
echo    - Click "Generate new token (classic)"
echo    - Select scopes: repo, read:user
echo    - Copy the token
echo.
echo 2. Edit the config file to add your GitHub token:
echo    - Open: %APPDATA%\Claude\claude_desktop_config.json
echo    - Replace "ghp_YOUR_TOKEN_HERE" with your actual token
echo.
echo 3. (Optional) Add Brave Search API key:
echo    - Get key from: https://brave.com/search/api/
echo    - Replace "YOUR_BRAVE_API_KEY" in the config
echo.
echo 4. Restart Claude Desktop to load the new configuration
echo.
echo Press any key to open the config file in Notepad...
pause >nul

:: Open the config file for editing
notepad "%APPDATA%\Claude\claude_desktop_config.json"

echo.
echo Setup complete! Remember to restart Claude Desktop.
pause
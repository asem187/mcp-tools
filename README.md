# MCP Tools for Claude Desktop

## Quick Setup

1. **Run the setup script:**
   ```
   setup-mcp.bat
   ```

2. **Get your GitHub token:**
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `read:user`
   - Copy the token

3. **Update the config:**
   - The script will open the config file in Notepad
   - Replace `ghp_YOUR_TOKEN_HERE` with your actual token
   - Save and close

4. **Restart Claude Desktop**

## Manual Setup

If the script doesn't work, copy `claude_desktop_config.json` to:
- Windows: `%APPDATA%\Claude\`
- Mac: `~/Library/Application Support/Claude/`
- Linux: `~/.config/Claude/`

## Available MCP Tools

- **Docker**: Control Docker containers
- **GitHub**: Interact with GitHub repos
- **Brave Search**: Web search capabilities
- **Puppeteer**: Browser automation

## Voice Chat Setup

See the `voice-chat` folder for Electron app and n8n workflow to add voice capabilities to Claude.
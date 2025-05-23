# Voice Assistant for Claude Desktop

A local Electron app that solves remote audio challenges by providing voice interaction with Claude while maintaining full conversation visibility.

## Features

- ? **Voice Input**: Continuous listening mode with automatic speech detection
- ? **Natural Speech**: ElevenLabs integration for high-quality voice responses
- ?? **Auto-Typing**: Automatically types your messages into Claude Desktop
- ?? **Dual Display**: See conversations in both the voice app and Claude Desktop
- ?? **Remote Audio Solution**: Runs locally, perfect for remote desktop scenarios
- ? **Fast & Responsive**: Direct API integration with Claude

## Quick Start

```bash
# Clone the repository
git clone https://github.com/asem187/mcp-tools.git
cd mcp-tools/unified-voice-system-v2

# Install dependencies
npm install

# Start the app
npm start
```

## How It Works

1. **Local Voice Capture**: The app runs on your local machine where your microphone exists
2. **API Processing**: Sends transcribed text to Claude's API
3. **Auto-Typing**: Types messages into Claude Desktop automatically
4. **Voice Response**: Uses ElevenLabs to speak Claude's responses

## Remote Audio Problem Solved

When using remote desktop to access your AI server:
- Audio doesn't work properly through RDP/VNC
- This app runs on your LOCAL machine
- Captures voice locally, processes remotely
- No audio streaming needed!

## Keyboard Shortcuts

- `Ctrl+Shift+Space`: Toggle voice listening
- `Ctrl+Shift+V`: Show/hide window
- `Ctrl+T`: Quick text input

## Configuration

The app stores settings in:
- Windows: `%APPDATA%/voice-assistant-for-claude`
- macOS: `~/Library/Application Support/voice-assistant-for-claude`
- Linux: `~/.config/voice-assistant-for-claude`

## API Keys

Your API keys are already configured:
- Claude (Anthropic) API
- ElevenLabs TTS API
- Hyperbrowser API (for future features)

## Building for Distribution

```bash
# Windows
npm run dist

# macOS
npm run dist

# Linux
npm run dist
```

## Architecture

```
Your Local Desktop
??? Voice Assistant (this app)
?   ??? Captures microphone input
?   ??? Sends to Claude API
?   ??? Auto-types to Claude Desktop
?   ??? Plays voice responses
?
??? Remote Desktop Connection
    ??? Your AI Server (7 RTX GPUs)
        ??? Claude Desktop (sees typed messages)
```

## Troubleshooting

### Microphone not working?
- Check browser permissions
- Ensure no other app is using the microphone

### Auto-type not working?
- Make sure Claude Desktop is visible
- Try disabling and re-enabling in settings

### Voice responses not playing?
- Check your system volume
- ElevenLabs will fallback to browser TTS if needed

## Future Features

- [ ] LM Studio integration for local models
- [ ] Hyperbrowser integration for web automation
- [ ] Custom wake words
- [ ] Voice profiles
- [ ] Conversation export

## License

MIT License - feel free to modify and distribute!
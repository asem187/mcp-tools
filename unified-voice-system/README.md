# Claude Unified Voice System

A complete voice interface for Claude that solves remote audio challenges and keeps your conversation visible in Claude Desktop.

## Features

- **? Local Voice Capture**: Runs on your local machine where your microphone is
- **? Remote AI Processing**: Communicates with Claude API (can run anywhere)
- **? Auto-Type Integration**: Automatically types into Claude Desktop
- **?? Full Conversation Visibility**: See everything in both the voice app and Claude Desktop
- **? Natural Voice Output**: ElevenLabs TTS for high-quality responses
- **? Multiple Modes**: Continuous listening or push-to-talk
- **? Fully Configured**: Your API keys are already set up

## Quick Start

```bash
# Clone the repository
git clone https://github.com/asem187/mcp-tools.git
cd mcp-tools/unified-voice-system

# Install and run
npm install
npm start
```

That's it! The app will launch and you can start talking to Claude.

## How It Works

1. **Voice Input**: Captured locally on your desktop (solving remote audio issues)
2. **API Processing**: Sends to Claude API (works from anywhere)
3. **Auto-Typing**: Types your message into Claude Desktop automatically
4. **Voice Response**: Claude's response is spoken via ElevenLabs
5. **Dual Display**: See conversation in both the voice app and Claude Desktop

## Architecture

```
Your Local Desktop
??? Voice Assistant App (Electron)
?   ??? Microphone Input ?
?   ??? Speaker Output ?
?   ??? Auto-Type to Claude Desktop
?
??? Claude Desktop (MCP Enhanced)
?   ??? Shows full conversation
?
Remote AI Server (Optional)
??? Can run API processing
```

## First Time Setup

When you first run the app:

1. **Allow Microphone Access**: Your browser will ask for microphone permission - click "Allow"
2. **Position the Window**: The app appears on the right side of your screen by default
3. **Check Claude Desktop**: Make sure Claude Desktop is running for auto-typing to work
4. **Start Talking**: Click the microphone button or press Ctrl+Shift+Space

## Using the Voice Assistant

### Voice Modes

**Continuous Mode** (Default)
- The assistant listens continuously after you start
- Automatically detects when you stop speaking
- Great for natural conversations

**Push-to-Talk Mode**
- Hold the microphone button while speaking
- Release to stop recording
- Good for noisy environments

### Keyboard Shortcuts

- **Ctrl+Shift+Space**: Toggle voice on/off
- **Ctrl+Shift+V**: Switch between continuous/push-to-talk
- **Enter**: Send typed message

### Settings

Click the gear icon to access settings:

- **Auto-Type**: Automatically type into Claude Desktop (enabled by default)
- **Always on Top**: Keep voice window above other apps
- **Voice Speed**: Adjust playback speed (0.5x - 2.0x)

## Troubleshooting

### Remote Desktop Audio
The app is designed to work perfectly with remote desktop setups:
- Voice capture happens on your LOCAL machine
- No remote audio forwarding needed
- Works with RDP, VNC, TeamViewer, etc.

### Claude Desktop Not Found
The app will still work! It will type wherever your cursor is focused. To ensure it finds Claude Desktop:
- Make sure Claude Desktop is running
- The window title should contain "Claude"
- Try clicking in Claude Desktop once before using voice

### Microphone Not Working
1. Check browser permissions (should show microphone icon in address bar)
2. Try refreshing the app
3. Check your system audio settings
4. If using remote desktop, make sure you're running the app locally

### No Audio Output
1. Check your system volume
2. Make sure ElevenLabs API key is valid
3. The app will fall back to browser TTS if ElevenLabs fails

## Advanced Features

### Conversation Context
The assistant maintains conversation history:
- Remembers last 10 messages (5 exchanges)
- Provides context for better responses
- Can be cleared with the "Clear Conversation" button

### System Tray Integration
- Minimize to system tray to save space
- Quick access via tray icon
- Right-click for options

### Custom Positioning
- Drag the window anywhere on screen
- Resize to your preference
- Settings persist between sessions

## Development

```bash
# Run with DevTools open
npm run dev

# Build standalone executable
npm run build
```

### Project Structure
```
unified-voice-system/
??? main.js          # Electron main process
??? renderer.js      # UI and voice logic
??? index.html       # Interface
??? setup.js         # Initial setup script
??? package.json     # Dependencies
??? assets/          # Icons and resources
```

## API Keys

Your API keys are already configured in main.js:
- Claude API: For AI responses
- ElevenLabs API: For natural voice synthesis

To update keys, edit the constants in main.js.

## Tips for Best Experience

1. **Speak naturally** - The recognition works best with normal speech
2. **Pause between sentences** - This helps with accurate transcription
3. **Keep Claude Desktop visible** - Position windows side by side
4. **Use keyboard shortcuts** - Much faster than clicking buttons
5. **Adjust voice speed** - Find what works best for you

## Privacy & Security

- All processing happens locally or through official APIs
- No data is stored except temporary conversation history
- API keys are kept in the main process only
- Settings stored locally on your machine

## Credits

Built with:
- Electron for cross-platform desktop app
- Claude API for AI responses
- ElevenLabs for natural voice synthesis
- RobotJS for system automation
- Web Speech API for voice recognition

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Run in dev mode (`npm run dev`) to see console logs
3. Create an issue on GitHub with details

---

Enjoy your new voice-powered Claude experience! ?
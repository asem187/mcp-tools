# AI Role: Unified Voice System Architect

## Role Definition
You are an expert full-stack developer specializing in Electron applications, voice interfaces, and system integration. Your task is to build a complete voice assistant system for Claude Desktop that solves remote audio challenges while maintaining full conversation visibility.

## Core Requirements

### Problem Statement
- User has a powerful AI server (7 RTX GPUs) accessed via remote desktop
- Remote audio doesn't work properly through RDP/VNC
- User wants ChatGPT-like voice interaction with Claude
- Must see conversation history in Claude Desktop
- Solution must work with existing MCP-enhanced Claude setup

### Technical Architecture
Build a distributed system where:
1. Voice capture happens locally (where microphone exists)
2. API processing can happen anywhere
3. Responses appear in both voice app and Claude Desktop
4. Audio output plays through local speakers

## Deliverables

### 1. Electron Desktop Application
Create a voice assistant with:
- **Main Process** (`main.js`)
  - Window management with always-on-top option
  - System tray integration
  - Global keyboard shortcuts
  - IPC handlers for API communication
  - RobotJS integration for auto-typing

- **Renderer Process** (`renderer.js`)
  - Web Speech API for voice recognition
  - Real-time transcription
  - Audio visualization with waveforms
  - Settings persistence
  - Error handling with fallbacks

- **User Interface** (`index.html`)
  - Modern dark theme
  - Microphone button with visual feedback
  - Conversation transcript
  - Settings panel
  - Mode toggle (continuous/push-to-talk)

### 2. API Integrations
Implement:
- **Claude API** (Anthropic)
  - Conversation context management (last 10 messages)
  - Streaming response support
  - Error handling

- **ElevenLabs TTS**
  - Natural voice synthesis
  - Variable playback speed
  - Fallback to browser TTS

### 3. Auto-Typing Bridge
Create system that:
- Detects Claude Desktop window
- Focuses the application
- Types messages automatically
- Works even if Claude Desktop not found (types at cursor)

### 4. Configuration Files
- `package.json` with all dependencies
- `setup.js` for initial configuration
- Comprehensive `README.md`
- Auto-setup scripts for Windows/Mac/Linux

## Key Features to Implement

### Voice Modes
1. **Continuous Listening** - Always ready, auto-detects speech end
2. **Push-to-Talk** - Manual control for noisy environments

### Keyboard Shortcuts
- `Ctrl+Shift+Space` - Toggle voice
- `Ctrl+Shift+V` - Switch modes
- `Enter` - Send typed message

### Settings
- Auto-type toggle
- Always-on-top window
- Voice speed adjustment (0.5x - 2.0x)
- Conversation history clearing

### Visual Feedback
- Status indicator (ready/listening/processing)
- Waveform animation during recording
- Message timestamps
- Smooth animations

## Technical Implementation Details

### Dependencies
```json
{
  "electron": "^25.0.0",
  "node-fetch": "^2.6.7",
  "robotjs": "^0.6.0",
  "electron-store": "^8.1.0",
  "ws": "^8.13.0"
}
```

### API Keys Structure
```javascript
const CLAUDE_API_KEY = 'sk-ant-api03-...';
const ELEVENLABS_API_KEY = 'sk_...';
```

### Error Handling
- Microphone permission denied ? Clear message + instructions
- API failures ? Fallback options
- Audio playback errors ? Browser TTS fallback
- Claude Desktop not found ? Type at current cursor

### Performance Optimizations
- Debounced speech recognition
- Efficient audio streaming
- Smart window management
- Minimal resource usage

## Success Criteria
1. Voice input works perfectly on local machine
2. No remote audio configuration needed
3. Conversation visible in both apps
4. Sub-second response latency
5. Natural voice output
6. Reliable auto-typing
7. Professional UI/UX
8. One-click installation

## Architecture Diagram
```
Local Desktop
??? Voice Assistant (Electron)
?   ??? Microphone ? Speech Recognition
?   ??? Claude API ? ? Response
?   ??? ElevenLabs ? Audio Output
?   ??? RobotJS ? Type to Claude Desktop
?
??? Claude Desktop (MCP-Enhanced)
    ??? Shows complete conversation
```

## Additional Considerations
- Handle remote desktop scenarios gracefully
- Support multiple monitors
- Persist window position/size
- Minimize to system tray
- Auto-start option
- Cross-platform compatibility

Build this system to be production-ready, user-friendly, and solve the specific challenge of voice interaction across remote desktop connections while maintaining the familiar Claude Desktop experience.
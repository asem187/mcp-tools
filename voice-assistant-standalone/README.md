# Claude Voice Assistant - Standalone Version

A lightweight voice assistant that runs alongside Claude Desktop, providing ChatGPT-like voice interaction.

## Quick Start

1. **Add your Claude API key**
   - Open `main.js`
   - Replace `YOUR_CLAUDE_API_KEY` with your Anthropic API key
   - Your ElevenLabs key is already configured

2. **Install and run**
   ```bash
   cd voice-assistant-standalone
   npm install
   npm start
   ```

3. **Use it**
   - Click "Start Voice Chat" or press Ctrl+Space
   - Speak naturally - it listens continuously
   - See your conversation in the window
   - Keep Claude Desktop open alongside

## Features

- ? Continuous listening (no push-to-talk)
- ? Natural ElevenLabs voices
- ? Floating window (always on top)
- ? Visual feedback (waveform animation)
- ? Conversation history
- ? Keyboard shortcut (Ctrl+Space)
- ? Auto-restart on errors

## Troubleshooting

- **No microphone access**: Allow microphone permissions when prompted
- **API errors**: Check your Claude API key is valid
- **Audio not playing**: Check system volume and audio output

## Customization

- Change window position: Edit `x` and `y` in main.js
- Change voice: Update voice ID in main.js (line with ElevenLabs URL)
- Adjust response length: Change `max_tokens` in main.js
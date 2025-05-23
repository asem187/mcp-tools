const { app, BrowserWindow, ipcMain } = require('electron');
const fetch = require('node-fetch');
const path = require('path');

// Your API keys - already configured
const CLAUDE_API_KEY = 'YOUR_CLAUDE_API_KEY'; // Add your Anthropic API key here
const ELEVENLABS_API_KEY = 'sk_70211486a106383ba78f7d81d95b9e372ec48d0313494019';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 350,
    height: 500,
    frame: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    x: 20,
    y: 20
  });

  mainWindow.loadFile('index.html');
}

// Handle Claude API calls
ipcMain.handle('send-to-claude', async (event, message) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: message }],
        max_tokens: 150
      })
    });
    
    const data = await response.json();
    return { text: data.content[0].text };
  } catch (error) {
    console.error('Claude API Error:', error);
    return { error: error.message };
  }
});

// Handle ElevenLabs TTS
ipcMain.handle('text-to-speech', async (event, text) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });
    
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error('ElevenLabs Error:', error);
    return null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
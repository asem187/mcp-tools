const { app, BrowserWindow, ipcMain, desktopCapturer, Menu } = require('electron');
const fetch = require('node-fetch');
const path = require('path');

// Your API keys
const CLAUDE_API_KEY = 'sk-ant-api03-SnqVB2_P9euq5bIi_alcsxnKxHU77NgP8r48S-ZOazmy0PoCP1ipTZpMij1ECLZVaNcFOolAFH5ammBB-Zww-uZTb9wAA';
const ELEVENLABS_API_KEY = 'sk_70211486a106383ba78f7d81d95b9e372ec48d0313494019';

let mainWindow;
let isRecording = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    x: 20,
    y: 20
  });

  mainWindow.loadFile('index-with-screenshare.html');
}

// Get available screens and windows for capture
ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['window', 'screen'],
      thumbnailSize: { width: 320, height: 240 }
    });
    
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

// Handle screen recording toggle
ipcMain.handle('toggle-recording', async (event, sourceId) => {
  isRecording = !isRecording;
  return { isRecording, sourceId };
});

// Handle Claude API calls with screen context
ipcMain.handle('send-to-claude', async (event, message, screenContext = null) => {
  try {
    let fullMessage = message;
    
    if (screenContext) {
      fullMessage = `User is sharing their screen (${screenContext.sourceName}). User says: ${message}`;
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: fullMessage }],
        max_tokens: 200
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

// Create app menu with screen recording options
function createMenu() {
  const template = [
    {
      label: 'Screen',
      submenu: [
        {
          label: 'Select Screen to Share',
          click: () => {
            mainWindow.webContents.send('open-screen-selector');
          }
        },
        {
          label: 'Stop Sharing',
          click: () => {
            mainWindow.webContents.send('stop-screen-share');
          }
        }
      ]
    },
    {
      label: 'Voice',
      submenu: [
        {
          label: 'Start Listening',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('toggle-voice');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle screen capture data if needed
ipcMain.handle('process-screen-frame', async (event, frameData) => {
  // Here you could:
  // 1. Send to your GPU server for processing
  // 2. Save locally
  // 3. Stream to a service
  // 4. Analyze with computer vision
  
  console.log('Received screen frame for processing');
  return { processed: true };
});
const { app, BrowserWindow, ipcMain, desktopCapturer, screen, systemPreferences } = require('electron');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Your API keys
const CLAUDE_API_KEY = 'sk-ant-api03-SnqVB2_P9euq5bIi_alcsxnKxHU77NgP8r48S-ZOazmy0PoCP1ipTZpMij1ECLZVaNcFOolAFH5ammBB-Zww-uZTb9wAA';
const ELEVENLABS_API_KEY = 'sk_70211486a106383ba78f7d81d95b9e372ec48d0313494019';

let mainWindow;
let recordingStream = null;
let mediaRecorder = null;
let recordedChunks = [];

// Check for screen recording permissions on macOS
async function checkScreenPermissions() {
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen');
    if (status !== 'granted') {
      console.log('Screen recording permission needed');
      return false;
    }
  }
  return true;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    frame: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Voice Assistant with Screen Share'
  });

  mainWindow.loadFile('index.html');
  
  // Auto-open devtools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Get available screens and windows
ipcMain.handle('get-sources', async () => {
  try {
    await checkScreenPermissions();
    
    const sources = await desktopCapturer.getSources({ 
      types: ['window', 'screen'],
      thumbnailSize: { width: 320, height: 240 }
    });
    
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

// Start screen recording
ipcMain.handle('start-recording', async (event, sourceId) => {
  try {
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080,
          minFrameRate: 15,
          maxFrameRate: 30
        }
      }
    };
    
    // Send constraints to renderer for recording
    mainWindow.webContents.send('setup-recording', { sourceId, constraints });
    
    return { success: true };
  } catch (error) {
    console.error('Error starting recording:', error);
    return { success: false, error: error.message };
  }
});

// Stop screen recording
ipcMain.handle('stop-recording', async () => {
  mainWindow.webContents.send('stop-recording-renderer');
  return { success: true };
});

// Save recording
ipcMain.handle('save-recording', async (event, buffer) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const downloadsPath = app.getPath('downloads');
    const fileName = `screen-recording-${timestamp}.webm`;
    const filePath = path.join(downloadsPath, fileName);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving recording:', error);
    return { success: false, error: error.message };
  }
});

// Handle Claude API calls with screen context
ipcMain.handle('send-to-claude', async (event, message, screenContext = null) => {
  try {
    let fullMessage = message;
    
    if (screenContext) {
      fullMessage = `User is sharing their screen (${screenContext.sourceName}). They said: "${message}"`;
      
      if (screenContext.description) {
        fullMessage += `\n\nScreen context: ${screenContext.description}`;
      }
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

// Get screen description for AI context
ipcMain.handle('capture-screen-context', async (event, sourceId) => {
  try {
    // This could be enhanced with OCR or image analysis
    // For now, return basic info
    return {
      timestamp: new Date().toISOString(),
      sourceId: sourceId,
      description: "Screen capture active"
    };
  } catch (error) {
    console.error('Error capturing screen context:', error);
    return null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
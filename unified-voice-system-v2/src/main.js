// Advanced Voice System Architecture v2.0
// Handles remote audio challenges with distributed processing

const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const robot = require('robotjs');

// Initialize configuration store
const store = new Store({
  defaults: {
    apiKeys: {
      claude: process.env.CLAUDE_API_KEY || 'sk-ant-api03-SnqVB2_P9euq5bIi_alcsxnKxHU77NgP8r48S-ZOazmy0PoCP1ipTZpMij1ECLZVaNcFOolAFH5ammBB-Zww-uZTb9wAA',
      elevenlabs: process.env.ELEVENLABS_API_KEY || 'sk_70211486a106383ba78f7d81d95b9e372ec48d0313494019',
      openai: process.env.OPENAI_API_KEY || '',
      hyperbrowser: process.env.HYPERBROWSER_API_KEY || 'hb_d474247f980179cb0536db9bd107'
    },
    preferences: {
      alwaysOnTop: true,
      autoType: true,
      voiceMode: 'continuous',
      modelPreference: 'claude',
      localServer: {
        enabled: true,
        port: 7777
      },
      lmStudio: {
        enabled: false,
        endpoint: 'http://localhost:1234/v1'
      }
    },
    windowBounds: {
      x: undefined,
      y: undefined,
      width: 400,
      height: 600
    }
  }
});

let mainWindow;
let tray;
let localServer;
let io;

// Create local server for remote audio bridge
function createLocalServer() {
  const app = express();
  const server = http.createServer(app);
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'web-client')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      version: '2.0.0',
      features: {
        langchain: true,
        hyperbrowser: true,
        lmStudio: store.get('preferences.lmStudio.enabled'),
        remoteAudio: true
      }
    });
  });

  // Voice endpoint for remote clients
  app.post('/voice', async (req, res) => {
    const { audio, text, mode } = req.body;
    
    try {
      const response = await processVoiceInput({
        audio,
        text,
        mode,
        source: 'remote'
      });
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket for real-time communication
  io.on('connection', (socket) => {
    console.log('Remote client connected:', socket.id);
    
    socket.on('voice-stream', async (data) => {
      // Handle streaming audio from remote client
      const result = await processStreamingAudio(data);
      socket.emit('voice-response', result);
    });

    socket.on('disconnect', () => {
      console.log('Remote client disconnected:', socket.id);
    });
  });

  const port = store.get('preferences.localServer.port');
  server.listen(port, () => {
    console.log(`Local voice bridge server running on port ${port}`);
  });

  return server;
}

// Create main application window
function createWindow() {
  const bounds = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    ...bounds,
    title: 'Voice Assistant Pro',
    frame: true,
    resizable: true,
    alwaysOnTop: store.get('preferences.alwaysOnTop'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Save window position on close
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup menu
  createMenu();
  
  // Setup system tray
  createTray();
  
  // Register global shortcuts
  registerShortcuts();
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'Ctrl+,',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        {
          label: 'Always on Top',
          type: 'checkbox',
          checked: store.get('preferences.alwaysOnTop'),
          click: (menuItem) => {
            store.set('preferences.alwaysOnTop', menuItem.checked);
            mainWindow.setAlwaysOnTop(menuItem.checked);
          }
        }
      ]
    },
    {
      label: 'Model',
      submenu: [
        {
          label: 'Claude (Anthropic)',
          type: 'radio',
          checked: store.get('preferences.modelPreference') === 'claude',
          click: () => {
            store.set('preferences.modelPreference', 'claude');
            mainWindow.webContents.send('model-changed', 'claude');
          }
        },
        {
          label: 'GPT-4 (OpenAI)',
          type: 'radio',
          checked: store.get('preferences.modelPreference') === 'openai',
          click: () => {
            store.set('preferences.modelPreference', 'openai');
            mainWindow.webContents.send('model-changed', 'openai');
          }
        },
        {
          label: 'LM Studio (Local)',
          type: 'radio',
          checked: store.get('preferences.modelPreference') === 'lmstudio',
          click: () => {
            store.set('preferences.modelPreference', 'lmstudio');
            mainWindow.webContents.send('model-changed', 'lmstudio');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/asem187/mcp-tools/wiki');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/asem187/mcp-tools/issues');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create system tray
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Start Voice',
      click: () => {
        mainWindow.webContents.send('toggle-voice');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Voice Assistant Pro');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Register global shortcuts
function registerShortcuts() {
  // Toggle voice
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    mainWindow.webContents.send('toggle-voice');
  });

  // Switch voice mode
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    const currentMode = store.get('preferences.voiceMode');
    const newMode = currentMode === 'continuous' ? 'push-to-talk' : 'continuous';
    store.set('preferences.voiceMode', newMode);
    mainWindow.webContents.send('voice-mode-changed', newMode);
  });

  // Quick type
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    mainWindow.webContents.send('quick-type');
  });
}

// Process voice input through LangChain
async function processVoiceInput({ audio, text, mode, source }) {
  const { ChatAnthropic } = require('@langchain/anthropic');
  const { ChatOpenAI } = require('@langchain/openai');
  const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
  
  const modelPreference = store.get('preferences.modelPreference');
  let chat;

  // Initialize appropriate model
  switch (modelPreference) {
    case 'claude':
      chat = new ChatAnthropic({
        apiKey: store.get('apiKeys.claude'),
        model: 'claude-3-opus-20240229',
        temperature: 0.7
      });
      break;
    
    case 'openai':
      chat = new ChatOpenAI({
        apiKey: store.get('apiKeys.openai'),
        model: 'gpt-4-turbo',
        temperature: 0.7
      });
      break;
    
    case 'lmstudio':
      // Use local LM Studio endpoint
      const lmStudioEndpoint = store.get('preferences.lmStudio.endpoint');
      chat = new ChatOpenAI({
        apiKey: 'not-needed',
        baseURL: lmStudioEndpoint,
        model: 'local-model',
        temperature: 0.7
      });
      break;
  }

  try {
    // Get conversation context
    const context = await getConversationContext();
    
    // Create messages
    const messages = [
      new SystemMessage("You are a helpful voice assistant. Keep responses concise and natural for speech."),
      ...context,
      new HumanMessage(text)
    ];

    // Get response
    const response = await chat.invoke(messages);
    
    // Convert to speech
    const audioResponse = await textToSpeech(response.content);
    
    // Auto-type if enabled
    if (store.get('preferences.autoType') && source === 'local') {
      await autoTypeToClaudeDesktop(text);
    }

    return {
      text: response.content,
      audio: audioResponse,
      model: modelPreference,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Processing error:', error);
    throw error;
  }
}

// Convert text to speech using ElevenLabs
async function textToSpeech(text) {
  const fetch = require('node-fetch');
  const apiKey = store.get('apiKeys.elevenlabs');
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error('TTS Error:', error);
    // Fallback to browser TTS
    return null;
  }
}

// Auto-type to Claude Desktop
async function autoTypeToClaudeDesktop(text) {
  try {
    // Find Claude Desktop window
    const windows = robot.getWindows();
    const claudeWindow = windows.find(w => 
      w.title.toLowerCase().includes('claude') || 
      w.title.toLowerCase().includes('anthropic')
    );

    if (claudeWindow) {
      // Focus Claude Desktop
      robot.focusWindow(claudeWindow);
      await sleep(100);
    }

    // Type the message
    robot.typeString(text);
    await sleep(50);
    
    // Press Enter to send
    robot.keyTap('enter');
  } catch (error) {
    console.error('Auto-type error:', error);
  }
}

// Get conversation context
async function getConversationContext() {
  // This would retrieve recent messages from your storage
  // For now, returning empty array
  return [];
}

// Utility sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle app events
app.whenReady().then(() => {
  createWindow();
  
  // Start local server
  localServer = createLocalServer();
  
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
});

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

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  // Close local server
  if (localServer) {
    localServer.close();
  }
});

// IPC handlers
ipcMain.handle('get-store', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('process-voice', async (event, data) => {
  return await processVoiceInput({ ...data, source: 'local' });
});

// Export for testing
module.exports = { app, store };
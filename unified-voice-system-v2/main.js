// Unified Voice System - Local Electron App
// Runs entirely on your local desktop to handle remote audio challenges

const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut } = require('electron');
const path = require('path');
const robot = require('robotjs');
const Store = require('electron-store');

// Configure store for settings persistence
const store = new Store({
  defaults: {
    apiKeys: {
      claude: 'sk-ant-api03-SnqVB2_P9euq5bIi_alcsxnKxHU77NgP8r48S-ZOazmy0PoCP1ipTZpMij1ECLZVaNcFOolAFH5ammBB-Zww-uZTb9wAA',
      elevenlabs: 'sk_70211486a106383ba78f7d81d95b9e372ec48d0313494019',
      hyperbrowser: 'hb_d474247f980179cb0536db9bd107'
    },
    preferences: {
      alwaysOnTop: true,
      autoType: true,
      voiceMode: 'continuous',
      voiceSpeed: 1.0,
      windowPosition: { x: null, y: null }
    }
  }
});

let mainWindow;
let tray;

function createWindow() {
  // Get saved position or default
  const savedPosition = store.get('preferences.windowPosition');
  const windowConfig = {
    width: 400,
    height: 600,
    frame: true,
    alwaysOnTop: store.get('preferences.alwaysOnTop'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Voice Assistant'
  };

  // Apply saved position if exists
  if (savedPosition.x !== null && savedPosition.y !== null) {
    windowConfig.x = savedPosition.x;
    windowConfig.y = savedPosition.y;
  } else {
    // Position on right side of screen
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    windowConfig.x = width - 420;
    windowConfig.y = 20;
  }

  mainWindow = new BrowserWindow(windowConfig);
  mainWindow.loadFile('index.html');

  // Save position on move
  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition();
    store.set('preferences.windowPosition', { x, y });
  });

  // Create tray icon
  createTray();

  // Register global shortcuts
  registerShortcuts();
}

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
      label: 'Toggle Voice',
      click: () => {
        mainWindow.webContents.send('toggle-voice');
      }
    },
    { type: 'separator' },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: store.get('preferences.alwaysOnTop'),
      click: (menuItem) => {
        store.set('preferences.alwaysOnTop', menuItem.checked);
        mainWindow.setAlwaysOnTop(menuItem.checked);
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

  tray.setToolTip('Voice Assistant');
  tray.setContextMenu(contextMenu);
  
  // Click to show/hide
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function registerShortcuts() {
  // Global shortcut to toggle voice
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    mainWindow.webContents.send('toggle-voice');
  });

  // Global shortcut to show/hide window
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// IPC Handlers
ipcMain.handle('get-api-keys', () => {
  return store.get('apiKeys');
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('preferences', { ...store.get('preferences'), ...settings });
  return true;
});

ipcMain.handle('get-settings', () => {
  return store.get('preferences');
});

// Claude API Handler
ipcMain.handle('send-to-claude', async (event, { message, conversationHistory }) => {
  const fetch = require('node-fetch');
  const apiKey = store.get('apiKeys.claude');
  
  try {
    // Build messages array with context
    const messages = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Claude API error');
    }

    return { 
      success: true, 
      text: data.content[0].text 
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ElevenLabs TTS Handler
ipcMain.handle('text-to-speech', async (event, text) => {
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
      throw new Error('ElevenLabs API error');
    }

    const buffer = await response.buffer();
    return { 
      success: true, 
      audio: buffer.toString('base64') 
    };
  } catch (error) {
    console.error('ElevenLabs Error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Auto-type to Claude Desktop
ipcMain.handle('auto-type', async (event, text) => {
  const autoTypeEnabled = store.get('preferences.autoType');
  
  if (!autoTypeEnabled) {
    return { success: false, reason: 'Auto-type disabled' };
  }

  try {
    // Small delay to allow window switching
    await sleep(100);
    
    // Try to find Claude Desktop window
    // This is a simplified version - in production you'd use more robust window detection
    const activeWindow = robot.getActiveWindow();
    
    // Type the text
    robot.typeString(text);
    
    // Small delay before pressing enter
    await sleep(50);
    
    // Press Enter to send
    robot.keyTap('enter');
    
    return { success: true };
  } catch (error) {
    console.error('Auto-type error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Utility function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// App event handlers
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

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});
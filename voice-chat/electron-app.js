// Electron Voice Chat for Claude
// This app provides voice interface while keeping Claude Desktop visible

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// n8n webhook URL - update after importing workflow
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/voice-chat'

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,
    transparent: false,
    alwaysOnTop: true
  })

  mainWindow.loadFile('index.html')
}

// Handle n8n webhook communication
ipcMain.handle('send-to-n8n', async (event, message) => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    return await response.json()
  } catch (error) {
    console.error('n8n Error:', error)
    return { error: error.message }
  }
})

app.whenReady().then(createWindow)
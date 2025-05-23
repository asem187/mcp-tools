// Renderer process - handles all UI and voice interactions
const { ipcRenderer } = require('electron');

let recognition = null;
let isListening = false;
let conversationHistory = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await ipcRenderer.invoke('get-settings');
  
  // Initialize UI elements
  const voiceButton = document.getElementById('voice-button');
  const statusDiv = document.getElementById('status');
  const transcriptDiv = document.getElementById('transcript');
  const conversationDiv = document.getElementById('conversation');
  const settingsBtn = document.getElementById('settings-btn');
  const clearBtn = document.getElementById('clear-history');
  const autoTypeToggle = document.getElementById('auto-type');
  const alwaysOnTopToggle = document.getElementById('always-on-top');
  const voiceSpeedSlider = document.getElementById('voice-speed');
  const voiceSpeedValue = document.getElementById('voice-speed-value');

  // Apply saved settings
  autoTypeToggle.checked = settings.autoType;
  alwaysOnTopToggle.checked = settings.alwaysOnTop;
  voiceSpeedSlider.value = settings.voiceSpeed || 1.0;
  voiceSpeedValue.textContent = settings.voiceSpeed || 1.0;

  // Initialize speech recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';
    let silenceTimer = null;

    recognition.onstart = () => {
      isListening = true;
      voiceButton.classList.add('listening');
      statusDiv.textContent = 'Listening...';
      statusDiv.className = 'status listening';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      transcriptDiv.textContent = finalTranscript + interimTranscript;
      
      // Auto-send after 2 seconds of silence
      if (silenceTimer) clearTimeout(silenceTimer);
      
      if (finalTranscript.trim()) {
        silenceTimer = setTimeout(() => {
          sendMessage(finalTranscript.trim());
          finalTranscript = '';
          transcriptDiv.textContent = '';
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      statusDiv.textContent = `Error: ${event.error}`;
      statusDiv.className = 'status error';
      stopListening();
    };

    recognition.onend = () => {
      isListening = false;
      voiceButton.classList.remove('listening');
      if (isListening) {
        // Auto-restart if still supposed to be listening
        recognition.start();
      }
    };
  } else {
    statusDiv.textContent = 'Speech recognition not supported';
    statusDiv.className = 'status error';
  }

  // Event listeners
  voiceButton.addEventListener('click', toggleListening);
  
  clearBtn.addEventListener('click', () => {
    conversationHistory = [];
    conversationDiv.innerHTML = '';
  });

  settingsBtn.addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('open');
  });

  autoTypeToggle.addEventListener('change', async () => {
    await ipcRenderer.invoke('save-settings', { autoType: autoTypeToggle.checked });
  });

  alwaysOnTopToggle.addEventListener('change', async () => {
    await ipcRenderer.invoke('save-settings', { alwaysOnTop: alwaysOnTopToggle.checked });
  });

  voiceSpeedSlider.addEventListener('input', async () => {
    const speed = parseFloat(voiceSpeedSlider.value);
    voiceSpeedValue.textContent = speed;
    await ipcRenderer.invoke('save-settings', { voiceSpeed: speed });
  });

  // IPC listeners
  ipcRenderer.on('toggle-voice', toggleListening);

  // Keyboard shortcut for quick text input
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
      const input = prompt('Type your message:');
      if (input) sendMessage(input);
    }
  });
});

function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  if (recognition && !isListening) {
    recognition.start();
    isListening = true;
  }
}

function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

async function sendMessage(text) {
  // Update UI
  addToConversation('user', text);
  document.getElementById('status').textContent = 'Processing...';
  document.getElementById('status').className = 'status processing';

  try {
    // Send to Claude
    const claudeResponse = await ipcRenderer.invoke('send-to-claude', {
      message: text,
      conversationHistory: conversationHistory
    });

    if (!claudeResponse.success) {
      throw new Error(claudeResponse.error);
    }

    // Add Claude's response to conversation
    addToConversation('assistant', claudeResponse.text);

    // Auto-type to Claude Desktop if enabled
    const settings = await ipcRenderer.invoke('get-settings');
    if (settings.autoType) {
      await ipcRenderer.invoke('auto-type', text);
    }

    // Convert to speech
    const ttsResponse = await ipcRenderer.invoke('text-to-speech', claudeResponse.text);
    
    if (ttsResponse.success) {
      // Play audio
      const audio = new Audio(`data:audio/mp3;base64,${ttsResponse.audio}`);
      audio.playbackRate = settings.voiceSpeed || 1.0;
      audio.play();
    } else {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(claudeResponse.text);
      utterance.rate = settings.voiceSpeed || 1.0;
      speechSynthesis.speak(utterance);
    }

    // Update status
    document.getElementById('status').textContent = 'Ready';
    document.getElementById('status').className = 'status ready';

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('status').textContent = `Error: ${error.message}`;
    document.getElementById('status').className = 'status error';
    addToConversation('error', error.message);
  }
}

function addToConversation(role, text) {
  const entry = {
    role: role,
    text: text,
    timestamp: new Date().toISOString()
  };
  
  conversationHistory.push(entry);
  
  // Update UI
  const conversationDiv = document.getElementById('conversation');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'timestamp';
  timeSpan.textContent = new Date().toLocaleTimeString();
  
  const textSpan = document.createElement('span');
  textSpan.className = 'text';
  textSpan.textContent = text;
  
  messageDiv.appendChild(timeSpan);
  messageDiv.appendChild(textSpan);
  
  conversationDiv.appendChild(messageDiv);
  conversationDiv.scrollTop = conversationDiv.scrollHeight;
}
const { ipcRenderer } = require('electron');

// Global state
let recognition;
let isListening = false;
let currentAudio = null;
let voiceMode = 'continuous';
let settings = {
  autoType: true,
  voiceSpeed: 1.0,
  alwaysOnTop: true
};

// Audio context for visualization
let audioContext;
let analyser;
let microphone;
let animationId;

// Initialize on load
window.addEventListener('load', async () => {
  // Load settings
  settings = await ipcRenderer.invoke('get-settings');
  applySettings();
  
  // Initialize speech recognition
  initSpeechRecognition();
  
  // Set up audio visualization
  setupAudioVisualization();
  
  // Update status
  updateStatus('ready');
  
  // Focus text input
  document.getElementById('textInput').focus();
  
  // Check for Claude Desktop
  checkClaudeDesktop();
});

// Initialize speech recognition
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    showError('Speech recognition not supported in this browser');
    return;
  }
  
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    updateStatus('listening');
    showWaveform(true);
  };
  
  recognition.onresult = async (event) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript;
    
    // Update UI with interim results
    if (!event.results[last].isFinal) {
      updateTextInput(transcript);
    } else {
      // Final result - process it
      clearTextInput();
      await processInput(transcript);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    if (event.error === 'not-allowed') {
      showError('Microphone access denied. Please allow microphone access and reload.');
    } else if (event.error === 'no-speech') {
      // Restart if no speech detected
      if (isListening && voiceMode === 'continuous') {
        setTimeout(() => recognition.start(), 100);
      }
    } else {
      showError(`Speech recognition error: ${event.error}`);
    }
  };
  
  recognition.onend = () => {
    showWaveform(false);
    
    // Auto-restart in continuous mode
    if (isListening && voiceMode === 'continuous') {
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }, 100);
    } else {
      isListening = false;
      updateVoiceButton(false);
    }
  };
}

// Process input (voice or text)
async function processInput(text) {
  if (!text.trim()) return;
  
  // Add to transcript
  addMessage('user', text);
  
  // Update status
  updateStatus('processing');
  
  // Send to Claude
  const response = await ipcRenderer.invoke('send-to-claude', text);
  
  if (response.error) {
    showError(response.error);
    updateStatus('ready');
    return;
  }
  
  // Add Claude's response to transcript
  addMessage('assistant', response.text);
  
  // Type to Claude Desktop if enabled
  if (settings.autoType) {
    const typeResult = await ipcRenderer.invoke('type-to-claude', text);
    console.log('Type result:', typeResult);
  }
  
  // Convert to speech
  await speakText(response.text);
  
  // Update status
  updateStatus(isListening ? 'listening' : 'ready');
}

// Text to speech
async function speakText(text) {
  const audioBase64 = await ipcRenderer.invoke('text-to-speech', text);
  
  if (!audioBase64) {
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.voiceSpeed;
      speechSynthesis.speak(utterance);
    }
    return;
  }
  
  // Play ElevenLabs audio
  try {
    const audioBlob = new Blob(
      [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
      { type: 'audio/mpeg' }
    );
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    currentAudio.playbackRate = settings.voiceSpeed;
    
    // Stop recognition while speaking
    if (isListening && recognition) {
      recognition.stop();
    }
    
    currentAudio.onended = () => {
      currentAudio = null;
      // Resume listening if needed
      if (isListening && voiceMode === 'continuous') {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart after speech:', e);
          }
        }, 500);
      }
    };
    
    await currentAudio.play();
  } catch (error) {
    console.error('Audio playback error:', error);
  }
}

// UI Functions
function toggleVoice() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  if (!recognition) {
    showError('Speech recognition not initialized');
    return;
  }
  
  isListening = true;
  updateVoiceButton(true);
  
  try {
    recognition.start();
  } catch (error) {
    if (error.message.includes('already started')) {
      // Already running, that's fine
    } else {
      console.error('Failed to start recognition:', error);
      isListening = false;
      updateVoiceButton(false);
    }
  }
}

function stopListening() {
  isListening = false;
  updateVoiceButton(false);
  
  if (recognition) {
    recognition.stop();
  }
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

function sendTextMessage() {
  const input = document.getElementById('textInput');
  const text = input.value.trim();
  
  if (!text) return;
  
  input.value = '';
  processInput(text);
}

function addMessage(role, text) {
  const transcript = document.getElementById('transcript');
  
  // Clear welcome message if exists
  const welcomeMsg = transcript.querySelector('.text-muted');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
  
  const message = document.createElement('div');
  message.className = `message ${role}`;
  
  const content = document.createElement('div');
  content.textContent = text;
  message.appendChild(content);
  
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  timestamp.textContent = new Date().toLocaleTimeString();
  message.appendChild(timestamp);
  
  transcript.appendChild(message);
  transcript.scrollTop = transcript.scrollHeight;
}

// Audio visualization
function setupAudioVisualization() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
      })
      .catch(err => {
        console.error('Error accessing microphone for visualization:', err);
      });
  } catch (error) {
    console.error('Error setting up audio visualization:', error);
  }
}

function animateWaveform() {
  if (!analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  const bars = document.querySelectorAll('.wave-bar');
  bars.forEach((bar, index) => {
    const value = dataArray[index * 20] || 0;
    const height = Math.max(10, (value / 255) * 50);
    bar.style.height = `${height}px`;
  });
  
  animationId = requestAnimationFrame(animateWaveform);
}

function showWaveform(show) {
  const waveform = document.getElementById('waveform');
  
  if (show) {
    waveform.classList.remove('hidden');
    animateWaveform();
  } else {
    waveform.classList.add('hidden');
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }
}

// Status updates
function updateStatus(status) {
  const indicator = document.getElementById('statusIndicator');
  
  indicator.className = 'status-indicator';
  
  switch (status) {
    case 'ready':
      indicator.classList.add('connected');
      break;
    case 'listening':
      indicator.classList.add('listening');
      break;
    case 'processing':
      indicator.classList.add('processing');
      break;
  }
}

function updateVoiceButton(active) {
  const button = document.getElementById('voiceButton');
  
  if (active) {
    button.classList.add('active');
    button.innerHTML = '??';
  } else {
    button.classList.remove('active');
    button.innerHTML = '?';
  }
}

function updateTextInput(text) {
  const input = document.getElementById('textInput');
  input.value = text;
}

function clearTextInput() {
  document.getElementById('textInput').value = '';
}

// Mode switching
function setMode(mode) {
  voiceMode = mode;
  
  // Update UI
  const buttons = document.querySelectorAll('.mode-toggle button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Stop listening if switching to push-to-talk
  if (mode === 'push-to-talk' && isListening) {
    stopListening();
  }
}

// Settings
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('open');
}

function toggleSetting(setting) {
  settings[setting] = !settings[setting];
  
  // Update UI
  const toggle = document.getElementById(`${setting}Toggle`);
  if (settings[setting]) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
  
  // Save settings
  ipcRenderer.invoke('save-settings', settings);
  
  // Apply immediately if needed
  if (setting === 'alwaysOnTop') {
    // Handled by main process
  }
}

function applySettings() {
  // Update toggles
  Object.keys(settings).forEach(key => {
    const toggle = document.getElementById(`${key}Toggle`);
    if (toggle) {
      if (settings[key]) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  });
  
  // Update voice speed
  const slider = document.getElementById('voiceSpeedSlider');
  if (slider) {
    slider.value = settings.voiceSpeed;
    document.getElementById('voiceSpeedValue').textContent = `${settings.voiceSpeed}x`;
  }
}

// Clear conversation
async function clearConversation() {
  if (confirm('Clear all conversation history?')) {
    document.getElementById('transcript').innerHTML = `
      <div class="text-center text-muted mb-20">
        <p>? Ready to chat! Click the microphone or type below.</p>
        <p style="font-size: 12px; margin-top: 10px;">Your conversation will appear here and in Claude Desktop.</p>
      </div>
    `;
    
    await ipcRenderer.invoke('clear-history');
  }
}

// Check for Claude Desktop
async function checkClaudeDesktop() {
  const result = await ipcRenderer.invoke('find-claude-desktop');
  
  if (!result.found) {
    console.log('Claude Desktop not found - will type to current focus');
  } else {
    console.log('Claude Desktop found:', result.bounds);
  }
}

// Error handling
function showError(message) {
  const transcript = document.getElementById('transcript');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'message assistant';
  errorDiv.style.background = '#e74c3c';
  errorDiv.style.color = 'white';
  errorDiv.textContent = `?? ${message}`;
  
  transcript.appendChild(errorDiv);
  transcript.scrollTop = transcript.scrollHeight;
}

// Voice speed adjustment
document.getElementById('voiceSpeedSlider')?.addEventListener('input', (e) => {
  settings.voiceSpeed = parseFloat(e.target.value);
  document.getElementById('voiceSpeedValue').textContent = `${settings.voiceSpeed}x`;
  ipcRenderer.invoke('save-settings', settings);
});

// IPC event listeners
ipcRenderer.on('toggle-voice', () => {
  toggleVoice();
});

ipcRenderer.on('open-settings', () => {
  toggleSettings();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey) {
    if (e.code === 'Space') {
      e.preventDefault();
      toggleVoice();
    } else if (e.code === 'KeyV') {
      e.preventDefault();
      // Toggle between continuous and push-to-talk
      const newMode = voiceMode === 'continuous' ? 'push-to-talk' : 'continuous';
      setMode(newMode);
    }
  }
});
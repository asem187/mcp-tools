// Advanced Voice Processing with Multiple Input Methods
// Supports Web Speech API, MediaRecorder, and Remote Audio

const { ipcRenderer } = require('electron');
const io = require('socket.io-client');

class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.isListening = false;
    this.conversationHistory = [];
    this.socket = null;
    this.voiceMode = 'continuous';
    this.selectedModel = 'claude';
    
    this.init();
  }

  async init() {
    // Load preferences
    this.voiceMode = await ipcRenderer.invoke('get-store', 'preferences.voiceMode');
    this.selectedModel = await ipcRenderer.invoke('get-store', 'preferences.modelPreference');
    
    // Initialize UI
    this.initializeUI();
    
    // Initialize voice recognition
    this.initializeSpeechRecognition();
    
    // Initialize audio context for visualization
    this.initializeAudioContext();
    
    // Connect to local server for remote audio
    this.connectToLocalServer();
    
    // Setup IPC listeners
    this.setupIPCListeners();
  }

  initializeUI() {
    // Voice button
    this.voiceButton = document.getElementById('voice-button');
    this.voiceButton.addEventListener('click', () => this.toggleVoice());
    
    // Status elements
    this.statusText = document.getElementById('status');
    this.transcriptDiv = document.getElementById('transcript');
    this.conversationDiv = document.getElementById('conversation');
    this.waveformCanvas = document.getElementById('waveform');
    this.canvasCtx = this.waveformCanvas.getContext('2d');
    
    // Settings
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsPanel = document.getElementById('settings-panel');
    this.settingsBtn.addEventListener('click', () => this.toggleSettings());
    
    // Model selector
    this.modelSelect = document.getElementById('model-select');
    this.modelSelect.value = this.selectedModel;
    this.modelSelect.addEventListener('change', (e) => this.changeModel(e.target.value));
    
    // Voice mode toggle
    this.voiceModeToggle = document.getElementById('voice-mode');
    this.voiceModeToggle.checked = this.voiceMode === 'continuous';
    this.voiceModeToggle.addEventListener('change', (e) => {
      this.voiceMode = e.target.checked ? 'continuous' : 'push-to-talk';
      ipcRenderer.invoke('set-store', 'preferences.voiceMode', this.voiceMode);
    });
    
    // Text input
    this.textInput = document.getElementById('text-input');
    this.sendButton = document.getElementById('send-button');
    this.sendButton.addEventListener('click', () => this.sendTextMessage());
    this.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendTextMessage();
      }
    });
    
    // Clear history
    document.getElementById('clear-history').addEventListener('click', () => {
      this.conversationHistory = [];
      this.conversationDiv.innerHTML = '';
    });
  }

  initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      this.showStatus('Speech recognition not supported in this browser', 'error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    let finalTranscript = '';
    let silenceTimer = null;
    
    this.recognition.onstart = () => {
      this.showStatus('Listening...', 'success');
      this.voiceButton.classList.add('listening');
      this.startWaveformAnimation();
    };
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      this.transcriptDiv.textContent = finalTranscript + interimTranscript;
      
      // Clear existing silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      // Set new silence timer
      if (this.voiceMode === 'continuous' && finalTranscript.trim()) {
        silenceTimer = setTimeout(() => {
          if (finalTranscript.trim()) {
            this.processVoiceInput(finalTranscript.trim());
            finalTranscript = '';
            this.transcriptDiv.textContent = '';
          }
        }, 1500); // 1.5 seconds of silence
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.showStatus(`Error: ${event.error}`, 'error');
      this.stopListening();
      
      // Auto-restart for certain errors
      if (event.error === 'network' || event.error === 'aborted') {
        setTimeout(() => {
          if (this.isListening) {
            this.startListening();
          }
        }, 1000);
      }
    };
    
    this.recognition.onend = () => {
      this.voiceButton.classList.remove('listening');
      this.stopWaveformAnimation();
      
      if (this.isListening && this.voiceMode === 'continuous') {
        // Restart recognition
        setTimeout(() => this.startListening(), 100);
      }
    };
  }

  initializeAudioContext() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
      });
  }

  connectToLocalServer() {
    const serverPort = 7777; // Default port, can be configured
    this.socket = io(`http://localhost:${serverPort}`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to local voice bridge server');
      this.showStatus('Connected to voice bridge', 'success');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from voice bridge');
      this.showStatus('Voice bridge disconnected', 'warning');
    });

    this.socket.on('voice-response', (data) => {
      this.handleVoiceResponse(data);
    });
  }

  setupIPCListeners() {
    ipcRenderer.on('toggle-voice', () => {
      this.toggleVoice();
    });

    ipcRenderer.on('voice-mode-changed', (event, mode) => {
      this.voiceMode = mode;
      this.voiceModeToggle.checked = mode === 'continuous';
    });

    ipcRenderer.on('model-changed', (event, model) => {
      this.selectedModel = model;
      this.modelSelect.value = model;
    });

    ipcRenderer.on('quick-type', () => {
      this.textInput.focus();
    });

    ipcRenderer.on('open-settings', () => {
      this.settingsPanel.classList.add('open');
    });
  }

  toggleVoice() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (!this.recognition) {
      this.showStatus('Speech recognition not available', 'error');
      return;
    }

    this.isListening = true;
    this.recognition.start();
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    this.showStatus('Ready', 'info');
  }

  async processVoiceInput(text) {
    this.showStatus('Processing...', 'info');
    
    // Add to conversation
    this.addToConversation('user', text);
    
    try {
      // Process through main process
      const response = await ipcRenderer.invoke('process-voice', {
        text: text,
        mode: this.voiceMode
      });
      
      // Handle response
      this.handleVoiceResponse(response);
    } catch (error) {
      console.error('Processing error:', error);
      this.showStatus('Error processing request', 'error');
      this.addToConversation('error', error.message);
    }
  }

  handleVoiceResponse(response) {
    // Add to conversation
    this.addToConversation('assistant', response.text);
    
    // Play audio if available
    if (response.audio) {
      this.playAudio(response.audio);
    } else {
      // Fallback to browser TTS
      this.speakText(response.text);
    }
    
    this.showStatus('Ready', 'success');
  }

  async sendTextMessage() {
    const text = this.textInput.value.trim();
    if (!text) return;
    
    this.textInput.value = '';
    await this.processVoiceInput(text);
  }

  addToConversation(role, text) {
    const message = {
      role: role,
      text: text,
      timestamp: new Date().toISOString()
    };
    
    this.conversationHistory.push(message);
    
    // Update UI
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
    
    this.conversationDiv.appendChild(messageDiv);
    this.conversationDiv.scrollTop = this.conversationDiv.scrollHeight;
  }

  playAudio(base64Audio) {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play().catch(err => {
      console.error('Audio playback error:', err);
      // Fallback to browser TTS
      this.speakText(this.conversationHistory[this.conversationHistory.length - 1].text);
    });
  }

  speakText(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  }

  changeModel(model) {
    this.selectedModel = model;
    ipcRenderer.invoke('set-store', 'preferences.modelPreference', model);
    this.showStatus(`Switched to ${model}`, 'success');
  }

  toggleSettings() {
    this.settingsPanel.classList.toggle('open');
  }

  showStatus(message, type = 'info') {
    this.statusText.textContent = message;
    this.statusText.className = `status ${type}`;
  }

  startWaveformAnimation() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!this.isListening) return;
      
      requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(dataArray);
      
      this.canvasCtx.fillStyle = '#1a1a1a';
      this.canvasCtx.fillRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      
      const barWidth = (this.waveformCanvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * this.waveformCanvas.height;
        
        this.canvasCtx.fillStyle = `rgb(${50 + dataArray[i]}, 100, 200)`;
        this.canvasCtx.fillRect(x, this.waveformCanvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  }

  stopWaveformAnimation() {
    this.canvasCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.voiceAssistant = new VoiceAssistant();
});
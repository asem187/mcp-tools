const { ipcRenderer } = require('electron');

let recognition;
let isListening = false;
let currentAudio = null;
let conversationHistory = [];

// Initialize speech recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        updateStatus('Speech recognition not supported', 'error');
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        updateStatus('Listening...', 'listening');
        document.getElementById('waveform').classList.remove('hidden');
    };
    
    recognition.onresult = async (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (event.results[last].isFinal) {
            addMessage('user', transcript);
            await processUserInput(transcript);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        updateStatus(`Error: ${event.error}`, 'error');
        document.getElementById('waveform').classList.add('hidden');
        
        // Auto-restart on certain errors
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
            setTimeout(() => {
                if (isListening) {
                    recognition.start();
                }
            }, 1000);
        }
    };
    
    recognition.onend = () => {
        document.getElementById('waveform').classList.add('hidden');
        if (isListening) {
            // Auto-restart if still in listening mode
            setTimeout(() => recognition.start(), 100);
        }
    };
}

// Process user input
async function processUserInput(text) {
    updateStatus('Processing...', 'processing');
    
    // Send to Claude
    const response = await ipcRenderer.invoke('send-to-claude', text);
    
    if (response.error) {
        updateStatus(`Error: ${response.error}`, 'error');
        return;
    }
    
    // Add Claude's response to transcript
    addMessage('assistant', response.text);
    
    // Convert to speech
    await speakText(response.text);
}

// Text to speech
async function speakText(text) {
    updateStatus('Speaking...', 'speaking');
    
    // Get audio from ElevenLabs
    const audioBase64 = await ipcRenderer.invoke('text-to-speech', text);
    
    if (!audioBase64) {
        updateStatus('TTS Error', 'error');
        setTimeout(() => updateStatus('Listening...', 'listening'), 2000);
        return;
    }
    
    // Play audio
    const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
    );
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    currentAudio.onended = () => {
        updateStatus('Listening...', 'listening');
        currentAudio = null;
    };
    
    try {
        await currentAudio.play();
    } catch (error) {
        console.error('Audio playback error:', error);
        updateStatus('Audio Error', 'error');
    }
}

// UI Functions
function updateStatus(text, className) {
    const status = document.getElementById('status');
    status.textContent = text;
    status.className = className;
}

function addMessage(role, text) {
    const transcript = document.getElementById('transcript');
    const message = document.createElement('div');
    message.className = `message ${role}`;
    message.textContent = `${role === 'user' ? 'You' : 'Claude'}: ${text}`;
    transcript.appendChild(message);
    transcript.scrollTop = transcript.scrollHeight;
    
    // Save to history
    conversationHistory.push({ role, text });
}

function toggleVoiceChat() {
    const btn = document.getElementById('toggleBtn');
    
    if (isListening) {
        // Stop
        isListening = false;
        recognition.stop();
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        btn.textContent = 'Start Voice Chat';
        updateStatus('Stopped', 'idle');
    } else {
        // Start
        if (!recognition) {
            initSpeechRecognition();
        }
        isListening = true;
        recognition.start();
        btn.textContent = 'Stop Voice Chat';
    }
}

function clearTranscript() {
    document.getElementById('transcript').innerHTML = '';
    conversationHistory = [];
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        toggleVoiceChat();
    }
});

// Initialize on load
window.addEventListener('load', () => {
    updateStatus('Ready - Click Start or press Ctrl+Space', 'idle');
});
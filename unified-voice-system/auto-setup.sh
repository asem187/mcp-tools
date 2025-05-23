#!/bin/bash
# Fully Automated Voice System Setup Script
# This script will set up everything possible automatically

echo "? Claude Voice System - Automated Setup"
echo "======================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        echo "windows"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "linux"
    fi
}

OS=$(detect_os)
echo "? Detected OS: $OS"
echo ""

# Check prerequisites
echo "? Checking prerequisites..."

if ! command_exists node; then
    echo "? Node.js not found!"
    echo "? Installing Node.js..."
    
    if [[ "$OS" == "windows" ]]; then
        # Download and install Node.js for Windows
        echo "Downloading Node.js installer..."
        curl -o node-installer.msi https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi
        echo "Please run: msiexec /i node-installer.msi"
        echo "Then re-run this script."
        exit 1
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install node
        else
            echo "Please install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    echo "? Node.js found: $(node --version)"
fi

if ! command_exists git; then
    echo "? Git not found!"
    echo "Please install Git from https://git-scm.com/downloads"
    exit 1
else
    echo "? Git found: $(git --version)"
fi

echo ""
echo "? Setting up project directory..."

# Clone or update the repository
if [ -d "mcp-tools" ]; then
    echo "? Repository already exists, updating..."
    cd mcp-tools
    git pull origin main
else
    echo "? Cloning repository..."
    git clone https://github.com/asem187/mcp-tools.git
    cd mcp-tools
fi

cd unified-voice-system

echo ""
echo "? Installing dependencies..."
npm install

echo ""
echo "? Running initial setup..."
node setup.js

# Create a launcher script
echo ""
echo "? Creating launcher script..."

if [[ "$OS" == "windows" ]]; then
    cat > start-voice-assistant.bat << 'EOF'
@echo off
echo Starting Claude Voice Assistant...
cd /d "%~dp0"
npm start
EOF
    echo "? Created start-voice-assistant.bat"
else
    cat > start-voice-assistant.sh << 'EOF'
#!/bin/bash
echo "Starting Claude Voice Assistant..."
cd "$(dirname "$0")"
npm start
EOF
    chmod +x start-voice-assistant.sh
    echo "? Created start-voice-assistant.sh"
fi

# Check if Claude Desktop is running
echo ""
echo "? Checking for Claude Desktop..."

if [[ "$OS" == "windows" ]]; then
    if tasklist | grep -i "claude" > /dev/null; then
        echo "? Claude Desktop is running"
    else
        echo "??  Claude Desktop not detected. Please start it for auto-typing to work."
    fi
fi

echo ""
echo "? Setup complete!"
echo ""
echo "? To start the voice assistant:"
if [[ "$OS" == "windows" ]]; then
    echo "   Double-click start-voice-assistant.bat"
    echo "   OR"
    echo "   Run: npm start"
else
    echo "   Run: ./start-voice-assistant.sh"
    echo "   OR"
    echo "   Run: npm start"
fi
echo ""
echo "? Enjoy your voice-powered Claude experience!"
echo ""

# Auto-start option
read -p "Would you like to start the voice assistant now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm start
fi
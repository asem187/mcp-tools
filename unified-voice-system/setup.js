const fs = require('fs');
const path = require('path');

console.log('Setting up Claude Voice Assistant...');

// Create assets directory
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
  console.log('? Created assets directory');
}

// Create placeholder icons (you can replace these with actual icons)
const iconSvg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#3498db" rx="50"/>
  <circle cx="128" cy="128" r="60" fill="white"/>
  <circle cx="128" cy="100" r="15" fill="#3498db"/>
  <rect x="113" y="110" width="30" height="40" fill="#3498db" rx="15"/>
</svg>`;

const trayIconSvg = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="7" fill="#3498db"/>
  <circle cx="8" cy="6" r="2" fill="white"/>
  <rect x="6" y="8" width="4" height="5" fill="white" rx="2"/>
</svg>`;

// Save icons (these are temporary - replace with proper icons)
fs.writeFileSync(path.join(assetsDir, 'icon.png'), Buffer.from(iconSvg));
fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), Buffer.from(iconSvg));
console.log('? Created placeholder icons');

console.log('\n? Setup complete!');
console.log('\nTo start the voice assistant:');
console.log('  npm start');
console.log('\nFor development mode with DevTools:');
console.log('  npm run dev');
console.log('\nImportant: Make sure Claude Desktop is running for auto-typing to work.');
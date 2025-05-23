# Assets Directory

This directory contains the app icons and resources.

## Required Files:
- `icon.png` - Main app icon (512x512)
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon  
- `tray-icon.png` - System tray icon (16x16 or 24x24)

## Creating Icons:

You can use any image editor to create a 512x512 PNG icon, then convert it:

### Online Tools:
- https://cloudconvert.com/png-to-ico
- https://cloudconvert.com/png-to-icns
- https://www.icoconverter.com/

### Command Line:
```bash
# Install ImageMagick
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: apt-get install imagemagick

# Convert PNG to ICO
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# For macOS icon
iconutil -c icns icon.iconset
```

## Placeholder Icons:

For now, you can create simple placeholder icons:
1. Create a 512x512 image with a microphone symbol
2. Use a blue background (#2563eb)
3. White microphone icon in the center

The app will work without these files, but you'll see default Electron icons.
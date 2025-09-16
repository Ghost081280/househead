#!/usr/bin/env node

// Simple icon generation script for House Head Chase
// Creates basic SVG icons since we don't have image processing libraries

const fs = require('fs');
const path = require('path');

console.log('🎨 House Head Chase - Icon Generator');
console.log('==================================');

// Create icons directory
const iconsDir = 'icons';
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 Created icons directory');
}

// Icon sizes needed for PWA
const iconSizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

// Generate SVG icon template
function generateIconSVG(size) {
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#001122;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="house" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a3a2a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2a1a0a;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="256" fill="url(#bg)" />
  
  <!-- House body -->
  <rect x="156" y="206" width="200" height="160" fill="url(#house)" 
        stroke="#000" stroke-width="4" rx="8"/>
  
  <!-- House roof -->
  <polygon points="136,206 256,136 376,206" fill="#2a1a0a" 
           stroke="#000" stroke-width="4"/>
  
  <!-- Windows (scary eyes) -->
  <rect x="186" y="236" width="30" height="30" fill="#ffff88" 
        stroke="#666" stroke-width="2" opacity="0.9"/>
  <rect x="296" y="236" width="30" height="30" fill="#ffff88" 
        stroke="#666" stroke-width="2" opacity="0.9"/>
  
  <!-- Door -->
  <rect x="226" y="306" width="60" height="60" fill="#000" 
        stroke="#333" stroke-width="2"/>
  <circle cx="266" cy="336" r="4" fill="#444"/>
  
  <!-- Spooky legs -->
  <g stroke="#2a2a2a" stroke-width="6" stroke-linecap="round" opacity="0.8">
    <line x1="176" y1="366" x2="156" y2="406" />
    <line x1="206" y1="366" x2="186" y2="406" />
    <line x1="306" y1="366" x2="326" y2="406" />
    <line x1="336" y1="366" x2="356" y2="406" />
  </g>
  
  <!-- Feet -->
  <g fill="#222">
    <circle cx="156" cy="406" r="8"/>
    <circle cx="186" cy="406" r="8"/>
    <circle cx="326" cy="406" r="8"/>
    <circle cx="356" cy="406" r="8"/>
  </g>
  
  <!-- Glow effect -->
  <circle cx="256" cy="256" r="240" fill="none" stroke="#ff4444" 
          stroke-width="2" opacity="0.3"/>
</svg>`;
}

// Generate all icon sizes
iconSizes.forEach(size => {
    const svgContent = generateIconSVG(size);
    const filename = `icon-${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svgContent);
    console.log(`✅ Generated ${filename}`);
});

// Generate favicon
const faviconContent = generateIconSVG(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconContent);
console.log('✅ Generated favicon.svg');

// Generate Apple touch icon
const appleIconContent = generateIconSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleIconContent);
console.log('✅ Generated apple-touch-icon.svg');

console.log('🎉 Icon generation completed!');
console.log('📝 Note: Icons generated as SVG files. Most browsers support SVG icons.');
console.log('💡 For production, consider converting to PNG using online tools if needed.');

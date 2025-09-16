#!/usr/bin/env node

// 🏠 House Head Chase - Icon Generation Script (Simplified)
// Generates all required PWA icons from SVG

const fs = require('fs').promises;
const path = require('path');

// Icon sizes for comprehensive PWA support
const ICON_SIZES = [
  16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512
];

class IconGenerator {
  constructor() {
    this.iconsDir = path.join(__dirname, '..', 'icons');
    this.colors = {
      primary: '#ff4444',
      background: '#000000',
      house: '#4a3a2a',
      roof: '#2a1a0a',
      window: '#ffff88'
    };
  }

  async ensureDirectories() {
    try {
      await fs.access(this.iconsDir);
    } catch {
      await fs.mkdir(this.iconsDir, { recursive: true });
      console.log('📁 Created icons directory');
    }
  }

  generateSVGIcon(size) {
    const scale = size / 512; // Base size is 512
    const strokeWidth = Math.max(2, 4 * scale);
    
    return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
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
        stroke="#000" stroke-width="${strokeWidth}" rx="8"/>
  
  <!-- House roof -->
  <polygon points="136,206 256,136 376,206" fill="#2a1a0a" 
           stroke="#000" stroke-width="${strokeWidth}"/>
  
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
  <g stroke="#2a2a2a" stroke-width="${Math.max(4, 6 * scale)}" stroke-linecap="round" opacity="0.8">
    <line x1="176" y1="366" x2="156" y2="406" />
    <line x1="206" y1="366" x2="186" y2="406" />
    <line x1="306" y1="366" x2="326" y2="406" />
    <line x1="336" y1="366" x2="356" y2="406" />
  </g>
  
  <!-- Feet -->
  <g fill="#222">
    <circle cx="156" cy="406" r="${Math.max(6, 8 * scale)}"/>
    <circle cx="186" cy="406" r="${Math.max(6, 8 * scale)}"/>
    <circle cx="326" cy="406" r="${Math.max(6, 8 * scale)}"/>
    <circle cx="356" cy="406" r="${Math.max(6, 8 * scale)}"/>
  </g>
  
  <!-- Glow effect -->
  <circle cx="256" cy="256" r="240" fill="none" stroke="#ff4444" 
          stroke-width="2" opacity="0.3"/>
</svg>`.trim();
  }

  async generatePNGFromSVG(svgContent, outputPath) {
    // For Node.js environment without Sharp, save as SVG
    // In production, you'd use Sharp or another library
    const svgPath = outputPath.replace('.png', '.svg');
    await fs.writeFile(svgPath, svgContent);
    
    // Create a simple placeholder PNG representation
    const placeholderSVG = svgContent.replace('</svg>', `
  <text x="256" y="480" font-family="Arial, sans-serif" font-size="24" 
        fill="#ff4444" text-anchor="middle">PWA Icon</text>
</svg>`);
    
    await fs.writeFile(outputPath.replace('.png', '-placeholder.svg'), placeholderSVG);
    console.log(`✅ Generated ${path.basename(outputPath)} (SVG format)`);
  }

  async generateFavicon() {
    const faviconSVG = this.generateSVGIcon(32);
    await fs.writeFile(path.join(this.iconsDir, 'favicon.svg'), faviconSVG);
    
    // Create simple ico file (placeholder)
    const icoPath = path.join(this.iconsDir, 'favicon.ico');
    await fs.writeFile(icoPath, faviconSVG); // Browsers can handle SVG as ICO in many cases
  }

  async generateSocialImages() {
    const socialSVG = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#001122;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="url(#bg)"/>
  
  <!-- Title -->
  <text x="600" y="180" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
        fill="#ff4444" text-anchor="middle">🏠 HOUSE HEAD CHASE</text>
  <text x="600" y="240" font-family="Arial, sans-serif" font-size="36" 
        fill="#ffffff" text-anchor="middle">Survival Horror Game for Kids</text>
  <text x="600" y="300" font-family="Arial, sans-serif" font-size="24" 
        fill="#cccccc" text-anchor="middle">Free • Browser • No Downloads</text>
  
  <!-- Game elements -->
  <g transform="translate(450, 350) scale(2)">
    <rect x="0" y="20" width="100" height="80" fill="#4a3a2a" stroke="#000" stroke-width="2" rx="4"/>
    <polygon points="-10,20 50,0 110,20" fill="#2a1a0a" stroke="#000" stroke-width="2"/>
    <rect x="15" y="35" width="15" height="15" fill="#ffff88" opacity="0.9"/>
    <rect x="70" y="35" width="15" height="15" fill="#ffff88" opacity="0.9"/>
    <rect x="35" y="70" width="30" height="30" fill="#000"/>
  </g>
  
  <!-- Player dot -->
  <circle cx="200" cy="400" r="20" fill="#4488ff" stroke="#88bbff" stroke-width="4"/>
  
  <!-- Decorative stars -->
  <circle cx="150" cy="100" r="3" fill="#ffffff" opacity="0.6"/>
  <circle cx="1050" cy="150" r="3" fill="#ffffff" opacity="0.6"/>
  <circle cx="100" cy="500" r="3" fill="#ffffff" opacity="0.6"/>
  <circle cx="1100" cy="520" r="3" fill="#ffffff" opacity="0.6"/>
</svg>`;

    await fs.writeFile(path.join(this.iconsDir, 'social-preview.svg'), socialSVG);
  }

  async generateAllIcons() {
    console.log('🏠 Starting icon generation...');
    
    await this.ensureDirectories();
    
    // Generate all icon sizes
    for (const size of ICON_SIZES) {
      const svgContent = this.generateSVGIcon(size);
      const filename = `icon-${size}.png`;
      await this.generatePNGFromSVG(svgContent, path.join(this.iconsDir, filename));
      
      // Apple touch icons
      if ([180, 152, 144, 120, 114, 76, 72, 60, 57].includes(size)) {
        const appleFilename = `apple-icon-${size}x${size}.png`;
        await this.generatePNGFromSVG(svgContent, path.join(this.iconsDir, appleFilename));
      }
      
      // Android icons
      if ([192, 144, 96, 72, 48, 36].includes(size)) {
        const androidFilename = `android-icon-${size}x${size}.png`;
        await this.generatePNGFromSVG(svgContent, path.join(this.iconsDir, androidFilename));
      }
    }
    
    await this.generateFavicon();
    await this.generateSocialImages();
    
    console.log('🎉 Icon generation completed!');
    console.log('📝 Note: Icons generated as SVG. Use Sharp or ImageMagick for PNG conversion.');
  }
}

// Usage
async function main() {
  try {
    const generator = new IconGenerator();
    await generator.generateAllIcons();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = IconGenerator;

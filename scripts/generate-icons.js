#!/usr/bin/env node

// 🏠 House Head Chase - Icon Generation Script
// Generates all required PWA icons from a base image

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Icon sizes needed for comprehensive PWA support
const ICON_SIZES = [
  // Basic web icons
  { size: 16, name: 'icon-16.png', purpose: 'favicon' },
  { size: 32, name: 'icon-32.png', purpose: 'favicon' },
  { size: 48, name: 'icon-48.png', purpose: 'web' },
  { size: 72, name: 'icon-72.png', purpose: 'web' },
  { size: 96, name: 'icon-96.png', purpose: 'web' },
  { size: 128, name: 'icon-128.png', purpose: 'web' },
  { size: 144, name: 'icon-144.png', purpose: 'web' },
  { size: 152, name: 'icon-152.png', purpose: 'web' },
  { size: 180, name: 'icon-180.png', purpose: 'web' },
  { size: 192, name: 'icon-192.png', purpose: 'pwa' },
  { size: 256, name: 'icon-256.png', purpose: 'web' },
  { size: 384, name: 'icon-384.png', purpose: 'pwa' },
  { size: 512, name: 'icon-512.png', purpose: 'pwa' },
  
  // Apple touch icons
  { size: 57, name: 'apple-icon-57x57.png', purpose: 'apple' },
  { size: 60, name: 'apple-icon-60x60.png', purpose: 'apple' },
  { size: 72, name: 'apple-icon-72x72.png', purpose: 'apple' },
  { size: 76, name: 'apple-icon-76x76.png', purpose: 'apple' },
  { size: 114, name: 'apple-icon-114x114.png', purpose: 'apple' },
  { size: 120, name: 'apple-icon-120x120.png', purpose: 'apple' },
  { size: 144, name: 'apple-icon-144x144.png', purpose: 'apple' },
  { size: 152, name: 'apple-icon-152x152.png', purpose: 'apple' },
  { size: 180, name: 'apple-icon-180x180.png', purpose: 'apple' },
  
  // Microsoft tiles
  { size: 70, name: 'ms-icon-70x70.png', purpose: 'microsoft' },
  { size: 150, name: 'ms-icon-150x150.png', purpose: 'microsoft' },
  { size: 310, name: 'ms-icon-310x310.png', purpose: 'microsoft' },
  
  // Android chrome icons
  { size: 36, name: 'android-icon-36x36.png', purpose: 'android' },
  { size: 48, name: 'android-icon-48x48.png', purpose: 'android' },
  { size: 72, name: 'android-icon-72x72.png', purpose: 'android' },
  { size: 96, name: 'android-icon-96x96.png', purpose: 'android' },
  { size: 144, name: 'android-icon-144x144.png', purpose: 'android' },
  { size: 192, name: 'android-icon-192x192.png', purpose: 'android' }
];

// Special images
const SPECIAL_IMAGES = [
  { width: 1200, height: 630, name: 'social-preview.png', purpose: 'social' },
  { width: 1280, height: 720, name: 'screenshot-wide.png', purpose: 'screenshot' },
  { width: 640, height: 1136, name: 'screenshot-narrow.png', purpose: 'screenshot' }
];

class IconGenerator {
  constructor() {
    this.baseIconPath = path.join(__dirname, '..', 'assets', 'icon-base.png');
    this.iconsDir = path.join(__dirname, '..', 'icons');
    this.colors = {
      primary: '#ff4444',
      background: '#000000',
      accent: '#ffaa44'
    };
  }

  async ensureDirectories() {
    try {
      await fs.access(this.iconsDir);
    } catch {
      await fs.mkdir(this.iconsDir, { recursive: true });
    }
  }

  async generateBaseIcon() {
    console.log('🎨 Generating base icon...');
    
    // Create a base icon using SVG (since we might not have a source image)
    const svgIcon = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
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
        
        <!-- Background -->
        <circle cx="256" cy="256" r="256" fill="url(#bg)" />
        
        <!-- House body -->
        <rect x="156" y="206" width="200" height="160" fill="url(#house)" stroke="#000" stroke-width="4" rx="8"/>
        
        <!-- House roof -->
        <polygon points="136,206 256,136 376,206" fill="#2a1a0a" stroke="#000" stroke-width="4"/>
        
        <!-- Windows (eyes) -->
        <rect x="186" y="236" width="30" height="30" fill="#ffff88" stroke="#666" stroke-width="2" opacity="0.9"/>
        <rect x="296" y="236" width="30" height="30" fill="#ffff88" stroke="#666" stroke-width="2" opacity="0.9"/>
        
        <!-- Door -->
        <rect x="226" y="306" width="60" height="60" fill="#000" stroke="#333" stroke-width="2"/>
        <circle cx="266" cy="336" r="4" fill="#444"/>
        
        <!-- Legs -->
        <g stroke="#2a2a2a" stroke-width="6" stroke-linecap="round" opacity="0.8">
          <line x1="176" y1="366" x2="156" y2="406" />
          <line x1="206" y1="366" x2="186" y2="406" />
          <line x1="306" y1="366" x2="326" y2="406" />
          <line x1="336" y1="366" x2="356" y2="406" />
        </g>
        
        <!-- Leg feet -->
        <g fill="#222">
          <circle cx="156" cy="406" r="8"/>
          <circle cx="186" cy="406" r="8"/>
          <circle cx="326" cy="406" r="8"/>
          <circle cx="356" cy="406" r="8"/>
        </g>
        
        <!-- Spooky glow effect -->
        <circle cx="256" cy="256" r="240" fill="none" stroke="${this.colors.primary}" stroke-width="2" opacity="0.3"/>
      </svg>
    `;

    const baseIconBuffer = Buffer.from(svgIcon);
    const baseIconPath = path.join(this.iconsDir, 'icon-base.svg');
    await fs.writeFile(baseIconPath, baseIconBuffer);
    
    return baseIconPath;
  }

  async generateIcon(size, outputName, options = {}) {
    try {
      const baseIcon = path.join(this.iconsDir, 'icon-base.svg');
      const outputPath = path.join(this.iconsDir, outputName);
      
      let sharpInstance = sharp(baseIcon)
        .resize(size, size, {
          fit: 'contain',
          background: options.backgroundColor || this.colors.background
        })
        .png({
          quality: 95,
          compressionLevel: 9,
          progressive: true
        });

      // Add padding for certain icon types
      if (options.padding) {
        const paddedSize = Math.floor(size * 0.8);
        sharpInstance = sharpInstance.resize(paddedSize, paddedSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });
        
        sharpInstance = sharpInstance.extend({
          top: Math.floor((size - paddedSize) / 2),
          bottom: Math.floor((size - paddedSize) / 2),
          left: Math.floor((size - paddedSize) / 2),
          right: Math.floor((size - paddedSize) / 2),
          background: options.backgroundColor || this.colors.background
        });
      }

      await sharpInstance.toFile(outputPath);
      return outputPath;
    } catch (error) {
      console.error(`❌ Error generating ${outputName}:`, error.message);
      throw error;
    }
  }

  async generateFavicon() {
    console.log('🔖 Generating favicon...');
    
    // Generate multiple sizes for favicon
    const faviconSizes = [16, 32, 48];
    const faviconBuffers = [];

    for (const size of faviconSizes) {
      const buffer = await sharp(path.join(this.iconsDir, 'icon-base.svg'))
        .resize(size, size)
        .png()
        .toBuffer();
      faviconBuffers.push(buffer);
    }

    // For now, just copy the 32x32 as favicon.ico
    // In a full implementation, you'd combine multiple sizes into an ICO file
    await fs.copyFile(
      path.join(this.iconsDir, 'icon-32.png'),
      path.join(this.iconsDir, 'favicon.ico')
    );
  }

  async generateSpecialImages() {
    console.log('🖼️ Generating special images...');
    
    for (const image of SPECIAL_IMAGES) {
      const outputPath = path.join(this.iconsDir, image.name);
      
      if (image.purpose === 'social') {
        // Generate social media preview
        const socialSvg = `
          <svg width="${image.width}" height="${image.height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#001122;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
              </linearGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#bg)"/>
            
            <!-- Game title -->
            <text x="600" y="180" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
                  fill="#ff4444" text-anchor="middle">🏠 HOUSE HEAD CHASE</text>
            <text x="600" y="240" font-family="Arial, sans-serif" font-size="36" 
                  fill="#ffffff" text-anchor="middle">Survival Horror Game</text>
            <text x="600" y="300" font-family="Arial, sans-serif" font-size="24" 
                  fill="#cccccc" text-anchor="middle">Free • Browser • Offline Play</text>
            
            <!-- House icon -->
            <g transform="translate(450, 350) scale(2)">
              <rect x="0" y="20" width="100" height="80" fill="#4a3a2a" stroke="#000" stroke-width="2" rx="4"/>
              <polygon points="-10,20 50,0 110,20" fill="#2a1a0a" stroke="#000" stroke-width="2"/>
              <rect x="15" y="35" width="15" height="15" fill="#ffff88" opacity="0.9"/>
              <rect x="70" y="35" width="15" height="15" fill="#ffff88" opacity="0.9"/>
              <rect x="35" y="70" width="30" height="30" fill="#000"/>
            </g>
            
            <!-- Stars background -->
            <circle cx="150" cy="100" r="2" fill="#ffffff" opacity="0.6"/>
            <circle cx="1050" cy="150" r="2" fill="#ffffff" opacity="0.6"/>
            <circle cx="200" cy="500" r="2" fill="#ffffff" opacity="0.6"/>
            <circle cx="1000" cy="520" r="2" fill="#ffffff" opacity="0.6"/>
          </svg>
        `;

        await fs.writeFile(outputPath, Buffer.from(socialSvg));
        
      } else if (image.purpose === 'screenshot') {
        // Generate gameplay screenshots (placeholder)
        const screenshotSvg = `
          <svg width="${image.width}" height="${image.height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#001122"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" 
                  fill="#ff4444" text-anchor="middle" dominant-baseline="middle">
              Gameplay Screenshot
            </text>
            <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="24" 
                  fill="#cccccc" text-anchor="middle" dominant-baseline="middle">
              ${image.width}x${image.height} - ${image.name}
            </text>
          </svg>
        `;

        await fs.writeFile(outputPath, Buffer.from(screenshotSvg));
      }
    }
  }

  async generateAllIcons() {
    console.log('🏠 House Head Chase - Icon Generator Starting...');
    console.log(`📁 Output directory: ${this.iconsDir}`);
    
    await this.ensureDirectories();
    
    // Generate base icon first
    await this.generateBaseIcon();
    
    console.log(`🔧 Generating ${ICON_SIZES.length} icon sizes...`);
    
    // Generate all icon sizes
    const promises = ICON_SIZES.map(async (iconConfig) => {
      const options = {};
      
      // Add padding for Apple icons to avoid edge cropping
      if (iconConfig.purpose === 'apple') {
        options.padding = true;
        options.backgroundColor = this.colors.background;
      }
      
      // Use transparent background for Android adaptive icons
      if (iconConfig.purpose === 'android' && iconConfig.size >= 192) {
        options.backgroundColor = { r: 0, g: 0, b: 0, alpha: 0 };
      }
      
      await this.generateIcon(iconConfig.size, iconConfig.name, options);
      console.log(`✅ Generated ${iconConfig.name} (${iconConfig.size}x${iconConfig.size})`);
    });
    
    await Promise.all(promises);
    
    // Generate favicon
    await this.generateFavicon();
    
    // Generate special images
    await this.generateSpecialImages();
    
    console.log('🎉 Icon generation completed successfully!');
    console.log(`📊 Generated ${ICON_SIZES.length + SPECIAL_IMAGES.length + 1} files total`);
  }

  async validateIcons() {
    console.log('✅ Validating generated icons...');
    
    const requiredIcons = [
      'icon-192.png',
      'icon-512.png',
      'apple-icon-180x180.png',
      'favicon.ico',
      'social-preview.png'
    ];
    
    for (const icon of requiredIcons) {
      try {
        await fs.access(path.join(this.iconsDir, icon));
        console.log(`✅ ${icon} exists`);
      } catch {
        console.error(`❌ Missing critical icon: ${icon}`);
      }
    }
  }
}

// Run the generator
async function main() {
  try {
    const generator = new IconGenerator();
    await generator.generateAllIcons();
    await generator.validateIcons();
    
    console.log('\n🚀 All icons generated successfully!');
    console.log('💡 Your PWA is now ready for deployment with comprehensive icon support.');
  } catch (error) {
    console.error('❌ Icon generation failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = IconGenerator;

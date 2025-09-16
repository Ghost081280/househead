#!/usr/bin/env node

// Simple build script for Firebase deployment
const fs = require('fs');
const path = require('path');

console.log('🏠 House Head Chase - Simple Build');
console.log('==================================');

// Check if all required files exist
const requiredFiles = [
    'index.html',
    'styles.css',
    'game.js',
    'config.js',
    'firebase-integration.js',
    'manifest.json',
    'sw.js'
];

console.log('✅ Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ ${file} - MISSING!`);
        allFilesExist = false;
    }
});

// Check icons directory
if (fs.existsSync('icons') && fs.existsSync('icons/icon-192.png')) {
    console.log('  ✓ icons/ directory');
} else {
    console.log('  ⚠ icons/ directory missing - will generate basic icons');
    
    // Create icons directory and basic placeholder
    if (!fs.existsSync('icons')) {
        fs.mkdirSync('icons');
    }
    
    // Create a simple SVG icon as placeholder
    const iconSVG = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ff4444"/>
        <text x="96" y="100" font-size="60" text-anchor="middle" fill="white">🏠</text>
    </svg>`;
    
    fs.writeFileSync('icons/icon-192.svg', iconSVG);
    console.log('  ✓ Created placeholder icon');
}

if (allFilesExist) {
    console.log('🎉 Build check passed! Ready for Firebase deployment.');
} else {
    console.log('❌ Build check failed! Missing required files.');
    process.exit(1);
}

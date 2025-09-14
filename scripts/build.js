#!/usr/bin/env node

// 🏠 House Head Chase - Production Build Script
// Prepares the game for deployment

const fs = require('fs').promises;
const path = require('path');

class BuildManager {
    constructor() {
        this.version = '2.0.0';
        this.buildDir = path.join(__dirname, '..', 'dist');
        this.sourceDir = path.join(__dirname, '..');
    }

    async build() {
        console.log('🏗️ Starting production build...');
        
        try {
            await this.cleanBuildDir();
            await this.generateIcons();
            await this.optimizeAssets();
            await this.validateBuild();
            
            console.log('✅ Build completed successfully!');
            console.log('🚀 Ready for Firebase deployment');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    async cleanBuildDir() {
        console.log('🧹 Cleaning build directory...');
        
        try {
            await fs.access(this.buildDir);
            await fs.rmdir(this.buildDir, { recursive: true });
        } catch {
            // Directory doesn't exist, which is fine
        }
        
        await fs.mkdir(this.buildDir, { recursive: true });
    }

    async generateIcons() {
        console.log('🎨 Generating icons...');
        
        const IconGenerator = require('./generate-icons.js');
        const generator = new IconGenerator();
        await generator.generateAllIcons();
    }

    async optimizeAssets() {
        console.log('⚡ Optimizing assets...');
        
        // Copy essential files
        const filesToCopy = [
            'index.html',
            'styles.css', 
            'game.js',
            'config.js',
            'firebase-integration.js',
            'manifest.json',
            'sw.js',
            'offline.html',
            'robots.txt',
            'sitemap.xml'
        ];

        for (const file of filesToCopy) {
            const sourcePath = path.join(this.sourceDir, file);
            const destPath = path.join(this.buildDir, file);
            
            try {
                await fs.copyFile(sourcePath, destPath);
                console.log(`📄 Copied ${file}`);
            } catch (error) {
                if (fs.existsSync(sourcePath)) {
                    console.warn(`⚠️ Failed to copy ${file}:`, error.message);
                }
            }
        }

        // Copy icons directory
        await this.copyDirectory('icons', 'icons');
        
        // Optimize manifest for production
        await this.optimizeManifest();
    }

    async copyDirectory(source, dest) {
        const sourcePath = path.join(this.sourceDir, source);
        const destPath = path.join(this.buildDir, dest);
        
        try {
            await fs.mkdir(destPath, { recursive: true });
            const files = await fs.readdir(sourcePath);
            
            for (const file of files) {
                const sourceFile = path.join(sourcePath, file);
                const destFile = path.join(destPath, file);
                await fs.copyFile(sourceFile, destFile);
            }
            
            console.log(`📁 Copied ${source}/ directory`);
        } catch (error) {
            console.warn(`⚠️ Failed to copy ${source}/:`, error.message);
        }
    }

    async optimizeManifest() {
        console.log('📋 Optimizing manifest...');
        
        try {
            const manifestPath = path.join(this.buildDir, 'manifest.json');
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            
            // Update version
            manifest.version = this.version;
            
            // Ensure production URLs
            manifest.start_url = './';
            manifest.scope = './';
            
            // Update name for production
            manifest.name = 'House Head Chase - Kids Survival Game';
            manifest.short_name = 'House Head Chase';
            
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
            console.log('✅ Manifest optimized');
            
        } catch (error) {
            console.error('❌ Failed to optimize manifest:', error);
        }
    }

    async validateBuild() {
        console.log('✅ Validating build...');
        
        const requiredFiles = [
            'index.html',
            'styles.css',
            'game.js', 
            'manifest.json',
            'sw.js',
            'icons/icon-192.png',
            'icons/icon-512.png'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.buildDir, file);
            
            try {
                await fs.access(filePath);
                console.log(`✅ ${file} exists`);
            } catch {
                throw new Error(`Missing required file: ${file}`);
            }
        }

        // Validate HTML
        await this.validateHTML();
        
        // Check file sizes
        await this.checkFileSizes();
    }

    async validateHTML() {
        try {
            const htmlPath = path.join(this.buildDir, 'index.html');
            const html = await fs.readFile(htmlPath, 'utf8');
            
            // Basic HTML validation
            if (!html.includes('<!DOCTYPE html>')) {
                throw new Error('Missing DOCTYPE declaration');
            }
            
            if (!html.includes('<title>')) {
                throw new Error('Missing page title');
            }
            
            if (!html.includes('manifest.json')) {
                throw new Error('Missing manifest link');
            }
            
            console.log('✅ HTML validation passed');
            
        } catch (error) {
            console.error('❌ HTML validation failed:', error);
        }
    }

    async checkFileSizes() {
        console.log('📊 Checking file sizes...');
        
        const files = ['game.js', 'styles.css', 'index.html'];
        
        for (const file of files) {
            try {
                const filePath = path.join(this.buildDir, file);
                const stats = await fs.stat(filePath);
                const sizeKB = Math.round(stats.size / 1024);
                
                console.log(`📄 ${file}: ${sizeKB}KB`);
                
                // Warn about large files
                if (file === 'game.js' && sizeKB > 100) {
                    console.warn(`⚠️ ${file} is quite large (${sizeKB}KB)`);
                }
                
            } catch (error) {
                console.warn(`⚠️ Could not check size of ${file}`);
            }
        }
    }

    async generateDeploymentInfo() {
        const info = {
            version: this.version,
            buildTime: new Date().toISOString(),
            environment: 'production',
            features: [
                'Firebase Auth',
                'Global Leaderboard',
                'Offline Support',
                'PWA',
                'Kid-Safe'
            ]
        };

        await fs.writeFile(
            path.join(this.buildDir, 'build-info.json'),
            JSON.stringify(info, null, 2)
        );

        console.log('📋 Generated build-info.json');
    }
}

// Run build if called directly
async function main() {
    const builder = new BuildManager();
    await builder.build();
    await builder.generateDeploymentInfo();
}

if (require.main === module) {
    main();
}

module.exports = BuildManager;

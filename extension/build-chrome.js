/**
 * Vibe Tracker Extension Build Script
 * Creates a Chrome-ready ZIP file for distribution
 * Version: 2.5.0 - Dark Pattern Shield Edition
 * 
 * No external dependencies required!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_DIR = __dirname;
const OUTPUT_DIR = path.join(EXTENSION_DIR, 'dist');
const VERSION = '2.5.0';

// Files to include in the build
const FILES_TO_INCLUDE = [
    'manifest.json',
    'popup.html',
    'popup.css',
    'popup.js',
    'background.js',
    'content.js',
    'content.css',
    'content-website.js',
    'dark-pattern-detector.js',
];

// Directories to include
const DIRS_TO_INCLUDE = [
    'icons'
];

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function build() {
    console.log('');
    console.log('🚀 ═══════════════════════════════════════════════════════');
    console.log('   VIBE TRACKER EXTENSION BUILD');
    console.log('   Version: ' + VERSION + ' - Dark Pattern Shield Edition');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputDir = path.join(OUTPUT_DIR, `vibetracker-chrome-v${VERSION}`);

    // Clean and create temp directory
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Copy files
    console.log('📁 Adding extension files...');
    let fileCount = 0;
    for (const file of FILES_TO_INCLUDE) {
        const srcPath = path.join(EXTENSION_DIR, file);
        const destPath = path.join(outputDir, file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log('   ✓ ' + file);
            fileCount++;
        } else {
            console.log('   ⚠️  Missing: ' + file);
        }
    }

    // Copy directories
    console.log('');
    console.log('📂 Adding directories...');
    for (const dir of DIRS_TO_INCLUDE) {
        const srcPath = path.join(EXTENSION_DIR, dir);
        const destPath = path.join(outputDir, dir);
        if (fs.existsSync(srcPath)) {
            copyDir(srcPath, destPath);
            const files = fs.readdirSync(srcPath);
            console.log('   ✓ ' + dir + '/ (' + files.length + ' files)');
        }
    }

    // Create ZIP using PowerShell
    const zipPath = path.join(OUTPUT_DIR, `vibetracker-chrome-v${VERSION}.zip`);

    // Remove old zip if exists
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }

    console.log('');
    console.log('📦 Creating ZIP archive...');

    try {
        execSync(`powershell -Command "Compress-Archive -Path '${outputDir}\\*' -DestinationPath '${zipPath}' -Force"`, {
            stdio: 'pipe'
        });

        const stats = fs.statSync(zipPath);
        const sizeKB = (stats.size / 1024).toFixed(2);

        console.log('   ✓ ZIP created successfully!');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ BUILD COMPLETE!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('📦 Output: ' + zipPath);
        console.log('📏 Size: ' + sizeKB + ' KB');
        console.log('📄 Files: ' + fileCount);
        console.log('');
        console.log('🎉 Ready to upload to Chrome Web Store!');
        console.log('');
        console.log('Features included:');
        console.log('  🛡️  Dark Pattern Shield');
        console.log('  ⏰  Trial Reminder System');
        console.log('  🛒  Auto Purchase Tracking');
        console.log('  📊  Real-time Dashboard Sync');
        console.log('  💰  Budget Alerts & Analytics');
        console.log('');

        return zipPath;
    } catch (e) {
        console.log('   ⚠️  Could not create ZIP automatically');
        console.log('');
        console.log('📁 Extension files ready at:');
        console.log('   ' + outputDir);
        console.log('');
        console.log('To create ZIP manually:');
        console.log('  - Right-click the folder > Send to > Compressed (zipped) folder');
        console.log('');

        return outputDir;
    }
}

// Run
try {
    build();
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

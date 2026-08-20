/**
 * Vibe Tracker Extension - Multi-Browser Build Script
 * Builds extension packages for Chrome, Firefox, and Edge
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to include in all builds
const commonFiles = [
    'popup.html',
    'popup.js',
    'popup.css',
    'content.js',
    'content.css',
    'content-website.js',
    'background.js'
];

// Directories to include
const commonDirs = ['icons'];

// Output directories
const outputDir = path.join(__dirname, 'dist');
const chromeDir = path.join(outputDir, 'chrome');
const firefoxDir = path.join(outputDir, 'firefox');
const edgeDir = path.join(outputDir, 'edge');

// Clean and create output directories
function setupDirs() {
    console.log('🧹 Cleaning output directories...');

    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true });
    }

    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(chromeDir, { recursive: true });
    fs.mkdirSync(firefoxDir, { recursive: true });
    fs.mkdirSync(edgeDir, { recursive: true });

    console.log('✅ Output directories created');
}

// Copy file helper
function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

// Copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

// Copy common files to a target directory
function copyCommonFiles(targetDir) {
    // Copy files
    for (const file of commonFiles) {
        const srcPath = path.join(__dirname, file);
        if (fs.existsSync(srcPath)) {
            copyFile(srcPath, path.join(targetDir, file));
        } else {
            console.warn(`⚠️  Warning: ${file} not found`);
        }
    }

    // Copy directories
    for (const dir of commonDirs) {
        const srcPath = path.join(__dirname, dir);
        if (fs.existsSync(srcPath)) {
            copyDir(srcPath, path.join(targetDir, dir));
        }
    }
}

// Build Chrome extension
function buildChrome() {
    console.log('\n🔵 Building Chrome extension...');

    copyCommonFiles(chromeDir);

    // Copy Chrome manifest
    copyFile(
        path.join(__dirname, 'manifest.json'),
        path.join(chromeDir, 'manifest.json')
    );

    // Create ZIP
    const zipPath = path.join(outputDir, 'vibe-tracker-chrome.zip');
    createZip(chromeDir, zipPath);

    console.log('✅ Chrome extension built: dist/chrome/');
    console.log(`📦 ZIP created: dist/vibe-tracker-chrome.zip`);
}

// Build Firefox extension
function buildFirefox() {
    console.log('\n🦊 Building Firefox extension...');

    copyCommonFiles(firefoxDir);

    // Copy Firefox manifest (rename to manifest.json)
    copyFile(
        path.join(__dirname, 'manifest-firefox.json'),
        path.join(firefoxDir, 'manifest.json')
    );

    // Create ZIP (Firefox uses .xpi but .zip also works for development)
    const zipPath = path.join(outputDir, 'vibe-tracker-firefox.zip');
    createZip(firefoxDir, zipPath);

    console.log('✅ Firefox extension built: dist/firefox/');
    console.log(`📦 ZIP created: dist/vibe-tracker-firefox.zip`);
}

// Build Edge extension (same as Chrome with slight manifest tweaks)
function buildEdge() {
    console.log('\n🔷 Building Edge extension...');

    copyCommonFiles(edgeDir);

    // Copy Chrome manifest (Edge uses the same format)
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

    // Update name for Edge
    manifest.name = 'Vibe Tracker - Auto Purchase Tracker';

    fs.writeFileSync(
        path.join(edgeDir, 'manifest.json'),
        JSON.stringify(manifest, null, 4)
    );

    // Create ZIP
    const zipPath = path.join(outputDir, 'vibe-tracker-edge.zip');
    createZip(edgeDir, zipPath);

    console.log('✅ Edge extension built: dist/edge/');
    console.log(`📦 ZIP created: dist/vibe-tracker-edge.zip`);
}

// Create ZIP archive
function createZip(sourceDir, zipPath) {
    try {
        // Try using PowerShell on Windows
        if (process.platform === 'win32') {
            execSync(`powershell Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${zipPath}" -Force`, {
                stdio: 'pipe'
            });
        } else {
            // Use zip command on Unix
            execSync(`cd "${sourceDir}" && zip -r "${zipPath}" .`, {
                stdio: 'pipe'
            });
        }
    } catch (error) {
        console.warn(`⚠️  Could not create ZIP: ${error.message}`);
        console.log('   You can manually zip the folder contents.');
    }
}

// Main build function
function build() {
    console.log('🚀 Vibe Tracker Extension - Multi-Browser Build');
    console.log('================================================\n');

    setupDirs();
    buildChrome();
    buildFirefox();
    buildEdge();

    console.log('\n================================================');
    console.log('✨ Build complete!');
    console.log('\n📁 Output:');
    console.log('   dist/chrome/           - Chrome extension folder');
    console.log('   dist/firefox/          - Firefox extension folder');
    console.log('   dist/edge/             - Edge extension folder');
    console.log('   dist/vibe-tracker-chrome.zip   - Chrome package');
    console.log('   dist/vibe-tracker-firefox.zip  - Firefox package');
    console.log('   dist/vibe-tracker-edge.zip     - Edge package');
    console.log('\n📖 Installation:');
    console.log('   Chrome: chrome://extensions → Load unpacked → select dist/chrome/');
    console.log('   Firefox: about:debugging → This Firefox → Load Temporary Add-on → select manifest.json');
    console.log('   Edge: edge://extensions → Load unpacked → select dist/edge/');
}

// Run build
build();

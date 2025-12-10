/**
 * Build script for Vibe Tracker Extension
 * Generates browser-specific packages for Chrome/Brave and Firefox
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const target = args[0] || 'all';
const shouldZip = args.includes('--zip');

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');

// Files to copy for all browsers
const commonFiles = [
    'popup.html',
    'popup.css',
    'popup.js',
    'content.js',
    'content.css',
    'content-website.js',
    'background.js',
    'dark-pattern-detector.js'
];

// Create dist directory
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Copy file
function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${path.basename(src)}`);
}

// Copy directory
function copyDir(src, dest) {
    ensureDir(dest);
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

// Build Chrome/Brave extension
function buildChrome() {
    console.log('\n🔵 Building Chrome/Brave extension...');
    const distDir = path.join(DIST_DIR, 'chrome');
    ensureDir(distDir);

    // Copy common files
    commonFiles.forEach(file => {
        const srcPath = path.join(SRC_DIR, file);
        if (fs.existsSync(srcPath)) {
            copyFile(srcPath, path.join(distDir, file));
        }
    });

    // Copy manifest
    copyFile(
        path.join(SRC_DIR, 'manifest.json'),
        path.join(distDir, 'manifest.json')
    );

    // Copy background script
    copyFile(
        path.join(SRC_DIR, 'background.js'),
        path.join(distDir, 'background.js')
    );

    // Copy icons
    const iconsDir = path.join(SRC_DIR, 'icons');
    if (fs.existsSync(iconsDir)) {
        copyDir(iconsDir, path.join(distDir, 'icons'));
    }

    console.log('✅ Chrome/Brave build complete: dist/chrome/');
    return distDir;
}

// Build Firefox extension
function buildFirefox() {
    console.log('\n🦊 Building Firefox extension...');
    const distDir = path.join(DIST_DIR, 'firefox');
    ensureDir(distDir);

    // Copy common files
    commonFiles.forEach(file => {
        const srcPath = path.join(SRC_DIR, file);
        if (fs.existsSync(srcPath)) {
            copyFile(srcPath, path.join(distDir, file));
        }
    });

    // Copy Firefox manifest
    copyFile(
        path.join(SRC_DIR, 'manifest-firefox.json'),
        path.join(distDir, 'manifest.json')
    );

    // Copy Firefox background script
    // Copy background script (same as Chrome now)
    copyFile(
        path.join(SRC_DIR, 'background.js'),
        path.join(distDir, 'background.js')
    );

    // Copy icons
    const iconsDir = path.join(SRC_DIR, 'icons');
    if (fs.existsSync(iconsDir)) {
        copyDir(iconsDir, path.join(distDir, 'icons'));
    }

    console.log('✅ Firefox build complete: dist/firefox/');
    return distDir;
}

// Create ZIP file (requires 'archiver' or manual zipping)
function createZip(sourceDir, browser) {
    console.log(`\n📦 Creating ZIP for ${browser}...`);
    console.log(`   Please manually zip the contents of: ${sourceDir}`);
    console.log(`   Save as: vibe-tracker-${browser}.zip`);
}

// Main build
console.log('🚀 Vibe Tracker Extension Builder');
console.log('================================');

ensureDir(DIST_DIR);

if (target === 'chrome' || target === 'all') {
    const dir = buildChrome();
    if (shouldZip) createZip(dir, 'chrome');
}

if (target === 'firefox' || target === 'all') {
    const dir = buildFirefox();
    if (shouldZip) createZip(dir, 'firefox');
}

console.log('\n🎉 Build complete!');
console.log('\nTo install:');
console.log('  Chrome/Brave: Load unpacked from dist/chrome/');
console.log('  Firefox: Load from dist/firefox/ as temporary add-on');

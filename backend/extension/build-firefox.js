// Build Firefox Extension
// Run: node build-firefox.js
// Creates a dist/firefox folder ready for loading

const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist', 'firefox');

// Files to copy
const files = [
    'popup.html',
    'popup.css',
    'popup.js',
    'background.js',
    'content.js',
    'content-website.js',
    'content.css'
];

const iconFiles = [
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'icons/icon128.png',
    'icons/logo.png'
];

console.log('🦊 Building Vibe Tracker for Firefox...\n');

// Create dist directory
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Create icons directory
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy manifest (Firefox version)
console.log('📄 Copying manifest-firefox.json as manifest.json...');
fs.copyFileSync(
    path.join(srcDir, 'manifest-firefox.json'),
    path.join(distDir, 'manifest.json')
);

// Copy all source files
console.log('📦 Copying source files...');
files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ⚠️ ${file} not found, skipping`);
    }
});

// Copy icon files
console.log('🎨 Copying icons...');
iconFiles.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ⚠️ ${file} not found, skipping`);
    }
});

console.log('\n✅ Firefox build complete!');
console.log(`📁 Output: ${distDir}`);
console.log('\n🦊 To load in Firefox:');
console.log('   1. Open about:debugging');
console.log('   2. Click "This Firefox"');
console.log('   3. Click "Load Temporary Add-on"');
console.log(`   4. Select: ${path.join(distDir, 'manifest.json')}`);

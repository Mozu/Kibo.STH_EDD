#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting build process...');

// Step 1: Run tests
console.log('\n📋 Running tests...');
try {
    execSync('npm test', { stdio: 'pipe' });
    console.log('✅ Tests passed!');
} catch (error) {
    console.error('❌ Tests failed!');
    console.error(error.stdout?.toString());
    console.error(error.stderr?.toString());
    process.exit(1);
}

// Step 2: Run browserify
console.log('\n📦 Running browserify...');
try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('assets/dist')) {
        fs.mkdirSync('assets/dist', { recursive: true });
    }
    
    execSync('npx browserify assets/src/platform.applications.manifest.js --standalone index > assets/dist/platform.applications.manifest.all.js', { stdio: 'pipe' });
    execSync('npx browserify assets/src/commerce.catalog.storefront.shipping.manifest.js --standalone index > assets/dist/commerce.catalog.storefront.shipping.manifest.all.js', { stdio: 'pipe' });
    console.log('✅ Browserify completed!');
} catch (error) {
    console.error('❌ Browserify failed!', error.message);
    console.error(error.stdout?.toString());
    console.error(error.stderr?.toString());
    process.exit(1);
}

// Step 3: Generate manifest
console.log('\n📄 Generating manifest...');
try {
    const files = [
        { src: 'assets/src/platform.applications.manifest.js', dest: 'assets/dist/platform.applications.manifest.all.js' },
        { src: 'assets/src/commerce.catalog.storefront.shipping.manifest.js', dest: 'assets/dist/commerce.catalog.storefront.shipping.manifest.all.js' }
    ];

    const manifest = [];

    files.forEach(function(conf) {
        const index = require('./' + conf.src);
        Object.keys(index).forEach(function(key) {
            manifest.push({
                id: key,
                virtualPath: './' + path.relative('assets', conf.dest),
                actionId: index[key].actionName
            });
        });
    });

    const functionsJson = { exports: manifest };
    fs.writeFileSync('./assets/functions.json', JSON.stringify(functionsJson, null, 2));
    console.log(`✅ Generated manifest with ${manifest.length} functions!`);
} catch (error) {
    console.error('❌ Manifest generation failed!', error.message);
    process.exit(1);
}

console.log('\n🎉 Build completed successfully!');
console.log('\nGenerated files:');
console.log('  - assets/dist/platform.applications.manifest.all.js');
console.log('  - assets/dist/commerce.catalog.storefront.shipping.manifest.all.js');
console.log('  - assets/functions.json');

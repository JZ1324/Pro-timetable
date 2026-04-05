/**
 * This script is run after the webpack build to make additional adjustments
 * to the generated HTML files, specifically adding path fix scripts
 */

const fs = require('fs');
const path = require('path');

// Configuration
const buildDir = path.join(__dirname, '..', '..', 'build');
const indexHtmlPath = path.join(buildDir, 'index.html');
const helperScripts = [
    '/path-fix.js',
    '/vercel-path-fix.js',
    '/EnglishTruncationFixDirectGlobal.js',
    '/EnglishTruncationFixStandalone.js',
    '/compatibility-polyfill.js',
    '/webpack-config-override.js'
];

function injectMissingHelperScripts(htmlContent) {
    const missingScripts = helperScripts.filter((scriptPath) => !htmlContent.includes(`src="${scriptPath}"`));

    if (missingScripts.length === 0) {
        console.log('Required scripts already present in HTML, skipping...');
        return htmlContent;
    }

    const scriptBlock = [
        '',
        '    <!-- Path fix scripts for deployment - must be loaded first -->',
        ...missingScripts.map((scriptPath) => `    <script src="${scriptPath}"></script>`)
    ].join('\n');

    console.log(`Adding missing helper scripts: ${missingScripts.join(', ')}`);
    return htmlContent.replace('<head>', `<head>${scriptBlock}`);
}

// Main function
async function fixHtmlOnBuild() {
    console.log('Running post-build HTML fixes...');
    
    try {
        // Check if the build directory and index.html exist
        if (!fs.existsSync(buildDir)) {
            throw new Error(`Build directory doesn't exist: ${buildDir}`);
        }
        
        if (!fs.existsSync(indexHtmlPath)) {
            throw new Error(`Index HTML file doesn't exist: ${indexHtmlPath}`);
        }
        
        // Read the index.html file
        let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Remove duplicate early script tags before re-injecting missing helpers.
        htmlContent = htmlContent
            .replace(/<script src="\/path-fix\.js"><\/script>\s*(?=.*<script src="\/path-fix\.js"><\/script>)/g, '')
            .replace(/<script src="\/vercel-path-fix\.js"><\/script>\s*(?=.*<script src="\/vercel-path-fix\.js"><\/script>)/g, '');

        htmlContent = injectMissingHelperScripts(htmlContent);

        // Write the modified content back to the file
        fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
        console.log('Successfully updated helper scripts in index.html');
        
        // Check if required scripts exist in the build directory
        const pathFixScriptPath = path.join(buildDir, 'path-fix.js');
        const vercelPathFixScriptPath = path.join(buildDir, 'vercel-path-fix.js');
        const englishFixScriptPath = path.join(buildDir, 'EnglishTruncationFixStandalone.js');
        
        if (!fs.existsSync(pathFixScriptPath)) {
            console.log('Copying path-fix.js to build directory...');
            const sourcePathFixPath = path.join(__dirname, '..', '..', 'public', 'path-fix.js');
            fs.copyFileSync(sourcePathFixPath, pathFixScriptPath);
        }
        
        if (!fs.existsSync(vercelPathFixScriptPath)) {
            console.log('Copying vercel-path-fix.js to build directory...');
            const sourceVercelPathFixPath = path.join(__dirname, '..', '..', 'public', 'vercel-path-fix.js');
            fs.copyFileSync(sourceVercelPathFixPath, vercelPathFixScriptPath);
        }
        
        if (!fs.existsSync(englishFixScriptPath)) {
            console.log('Copying EnglishTruncationFixStandalone.js to build directory...');
            const sourceEnglishFixPath = path.join(__dirname, '..', '..', 'src', 'utils', 'EnglishTruncationFixStandalone.js');
            if (fs.existsSync(sourceEnglishFixPath)) {
                fs.copyFileSync(sourceEnglishFixPath, englishFixScriptPath);
                console.log('Successfully copied EnglishTruncationFixStandalone.js');
            } else {
                console.error('Source EnglishTruncationFixStandalone.js not found');
            }
        }
        
        // Copy direct global fix
        const directGlobalFixPath = path.join(buildDir, 'EnglishTruncationFixDirectGlobal.js');
        if (!fs.existsSync(directGlobalFixPath)) {
            console.log('Copying EnglishTruncationFixDirectGlobal.js to build directory...');
            const sourceDirectGlobalPath = path.join(__dirname, '..', '..', 'src', 'utils', 'EnglishTruncationFixDirectGlobal.js');
            if (fs.existsSync(sourceDirectGlobalPath)) {
                fs.copyFileSync(sourceDirectGlobalPath, directGlobalFixPath);
                console.log('Successfully copied EnglishTruncationFixDirectGlobal.js');
            } else {
                console.error('Source EnglishTruncationFixDirectGlobal.js not found');
            }
        }
        
        // Copy compatibility polyfill
        const compatibilityPolyfillPath = path.join(buildDir, 'compatibility-polyfill.js');
        if (!fs.existsSync(compatibilityPolyfillPath)) {
            console.log('Copying compatibility-polyfill.js to build directory...');
            const sourcePolyfillPath = path.join(__dirname, '..', '..', 'src', 'compatibility-polyfill.js');
            if (fs.existsSync(sourcePolyfillPath)) {
                fs.copyFileSync(sourcePolyfillPath, compatibilityPolyfillPath);
                console.log('Successfully copied compatibility-polyfill.js');
            } else {
                console.error('Source compatibility-polyfill.js not found');
            }
        }
        
        // Copy webpack config override
        const webpackOverridePath = path.join(buildDir, 'webpack-config-override.js');
        if (!fs.existsSync(webpackOverridePath)) {
            console.log('Copying webpack-config-override.js to build directory...');
            const sourceOverridePath = path.join(__dirname, '..', '..', 'src', 'webpack-config-override.js');
            if (fs.existsSync(sourceOverridePath)) {
                fs.copyFileSync(sourceOverridePath, webpackOverridePath);
                console.log('Successfully copied webpack-config-override.js');
            } else {
                console.error('Source webpack-config-override.js not found');
            }
        }
        
        console.log('Post-build HTML fixes completed successfully.');
    } catch (error) {
        console.error('Error during post-build HTML fixes:', error);
        process.exit(1);
    }
}

// Execute the function
fixHtmlOnBuild();

const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlContent = fs.readFileSync('/Users/michellepaulson/pumpkinspice/public/fountain.html', 'utf8');

// Extract JavaScript content between script tags
const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);

if (scriptMatch) {
  console.log(`Found ${scriptMatch.length} script tag(s)`);
  
  // Extract the main script (usually the largest one)
  let mainScript = '';
  let maxLength = 0;
  
  scriptMatch.forEach((scriptTag, index) => {
    // Remove script tags to get just the JS
    const jsContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
    
    if (jsContent.length > maxLength) {
      maxLength = jsContent.length;
      mainScript = jsContent;
    }
    
    console.log(`Script ${index + 1}: ${jsContent.length} characters`);
  });
  
  // Save the extracted JavaScript
  const outputPath = '/Users/michellepaulson/pumpkinspice/public/fountain-extracted.js';
  fs.writeFileSync(outputPath, mainScript);
  console.log(`\nMain script extracted to: ${outputPath}`);
  console.log(`Size: ${(mainScript.length / 1024).toFixed(2)} KB`);
  console.log(`Lines: ${mainScript.split('\n').length}`);
  
  // Now run the dead code analyzer on it
  console.log('\nNow run: node remove-dead-code.js public/fountain-extracted.js --analyze');
} else {
  console.log('No script tags found in the HTML file');
}
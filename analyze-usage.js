const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Track all files and their usage
const allComponents = new Set();
const allHooks = new Set();
const allUtilities = new Set();
const allPages = new Set();
const usedComponents = new Set();
const usedHooks = new Set();
const usedUtilities = new Set();
const usedAssets = new Set();
const importMap = new Map();

// Find all files in a directory
function findAllFiles(dir, type) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findAllFiles(filePath, type);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      const relativePath = filePath.replace(/\\/g, '/');
      if (type === 'components' && relativePath.includes('/components/')) {
        allComponents.add(relativePath);
      } else if (type === 'hooks' && relativePath.includes('/hooks/')) {
        allHooks.add(relativePath);
      } else if (type === 'utilities' && relativePath.includes('/utilities/')) {
        allUtilities.add(relativePath);
      } else if (type === 'pages' && relativePath.includes('/app/') && file.startsWith('page.')) {
        allPages.add(relativePath);
      }
    }
  });
}

// Find imports in files
function findImports(dir, currentFile = null) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findImports(filePath, currentFile);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileKey = filePath.replace(/\\/g, '/');
      
      // Track what each file imports
      if (!importMap.has(fileKey)) {
        importMap.set(fileKey, new Set());
      }
      
      // Find component imports
      const componentRegex = /import.*from\s+['"](@\/components\/[^'"]+|\.\.?\/[^'"]*components\/[^'"]+)['"]/g;
      let match;
      while ((match = componentRegex.exec(content)) !== null) {
        const importPath = match[1];
        usedComponents.add(importPath);
        importMap.get(fileKey).add(importPath);
      }
      
      // Find hook imports
      const hookRegex = /import.*from\s+['"](@\/hooks\/[^'"]+|\.\.?\/[^'"]*hooks\/[^'"]+)['"]/g;
      while ((match = hookRegex.exec(content)) !== null) {
        const importPath = match[1];
        usedHooks.add(importPath);
        importMap.get(fileKey).add(importPath);
      }
      
      // Find utility imports
      const utilityRegex = /import.*from\s+['"](@\/utilities\/[^'"]+|\.\.?\/[^'"]*utilities\/[^'"]+)['"]/g;
      while ((match = utilityRegex.exec(content)) !== null) {
        const importPath = match[1];
        usedUtilities.add(importPath);
        importMap.get(fileKey).add(importPath);
      }
      
      // Find trading imports
      const tradingRegex = /import.*from\s+['"](@\/trading[^'"]*)['"]/g;
      while ((match = tradingRegex.exec(content)) !== null) {
        importMap.get(fileKey).add(match[1]);
      }
      
      // Find asset references
      const assetRegex = /['"`](\/models\/[^'"`]+|\/fonts\/[^'"`]+|\/images\/[^'"`]+|\/videos\/[^'"`]+)['"`]/g;
      while ((match = assetRegex.exec(content)) !== null) {
        usedAssets.add(match[1]);
      }
    }
  });
}

// Find all assets in public directory
function findAllAssets(dir, basePath = '') {
  const assets = [];
  if (!fs.existsSync(dir)) return assets;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.join(basePath, file).replace(/\\/g, '/');
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      assets.push(...findAllAssets(filePath, relativePath));
    } else if (!file.startsWith('.')) {
      assets.push('/' + relativePath);
    }
  });
  
  return assets;
}

// Main analysis
console.log(colors.cyan + '\n🔍 Analyzing PumpkinSpice Project Usage...\n' + colors.reset);

// Find all existing files
findAllFiles('./src/components', 'components');
findAllFiles('./src/hooks', 'hooks');
findAllFiles('./src/utilities', 'utilities');
findAllFiles('./src/app', 'pages');

// Find what's actually being used
findImports('./src/app');
findImports('./src/components');
findImports('./src/trading');

// Analyze components
console.log(colors.blue + '📦 COMPONENTS ANALYSIS' + colors.reset);
console.log('=' .repeat(60));

const unusedComponents = [];
const usedComponentsList = [];

allComponents.forEach(component => {
  const fileName = path.basename(component);
  const isUsed = Array.from(usedComponents).some(imp => 
    imp.includes(fileName.replace('.jsx', '').replace('.js', ''))
  );
  
  if (isUsed) {
    usedComponentsList.push(fileName);
  } else {
    unusedComponents.push(component);
  }
});

console.log(colors.green + `✅ Used Components (${usedComponentsList.length}):` + colors.reset);
usedComponentsList.sort().forEach(comp => console.log('   ', comp));

console.log(colors.red + `\n❌ Unused Components (${unusedComponents.length}) - CAN DELETE:` + colors.reset);
unusedComponents.sort().forEach(comp => {
  const fileName = path.basename(comp);
  console.log('   ', colors.red + '✗' + colors.reset, fileName, colors.yellow + `(${comp})` + colors.reset);
});

// Analyze hooks
console.log(colors.blue + '\n🪝 HOOKS ANALYSIS' + colors.reset);
console.log('=' .repeat(60));

const unusedHooks = [];
const usedHooksList = [];

allHooks.forEach(hook => {
  const fileName = path.basename(hook);
  const isUsed = Array.from(usedHooks).some(imp => 
    imp.includes(fileName.replace('.js', '').replace('.jsx', ''))
  );
  
  if (isUsed) {
    usedHooksList.push(fileName);
  } else {
    unusedHooks.push(hook);
  }
});

console.log(colors.green + `✅ Used Hooks (${usedHooksList.length}):` + colors.reset);
usedHooksList.sort().forEach(hook => console.log('   ', hook));

console.log(colors.red + `\n❌ Unused Hooks (${unusedHooks.length}) - CAN DELETE:` + colors.reset);
unusedHooks.sort().forEach(hook => {
  const fileName = path.basename(hook);
  console.log('   ', colors.red + '✗' + colors.reset, fileName);
});

// Analyze pages
console.log(colors.blue + '\n📄 PAGES ANALYSIS' + colors.reset);
console.log('=' .repeat(60));

console.log(colors.green + `Active Pages (${allPages.size}):` + colors.reset);
allPages.forEach(page => {
  const dir = path.dirname(page).split('/').pop();
  console.log('   ', `/${dir}`, colors.yellow + `(${page})` + colors.reset);
});

// Analyze assets
console.log(colors.blue + '\n🎨 ASSETS ANALYSIS' + colors.reset);
console.log('=' .repeat(60));

const allAssets = [
  ...findAllAssets('./public/models', 'models'),
  ...findAllAssets('./public/fonts', 'fonts'),
  ...findAllAssets('./public/images', 'images'),
  ...findAllAssets('./public/videos', 'videos')
];

const unusedAssets = allAssets.filter(asset => !usedAssets.has(asset));

console.log(colors.green + `✅ Used Assets (${usedAssets.size}):` + colors.reset);
Array.from(usedAssets).sort().forEach(asset => console.log('   ', asset));

console.log(colors.red + `\n❌ Unused Assets (${unusedAssets.length}) - CAN DELETE:` + colors.reset);
unusedAssets.sort().forEach(asset => {
  const fileSize = fs.existsSync('./public' + asset) 
    ? (fs.statSync('./public' + asset).size / 1024 / 1024).toFixed(2) + ' MB'
    : 'N/A';
  console.log('   ', colors.red + '✗' + colors.reset, asset, colors.yellow + `(${fileSize})` + colors.reset);
});

// Summary
console.log(colors.cyan + '\n📊 SUMMARY' + colors.reset);
console.log('=' .repeat(60));
console.log(`Total Components: ${allComponents.size} (Used: ${usedComponentsList.length}, Unused: ${unusedComponents.length})`);
console.log(`Total Hooks: ${allHooks.size} (Used: ${usedHooksList.length}, Unused: ${unusedHooks.length})`);
console.log(`Total Assets: ${allAssets.length} (Used: ${usedAssets.size}, Unused: ${unusedAssets.length})`);
console.log(`Total Pages: ${allPages.size}`);

const percentUsed = ((usedComponentsList.length + usedHooksList.length) / (allComponents.size + allHooks.size) * 100).toFixed(1);
console.log(colors.yellow + `\n⚠️  You're using approximately ${percentUsed}% of your components and hooks` + colors.reset);

// File size estimation
let totalUnusedSize = 0;
unusedComponents.forEach(comp => {
  if (fs.existsSync(comp)) {
    totalUnusedSize += fs.statSync(comp).size;
  }
});
unusedAssets.forEach(asset => {
  const assetPath = './public' + asset;
  if (fs.existsSync(assetPath)) {
    totalUnusedSize += fs.statSync(assetPath).size;
  }
});

console.log(colors.red + `\n🗑️  Potential space savings: ${(totalUnusedSize / 1024 / 1024).toFixed(2)} MB` + colors.reset);

// Export results to file
const results = {
  usedComponents: usedComponentsList,
  unusedComponents: unusedComponents.map(c => path.basename(c)),
  usedHooks: usedHooksList,
  unusedHooks: unusedHooks.map(h => path.basename(h)),
  usedAssets: Array.from(usedAssets),
  unusedAssets,
  pages: Array.from(allPages).map(p => path.dirname(p).split('/').pop())
};

fs.writeFileSync('usage-analysis.json', JSON.stringify(results, null, 2));
console.log(colors.green + '\n✅ Detailed results saved to usage-analysis.json' + colors.reset);
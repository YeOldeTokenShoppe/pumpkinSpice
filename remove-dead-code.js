const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

/**
 * Analyzes a JavaScript/JSX file for unused code
 */
class DeadCodeAnalyzer {
  constructor(code, filename) {
    this.code = code;
    this.filename = filename;
    this.ast = null;
    this.declaredVars = new Map(); // variable name -> node
    this.declaredFuncs = new Map(); // function name -> node
    this.usedIdentifiers = new Set();
    this.exportedNames = new Set();
    this.componentNames = new Set();
    this.hooksUsed = new Set();
    this.propsUsed = new Set();
    this.removedCount = 0;
  }

  parse() {
    try {
      this.ast = parser.parse(this.code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true
      });
      return true;
    } catch (error) {
      console.error(`${colors.red}Error parsing ${this.filename}: ${error.message}${colors.reset}`);
      return false;
    }
  }

  analyze() {
    if (!this.ast) return;

    // First pass: collect all declarations
    traverse(this.ast, {
      // Collect variable declarations
      VariableDeclarator: (path) => {
        const name = path.node.id.name;
        if (name) {
          this.declaredVars.set(name, path);
        }
      },

      // Collect function declarations
      FunctionDeclaration: (path) => {
        const name = path.node.id?.name;
        if (name) {
          this.declaredFuncs.set(name, path);
          // Check if it's a React component (starts with capital letter)
          if (/^[A-Z]/.test(name)) {
            this.componentNames.add(name);
          }
        }
      },

      // Collect arrow functions assigned to variables
      VariableDeclarator: (path) => {
        if (t.isArrowFunctionExpression(path.node.init) || 
            t.isFunctionExpression(path.node.init)) {
          const name = path.node.id?.name;
          if (name) {
            this.declaredFuncs.set(name, path);
            if (/^[A-Z]/.test(name)) {
              this.componentNames.add(name);
            }
          }
        }
      },

      // Track exports
      ExportDefaultDeclaration: (path) => {
        if (path.node.declaration?.name) {
          this.exportedNames.add(path.node.declaration.name);
        }
        // For export default function ComponentName
        if (t.isFunctionDeclaration(path.node.declaration)) {
          const name = path.node.declaration.id?.name;
          if (name) this.exportedNames.add(name);
        }
      },

      ExportNamedDeclaration: (path) => {
        path.node.specifiers?.forEach(spec => {
          this.exportedNames.add(spec.exported.name);
        });
        // For export function functionName
        if (path.node.declaration?.id?.name) {
          this.exportedNames.add(path.node.declaration.id.name);
        }
      },

      // Track React hooks usage
      CallExpression: (path) => {
        const callee = path.node.callee;
        if (t.isIdentifier(callee) && callee.name.startsWith('use')) {
          this.hooksUsed.add(callee.name);
        }
      }
    });

    // Second pass: collect all identifier usage
    traverse(this.ast, {
      Identifier: (path) => {
        const name = path.node.name;
        
        // Skip if this is a declaration
        if (path.isBindingIdentifier()) return;
        if (path.isFunctionDeclaration()) return;
        
        // Skip property keys in objects
        if (path.isObjectProperty() && path.node.key === path.node) return;
        
        // Track as used
        this.usedIdentifiers.add(name);
      },

      JSXIdentifier: (path) => {
        this.usedIdentifiers.add(path.node.name);
      },

      // Track props usage in React components
      MemberExpression: (path) => {
        if (t.isIdentifier(path.node.object, { name: 'props' })) {
          this.propsUsed.add(path.node.property.name);
        }
      }
    });
  }

  getUnusedCode() {
    const unused = {
      variables: [],
      functions: [],
      totalLines: 0
    };

    // Check unused variables
    for (const [name, path] of this.declaredVars) {
      // Skip if exported, used, or is a React component
      if (this.exportedNames.has(name)) continue;
      if (this.usedIdentifiers.has(name)) continue;
      if (this.componentNames.has(name)) continue;
      if (name.startsWith('_')) continue; // Skip private by convention
      
      unused.variables.push({
        name,
        line: path.node.loc?.start.line
      });
    }

    // Check unused functions
    for (const [name, path] of this.declaredFuncs) {
      // Skip if exported, used, or is a React component
      if (this.exportedNames.has(name)) continue;
      if (this.usedIdentifiers.has(name)) continue;
      if (this.componentNames.has(name) && this.exportedNames.size > 0) continue;
      if (name.startsWith('_')) continue; // Skip private by convention
      
      const funcNode = path.node.init || path.node;
      const lines = funcNode.loc ? 
        funcNode.loc.end.line - funcNode.loc.start.line + 1 : 0;
      
      unused.functions.push({
        name,
        line: path.node.loc?.start.line,
        lines
      });
      unused.totalLines += lines;
    }

    return unused;
  }

  removeUnusedCode() {
    if (!this.ast) return null;

    // Remove unused variables and functions
    traverse(this.ast, {
      VariableDeclarator: (path) => {
        const name = path.node.id?.name;
        if (!name) return;

        // Check if unused
        if (!this.exportedNames.has(name) && 
            !this.usedIdentifiers.has(name) && 
            !this.componentNames.has(name) &&
            !name.startsWith('_')) {
          
          // Remove the declarator
          if (path.parent.declarations?.length === 1) {
            // Remove entire variable statement
            path.parentPath.remove();
            this.removedCount++;
          } else {
            // Just remove this declarator
            path.remove();
            this.removedCount++;
          }
        }
      },

      FunctionDeclaration: (path) => {
        const name = path.node.id?.name;
        if (!name) return;

        // Check if unused
        if (!this.exportedNames.has(name) && 
            !this.usedIdentifiers.has(name) && 
            !name.startsWith('_')) {
          path.remove();
          this.removedCount++;
        }
      },

      // Remove empty import statements
      ImportDeclaration: (path) => {
        const specifiers = path.node.specifiers.filter(spec => {
          const name = spec.local.name;
          return this.usedIdentifiers.has(name);
        });

        if (specifiers.length === 0 && path.node.specifiers.length > 0) {
          path.remove();
        } else if (specifiers.length !== path.node.specifiers.length) {
          path.node.specifiers = specifiers;
        }
      }
    });

    // Generate cleaned code
    const output = generate(this.ast, {
      retainLines: false,
      compact: false,
      concise: false,
      quotes: 'single',
      jsxSingleQuote: false
    });

    return output.code;
  }
}

/**
 * Process a single file
 */
function processFile(filepath, options = {}) {
  console.log(`\n${colors.blue}Analyzing: ${filepath}${colors.reset}`);
  
  const code = fs.readFileSync(filepath, 'utf8');
  const analyzer = new DeadCodeAnalyzer(code, filepath);
  
  if (!analyzer.parse()) {
    return { error: true };
  }
  
  analyzer.analyze();
  const unused = analyzer.getUnusedCode();
  
  // Report findings
  if (unused.variables.length > 0) {
    console.log(`${colors.yellow}Unused variables (${unused.variables.length}):${colors.reset}`);
    unused.variables.forEach(v => {
      console.log(`  ${colors.red}✗${colors.reset} ${v.name} (line ${v.line})`);
    });
  }
  
  if (unused.functions.length > 0) {
    console.log(`${colors.yellow}Unused functions (${unused.functions.length}):${colors.reset}`);
    unused.functions.forEach(f => {
      console.log(`  ${colors.red}✗${colors.reset} ${f.name} (line ${f.line}, ~${f.lines} lines)`);
    });
  }
  
  if (unused.variables.length === 0 && unused.functions.length === 0) {
    console.log(`${colors.green}✓ No unused code found${colors.reset}`);
    return { clean: true };
  }
  
  // Ask to clean or auto-clean based on options
  if (options.autoClean || options.write) {
    const cleanedCode = analyzer.removeUnusedCode();
    if (cleanedCode) {
      if (options.write) {
        // Backup original
        const backupPath = filepath + '.backup';
        fs.copyFileSync(filepath, backupPath);
        console.log(`${colors.cyan}Backup saved: ${backupPath}${colors.reset}`);
        
        // Write cleaned file
        fs.writeFileSync(filepath, cleanedCode);
        console.log(`${colors.green}✓ Removed ${analyzer.removedCount} unused items${colors.reset}`);
      } else {
        // Save to new file
        const cleanPath = filepath.replace(/\.(js|jsx)$/, '.clean.$1');
        fs.writeFileSync(cleanPath, cleanedCode);
        console.log(`${colors.green}✓ Cleaned version saved: ${cleanPath}${colors.reset}`);
      }
    }
  }
  
  return {
    unused,
    removedCount: analyzer.removedCount,
    totalUnusedLines: unused.totalLines
  };
}

// Main CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
${colors.cyan}Dead Code Removal Tool${colors.reset}

Usage:
  node remove-dead-code.js <file|directory> [options]

Options:
  --write    Overwrite files in place (backs up originals)
  --clean    Save cleaned versions as .clean.js files
  --analyze  Only analyze, don't modify files (default)

Examples:
  node remove-dead-code.js src/components/MyComponent.jsx --analyze
  node remove-dead-code.js src/components/MyComponent.jsx --clean
  node remove-dead-code.js src/components --write
`);
  process.exit(0);
}

// Check if babel packages are installed
try {
  require('@babel/parser');
  require('@babel/traverse');
  require('@babel/generator');
  require('@babel/types');
} catch (error) {
  console.error(`
${colors.red}Missing required Babel packages!${colors.reset}

Please install them first:
${colors.cyan}npm install --save-dev @babel/parser @babel/traverse @babel/generator @babel/types${colors.reset}
`);
  process.exit(1);
}

const targetPath = args[0];
const options = {
  write: args.includes('--write'),
  autoClean: args.includes('--clean'),
  analyze: args.includes('--analyze') || (!args.includes('--write') && !args.includes('--clean'))
};

if (fs.statSync(targetPath).isDirectory()) {
  // Process all JS/JSX files in directory
  const files = fs.readdirSync(targetPath)
    .filter(f => f.endsWith('.js') || f.endsWith('.jsx'))
    .map(f => path.join(targetPath, f));
  
  let totalUnused = 0;
  let totalLines = 0;
  
  files.forEach(file => {
    const result = processFile(file, options);
    if (result.unused) {
      totalUnused += result.unused.variables.length + result.unused.functions.length;
      totalLines += result.totalUnusedLines;
    }
  });
  
  console.log(`\n${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Files analyzed: ${files.length}`);
  console.log(`  Total unused items: ${totalUnused}`);
  console.log(`  Estimated lines to remove: ${totalLines}`);
} else {
  // Process single file
  processFile(targetPath, options);
}
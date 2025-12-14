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
 * Aggressive code cleaner - removes console.logs, comments, and dead code
 */
class AggressiveCodeCleaner {
  constructor(code, filename) {
    this.code = code;
    this.filename = filename;
    this.ast = null;
    this.stats = {
      consoleLogs: 0,
      comments: 0,
      emptyLines: 0,
      debuggers: 0,
      todos: 0,
      unusedVars: 0,
      unusedFuncs: 0
    };
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

  clean() {
    if (!this.ast) return null;

    // Track what's used
    const declaredVars = new Map();
    const declaredFuncs = new Map();
    const usedIdentifiers = new Set();
    const exportedNames = new Set();

    // First pass: collect declarations and exports
    traverse(this.ast, {
      VariableDeclarator: (path) => {
        const name = path.node.id?.name;
        if (name) declaredVars.set(name, path);
      },
      FunctionDeclaration: (path) => {
        const name = path.node.id?.name;
        if (name) declaredFuncs.set(name, path);
      },
      ExportDefaultDeclaration: (path) => {
        if (path.node.declaration?.name) {
          exportedNames.add(path.node.declaration.name);
        }
        if (t.isFunctionDeclaration(path.node.declaration)) {
          const name = path.node.declaration.id?.name;
          if (name) exportedNames.add(name);
        }
      },
      ExportNamedDeclaration: (path) => {
        path.node.specifiers?.forEach(spec => {
          if (spec.exported?.name) {
            exportedNames.add(spec.exported.name);
          }
        });
        if (path.node.declaration?.id?.name) {
          exportedNames.add(path.node.declaration.id.name);
        }
      }
    });

    // Second pass: collect usage
    traverse(this.ast, {
      Identifier: (path) => {
        const name = path.node.name;
        if (!path.isBindingIdentifier() && !path.isFunctionDeclaration()) {
          usedIdentifiers.add(name);
        }
      },
      JSXIdentifier: (path) => {
        usedIdentifiers.add(path.node.name);
      }
    });

    // Main cleaning pass
    traverse(this.ast, {
      // Remove ALL console statements
      CallExpression: (path) => {
        if (t.isMemberExpression(path.node.callee)) {
          const object = path.node.callee.object;
          const property = path.node.callee.property;
          
          // Remove console.* calls
          if (t.isIdentifier(object, { name: 'console' })) {
            this.stats.consoleLogs++;
            
            // If it's a statement, remove the whole thing
            if (path.parentPath.isExpressionStatement()) {
              path.parentPath.remove();
            } else {
              // If it's part of an expression, replace with undefined
              path.replaceWith(t.identifier('undefined'));
            }
          }
        }
      },

      // Remove debugger statements
      DebuggerStatement: (path) => {
        this.stats.debuggers++;
        path.remove();
      },

      // Remove unused variables
      VariableDeclarator: (path) => {
        const name = path.node.id?.name;
        if (!name) return;

        // Skip if it's exported or used
        if (exportedNames.has(name) || usedIdentifiers.has(name)) return;
        
        // Skip React component names (start with capital)
        if (/^[A-Z]/.test(name)) return;
        
        // Skip if it starts with _ (convention for intentionally unused)
        if (name.startsWith('_')) return;

        this.stats.unusedVars++;
        
        if (path.parent.declarations?.length === 1) {
          // Remove entire variable statement
          path.parentPath.remove();
        } else {
          // Just remove this declarator
          path.remove();
        }
      },

      // Remove unused functions
      FunctionDeclaration: (path) => {
        const name = path.node.id?.name;
        if (!name) return;

        // Skip if exported or used
        if (exportedNames.has(name) || usedIdentifiers.has(name)) return;
        
        // Skip React components
        if (/^[A-Z]/.test(name)) return;
        
        // Skip if it starts with _
        if (name.startsWith('_')) return;

        this.stats.unusedFuncs++;
        path.remove();
      },

      // Remove commented JSX
      JSXElement: (path) => {
        // Remove JSX comments like {/* comment */}
        path.node.children = path.node.children?.filter(child => {
          if (t.isJSXExpressionContainer(child)) {
            if (t.isJSXEmptyExpression(child.expression)) {
              this.stats.comments++;
              return false;
            }
          }
          return true;
        });
      },

      // Clean up empty blocks
      BlockStatement: (path) => {
        // Remove empty blocks (but keep function bodies)
        if (path.node.body.length === 0 && !path.parentPath.isFunction()) {
          path.remove();
        }
      },

      // Remove TODO/FIXME/HACK comments from string literals
      StringLiteral: (path) => {
        if (path.node.value.includes('TODO') || 
            path.node.value.includes('FIXME') || 
            path.node.value.includes('HACK')) {
          this.stats.todos++;
        }
      }
    });

    // Generate clean code
    const output = generate(this.ast, {
      retainLines: false,
      compact: false,
      concise: false,
      comments: false, // Remove ALL comments
      jsxSingleQuote: false,
      quotes: 'single'
    });

    // Post-process to remove extra blank lines
    const lines = output.code.split('\n');
    const cleanedLines = [];
    let prevBlank = false;

    for (const line of lines) {
      const isBlank = line.trim() === '';
      
      // Skip multiple consecutive blank lines
      if (isBlank && prevBlank) {
        this.stats.emptyLines++;
        continue;
      }
      
      // Skip lines that are just comments
      if (line.trim().startsWith('//')) {
        this.stats.comments++;
        continue;
      }
      
      cleanedLines.push(line);
      prevBlank = isBlank;
    }

    return cleanedLines.join('\n');
  }
}

// Main function
function aggressiveClean(filepath, options = {}) {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Aggressively cleaning: ${path.basename(filepath)}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
  
  const code = fs.readFileSync(filepath, 'utf8');
  const originalLines = code.split('\n').length;
  const originalSize = (code.length / 1024).toFixed(2);
  
  console.log(`${colors.yellow}Original: ${originalLines} lines, ${originalSize} KB${colors.reset}`);
  
  const cleaner = new AggressiveCodeCleaner(code, filepath);
  
  if (!cleaner.parse()) {
    return { error: true };
  }
  
  const cleanedCode = cleaner.clean();
  
  if (!cleanedCode) {
    console.error(`${colors.red}Failed to clean code${colors.reset}`);
    return { error: true };
  }
  
  const cleanedLines = cleanedCode.split('\n').length;
  const cleanedSize = (cleanedCode.length / 1024).toFixed(2);
  const reduction = ((1 - cleanedCode.length / code.length) * 100).toFixed(1);
  
  // Report what was removed
  console.log(`\n${colors.yellow}Removed:${colors.reset}`);
  if (cleaner.stats.consoleLogs > 0) {
    console.log(`  ${colors.red}✗${colors.reset} ${cleaner.stats.consoleLogs} console.log statements`);
  }
  if (cleaner.stats.debuggers > 0) {
    console.log(`  ${colors.red}✗${colors.reset} ${cleaner.stats.debuggers} debugger statements`);
  }
  if (cleaner.stats.unusedVars > 0) {
    console.log(`  ${colors.red}✗${colors.reset} ${cleaner.stats.unusedVars} unused variables`);
  }
  if (cleaner.stats.unusedFuncs > 0) {
    console.log(`  ${colors.red}✗${colors.reset} ${cleaner.stats.unusedFuncs} unused functions`);
  }
  if (cleaner.stats.comments > 0) {
    console.log(`  ${colors.red}✗${colors.reset} ${cleaner.stats.comments} comment blocks`);
  }
  if (cleaner.stats.emptyLines > 0) {
    console.log(`  ${colors.red}✗${colors.reset} ${cleaner.stats.emptyLines} extra blank lines`);
  }
  
  console.log(`\n${colors.green}Result: ${cleanedLines} lines, ${cleanedSize} KB${colors.reset}`);
  console.log(`${colors.green}Reduction: ${originalLines - cleanedLines} lines (${reduction}%)${colors.reset}`);
  
  // Save the file
  if (options.write) {
    // Backup original
    const backupPath = filepath + '.backup';
    fs.copyFileSync(filepath, backupPath);
    console.log(`\n${colors.cyan}Backup saved: ${backupPath}${colors.reset}`);
    
    // Write cleaned file
    fs.writeFileSync(filepath, cleanedCode);
    console.log(`${colors.green}✓ Original file updated${colors.reset}`);
  } else {
    // Save to new file
    const cleanPath = filepath.replace(/\.(js|jsx)$/, '.superclean.$1');
    fs.writeFileSync(cleanPath, cleanedCode);
    console.log(`\n${colors.green}✓ Clean version saved: ${cleanPath}${colors.reset}`);
  }
  
  return { success: true, stats: cleaner.stats, reduction };
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
${colors.cyan}🧹 Aggressive Code Cleaner${colors.reset}

Removes:
  • All console.log statements
  • All comments (single line, multi-line, JSX)
  • Debugger statements
  • Unused variables and functions
  • Extra blank lines
  • TODO/FIXME/HACK markers

Usage:
  node clean-code-aggressive.js <file> [--write]

Options:
  --write    Overwrite original file (backs up first)
  (default)  Creates .superclean.js file

Example:
  node clean-code-aggressive.js src/components/Modal.jsx
  node clean-code-aggressive.js src/components/Modal.jsx --write
`);
  process.exit(0);
}

const filepath = args[0];
const writeMode = args.includes('--write');

if (!fs.existsSync(filepath)) {
  console.error(`${colors.red}File not found: ${filepath}${colors.reset}`);
  process.exit(1);
}

aggressiveClean(filepath, { write: writeMode });
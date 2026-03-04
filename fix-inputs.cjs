const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Clean remaining absolute colors causing contrast issues on light mode
  content = content.replace(/bg-\[#0a0c10\]/g, 'bg-background');
  content = content.replace(/bg-slate-800\/50/g, 'bg-foreground/5');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed inputs in ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.astro')) {
      replaceInFile(fullPath);
    }
  }
}

traverse(srcDir);

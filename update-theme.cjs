const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Replace exact hardcoded hex to logical tailwind theme references
  content = content.replace(/bg-\[#161824\]/g, "bg-background");
  content = content.replace(/bg-naveo-dark/g, "bg-background");
  content = content.replace(/bg-\[#212529\]/g, "bg-card");
  content = content.replace(/bg-\[#1a1a1c\]/g, "bg-card");
  content = content.replace(/bg-\[#11131c\]/g, "bg-card");
  content = content.replace(/bg-\[#0f111a\]/g, "bg-background");
  content = content.replace(/bg-\[#161618\]/g, "bg-background");

  // Replace text-white to text-foreground (safely)
  content = content.replace(/text-white/g, "text-foreground");

  // Replace border-white/5 etc to border-border
  content = content.replace(/border-white\/5/g, "border-border/50");
  content = content.replace(/border-white\/10/g, "border-border");
  content = content.replace(/border-white\/20/g, "border-border");

  // Soft texts like slate-400 / gray-400 to text-muted-foreground
  content = content.replace(/text-slate-400/g, "text-muted-foreground");
  content = content.replace(/text-gray-400/g, "text-muted-foreground");
  content = content.replace(/text-gray-300/g, "text-foreground/80");
  content = content.replace(/text-slate-300/g, "text-foreground/80");
  content = content.replace(/text-slate-500/g, "text-muted-foreground");
  content = content.replace(/text-gray-500/g, "text-muted-foreground");

  // Hover backgrounds
  content = content.replace(/hover:bg-white\/5/g, "hover:bg-foreground/5");
  content = content.replace(/hover:bg-white\/10/g, "hover:bg-foreground/10");

  // Faint background placeholders
  content = content.replace(/bg-white\/5/g, "bg-foreground/5");
  content = content.replace(/bg-white\/10/g, "bg-foreground/10");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (
      fullPath.endsWith(".tsx") ||
      fullPath.endsWith(".ts") ||
      fullPath.endsWith(".astro")
    ) {
      replaceInFile(fullPath);
    }
  }
}

traverse(srcDir);

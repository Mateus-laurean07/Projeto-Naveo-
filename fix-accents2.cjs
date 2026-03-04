const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Additional Replacements
  content = content.replace(/hover:bg-\[#146cd5\]/g, "hover:bg-accent/80");
  content = content.replace(/bg-\[#1a7efb\]/g, "bg-accent");
  content = content.replace(
    /bg-gradient-to-br from-\[#1a7efb\] to-\[#146cd5\]/g,
    "bg-accent",
  );
  content = content.replace(
    /hover:shadow-\[#1a7efb\]\/20/g,
    "hover:shadow-accent/20",
  );
  content = content.replace(
    /hover:shadow-\[#1a7efb\]\/40/g,
    "hover:shadow-accent/40",
  );
  content = content.replace(
    /shadow-\[0_0_20px_rgba\(26,126,251,0\.3\)\]/g,
    "shadow-[0_0_20px_hsl(var(--accent))\/30]",
  );
  content = content.replace(
    /hover:shadow-\[0_0_30px_rgba\(26,126,251,0\.5\)\]/g,
    "hover:shadow-[0_0_30px_hsl(var(--accent))\/50]",
  );
  content = content.replace(/bg-\[#D0F500\]/gi, "bg-accent");
  content = content.replace(/text-\[#D0F500\]/gi, "text-accent");
  content = content.replace(/text-\[#1a7efb\]/gi, "text-accent");
  content = content.replace(
    /shadow-\[0_0_15px_rgba\(208,245,0,0\.4\)\]/gi,
    "shadow-[0_0_15px_hsl(var(--accent))\/40]",
  );
  content = content.replace(/bg-[#D0F500]\/10/gi, "bg-accent/10");
  content = content.replace(
    /shadow-\[inset_4px_0_0_#D0F500\]/gi,
    "shadow-[inset_4px_0_0_hsl(var(--accent))]",
  );
  content = content.replace(/bg-naveo-accent/gi, "bg-accent");
  content = content.replace(/text-naveo-accent/gi, "text-accent");
  content = content.replace(/border-naveo-accent/gi, "border-accent");
  content = content.replace(/ring-naveo-accent/gi, "ring-accent");
  content = content.replace(/focus:border-\[#1a7efb\]/g, "focus:border-accent");
  content = content.replace(/focus:ring-\[#1a7efb\]/g, "focus:ring-accent");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated accent colors in ${filePath}`);
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
      fullPath.endsWith(".css")
    ) {
      replaceInFile(fullPath);
    }
  }
}

traverse(srcDir);

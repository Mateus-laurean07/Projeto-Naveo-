const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Replace Hex Codes with Tailwind variables
  content = content.replace(/bg-\[#1a7efb\]/g, "bg-accent");
  content = content.replace(/text-\[#1a7efb\]/g, "text-accent");
  content = content.replace(/border-\[#1a7efb\]/g, "border-accent");
  content = content.replace(/ring-\[#1a7efb\]/g, "ring-accent");

  content = content.replace(/hover:bg-\[#1a7efb\]/g, "hover:bg-accent");
  content = content.replace(/hover:text-\[#1a7efb\]/g, "hover:text-accent");
  content = content.replace(/focus:border-\[#1a7efb\]/g, "focus:border-accent");
  content = content.replace(/focus:ring-\[#1a7efb\]/g, "focus:ring-accent");
  content = content.replace(
    /shadow-\[0_0_15px_rgba\(26,126,251,0\.3\)\]/g,
    "shadow-[0_0_15px_hsl(var(--accent))\/30]",
  );
  content = content.replace(
    /shadow-\[0_0_20px_rgba\(26,126,251,0\.5\)\]/g,
    "shadow-[0_0_15px_hsl(var(--accent))\/50]",
  );

  // Header accent update
  content = content.replace(
    /shadow-\[0_0_15px_rgba\(233,30,99,0\.4\)\]/g,
    "shadow-[0_0_15px_hsl(var(--accent))\/40]",
  );

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

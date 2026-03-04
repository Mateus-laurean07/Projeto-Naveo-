const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Replace naveo-card
  content = content.replace(/bg-naveo-card\/40 p-1/g, "bg-transparent mb-6");
  content = content.replace(/bg-naveo-card/g, "bg-card");
  content = content.replace(/hover:bg-naveo-card/g, "hover:bg-card");

  // Replace header notification ugly grays
  content = content.replace(/bg-\[#1e1e24\]/g, "bg-card");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated naveo-card in ${filePath}`);
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

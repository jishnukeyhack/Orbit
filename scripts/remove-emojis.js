const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

// Unicode property escape regex that matches any pictographic symbol or emoji
const emojiRegex = /\p{Extended_Pictographic}/gu;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (emojiRegex.test(content)) {
        // Clean up: replace emoji and trim extra consecutive spaces
        const cleaned = content.replace(emojiRegex, '');
        fs.writeFileSync(fullPath, cleaned, 'utf8');
        console.log(`[Cleaned Emojis] ${path.relative(targetDir, fullPath)}`);
      }
    }
  }
}

console.log('Scrubbing emojis from codebase...');
walk(targetDir);
console.log('Emoji scrubbing completed successfully.');

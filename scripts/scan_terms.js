const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const excludeDirs = ['.next', 'node_modules', '.git', 'scripts', 'ClawTeam-main', 'agency-agents-main', 'build'];
const terms = [/ClawTeam/g, /Roaster/gi, /Roster/gi, /reasoner/gi];

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (excludeDirs.includes(file)) continue;
      walk(fullPath, callback);
    } else {
      // Exclude binary files or common config
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.db')) continue;
      callback(fullPath);
    }
  }
}

console.log('Scanning for terms: ClawTeam, Roaster, Roster, reasoners...');
const matches = {};

walk(rootDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let fileHasMatch = false;
  
  terms.forEach(term => {
    const count = (content.match(term) || []).length;
    if (count > 0) {
      fileHasMatch = true;
      if (!matches[filePath]) matches[filePath] = [];
      matches[filePath].push({ term: term.source, count });
    }
  });
});

console.log('\n--- SCAN RESULTS ---');
for (const [file, info] of Object.entries(matches)) {
  const relative = path.relative(rootDir, file);
  console.log(`${relative}:`);
  info.forEach(item => {
    console.log(`  - Found /${item.term}/: ${item.count} times`);
  });
}
console.log('--- END OF SCAN ---\n');

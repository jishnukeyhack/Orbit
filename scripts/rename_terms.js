const fs = require('fs');
const path = require('path');

const filesToRename = [
  'src/app/(app)/agents/page.tsx',
  'src/app/(app)/swarms/page.tsx',
  'src/app/(app)/workflows/page.tsx',
  'src/lib/openswarm/agents-compiled.json'
];

const rootDir = path.resolve(__dirname, '..');

console.log('Beginning global term rebranding replacements (including capitalized variants)...');

filesToRename.forEach(relPath => {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`File does not exist: ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Rebrand ClawTeam
  content = content.replace(/ClawTeam/g, 'Orbit');
  content = content.replace(/clawteam/g, 'orbit');
  content = content.replace(/CLAWTEAM/g, 'ORBIT');

  // 2. Rebrand Roster / Roaster
  content = content.replace(/Roaster/g, 'Agents');
  content = content.replace(/roaster/g, 'agents');
  content = content.replace(/ROASTER/g, 'AGENTS');
  content = content.replace(/Roster/g, 'Agents');
  content = content.replace(/roster/g, 'agents');
  content = content.replace(/ROSTER/g, 'AGENTS');

  // 3. Rebrand reasoners / reasoner (all cases)
  content = content.replace(/Reasoners/g, 'Agents');
  content = content.replace(/reasoners/g, 'agents');
  content = content.replace(/REASONERS/g, 'AGENTS');
  content = content.replace(/Reasoner/g, 'Agent');
  content = content.replace(/reasoner/g, 'agent');
  content = content.replace(/REASONER/g, 'AGENT');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully rebranded terms in: ${relPath}`);
  } else {
    console.log(`No terms required changes in: ${relPath}`);
  }
});

console.log('Capitalized term rebranding completed successfully.');

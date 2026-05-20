const fs = require('fs');
const path = require('path');

const CATEGORY_META = {
  engineering:        { label: 'Engineering',        icon: 'cpu' },
  marketing:          { label: 'Marketing',           icon: 'megaphone' },
  finance:            { label: 'Finance',             icon: 'dollar-sign' },
  design:             { label: 'Design',              icon: 'palette' },
  product:            { label: 'Product',             icon: 'box' },
  sales:              { label: 'Sales',               icon: 'briefcase' },
  support:            { label: 'Support',             icon: 'life-buoy' },
  strategy:           { label: 'Strategy',            icon: 'compass' },
  academic:           { label: 'Academic',            icon: 'graduation-cap' },
  testing:            { label: 'Testing',             icon: 'flask-conical' },
  'game-development': { label: 'Game Dev',            icon: 'gamepad-2' },
  integrations:       { label: 'Integrations',        icon: 'plug' },
  'paid-media':       { label: 'Paid Media',          icon: 'volume-2' },
  'project-management': { label: 'Project Mgmt',     icon: 'clipboard-list' },
  specialized:        { label: 'Specialized',         icon: 'sparkles' },
  'spatial-computing':{ label: 'Spatial Computing',   icon: 'eye' },
};

function parseFrontmatter(content) {
  const meta = {};
  let body = content;

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    const fmLines = fmMatch[1].split('\n');
    for (const line of fmLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        meta[key] = value;
      }
    }
    body = fmMatch[2];
  }

  return { meta, body };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function main() {
  const projectRoot = path.join(__dirname, '..');
  const AGENCY_AGENTS_ROOT = path.join(projectRoot, 'agency-agents-main');

  console.log(`Starting agent compilation from: ${AGENCY_AGENTS_ROOT}`);

  if (!fs.existsSync(AGENCY_AGENTS_ROOT)) {
    console.error(`Error: directory not found at ${AGENCY_AGENTS_ROOT}`);
    process.exit(1);
  }

  const agents = [];
  const categories = Object.keys(CATEGORY_META);

  for (const category of categories) {
    const catDir = path.join(AGENCY_AGENTS_ROOT, category);
    if (!fs.existsSync(catDir)) {
      continue;
    }

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
    console.log(`Category [${category}]: Found ${files.length} agent files`);

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(catDir, file), 'utf-8');
        const { meta, body } = parseFrontmatter(content);

        const name = meta.name || file.replace(/^[a-z-]+-/, '').replace(/-/g, ' ').replace(/\.md$/, '');
        const id = slugify(`${category}-${name}`);

        agents.push({
          id,
          name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: meta.description || body.split('\n').find(l => l.trim() && !l.startsWith('#')) || '',
          color: meta.color || 'blue',
          emoji: CATEGORY_META[category]?.icon || 'cpu',
          vibe: meta.vibe || '',
          category,
          systemPrompt: content,
          filename: file,
        });
      } catch (err) {
        console.error(`Error parsing file ${file} in ${category}:`, err);
      }
    }
  }

  const outputPath = path.join(projectRoot, 'src', 'lib', 'openswarm', 'agents-compiled.json');
  fs.writeFileSync(outputPath, JSON.stringify(agents, null, 2), 'utf-8');
  console.log(`Successfully compiled ${agents.length} agents to ${outputPath}`);
}

main();

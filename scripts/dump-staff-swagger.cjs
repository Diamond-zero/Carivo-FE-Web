const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('./swagger-spec.json', 'utf8'));
const lines = [];
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    const summary = op.summary || '';
    const rolesMatch = summary.match(/\[([^\]]+)\]/);
    const roles = rolesMatch ? rolesMatch[1] : '';
    if (!roles.includes('STAFF')) continue;
    lines.push({
      method: method.toUpperCase(),
      path,
      roles,
      summary: summary.replace(/\[[^\]]+\]\s*/, ''),
      tag: (op.tags || []).join(','),
    });
  }
}
fs.writeFileSync('./scripts/swagger-staff.txt',
  lines.map(l => `${l.method.padEnd(6)} ${l.path.padEnd(75)} ${l.roles.padEnd(15)} [${l.tag}] ${l.summary}`).join('\n')
);
console.log('Total staff endpoints:', lines.length);

// Categorize by tag
const byTag = {};
for (const l of lines) {
  const tag = l.tag.split(',')[0].trim();
  byTag[tag] = (byTag[tag] || 0) + 1;
}
console.log('\nBy tag:');
for (const [t, c] of Object.entries(byTag).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(45)} ${c}`);
}
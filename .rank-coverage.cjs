const { readFileSync } = require('node:fs');

const files = [
  'C:/Users/USER/AppData/Roaming/Code/User/workspaceStorage/f609379edd7ff10606fdc5fc855ea8da/GitHub.copilot-chat/chat-session-resources/b295adce-948c-4d7a-ab63-9becbe44ad3c/toolu_vrtx_01EiA513kGYgSQHeLVgrJ4mn__vscode-1778102833709/content.json',
  'C:/Users/USER/AppData/Roaming/Code/User/workspaceStorage/f609379edd7ff10606fdc5fc855ea8da/GitHub.copilot-chat/chat-session-resources/b295adce-948c-4d7a-ab63-9becbe44ad3c/toolu_vrtx_01BepQvFdDCrKhBEpP1YhBob__vscode-1778102833712/content.json',
  'C:/Users/USER/AppData/Roaming/Code/User/workspaceStorage/f609379edd7ff10606fdc5fc855ea8da/GitHub.copilot-chat/chat-session-resources/b295adce-948c-4d7a-ab63-9becbe44ad3c/toolu_vrtx_01HuGZ8aHbZ4TYk4P8r8RbrL__vscode-1778102833713/content.json',
];

const all = [];
for (const f of files) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  for (const c of data.components) {
    const m = {};
    for (const measure of (c.measures || [])) {
      m[measure.metric] = measure.value;
    }
    const uncovered = Number.parseInt(m.uncovered_conditions || '0', 10);
    const total = Number.parseInt(m.conditions_to_cover || '0', 10);
    const coverage = m.branch_coverage ? Number.parseFloat(m.branch_coverage) : null;
    if (total > 0) {
      all.push({
        key: c.key.replace('Ange230700_kraak-group:', ''),
        uncovered,
        total,
        coverage,
      });
    }
  }
}

all.sort((a, b) => b.uncovered - a.uncovered);

const top = all.slice(0, 25);
process.stdout.write('File | Uncovered branches | Total branches | Coverage %\n');
process.stdout.write('--- | --- | --- | ---\n');
for (const r of top) {
  process.stdout.write(`${r.key} | ${r.uncovered} | ${r.total} | ${r.coverage === null ? 'N/A' : r.coverage + '%'}\n`);
}
process.stdout.write('\nTotal files with uncovered branches: ' + all.length + '\n');
process.stdout.write('Total uncovered conditions: ' + all.reduce((s, r) => s + r.uncovered, 0) + '\n');

const { readFileSync, writeFileSync } = require('node:fs');
const raw = readFileSync('C:/Users/USER/AppData/Roaming/Code/User/workspaceStorage/f609379edd7ff10606fdc5fc855ea8da/GitHub.copilot-chat/chat-session-resources/b295adce-948c-4d7a-ab63-9becbe44ad3c/toolu_vrtx_01AjSXrJQYbtznS5moBPFgdV__vscode-1778102833691/content.json', 'utf8');
const data = JSON.parse(raw);
const skip = /\.(html|sql|json|toml|css|scss|txt|md|properties|yaml|yml|png|svg|ico|webmanifest)$/;
const keys = data.components
  .filter(function(c) { return !skip.test(c.key); })
  .map(function(c) { return c.key; });
writeFileSync('.keys-batch1.json', JSON.stringify(keys.slice(0, 50)));
writeFileSync('.keys-batch2.json', JSON.stringify(keys.slice(50, 100)));
writeFileSync('.keys-batch3.json', JSON.stringify(keys.slice(100)));
process.stdout.write('Written: ' + keys.length + ' keys in 3 batches\n');

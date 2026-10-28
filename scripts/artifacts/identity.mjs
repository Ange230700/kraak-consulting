import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

export const renderSpec = Object.freeze({
  version: 1,
  markdown: '17.0.1',
  pdf: 'chromium-tagged-a4',
  pptx: '4.0.1',
  narration: 1,
  mermaid: '11.12.0',
});
export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
export function stableJson(value) {
  const sort = (entry) => {
    if (Array.isArray(entry)) return entry.map(sort);
    if (entry && typeof entry === 'object')
      return Object.fromEntries(
        Object.keys(entry)
          .sort((left, right) =>
            Buffer.compare(Buffer.from(left), Buffer.from(right)),
          )
          .map((key) => [key, sort(entry[key])]),
      );
    return entry;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}
export async function atomicWrite(destination, data) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, data);
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}
export async function fileHash(file) {
  return sha256(await readFile(file));
}

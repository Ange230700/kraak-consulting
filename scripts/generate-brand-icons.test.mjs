import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

if (process.env.NODE_TEST_CONTEXT === 'child-v8') {
  test('Given le moteur natif sharp, When les scénarios d’icônes sont exécutés hors du canal IPC V8, Then toutes leurs assertions passent', () => {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      ['--test-reporter=tap', fileURLToPath(import.meta.url)],
      {
        env,
        encoding: 'utf8',
        timeout: 120_000,
      },
    );
    assert.equal(
      result.status,
      0,
      `${result.error?.message ?? ''}\n${result.stdout}\n${result.stderr}`,
    );
    assert.match(result.stdout, /# tests 3/);
    assert.match(result.stdout, /# pass 3/);
    assert.match(result.stdout, /# fail 0/);
  });
} else {
  const { default: sharp } = await import('sharp');
  const { buildIcoFile, generateAndroidLauncherIcons, main } =
    await import('./generate-brand-icons.mjs');

  test('Given des images PNG, When le conteneur ICO est construit, Then les tailles et offsets décodent les images originales', async () => {
    const entries = await Promise.all(
      [16, 256].map(async (size) => ({
        size,
        buffer: await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: '#122B4A',
          },
        })
          .png()
          .toBuffer(),
      })),
    );
    const ico = buildIcoFile(entries);
    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1);
    assert.equal(ico.readUInt16LE(4), 2);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = 6 + index * 16;
      assert.equal(
        ico[entry],
        entries[index].size === 256 ? 0 : entries[index].size,
      );
      assert.equal(ico[entry + 1], ico[entry]);
      const offset = ico.readUInt32LE(entry + 12);
      const length = ico.readUInt32LE(entry + 8);
      assert.deepEqual(
        ico.subarray(offset, offset + length),
        entries[index].buffer,
      );
    }
  });

  test('Given un dépôt de marque temporaire, When les icônes sont générées, Then les favicons et lanceurs Android respectent leurs dimensions', async (t) => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-icons-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    await assert.rejects(main(root), /Source manquante/);
    await generateAndroidLauncherIcons(root);
    for (const project of ['web', 'mobile']) {
      const directory = path.join(
        root,
        'apps',
        'client',
        'projects',
        project,
        'public',
      );
      mkdirSync(directory, { recursive: true });
      await sharp({
        create: { width: 24, height: 12, channels: 4, background: '#ff5500' },
      })
        .png()
        .toFile(path.join(directory, 'kraak-symbol.png'));
    }
    await main(root);
    const mobile = path.join(
      root,
      'apps',
      'client',
      'projects',
      'mobile',
      'public',
    );
    for (const [name, size] of [
      ['favicon-16x16.png', 16],
      ['favicon-32x32.png', 32],
      ['apple-touch-icon.png', 180],
      ['icon-192x192.png', 192],
      ['icon-512x512.png', 512],
    ]) {
      const metadata = await sharp(path.join(mobile, name)).metadata();
      assert.equal(metadata.width, size);
      assert.equal(metadata.height, size);
    }
    assert.equal(
      readFileSync(path.join(mobile, 'favicon.ico')).readUInt16LE(4),
      3,
    );
    const res = path.join(
      root,
      'apps',
      'client',
      'android',
      'app',
      'src',
      'main',
      'res',
    );
    mkdirSync(res, { recursive: true });
    await generateAndroidLauncherIcons(root);
    const launcher = path.join(res, 'mipmap-mdpi', 'ic_launcher.png');
    const { data, info } = await sharp(launcher)
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 48);
    assert.deepEqual([...data.subarray(0, 4)], [0x12, 0x2b, 0x4a, 255]);
    const rounded = await sharp(
      path.join(res, 'mipmap-mdpi', 'ic_launcher_round.png'),
    )
      .raw()
      .toBuffer();
    assert.equal(rounded[3], 0);
    assert.equal(
      (
        await sharp(
          path.join(res, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png'),
        ).metadata()
      ).width,
      432,
    );
    const values = path.join(res, 'values');
    mkdirSync(values);
    const background = path.join(values, 'ic_launcher_background.xml');
    writeFileSync(
      background,
      '<color name="ic_launcher_background">#ffffff</color>',
    );
    await generateAndroidLauncherIcons(root);
    assert.equal(
      readFileSync(background, 'utf8'),
      '<color name="ic_launcher_background">#122B4A</color>',
    );
    await generateAndroidLauncherIcons(root);
    assert.equal(
      readFileSync(background, 'utf8'),
      '<color name="ic_launcher_background">#122B4A</color>',
    );
  });

  test('Given le générateur CLI, When les entrées existent ou manquent, Then le succès et l’erreur sont annoncés sans effets à l’import', () => {
    const url = new URL('generate-brand-icons.mjs', import.meta.url).href;
    for (const present of [true, false]) {
      const code = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {fileURLToPath} from 'node:url';const exists=fs.existsSync;fs.existsSync=(p)=>${present}&&p.endsWith('kraak-symbol.png')&&exists(p);fs.writeFileSync=()=>{};syncBuiltinESMExports();process.argv[1]=fileURLToPath(${JSON.stringify(url)});await import(${JSON.stringify(url)});`;
      const result = spawnSync(
        process.execPath,
        ['--input-type=module', '-e', code],
        { encoding: 'utf8' },
      );
      assert.equal(result.status, present ? 0 : 1, result.stderr);
      assert.match(
        present ? result.stdout : result.stderr,
        present ? /succès/ : /Source manquante/,
      );
    }
    const imported = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(url)});`,
    ]);
    assert.equal(imported.status, 0);
  });
}

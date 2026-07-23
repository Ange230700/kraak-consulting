import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = process.cwd();
const scriptPath = path.join(
  repoRoot,
  'scripts',
  'github-project-awareness.sh',
);

function extractAnalyzerScript() {
  const script = readFileSync(scriptPath, 'utf8');
  const startMarker = 'cat > "$RAW_DIR/analyze-project.mjs" <<\'NODE\'\n';
  const endMarker = '\nNODE\n\nRAW_DIR="$RAW_DIR"';
  const start = script.indexOf(startMarker);
  const end = script.indexOf(endMarker, start);

  assert.notEqual(start, -1, 'Expected analyzer heredoc start marker.');
  assert.notEqual(end, -1, 'Expected analyzer heredoc end marker.');

  return script.slice(start + startMarker.length, end);
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function projectIssue(title, number, fields = {}, content = {}) {
  return {
    id: `ITEM_${number}`,
    content: {
      number,
      repository: 'Ange230700/kraak-consulting',
      state: 'OPEN',
      title,
      type: 'Issue',
      url: `https://github.com/Ange230700/kraak-consulting/issues/${number}`,
      ...content,
    },
    ...fields,
  };
}

test('Given the GitHub Project analyzer, When Phase 4 field policy is applied, Then required fields are category aware', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-project-awareness-'));
  const rawDirectory = path.join(root, 'raw');
  const deepDirectory = path.join(root, 'deep');
  const analyzerPath = path.join(rawDirectory, 'analyze-project.mjs');

  mkdirSync(rawDirectory, { recursive: true });
  mkdirSync(deepDirectory, { recursive: true });

  writeFileSync(analyzerPath, extractAnalyzerScript(), 'utf8');
  writeJson(path.join(rawDirectory, 'project.json'), {
    title: 'Fixture project',
    url: 'https://github.com/users/Ange230700/projects/6',
  });
  writeJson(path.join(rawDirectory, 'project-graphql.json'), {
    data: {
      user: {
        projectV2: {
          fields: {
            nodes: [
              { name: 'Status', dataType: 'SINGLE_SELECT' },
              { name: 'Priority', dataType: 'SINGLE_SELECT' },
              { name: 'Effort', dataType: 'NUMBER' },
              { name: 'Launch blocker', dataType: 'SINGLE_SELECT' },
              { name: 'Lane', dataType: 'SINGLE_SELECT' },
              { name: 'Surface', dataType: 'SINGLE_SELECT' },
              { name: 'Coupling', dataType: 'SINGLE_SELECT' },
              { name: 'Wave', dataType: 'SINGLE_SELECT' },
            ],
          },
          repositories: { nodes: [] },
          statusUpdates: { nodes: [] },
          views: { nodes: [] },
          workflows: { nodes: [] },
        },
      },
    },
  });
  writeJson(path.join(rawDirectory, 'fields-cli.json'), { fields: [] });
  writeJson(path.join(rawDirectory, 'repository-issues.json'), [
    {
      number: 3,
      state: 'OPEN',
      title: '[TASK][PAY-01] Tache courante sans estimation',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/3',
    },
    {
      number: 5,
      state: 'OPEN',
      title: '[TASK][LMS-01] Tache future non raffinee',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/5',
    },
    {
      number: 7,
      state: 'OPEN',
      title: '[TASK][QAT-01] Tache active stale',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/7',
    },
  ]);
  writeJson(path.join(rawDirectory, 'repository-prs.json'), []);
  writeJson(path.join(rawDirectory, 'repository-labels.json'), []);
  writeJson(path.join(rawDirectory, 'repository-milestones.json'), []);
  writeJson(path.join(deepDirectory, 'issue-details.json'), []);
  writeJson(path.join(deepDirectory, 'pr-details.json'), []);
  writeJson(path.join(rawDirectory, 'items.json'), {
    items: [
      projectIssue(
        '[TASK][OLD-01] Historique termine',
        1,
        {
          Status: 'Done',
        },
        { state: 'CLOSED' },
      ),
      projectIssue('[EPIC][PAY] Paiement en ligne', 2, {
        Status: 'Todo',
        Priority: 'high',
        Lane: 'Lane B - Platform & participant',
        Wave: 'Wave 6 - Monetisation',
      }),
      projectIssue('[TASK][PAY-01] Tache courante sans estimation', 3, {
        Status: 'Todo',
        Priority: 'high',
        Lane: 'Lane B - Platform & participant',
        Surface: 'api',
        Coupling: 'handoff',
        Wave: 'Wave 6 - Monetisation',
      }),
      projectIssue('[TASK][PAY-02] Tache en cours sans responsable', 4, {
        Status: 'In Progress',
        Priority: 'high',
        Lane: 'Lane B - Platform & participant',
        Surface: 'api',
        Coupling: 'handoff',
        Wave: 'Wave 6 - Monetisation',
        Effort: '3',
        'Launch blocker': 'No',
      }),
      projectIssue('[TASK][LMS-01] Tache future non raffinee', 5, {
        Status: 'Todo',
        Priority: 'medium',
        Lane: 'Lane B - Platform & participant',
        Surface: 'shared',
        Wave: 'Wave 7 - Apprentissage',
      }),
      projectIssue('[TASK][QAT-01] Tache active stale', 7, {
        Status: 'In Progress',
        Priority: 'high',
        Lane: 'Shared handoff',
        Surface: 'qa',
        Coupling: 'handoff',
        Wave: 'Wave 4 - Qualite',
        Effort: '3',
        'Launch blocker': 'No',
      }),
      {
        id: 'ITEM_PR_1',
        content: {
          number: 6,
          repository: 'Ange230700/kraak-consulting',
          state: 'OPEN',
          title: 'PR fixture',
          type: 'PullRequest',
          url: 'https://github.com/Ange230700/kraak-consulting/pull/6',
        },
        Status: 'In Progress',
      },
    ],
  });

  try {
    const result = spawnSync(process.execPath, [analyzerPath, 'analyze'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        CANONICAL_FILE: '',
        CURRENT_WAVE: 'Wave 6 - Monetisation',
        GENERIC: '0',
        OWNER_LOGIN: 'Ange230700',
        OUT_DIR: root,
        PROJECT_NUMBER: '6',
        RAW_DIR: rawDirectory,
        REPOSITORY: 'Ange230700/kraak-consulting',
        STALE_DAYS: '30',
        USE_CANONICAL: '0',
      },
      timeout: 30_000,
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const analysis = JSON.parse(
      readFileSync(path.join(root, 'analysis.json'), 'utf8'),
    );
    const missingByTitle = new Map(
      analysis.findings.missingFields.map((item) => [item.title, item.missing]),
    );

    assert.equal(
      missingByTitle.has('[TASK][OLD-01] Historique termine'),
      false,
    );
    assert.equal(missingByTitle.has('[EPIC][PAY] Paiement en ligne'), false);
    assert.equal(
      missingByTitle.has('[TASK][LMS-01] Tache future non raffinee'),
      false,
    );
    assert.deepEqual(
      missingByTitle.get('[TASK][PAY-01] Tache courante sans estimation'),
      ['Effort', 'Launch blocker'],
    );
    assert.deepEqual(
      missingByTitle.get('[TASK][PAY-02] Tache en cours sans responsable'),
      ['Assignee', 'Milestone'],
    );
    assert.equal(analysis.findings.pullRequestProjectItems.length, 1);

    const staleTitles = analysis.findings.staleOpenItems.map(
      (item) => item.title,
    );
    assert.deepEqual(staleTitles, [
      '[TASK][PAY-01] Tache courante sans estimation',
      '[TASK][QAT-01] Tache active stale',
    ]);

    const effortCompleteness = analysis.fieldCompleteness.find(
      (entry) => entry.field === 'Effort',
    );
    assert.equal(effortCompleteness.required, 3);
    assert.equal(effortCompleteness.missing, 1);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('Given a canonical CSV with stable issue keys, When Phase 9 comparison runs, Then only stable planning dimensions create drift', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-project-csv-'));
  const rawDirectory = path.join(root, 'raw');
  const deepDirectory = path.join(root, 'deep');
  const analyzerPath = path.join(rawDirectory, 'analyze-project.mjs');
  const canonicalFile = path.join(root, 'canonical.csv');
  const planningExportFile = path.join(root, 'current-export.csv');

  mkdirSync(rawDirectory, { recursive: true });
  mkdirSync(deepDirectory, { recursive: true });

  writeFileSync(analyzerPath, extractAnalyzerScript(), 'utf8');
  writeJson(path.join(rawDirectory, 'project.json'), {
    title: 'Fixture project',
    url: 'https://github.com/users/Ange230700/projects/6',
  });
  writeJson(path.join(rawDirectory, 'project-graphql.json'), {
    data: {
      user: {
        projectV2: {
          fields: {
            nodes: [
              { name: 'Status', dataType: 'SINGLE_SELECT' },
              { name: 'Priority', dataType: 'SINGLE_SELECT' },
              { name: 'Effort', dataType: 'NUMBER' },
              { name: 'Launch blocker', dataType: 'SINGLE_SELECT' },
              { name: 'Lane', dataType: 'SINGLE_SELECT' },
              { name: 'Surface', dataType: 'SINGLE_SELECT' },
              { name: 'Coupling', dataType: 'SINGLE_SELECT' },
              { name: 'Wave', dataType: 'SINGLE_SELECT' },
            ],
          },
          repositories: { nodes: [] },
          statusUpdates: { nodes: [] },
          views: { nodes: [] },
          workflows: { nodes: [] },
        },
      },
    },
  });
  writeJson(path.join(rawDirectory, 'fields-cli.json'), { fields: [] });
  writeJson(path.join(rawDirectory, 'repository-issues.json'), [
    {
      number: 42,
      state: 'CLOSED',
      title: '[TASK][WEB-01] Titre actuel sans accent',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/42',
    },
    {
      number: 43,
      state: 'OPEN',
      title: '[TASK][API-01] Numero seul',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/43',
    },
    {
      number: 45,
      state: 'OPEN',
      title: '[TASK][WEB-45] Resume client',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/45',
    },
    {
      number: 99,
      state: 'OPEN',
      title: '[TASK][OPS-99] Extra live item',
      updatedAt: '2026-01-01T00:00:00Z',
      url: 'https://github.com/Ange230700/kraak-consulting/issues/99',
    },
  ]);
  writeJson(path.join(rawDirectory, 'repository-prs.json'), []);
  writeJson(path.join(rawDirectory, 'repository-labels.json'), []);
  writeJson(path.join(rawDirectory, 'repository-milestones.json'), []);
  writeJson(path.join(deepDirectory, 'issue-details.json'), []);
  writeJson(path.join(deepDirectory, 'pr-details.json'), []);
  writeJson(path.join(rawDirectory, 'items.json'), {
    items: [
      projectIssue(
        '[TASK][WEB-01] Titre actuel sans accent',
        42,
        {
          Status: 'Done',
          Priority: 'critical',
          Lane: 'Lane A - Web public',
          Surface: 'web',
          Coupling: 'independent',
          Wave: 'Wave 3A - Site public',
          Effort: '3',
          'Launch blocker': 'No',
        },
        { state: 'CLOSED' },
      ),
      projectIssue('[TASK][API-01] Numero seul', 43, {
        Status: 'In Progress',
        Priority: 'high',
        Lane: 'Lane B - Platform & participant',
        Surface: 'api',
        Coupling: 'handoff',
        Wave: 'Wave 3B - Parcours participant',
        Effort: '2',
        'Launch blocker': 'No',
      }),
      projectIssue('[TASK][WEB-45] Resume client', 45, {
        Status: 'Todo',
        Priority: 'medium',
        Lane: 'Lane A - Web public',
        Surface: 'web',
        Coupling: 'independent',
        Wave: 'Wave 3A - Site public',
        Effort: '1',
      }),
      projectIssue('[TASK][OPS-99] Extra live item', 99, {
        Status: 'Todo',
        Priority: 'low',
        Lane: 'Shared handoff',
        Surface: 'ops',
        Coupling: 'handoff',
        Wave: 'Wave 5 - Release',
        Effort: '5',
      }),
    ],
  });
  writeFileSync(
    canonicalFile,
    [
      '"Issue Number","Issue URL","Title","Priority","Lane","Surface","Coupling","Wave","Effort","Status","Launch blocker","Assignee","Milestone"',
      '"42","https://github.com/Ange230700/kraak-consulting/issues/42","[TASK][WEB-01] Ancien titre accentué","P0","Lane A - Web public","web","independent","Wave 3A - Site public","M","Todo","Yes","personne","Ancien jalon"',
      '"43","","[TASK][API-01] Numero seul","P1","Lane B - Platform & participant","api","handoff","Wave 3B - Parcours participant","S","Done","Yes","",""',
      '"","","[TASK][WEB-45] Résumé client","P2","Lane A - Web public","web","independent","Wave 3A - Site public","XS","","","",""',
      '"999","","[TASK][MISS-01] Absente","P3","Shared handoff","ops","handoff","Wave 5 - Release","L","","","",""',
      '',
    ].join('\n'),
    'utf8',
  );

  try {
    const result = spawnSync(process.execPath, [analyzerPath, 'analyze'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        CANONICAL_FILE: canonicalFile,
        CURRENT_WAVE: 'Wave 3A - Site public',
        GENERIC: '0',
        OWNER_LOGIN: 'Ange230700',
        OUT_DIR: root,
        PLANNING_EXPORT_FILE: planningExportFile,
        PROJECT_NUMBER: '6',
        RAW_DIR: rawDirectory,
        REPOSITORY: 'Ange230700/kraak-consulting',
        STALE_DAYS: '30',
        USE_CANONICAL: '1',
      },
      timeout: 30_000,
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const analysis = JSON.parse(
      readFileSync(path.join(root, 'analysis.json'), 'utf8'),
    );
    const comparison = analysis.canonicalComparison;

    assert.equal(comparison.rowCount, 4);
    assert.equal(comparison.comparedRows, 3);
    assert.deepEqual(
      comparison.missingInProject.map((entry) => entry.title),
      ['[TASK][MISS-01] Absente'],
    );
    assert.deepEqual(
      comparison.extraInProject.map((entry) => entry.title),
      ['[TASK][OPS-99] Extra live item'],
    );
    assert.deepEqual(comparison.fieldMismatches, []);
    assert.deepEqual(
      comparison.fallbackMatches.map((entry) => entry.title),
      ['[TASK][WEB-45] Résumé client'],
    );

    const exportLines = readFileSync(planningExportFile, 'utf8')
      .trimEnd()
      .split('\n');
    assert.equal(
      exportLines[0],
      '"Issue Number","Issue URL","Title","Priority","Lane","Surface","Coupling","Wave","Effort"',
    );
    assert.match(
      exportLines[1],
      /^"42","https:\/\/github\.com\/Ange230700\/kraak-consulting\/issues\/42","\[TASK\]\[WEB-01\] Titre actuel sans accent"/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('Given repository labels and operational issue titles, When Phase 10 policy is analyzed, Then retired labels and only invalid titles are reported', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-project-labels-'));
  const rawDirectory = path.join(root, 'raw');
  const deepDirectory = path.join(root, 'deep');
  const analyzerPath = path.join(rawDirectory, 'analyze-project.mjs');

  mkdirSync(rawDirectory, { recursive: true });
  mkdirSync(deepDirectory, { recursive: true });

  writeFileSync(analyzerPath, extractAnalyzerScript(), 'utf8');
  writeJson(path.join(rawDirectory, 'project.json'), {
    title: 'Fixture project',
    url: 'https://github.com/users/Ange230700/projects/6',
  });
  writeJson(path.join(rawDirectory, 'project-graphql.json'), {
    data: {
      user: {
        projectV2: {
          fields: {
            nodes: [
              { name: 'Status', dataType: 'SINGLE_SELECT' },
              { name: 'Priority', dataType: 'SINGLE_SELECT' },
              { name: 'Effort', dataType: 'NUMBER' },
              { name: 'Launch blocker', dataType: 'SINGLE_SELECT' },
              { name: 'Lane', dataType: 'SINGLE_SELECT' },
              { name: 'Surface', dataType: 'SINGLE_SELECT' },
              { name: 'Coupling', dataType: 'SINGLE_SELECT' },
              { name: 'Wave', dataType: 'SINGLE_SELECT' },
            ],
          },
          repositories: { nodes: [] },
          statusUpdates: { nodes: [] },
          views: { nodes: [] },
          workflows: { nodes: [] },
        },
      },
    },
  });
  writeJson(path.join(rawDirectory, 'fields-cli.json'), { fields: [] });
  writeJson(path.join(rawDirectory, 'repository-issues.json'), []);
  writeJson(path.join(rawDirectory, 'repository-prs.json'), []);
  writeJson(path.join(rawDirectory, 'repository-labels.json'), [
    { name: 'epic: SET' },
    { name: 'epic:SET' },
    { name: 'priority: P0' },
    { name: 'priority:P0' },
    { name: 'status: done' },
    { name: 'status:done' },
    { name: 'type: task' },
    { name: 'documentation' },
  ]);
  writeJson(path.join(rawDirectory, 'repository-milestones.json'), []);
  writeJson(path.join(deepDirectory, 'issue-details.json'), []);
  writeJson(path.join(deepDirectory, 'pr-details.json'), []);
  writeJson(path.join(rawDirectory, 'items.json'), {
    items: [
      projectIssue('[OPS] Relancer le pipeline Render', 608, {
        Status: 'Todo',
        Priority: 'high',
        Lane: 'Shared handoff',
        Surface: 'ops',
        Coupling: 'handoff',
        Wave: 'Wave 5 - Release',
      }),
      projectIssue('[DOCS] Clarifier le runbook release', 618, {
        Status: 'Todo',
        Priority: 'medium',
        Lane: 'Shared handoff',
        Surface: 'docs',
        Coupling: 'independent',
        Wave: 'Wave 5 - Release',
      }),
      projectIssue(
        '[ALERT][DEP-05][production] Alerte observabilite active',
        619,
        {
          Status: 'Todo',
          Priority: 'critical',
          Lane: 'Shared handoff',
          Surface: 'ops',
          Coupling: 'handoff',
          Wave: 'Wave 5 - Release',
        },
      ),
      projectIssue('Titre legacy sans prefixe', 620, {
        Status: 'Todo',
        Priority: 'low',
        Lane: 'Shared handoff',
        Surface: 'ops',
        Coupling: 'handoff',
        Wave: 'Wave 5 - Release',
      }),
    ],
  });

  try {
    const result = spawnSync(process.execPath, [analyzerPath, 'analyze'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        CANONICAL_FILE: '',
        CURRENT_WAVE: 'Wave 5 - Release',
        GENERIC: '0',
        OWNER_LOGIN: 'Ange230700',
        OUT_DIR: root,
        PROJECT_NUMBER: '6',
        RAW_DIR: rawDirectory,
        REPOSITORY: 'Ange230700/kraak-consulting',
        STALE_DAYS: '30',
        USE_CANONICAL: '0',
      },
      timeout: 30_000,
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const analysis = JSON.parse(
      readFileSync(path.join(root, 'analysis.json'), 'utf8'),
    );

    assert.deepEqual(
      analysis.findings.nonCanonicalTitles.map((item) => item.title),
      ['Titre legacy sans prefixe'],
    );
    assert.deepEqual(
      analysis.findings.retiredLabels.map((label) => label.name),
      ['priority: P0', 'priority:P0', 'status: done', 'status:done'],
    );
    assert.deepEqual(analysis.findings.labelFormatDrift, [
      {
        canonical: 'epic: SET',
        labels: ['epic: SET', 'epic:SET'],
      },
      {
        canonical: 'priority: P0',
        labels: ['priority: P0', 'priority:P0'],
      },
      {
        canonical: 'status: done',
        labels: ['status: done', 'status:done'],
      },
    ]);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('Given repository issue templates, When default labels are reviewed, Then status and priority labels are not assigned', () => {
  const templateDirectory = path.join(repoRoot, '.github', 'ISSUE_TEMPLATE');
  const templateFiles = ['bug_report.md', 'content_task.md', 'design_task.md'];

  for (const templateFile of templateFiles) {
    const template = readFileSync(
      path.join(templateDirectory, templateFile),
      'utf8',
    );

    assert.doesNotMatch(template, /['"]?status\s*:/i, templateFile);
    assert.doesNotMatch(template, /['"]?priority\s*:/i, templateFile);
  }
});

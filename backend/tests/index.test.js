const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const {
  buildDirectReport,
  createApp,
  needsFallback,
  shellEscape,
} = require('../index');

async function startServer(app) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

function makeTempDirs() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'analyst-backend-'));
  return {
    root,
    inputsDir: path.join(root, 'inputs'),
    resultsDir: path.join(root, 'results'),
  };
}

test('utility helpers detect fallback content and escape shell strings', async () => {
  assert.equal(needsFallback('An error occurred: timeout'), true);
  assert.equal(needsFallback('Clean response'), false);
  assert.equal(shellEscape('hello "quoted" value'), '"hello \\"quoted\\" value"');

  const report = await buildDirectReport({
    pythonExec: 'python',
    tempFilePath: 'context.json',
    reason: 'No retrieval context',
    execCommandImpl: async () => ({ stdout: 'Summary\nKey Findings' }),
  });

  assert.match(report, /Fallback notice: No retrieval context/);
  assert.match(report, /Summary/);
});

test('basic routes respond and results endpoints work', async () => {
  const dirs = makeTempDirs();
  const app = createApp({
    inputsDir: dirs.inputsDir,
    resultsDir: dirs.resultsDir,
    useRagPrimary: false,
    searchPackageEventsImpl: async () => [],
    execCommandImpl: async () => ({ stdout: 'Summary\nKey Findings\nRecommended Actions' }),
  });
  const server = await startServer(app);

  try {
    const home = await fetch(`${server.baseUrl}/`);
    assert.equal(home.status, 200);
    assert.equal(await home.text(), 'Hello World!');

    const health = await fetch(`${server.baseUrl}/api/test`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { message: 'Hello from the backend!' });

    const analyze = await fetch(`${server.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        misp_output: null,
        original_input: { package_id: 'pkg-1', events: [{ id: 'evt-1' }] },
      }),
    });

    assert.equal(analyze.status, 200);
    const analyzePayload = await analyze.json();
    assert.equal(analyzePayload.saved, true);
    assert.equal(analyzePayload.used_fallback, true);
    assert.match(analyzePayload.content, /Fallback notice:/);

    const results = await fetch(`${server.baseUrl}/results`);
    assert.equal(results.status, 200);
    const resultsPayload = await results.json();
    assert.equal(resultsPayload.length, 1);
    assert.equal(resultsPayload[0].id, analyzePayload.id);

    const result = await fetch(`${server.baseUrl}/results/${analyzePayload.id}`);
    assert.equal(result.status, 200);
    const resultPayload = await result.json();
    assert.equal(resultPayload.id, analyzePayload.id);
    assert.match(resultPayload.content, /Recommended Actions/);

    const missing = await fetch(`${server.baseUrl}/results/does-not-exist`);
    assert.equal(missing.status, 404);
  } finally {
    await server.close();
    fs.rmSync(dirs.root, { recursive: true, force: true });
  }
});

test('analyze surfaces elasticsearch warnings and still returns a report', async () => {
  const dirs = makeTempDirs();
  const app = createApp({
    inputsDir: dirs.inputsDir,
    resultsDir: dirs.resultsDir,
    useRagPrimary: false,
    searchPackageEventsImpl: async () => {
      throw new Error('elastic unavailable');
    },
    execCommandImpl: async () => ({ stdout: 'Summary only' }),
  });
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        misp_output: null,
        original_input: { package_id: 'pkg-2' },
      }),
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.elastic_warning, 'elastic unavailable');
    assert.equal(payload.used_fallback, true);
    assert.match(payload.content, /Summary only/);
  } finally {
    await server.close();
    fs.rmSync(dirs.root, { recursive: true, force: true });
  }
});

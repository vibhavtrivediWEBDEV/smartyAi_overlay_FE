const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Opt-in integration check using a disposable PM2 daemon, with no network listener.
// Never connects to or changes the production PM2 daemon.
test('real PM2 changes npm working directory and restores the previous configuration', {
  skip: process.env.RUN_PM2_SMOKE !== '1', timeout: 90000
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'smarty-pm2-smoke-'));
  const env = { ...process.env, PM2_HOME: path.join(root, 'pm2'), PM2_SILENT: 'true' };
  const npm = execFileSync('which', ['npm'], { encoding: 'utf8' }).trim();
  const pm2 = (...args) => execFileSync('pm2', args, { env, encoding: 'utf8', timeout: 20000 });
  function config(label) {
    const cwd = path.join(root, label);
    fs.mkdirSync(cwd);
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ scripts: { start: 'node worker.cjs' } }));
    fs.writeFileSync(path.join(cwd, 'worker.cjs'), "require('node:fs').writeFileSync('ready', process.cwd()); setInterval(() => {}, 1000);\n");
    const file = path.join(root, `${label}.config.json`);
    fs.writeFileSync(file, JSON.stringify({ apps: [{ name: 'smarty-release-smoke', script: npm,
      args: ['start'], cwd, interpreter: process.execPath, exec_mode: 'fork', instances: 1 }] }));
    return { file, cwd };
  }
  function ready(cwd) {
    const file = path.join(cwd, 'ready');
    return new Promise((resolve, reject) => {
      const watcher = fs.watch(cwd, check);
      const timer = setTimeout(() => { watcher.close(); reject(new Error('Worker did not become ready')); }, 15000);
      function check() {
        if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === cwd) {
          clearTimeout(timer); watcher.close(); resolve();
        }
      }
      check();
    });
  }
  const old = config('old');
  const candidate = config('candidate');
  try {
    for (const release of [old, candidate, old]) {
      fs.rmSync(path.join(release.cwd, 'ready'), { force: true });
      if (JSON.parse(pm2('jlist')).some(p => p.name === 'smarty-release-smoke')) {
        pm2('delete', 'smarty-release-smoke');
      }
      pm2('start', release.file, '--update-env');
      try {
        await ready(release.cwd);
      } catch (error) {
        const app = JSON.parse(pm2('jlist')).find(p => p.name === 'smarty-release-smoke');
        console.error({ expectedCwd: release.cwd, actualCwd: app?.pm2_env.pm_cwd, status: app?.pm2_env.status });
        console.error(pm2('logs', 'smarty-release-smoke', '--nostream', '--lines', '15'));
        throw error;
      }
      const app = JSON.parse(pm2('jlist')).find(p => p.name === 'smarty-release-smoke');
      assert.equal(app.pm2_env.pm_cwd, release.cwd);
      assert.equal(app.pm2_env.status, 'online');
    }
  } finally {
    try { pm2('kill'); } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});

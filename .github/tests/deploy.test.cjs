const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Exercise the actual remote Bash from the workflow with real Git repositories.
// npm, PM2, curl, and flock are isolated fakes; no production services are touched.
const workflow = fs.readFileSync(path.join(__dirname, '../workflows/deploy.yml'), 'utf8');
const remote = workflow.match(/<<'REMOTE'\n([\s\S]*?)^          REMOTE$/m)[1]
  .split('\n').map(line => line.replace(/^          /, '')).join('\n');

function fixture(t, failure = '') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'smarty-deploy-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const source = path.join(root, 'source');
  const live = path.join(home, 'smartyAi_overlay_FE');
  const bin = path.join(root, 'bin');
  const upload = path.join(root, 'upload');
  for (const dir of [home, source, bin, upload, path.join(home, '.nvm')]) fs.mkdirSync(dir, { recursive: true });
  function write(file, text) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
  const env = { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}`,
    MOCK_ROOT: root, MOCK_FAILURE: failure, MOCK_LIVE: live,
    GIT_AUTHOR_NAME: 'Deployment Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
    GIT_COMMITTER_NAME: 'Deployment Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };
  function git(cwd, ...args) {
    const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  git(source, 'init', '-b', 'main');
  write(path.join(source, '.gitignore'), '.env\n.next/\nnode_modules/\n');
  write(path.join(source, 'version.txt'), 'old');
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'Working release');
  git(root, 'clone', source, live);
  const oldSha = git(live, 'rev-parse', 'HEAD');
  write(path.join(live, '.env'), 'ENV_SENTINEL=keep-private\n');
  write(path.join(live, '.next/BUILD_ID'), 'old-build');
  write(path.join(live, 'node_modules/sentinel'), 'old-dependencies');
  write(path.join(source, 'version.txt'), 'new');
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'Candidate release');
  const sha = git(source, 'rev-parse', 'HEAD');
  git(source, 'bundle', 'create', path.join(upload, 'source.bundle'), 'HEAD');
  write(path.join(home, '.nvm/nvm.sh'), ':\n');
  function executable(name, text) {
    const file = path.join(bin, name);
    write(file, text);
    fs.chmodSync(file, 0o755);
  }
  executable('flock', '#!/bin/sh\nexit 0\n');
  executable('npm', `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const stage = process.argv[2] === 'ci' ? 'install' : 'build';
fs.appendFileSync(path.join(process.env.MOCK_ROOT, 'events'), stage + '\\n');
fs.mkdirSync(stage === 'install' ? 'node_modules' : '.next', {recursive:true});
fs.writeFileSync(stage === 'install' ? 'node_modules/sentinel' : '.next/BUILD_ID', 'candidate');
if (process.env.MOCK_FAILURE === stage) process.exit(1);
`);
  executable('pm2', `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(process.env.MOCK_ROOT, 'state.json');
const app = JSON.parse(fs.readFileSync(file));
const command = process.argv[2];
if (command === 'jlist') { console.log(JSON.stringify([app])); process.exit(0); }
if (command === 'describe') process.exit(0);
fs.appendFileSync(path.join(process.env.MOCK_ROOT, 'events'), command + '\\n');
if (command === 'start') {
  const config = JSON.parse(fs.readFileSync(process.argv[3])).apps[0];
  app.pm2_env.pm_cwd = config.cwd;
  app.pm2_env.env = config.env;
  app.pid += 1;
  fs.writeFileSync(file, JSON.stringify(app));
  if (process.env.MOCK_FAILURE === 'activation' && config.cwd !== process.env.MOCK_LIVE) process.exit(1);
}
if (command === 'save' && process.env.MOCK_FAILURE === 'save' && app.pm2_env.pm_cwd !== process.env.MOCK_LIVE) process.exit(1);
`);
  executable('curl', `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const app = JSON.parse(fs.readFileSync(path.join(process.env.MOCK_ROOT, 'state.json')));
if (process.env.MOCK_FAILURE === 'health' && app.pm2_env.pm_cwd !== process.env.MOCK_LIVE) process.exit(22);
`);
  const initial = { name: 'smarty-frontend', pid: 100, pm2_env: {
    status: 'online', pm_cwd: live, pm_exec_path: path.join(bin, 'npm'), args: ['start'],
    exec_interpreter: process.execPath, env: { PORT: '3000', PRESERVE_ENV: 'yes' }
  }};
  write(path.join(root, 'state.json'), JSON.stringify(initial));
  const state = () => JSON.parse(fs.readFileSync(path.join(root, 'state.json')));
  const events = () => fs.existsSync(path.join(root, 'events')) ? fs.readFileSync(path.join(root, 'events'), 'utf8') : '';
  function unchangedLive() {
    assert.equal(git(live, 'rev-parse', 'HEAD'), oldSha);
    assert.equal(fs.readFileSync(path.join(live, '.next/BUILD_ID'), 'utf8'), 'old-build');
    assert.equal(fs.readFileSync(path.join(live, 'node_modules/sentinel'), 'utf8'), 'old-dependencies');
    assert.equal(fs.readFileSync(path.join(live, 'version.txt'), 'utf8'), 'old');
  }
  function run() {
    return spawnSync('bash', ['-s', '--', upload, sha], { env, input: remote, encoding: 'utf8' });
  }
  return { root, home, live, upload, source, sha, oldSha, git, run, state, events, unchangedLive };
}

for (const failure of ['install', 'build']) {
  test(`${failure} failure keeps old build, dependencies, Git HEAD, and running process`, t => {
    const f = fixture(t, failure);
    const result = f.run();
    assert.notEqual(result.status, 0);
    f.unchangedLive();
    assert.equal(f.state().pid, 100);
    assert.equal(f.state().pm2_env.pm_cwd, f.live);
    assert.doesNotMatch(f.events(), /delete|start|save/);
    assert.deepEqual(fs.readdirSync(path.join(f.home, '.smarty-frontend/releases')), []);
    assert.match(result.stderr, /previous build retained/);
  });
}

for (const failure of ['activation', 'health', 'save']) {
  test(`${failure} failure restores the previous PM2 release and reports failure`, t => {
    const f = fixture(t, failure);
    const result = f.run();
    assert.notEqual(result.status, 0);
    f.unchangedLive();
    assert.equal(f.state().pm2_env.pm_cwd, f.live);
    assert.equal(f.state().pm2_env.env.PRESERVE_ENV, 'yes');
    assert.equal(f.events().match(/start/g).length, 2);
    assert.match(result.stderr, /Previous release restored successfully/);
    assert.deepEqual(fs.readdirSync(path.join(f.home, '.smarty-frontend/releases')), []);
  });
}

test('success switches only after build, retains old release, and records exact commit', t => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  f.unchangedLive();
  const current = f.state().pm2_env.pm_cwd;
  assert.notEqual(current, f.live);
  assert.equal(fs.readFileSync(path.join(current, 'version.txt'), 'utf8'), 'new');
  assert.equal(fs.readFileSync(path.join(current, '.env'), 'utf8'), 'ENV_SENTINEL=keep-private\n');
  assert.equal(fs.statSync(path.join(current, '.env')).mode & 0o777, 0o600);
  assert.equal(f.git(f.live, 'rev-parse', 'refs/deployments/frontend'), f.sha);
  assert.equal(f.events(), 'install\nbuild\ndelete\nstart\nsave\n');
  assert.equal(fs.existsSync(f.upload), false);
});

test('a later failed build leaves a previously deployed release running', t => {
  const f = fixture(t);
  assert.equal(f.run().status, 0);
  const first = f.state();
  fs.mkdirSync(f.upload);
  f.git(f.source, 'bundle', 'create', path.join(f.upload, 'source.bundle'), 'HEAD');
  // Force compilation to fail on a subsequent attempt, after one successful release.
  const command = fs.readFileSync(path.join(f.root, 'bin/npm'), 'utf8');
  fs.writeFileSync(path.join(f.root, 'bin/npm'), command.replace("process.env.MOCK_FAILURE === stage", "stage === 'build'"));
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.deepEqual(f.state(), first);
  assert.equal(fs.readFileSync(path.join(first.pm2_env.pm_cwd, '.next/BUILD_ID'), 'utf8'), 'candidate');
  assert.equal(fs.readdirSync(path.join(f.home, '.smarty-frontend/releases')).length, 1);
  f.unchangedLive();
});

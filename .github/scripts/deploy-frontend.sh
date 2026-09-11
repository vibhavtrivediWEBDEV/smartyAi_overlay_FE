#!/usr/bin/env bash
set -eo pipefail
umask 077
upload_dir="$1"
release_sha="$2"
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]]
source_dir="$HOME/smartyAi_overlay_FE"
release_root="$HOME/.smarty-frontend/releases"
release_dir=''
switching=0
committed=0
activate() {
  # PM2 reload retains the old cwd: recreate only this named frontend app.
  if pm2 describe smarty-frontend >/dev/null 2>&1; then
    pm2 delete smarty-frontend || return 1
  fi
  pm2 start "$1" --update-env
}
healthy() {
  curl --fail --silent --show-error --retry 8 --retry-delay 1 \
    --retry-connrefused --connect-timeout 3 --max-time 10 \
    --output /dev/null http://127.0.0.1:3000/login
}
cleanup() {
  exit_code=$?
  trap - EXIT
  if [[ "$switching" = 1 && "$committed" = 0 ]]; then
    printf 'Activation failed; restoring the previous working release.\n' >&2
    if activate "$upload_dir/previous.config.json" && healthy && pm2 save; then
      printf 'Previous release restored successfully.\n' >&2
      switching=0
    else
      printf 'CRITICAL: automatic restoration failed; manual intervention required. Recovery configs retained in %s\n' "$upload_dir" >&2
    fi
  fi
  if [[ "$committed" = 0 && "$switching" = 0 && -n "$release_dir" ]]; then
    rm -rf -- "$release_dir"
    printf 'Candidate discarded; previous build retained.\n' >&2
  fi
  if [[ "$committed" = 1 || "$switching" = 0 ]]; then
    rm -rf -- "$upload_dir"
  fi
  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP
exec 9>"$HOME/.smarty-deploy.lock"
flock -w 1200 9
cd "$source_dir"
test -f .env
test "$(git branch --show-current)" = main
if test -n "$(git status --porcelain --untracked-files=no)"; then
  printf 'Deployment stopped: tracked files have local changes.\n' >&2
  exit 1
fi
git bundle verify "$upload_dir/source.bundle"
git fetch --no-tags "$upload_dir/source.bundle" HEAD
test "$(git rev-parse FETCH_HEAD)" = "$release_sha"
deployed_sha=$(git rev-parse --verify refs/deployments/frontend 2>/dev/null || git rev-parse HEAD)
git merge-base --is-ancestor "$deployed_sha" "$release_sha"
if git ls-tree --name-only "$release_sha" -- .env | grep -q .; then
  printf 'Deployment stopped: production .env must remain untracked.\n' >&2
  exit 1
fi
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
mkdir -p "$release_root"
release_dir=$(mktemp -d "$release_root/$release_sha.XXXXXXXX")
# Never merge into or build inside the currently running checkout.
git archive "$release_sha" | tar -x -C "$release_dir"
# Snapshot only this app's PM2 configuration, not other applications.
pm2 jlist | node -e '
  const fs = require("node:fs");
  let input = "";
  process.stdin.on("data", chunk => input += chunk);
  process.stdin.on("end", () => {
    const app = JSON.parse(input).find(p => p.name === "smarty-frontend");
    if (!app || app.pm2_env.status !== "online") throw new Error("Previous frontend must be online");
    const p = app.pm2_env;
    const previous = {
      name: app.name, script: p.pm_exec_path, args: p.args,
      cwd: p.pm_cwd, interpreter: p.exec_interpreter,
      exec_mode: "fork", instances: 1, env: p.env || {}
    };
    const candidate = {...previous, cwd: process.argv[2],
      env: {...previous.env, NODE_ENV: "production", PORT: "3000"}};
    for (const [name, config] of [["previous", previous], ["candidate", candidate]]) {
      fs.writeFileSync(`${process.argv[1]}/${name}.config.json`,
        JSON.stringify({apps: [config]}), {mode: 0o600});
    }
  });
' "$upload_dir" "$release_dir"
cd "$release_dir"
printf 'Running isolated deployment-safety tests on EC2\n'
node --test .github/tests/deploy.test.cjs
# Next.js needs the public production configuration at build time, but tests do not.
cp "$source_dir/.env" "$release_dir/.env"
chmod 600 "$release_dir/.env"
printf 'Installing and building isolated candidate %s on EC2\n' "$release_sha"
npm ci --include=dev --no-audit --no-fund
npm run build
test -s .next/BUILD_ID
printf 'Build passed; switching frontend to the candidate release.\n'
switching=1
activate "$upload_dir/candidate.config.json"
healthy
pm2 save
# Record success only after activation; original checkout stays intact for fallback.
git -C "$source_dir" update-ref refs/deployments/frontend "$release_sha"
committed=1
printf 'Deployed frontend commit %s; previous release retained.\n' "$release_sha"

import { readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { comparison, releaseNeeded } from './policy.mjs';
import { lastPublished } from './github.mjs';

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const name = process.env.GITHUB_EVENT_NAME;
const head = process.env.GITHUB_SHA;
let changed = true;
let production = false;
if (name === 'pull_request') {
  const base = execFileSync('git', ['merge-base', event.pull_request.base.sha, event.pull_request.head.sha], {
    encoding: 'utf8',
  }).trim();
  changed = comparison(base, event.pull_request.head.sha);
} else if (name === 'merge_group') {
  changed = comparison(event.merge_group.base_sha, event.merge_group.head_sha);
} else if (['push', 'workflow_dispatch'].includes(name)) {
  production = process.env.GITHUB_REF === 'refs/heads/main';
  if (!production) throw new Error('Production dispatch must target main');
  const baseline = await lastPublished();
  const pending = comparison(baseline, head);
  changed = name === 'push' ? releaseNeeded(comparison(event.before, head), pending) : pending;
}
appendFileSync(process.env.GITHUB_OUTPUT, `site_changed=${changed}\nproduction=${production}\nsha=${head}\n`);
console.log(JSON.stringify({ site_changed: changed, production, sha: head }));

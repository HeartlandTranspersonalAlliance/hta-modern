import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { siteChanged, comparison, gatePasses, releaseNeeded, mayPublish, publishedJob } from './policy.mjs';
import { lastPublished } from './github.mjs';

test('only exact non-site documentation is excluded', () => {
  assert.equal(siteChanged(['README.md', 'docs/ci.md']), false);
  for (const path of [
    'src/pages/privacy.md',
    'src/content/post/new.mdx',
    'package-lock.json',
    'astro.config.ts',
    '.github/workflows/actions.yaml',
    'tests/e2e/site.test.ts',
    'docs/unknown.md',
    'public/example.md',
    'AGENTS.md',
  ]) {
    assert.equal(siteChanged([path]), true, path);
    assert.equal(siteChanged(['README.md', path]), true);
  }
});

test('real git comparisons include renamed and deleted paths', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hta-policy-'));
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = () => {
    git('add', '-A');
    git('commit', '-qm', 'fixture');
    return git('rev-parse', 'HEAD');
  };
  try {
    git('init');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'user.name', 'CI fixture');
    writeFileSync(join(cwd, 'README.md'), 'first');
    const first = commit();
    writeFileSync(join(cwd, 'README.md'), 'second');
    const docs = commit();
    assert.equal(comparison(first, docs, cwd), false);
    renameSync(join(cwd, 'README.md'), join(cwd, 'page.mdx'));
    const renamed = commit();
    assert.equal(comparison(docs, renamed, cwd), true);
    renameSync(join(cwd, 'page.mdx'), join(cwd, 'README.md'));
    const reverse = commit();
    assert.equal(comparison(renamed, reverse, cwd), true);
    writeFileSync(join(cwd, 'site file\nwith newline.astro'), 'fixture');
    const added = commit();
    rmSync(join(cwd, 'site file\nwith newline.astro'));
    const removed = commit();
    assert.equal(comparison(added, removed, cwd), true);
    writeFileSync(join(cwd, 'README.md'), 'docs after site change');
    const followingDocs = commit();
    assert.equal(comparison(removed, followingDocs, cwd), false);
    assert.equal(releaseNeeded(comparison(removed, followingDocs, cwd), comparison(added, followingDocs, cwd)), true);
    assert.equal(comparison(undefined, removed, cwd), true);
    assert.equal(comparison('0'.repeat(40), removed, cwd), true);
    assert.equal(comparison('a'.repeat(40), removed, cwd), true);
    assert.throws(() => comparison(first, 'not-a-sha', cwd));
    assert.throws(() => comparison(first, 'b'.repeat(40), cwd));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('gate rejects errors, cancellations, missing outputs and unexpected skips', () => {
  assert.equal(gatePasses('success', 'false', 'skipped'), true);
  assert.equal(gatePasses('success', 'true', 'success'), true);
  for (const state of ['failure', 'cancelled', 'skipped', undefined]) {
    assert.equal(gatePasses(state, 'false', 'skipped'), false);
    assert.equal(gatePasses('success', 'true', state), false);
  }
  assert.equal(gatePasses('success', undefined, 'skipped'), false);
  assert.equal(gatePasses('success', 'false', 'success'), false);
});

test('README push retains pending site work and stale releases cannot publish', () => {
  assert.equal(releaseNeeded(false, false), false);
  assert.equal(releaseNeeded(false, true), true);
  assert.equal(releaseNeeded(true, false), true);
  assert.equal(mayPublish('old', 'new', 'baseline'), false);
  assert.equal(mayPublish('new', 'new', 'old'), true);
  assert.equal(mayPublish('new', 'new', 'new'), false);
});

test('only actual successful publishing advances baseline, including legacy workflow', async () => {
  const run = (id, name = 'Website CI') => ({ id, name, head_branch: 'main', event: 'push', head_sha: String(id) });
  const job = (name, conclusion, completed_at) => ({
    conclusion: 'success',
    completed_at,
    steps: [{ name, conclusion }],
  });
  assert.equal(publishedJob([job('Publish Pages', 'skipped', '')]), undefined);
  const request = async (path) => {
    if (path.startsWith('actions/runs?')) return { workflow_runs: [run(3), run(2), run(1, 'Deploy GitHub Pages')] };
    if (path.includes('/3/')) return { jobs: [job('Publish Pages', 'skipped', '2026-03-03')] };
    if (path.includes('/2/')) return { jobs: [job('Publish Pages', 'success', '2026-03-02')] };
    return { jobs: [job('Deploy', 'success', '2026-03-01')] };
  };
  assert.equal(await lastPublished(request), '2');
  assert.equal(await lastPublished(async () => ({ workflow_runs: [] })), undefined);
  await assert.rejects(
    lastPublished(async () => {
      throw new Error('API unavailable');
    })
  );
});

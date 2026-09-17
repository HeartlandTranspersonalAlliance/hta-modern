import { execFileSync } from 'node:child_process';

export const documentation = new Set([
  'README.md',
  'LICENSE.md',
  'MIGRATION_NOTES.md',
  'docs/audits/asset-audit.md',
  'docs/audits/contrast-audit.md',
  'docs/ci.md',
]);
export const siteChanged = (paths) => paths.some((path) => !documentation.has(path));

export function changedPaths(base, head, cwd = process.cwd()) {
  // --no-renames represents a rename as deletion + addition, preserving BOTH paths.
  const output = execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', base, head, '--'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return output.toString('utf8').split('\0').filter(Boolean);
}
export function comparison(base, head, cwd = process.cwd()) {
  if (!base || /^0+$/.test(base)) return true;
  if (!/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(head)) throw new Error('Invalid comparison SHA');
  // Unknown history is conservative; a failed diff is an error, never documentation-only.
  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { cwd, stdio: 'pipe' });
  } catch {
    return true;
  }
  return siteChanged(changedPaths(base, head, cwd));
}
export function gatePasses(detection, changed, validation) {
  return (
    detection === 'success' &&
    ((changed === 'false' && validation === 'skipped') || (changed === 'true' && validation === 'success'))
  );
}
export const releaseNeeded = (eventChanged, pendingChanged) => eventChanged || pendingChanged;
export const mayPublish = (sha, currentHead, deployedSha) => sha === currentHead && sha !== deployedSha;
export function publishedJob(jobs) {
  return jobs.find(
    (job) =>
      job.conclusion === 'success' &&
      job.steps?.some((step) => ['Publish Pages', 'Deploy'].includes(step.name) && step.conclusion === 'success')
  );
}

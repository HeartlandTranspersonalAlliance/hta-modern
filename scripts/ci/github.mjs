import { publishedJob } from './policy.mjs';

export async function api(path) {
  const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`);
  return response.json();
}

export async function lastPublished(request = api) {
  // Inspect the actual publishing step: a green docs-only or stale run did not deploy.
  // Bounded history lookup. No evidence in the window means full validation, not a skip.
  let latest;
  for (let page = 1; page <= 5; page++) {
    const { workflow_runs: runs } = await request(`actions/runs?branch=main&status=success&per_page=100&page=${page}`);
    for (const run of runs) {
      if (
        !['Website CI', 'Deploy GitHub Pages'].includes(run.name) ||
        run.head_branch !== 'main' ||
        !['push', 'workflow_dispatch'].includes(run.event)
      )
        continue;
      const { jobs } = await request(`actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
      const job = publishedJob(jobs);
      if (job && (!latest || job.completed_at > latest.completedAt))
        latest = { sha: run.head_sha, completedAt: job.completed_at };
    }
    // Run order is creation order, not deployment order; compare completion timestamps.
    if (runs.length < 100) break;
  }
  return latest?.sha;
}

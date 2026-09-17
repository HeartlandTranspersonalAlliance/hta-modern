import { appendFileSync } from 'node:fs';
import { api, lastPublished } from './github.mjs';
import { mayPublish } from './policy.mjs';
const deployed = await lastPublished();
const { object } = await api('git/ref/heads/main');
const publish = mayPublish(process.env.GITHUB_SHA, object.sha, deployed);
appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
console.log(publish ? 'Current validated main commit may publish' : 'Superseded or already published; not deploying');

import { gatePasses } from './policy.mjs';
if (!gatePasses(process.env.DETECTION_RESULT, process.env.SITE_CHANGED, process.env.VALIDATION_RESULT)) {
  throw new Error(
    `Website gate failed: detection=${process.env.DETECTION_RESULT}, changed=${process.env.SITE_CHANGED}, validation=${process.env.VALIDATION_RESULT}`
  );
}
console.log('Website gate passed');

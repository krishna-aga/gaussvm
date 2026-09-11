import { execFileSync } from 'node:child_process';

export default function setup() {
  // Playwright starts/reuses the local server first. Always provision a fresh market
  // because the lifecycle scenario deliberately resolves its market.
  execFileSync(process.execPath,['scripts/deploy.mjs'],{stdio:'inherit'});
}

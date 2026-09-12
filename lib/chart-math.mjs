import { cdf, pdf, quote } from './reference.mjs';

/** Implied probability, not a prediction or a YES/NO exchange ratio. */
export function positionProbability(deployment, snapshot) {
  if (!deployment || !snapshot || !snapshot.active || snapshot.status !== 0) return undefined;
  if (snapshot.timestamp < deployment.start || snapshot.timestamp + 60 >= deployment.expiry) return undefined;
  const scale = Number(deployment.liquidity) / 1e18 * (deployment.timeScaled
    ? Math.sqrt((deployment.expiry - snapshot.timestamp) / (deployment.expiry - deployment.start)) : 1);
  if (!Number.isFinite(scale) || scale < 1 || snapshot.reserveYes <= 0n || snapshot.reserveNo <= 0n) return undefined;
  const z = Number(snapshot.reserveNo - snapshot.reserveYes) / 1e18 / scale;
  return Number.isFinite(z) && Math.abs(z) <= 3 ? cdf(z) : undefined;
}

export const EXAMPLE_LIQUIDITY = 1000 / pdf(0);
export const exampleStart = () => ({ yes: 1000, no: 1000, liquidity: EXAMPLE_LIQUIDITY });

/** Ideal, zero-fee research example; never used to produce an executable quote. */
export function exampleTrade(position, side, input) {
  if (!['YES', 'NO'].includes(side) || !Number.isFinite(input) || input <= 0 || input > 500)
    throw new Error('Choose an example amount between 1 and 500.');
  const buyYes = side === 'YES';
  const x = buyYes ? position.no : position.yes;
  const y = buyYes ? position.yes : position.no;
  const output = quote(x, y, position.liquidity, input);
  const next = { ...position, yes: position.yes + (buyYes ? -output : input), no: position.no + (buyYes ? input : -output) };
  const z = (next.no - next.yes) / next.liquidity;
  if (!Number.isFinite(output) || output <= 0 || next.yes < 1 || next.no < 1 || Math.abs(z) > 2)
    throw new Error('This example has reached its range. Reset to try another trade.');
  return { ...next, output, probability: cdf(z) };
}

/** Analytic zero-level reserves keep the animated marker on the invariant. */
export function exampleAtScore(z, liquidity = EXAMPLE_LIQUIDITY) {
  const probability = cdf(z);
  const no = liquidity * (z * probability + pdf(z));
  return { yes: no - z * liquidity, no, liquidity, probability };
}

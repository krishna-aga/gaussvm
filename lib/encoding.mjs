import { concat, encodeAbiParameters, toHex, keccak256 } from 'viem';

export const orderType = [{ type: 'tuple', components: [
  { name: 'maker', type: 'address' }, { name: 'traits', type: 'uint256' }, { name: 'data', type: 'bytes' },
] }];

export function makeOrder({ maker, yes, no, market, liquidity, start, expiry, timeScaled = false }) {
  const [a, b] = BigInt(yes) < BigInt(no) ? [yes, no] : [no, yes];
  const args = encodeAbiParameters([
    { type: 'address' }, { type: 'uint256' }, { type: 'uint64' }, { type: 'uint64' }, { type: 'bool' },
  ], [market, BigInt(liquidity), BigInt(start), BigInt(expiry), timeScaled]);
  const indexes = BigInt('0x0028002800280028'); // Four hook slices, all starting after token pair.
  return { maker, traits: (1n << 254n) | (indexes << 160n), data: concat([a, b, '0x80a0', args]) };
}
export function encodeOrder(order) { return encodeAbiParameters(orderType, [order]); }
export function orderHash(order) { return keccak256(encodeOrder(order)); }

export function takerData({ tokenIn, yes, no, minOutput = 1n, deadline, exactIn = true }) {
  const a = BigInt(yes) < BigInt(no) ? yes : no;
  const hasDeadline = deadline !== undefined;
  const end = hasDeadline ? 37 : 32;
  const indexes = [end,end,end,end,end,end,end,end,32,32].map(i => toHex(i, { size: 2 }));
  const flags = (exactIn ? 1 : 0) | 0x20 | 0x40 | (tokenIn.toLowerCase() === a.toLowerCase() ? 0x80 : 0);
  return concat([...indexes, toHex(flags, { size: 2 }), toHex(BigInt(minOutput), { size: 32 }),
    ...(hasDeadline ? [toHex(BigInt(deadline), { size: 5 })] : [])]);
}

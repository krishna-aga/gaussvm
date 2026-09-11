import { isAddress, zeroAddress } from 'viem';
import { makeOrder, orderHash } from './encoding.mjs';

const decimal = value => typeof value === 'string' && /^\d+$/.test(value);
const hash = value => typeof value === 'string' && /^0x[\da-f]{64}$/i.test(value);
const address = value => typeof value === 'string' && isAddress(value) && value.toLowerCase() !== zeroAddress;
const same = (a,b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

/** Validate configuration before any wallet or RPC is constructed. */
export function validateDeployment(d) {
  try {
    if (!d || d.schemaVersion !== 1 || ![31337,11155111].includes(d.chainId)) return false;
    const rpc = new URL(d.rpcUrl);
    if (!['http:','https:'].includes(rpc.protocol)) return false;
    if (d.chainId === 11155111 && rpc.protocol !== 'https:') return false;
    if (typeof d.network !== 'string' || !d.network.trim()) return false;
    if (!['aqua','router','collateral','market','yes','no','maker','resolver'].every(k => address(d[k]))) return false;
    if (same(d.yes,d.no) || !Number.isSafeInteger(d.start) || !Number.isSafeInteger(d.expiry) || d.start < 0 || d.expiry <= d.start) return false;
    if (typeof d.timeScaled !== 'boolean' || !decimal(d.liquidity) || BigInt(d.liquidity) < 10n**18n || BigInt(d.liquidity) > 10n**27n) return false;
    const expected = makeOrder({...d,liquidity:BigInt(d.liquidity)});
    return same(d.order?.maker,d.maker) && String(expected.traits) === d.order?.traits && same(expected.data,d.order?.data) && same(orderHash(expected),d.orderHash);
  } catch { return false; }
}

export const workspaceKey = d => `gaussvm:workspace:v2:${d.chainId}:${d.market.toLowerCase()}:${d.router.toLowerCase()}:${d.orderHash.toLowerCase()}`;

export function positionFrom(d) {
  return {maker:d.maker,start:d.start,timeScaled:d.timeScaled,liquidity:d.liquidity,order:d.order,orderHash:d.orderHash};
}

const states = ['pending','unknown','confirmed','failed','cancelled','replaced'];
const reasons = ['repriced','cancelled','replaced'];
function validTransaction(tx) {
  return tx && hash(tx.hash) && address(tx.account) && typeof tx.label === 'string' && tx.label.length <= 160 && states.includes(tx.state)
    && (tx.gas === undefined || decimal(tx.gas)) && (tx.block === undefined || decimal(tx.block))
    && (tx.replacement === undefined || reasons.includes(tx.replacement));
}

/** A successful cancellation receipt is not a successful application operation. */
export function receiptState(transaction,status) {
  if(status !== 'success') return 'failed';
  if(transaction.replacement === 'cancelled') return 'cancelled';
  if(transaction.replacement === 'replaced') return 'replaced';
  return 'confirmed';
}

export function readWorkspace(storage,seed) {
  const empty = {positions:[positionFrom(seed)],selected:seed.orderHash,transactions:[],warning:''};
  try {
    let raw=storage.getItem(workspaceKey(seed));
    let legacy=false;
    if(!raw) {
      raw=storage.getItem(`gaussvm:workspace:v1:${seed.chainId}:${seed.market.toLowerCase()}:${seed.orderHash.toLowerCase()}`);
      legacy=Boolean(raw);
    }
    if(!raw) return empty;
    const saved=JSON.parse(raw);
    if(saved.version!==1 || !Array.isArray(saved.positions) || !Array.isArray(saved.transactions)) throw new Error('Invalid history');
    const positions=[positionFrom(seed)];
    // Old caches did not identify the router. Keep receipts, but never interpret
    // an old router's authorization as a position shipped to the current one.
    for(const p of legacy ? [] : saved.positions) {
      if(!p || typeof p !== 'object') continue;
      // Stored strategy data cannot replace RPC, market, token or settlement addresses.
      const candidate={...seed,...positionFrom(p)};
      if(validateDeployment(candidate) && !positions.some(item => same(item.orderHash,p.orderHash))) positions.push(positionFrom(candidate));
    }
    const transactions=saved.transactions.filter(validTransaction).map(tx=>({
      label:tx.label,hash:tx.hash,account:tx.account,state:tx.state === 'pending' ? 'unknown' : tx.state,
      gas:tx.gas,block:tx.block,replacement:tx.replacement,
    }));
    return {positions,selected:positions.some(p=>same(p.orderHash,saved.selected))?saved.selected:seed.orderHash,transactions,
      warning:transactions.length!==saved.transactions.length ? 'Some saved receipts could not be read. Check your wallet history for missing transactions.'
        : legacy ? 'Previous receipts restored. Earlier custom liquidity positions remain on their original contract; the demo position is ready here.' : ''};
  } catch {
    return {...empty,warning:'Browser history is unavailable. Keep transaction hashes before refreshing; your wallet and onchain positions are unchanged.'};
  }
}

export function writeWorkspace(storage,key,value) {
  try { storage.setItem(key,JSON.stringify({version:1,...value}));return true; }
  catch { return false; }
}

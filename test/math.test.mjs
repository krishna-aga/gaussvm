import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEther, formatEther } from 'viem';
import { deploy, read } from './helpers.mjs';
import * as reference from '../lib/reference.mjs';

const harness = await deploy('MathHarness');
const wad = n => parseEther(n.toFixed(12));
const value = n => Number(formatEther(n));

test('CDF/PDF agree with independent Simpson quadrature across [-3,3]', async () => {
  let worst=0;
  for(let i=-60;i<=60;i++) {
    const z=i/20, actual=value(await read(harness,'cdf',[wad(z)]));
    worst=Math.max(worst,Math.abs(actual-reference.cdf(z)));
    assert.ok(Math.abs(actual-reference.cdf(z))<2e-13, `CDF at ${z}`);
    assert.ok(Math.abs(value(await read(harness,'pdf',[wad(z)]))-reference.pdf(z))<2e-14);
    const opposite=await read(harness,'cdf',[wad(-z)]);
    assert.equal(await read(harness,'cdf',[wad(z)]) + opposite, parseEther('1'));
  }
  console.log(`121 CDF points: maximum absolute error ${worst}`);
});

test('swap outputs track independent roots and preserve conservative invariant', async () => {
  let cases=0;
  for(const l of [10,1000,1e6]) for(const z of [-2,-1,0,1,2]) for(const fraction of [.0001,.001,.01]) {
    const y=l*(z*reference.cdf(z)+reference.pdf(z));
    const x=y-z*l, input=l*fraction;
    const expected=reference.quote(x,y,l,input);
    // Extremely unbalanced directions may leave the explicitly supported region.
    if((y-expected-x-input)/l < -3) continue;
    const out=await read(harness,'quote',[wad(x),wad(y),wad(l),wad(input)]);
    const actual=value(out);
    assert.ok(actual<=expected+l*1e-12, `maker rounding ${z}`);
    assert.ok(Math.abs(actual-expected)<l*2e-9, `root error: ${actual-expected}`);
    const before=await read(harness,'invariant',[wad(x),wad(y),wad(l)]);
    const after=await read(harness,'invariant',[wad(x)+wad(input),wad(y)-out,wad(l)]);
    assert.ok(after<before);
    cases++;
  }
  console.log(`${cases} independent swap-root comparisons`);
});

test('invalid numerical domains and zero trades revert', async () => {
  await assert.rejects(read(harness,'cdf',[wad(3.01)]));
  await assert.rejects(read(harness,'quote',[wad(100),wad(100),0n,wad(1)]));
  await assert.rejects(read(harness,'quote',[wad(100),wad(100),wad(1000),0n]));
});

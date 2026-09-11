import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEther } from 'viem';
import { deploy,read } from './helpers.mjs';
const h=await deploy('MathHarness'),e=parseEther;

test('fixed-time round trips cannot increase the starting input balance',async()=>{
  for(const input of ['0.001','1','10','100']) {
    const x=e('1000'),y=e('1000'),l=e('2506.628274631'),a=e(input);
    const b=await read(h,'quote',[x,y,l,a]);
    const returned=await read(h,'quote',[y-b,x+a,l,b]);
    assert.ok(returned<a,`Profitable round trip for ${input}`);
  }
});

test('larger supported trades receive more output with declining average execution rate',async()=>{
  let previousOutput=0n,previousInput=0n;
  for(const amount of ['.001','.01','.1','1','10','100']) {
    const a=e(amount),b=await read(h,'quote',[e('1000'),e('1000'),e('2506.628274631'),a]);
    assert.ok(b>previousOutput);
    // Numerical guard matters for dust; tested amounts are substantially above that threshold.
    if(previousInput>0n)assert.ok(b*previousInput<=previousOutput*a);
    previousInput=a;previousOutput=b;
  }
});

test('splitting a supported static trade has no material output advantage',async()=>{
  const x=e('1000'),y=e('1000'),l=e('2506.628274631'),a=e('10');
  const one=await read(h,'quote',[x,y,l,a]);
  const first=await read(h,'quote',[x,y,l,a/2n]);
  const second=await read(h,'quote',[x+a/2n,y-first,l,a/2n]);
  assert.ok(first+second<=one);
});

test('deterministic alternating trade sequence preserves maker-favorable residuals',async()=>{
  let x=e('1000'),y=e('1000');const l=e('2506.628274631');
  for(let i=0;i<20;i++) {
    const input=e(String(1+(i*7)%13));
    const before=await read(h,'invariant',[x,y,l]);
    const output=await read(h,'quote',[x,y,l,input]);
    x+=input;y-=output;
    assert.ok(await read(h,'invariant',[x,y,l])<before);
    [x,y]=[y,x];
  }
});

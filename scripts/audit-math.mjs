import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync,execFileSync } from 'node:child_process';
import solc from 'solc';

const started=new Date(),clock=performance.now();
const sources=['contracts/math/Gaussian.sol','contracts/math/PmAmmMath.sol','contracts/test/MathHarness.sol','lib/reference.mjs','test/math.test.mjs','test/economics.test.mjs','test/helpers.mjs','scripts/compile.mjs','hardhat.config.ts','package-lock.json'];
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const hashes=Object.fromEntries(sources.map(file=>[file,sha(file)]));
const compilation=spawnSync(process.execPath,['scripts/compile.mjs'],{stdio:'inherit',timeout:120_000});
if(compilation.status!==0)throw new Error('Audit stopped: current sources could not be compiled.');
sources.push('artifacts/MathHarness.json');
hashes['artifacts/MathHarness.json']=sha('artifacts/MathHarness.json');
const args=['--test','--test-concurrency=1','test/math.test.mjs','test/economics.test.mjs'];
const result=spawnSync(process.execPath,args,{encoding:'utf8',timeout:120_000});
const output=(result.stdout??'')+(result.stderr??'');
process.stdout.write(output);
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/math-audit.log',output);
const unchanged=sources.every(file=>hashes[file]===sha(file));
const manifest={schema_version:1,claim_id:'gaussvm-bounded-numerical-comparison',
  repository:{commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0},
  command:`node scripts/compile.mjs && node ${args.join(' ')}`,
  environment:{software:[`Node ${process.version}`,`solc ${solc.version()}`,'Hardhat 3.16.0','viem 2.56.3'],hardware:`${os.platform()} ${os.arch()}; ${os.cpus()[0]?.model??'unknown CPU'}`},
  mathematics:{assertion_tested:'Bounded CDF/PDF and swap-root comparison; sampled round-trip, monotonicity, splitting and sequential residual checks',
    coefficient_domain:'Signed integer WAD Solidity arithmetic, compared with double-precision Simpson quadrature and bisection',
    conventions:'x=input reserve, y=output reserve; z=(y-x)/L; F=d*Phi(z)+L*phi(z)-y; lower feasible output',
    inputs:sources,bounds:{cdf_points:121,z_min:-3,z_max:3,z_step:0.05,root_cases:45,liquidity:[10,1000,1000000],reserve_scores:[-2,-1,0,1,2],input_fractions:[0.0001,0.001,0.01],timeout_seconds:120},
    non_claims:['No universal error proof','No production security audit','No profitability or LVR simulation','No real-market Gaussian dynamics validation']},
  randomness:{used:false,generator:'Deterministic explicit grid and fixed sequence',seed:null},
  run:{started_at:started.toISOString(),runtime_seconds:(performance.now()-clock)/1000,exit_status:result.status??1},
  outputs:[{path:'reports/math-audit.log',sha256:sha('reports/math-audit.log')}],
  source_hashes:hashes,
  checks:[`Source files unchanged during run: ${unchanged}`,'CDF tolerance 2e-13; PDF tolerance 2e-14; output tolerance 2e-9 L','Tests perform fixed-point residual and exact complement checks'],
  result:result.status===0&&unchanged?'Finite assertions passed in stated ranges, conditional on numerical tolerance and the double-precision reference.':'Failed or inconclusive: inspect log.',
  residual_risks:['The numerical guard is experimentally validated, not formally certified','Version 1 manifest records input hashes in a project-specific field; no OS memory or CPU cap was applied']};
fs.writeFileSync('reports/math-audit.json',JSON.stringify(manifest,null,2));
if(result.status!==0||!unchanged)process.exitCode=1;

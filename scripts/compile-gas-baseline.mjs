import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import solc from 'solc';

// Frozen pre-optimization math from 4e8cd92. Compile the SAME router/harness and
// settings with only these sources replaced, so comparisons isolate the math.
const build = JSON.parse(fs.readFileSync('artifacts/build-info.json', 'utf8'));
assert.equal(build.compilerVersion, solc.version().replace('.Emscripten.clang', ''));
const input = structuredClone(build.input);
const sources = {};
for (const name of ['Gaussian', 'PmAmmMath']) {
  const content = fs.readFileSync(`test/fixtures/pre-gas/${name}.sol`, 'utf8');
  input.sources[`contracts/math/${name}.sol`] = { content };
  sources[name] = createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex');
}
input.settings.outputSelection = Object.fromEntries([
  ['contracts/GaussVM.sol', 'GaussVM'], ['contracts/test/MathHarness.sol', 'MathHarness'],
].map(([source, name]) => [source, { [name]: ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] }]));
const output = JSON.parse(solc.compile(JSON.stringify(input)));
for (const error of output.errors ?? []) if (error.severity === 'error') console.error(error.formattedMessage);
assert(!output.errors?.some(e => e.severity === 'error'), 'Baseline compilation failed');
for (const [source, contracts] of Object.entries(output.contracts)) {
  for (const [name, artifact] of Object.entries(contracts)) {
    fs.writeFileSync(`artifacts/Baseline${name}.json`, JSON.stringify({ contractName: name, source,
      abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}`,
      deployedBytecode: `0x${artifact.evm.deployedBytecode.object}` }));
  }
}
fs.writeFileSync('artifacts/gas-baseline.json', JSON.stringify({
  revision: '4e8cd92dcca618b50a7b2cfa5845eb637b70ff4f', compilerVersion: build.compilerVersion,
  optimizer: input.settings.optimizer, viaIR: input.settings.viaIR, evmVersion: input.settings.evmVersion, sources,
}, null, 2));
console.log('Built frozen pre-optimization baseline with identical compiler settings.');

import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(`${dir}/${e.name}`) : e.name.endsWith('.sol') ? [`${dir}/${e.name}`] : []);
}
function resolveImport(name) {
  const resolved = name.startsWith('@1inch/swap-vm/') ? name.replace('@1inch/swap-vm/', 'vendor/swap-vm/')
    : name.startsWith('@1inch/aqua/') ? name.replace('@1inch/aqua/', 'vendor/aqua/')
    : path.join('node_modules', name);
  try { return { contents: fs.readFileSync(resolved, 'utf8') }; }
  catch { return { error: `Missing ${resolved}. Run git submodule update --init --recursive and npm ci.` }; }
}
const input = {
  language: 'Solidity',
  sources: Object.fromEntries(files('contracts').map(file => [file, { content: fs.readFileSync(file, 'utf8') }])),
  settings: {
    optimizer: { enabled: true, runs: 200 }, viaIR: true, evmVersion: 'cancun',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));
for (const error of output.errors ?? []) console[error.severity === 'error' ? 'error' : 'warn'](error.formattedMessage);
if (output.errors?.some(e => e.severity === 'error')) process.exit(1);
fs.mkdirSync('artifacts', { recursive: true });
for (const [source, contracts] of Object.entries(output.contracts)) {
  for (const [name, artifact] of Object.entries(contracts)) {
    if (!artifact.evm.bytecode.object) continue;
    fs.writeFileSync(`artifacts/${name}.json`, JSON.stringify({ contractName: name, source, abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`, deployedBytecode: `0x${artifact.evm.deployedBytecode.object}` }, null, 2));
    if (source.startsWith('contracts/')) console.log(`${name}: ${artifact.evm.deployedBytecode.object.length / 2} runtime bytes`);
  }
}
console.log(`Compiled with solc ${solc.version()} (Cancun, optimizer 200, viaIR).`);

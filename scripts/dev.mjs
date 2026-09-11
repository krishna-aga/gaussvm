import fs from 'node:fs';
import { spawn } from 'node:child_process';

const children=[];
function run(file,args=[],inherit=true) {
  const child=spawn(process.execPath,[file,...args],{stdio:inherit?'inherit':['ignore','pipe','pipe']});
  children.push(child); return child;
}
async function once(file,args=[]) {
  const child=run(file,args);
  const code=await new Promise(resolve=>child.on('exit',resolve));
  if(code!==0) throw new Error(`${file} exited ${code}`);
}
function shutdown(){ for(const c of children) if(c.exitCode===null) c.kill(); }
process.on('SIGINT',()=>{shutdown();process.exit(0);});
process.on('SIGTERM',()=>{shutdown();process.exit(0);});
process.on('exit',shutdown);
async function rpc() {
  const res=await fetch('http://127.0.0.1:8545',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(800)});
  return (await res.json()).result;
}
try {
  await once('scripts/compile.mjs');
  let existing;
  try { existing=await rpc(); } catch { /* no local chain */ }
  if(existing && existing!=='0x7a69') throw new Error('Port 8545 serves another network. Stop it before running this demo.');
  if(!existing) {
    fs.mkdirSync('reports',{recursive:true});
    const log=fs.createWriteStream('reports/local-chain.log');
    const chain=run('node_modules/hardhat/dist/src/cli.js',['node','--hostname','127.0.0.1'],false);
    chain.stdout.pipe(log); chain.stderr.pipe(log);
    let ready=false;
    for(let i=0;i<100;i++) {
      try{if(await rpc()==='0x7a69'){ready=true;break;}}catch{}
      if(chain.exitCode!==null) throw new Error('Local chain failed. See reports/local-chain.log.');
      await new Promise(r=>setTimeout(r,200));
    }
    if(!ready) throw new Error('Local chain did not start.');
  }
  await once('scripts/deploy.mjs');
  console.log('\nGaussVM: local test tokens only. Open http://127.0.0.1:5173. Ctrl+C stops child services.');
  const web=run('node_modules/vite/bin/vite.js',['--host','127.0.0.1']);
  await new Promise(resolve=>web.on('exit',resolve));
} catch(error) { console.error(error.message);process.exitCode=1; }
finally { shutdown(); }

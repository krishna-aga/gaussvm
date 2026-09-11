import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// A public build must never advertise a localhost deployment as a public network.
const target='web/public/deployment.json';
const previous=fs.existsSync(target)?fs.readFileSync(target):undefined;
try {
  if(fs.existsSync('deployments/sepolia.json')) {
    const manifest=JSON.parse(fs.readFileSync('deployments/sepolia.json','utf8'));
    if(manifest.chainId!==11155111)throw new Error('Public deployment manifest must be Sepolia.');
    fs.mkdirSync('web/public',{recursive:true});
    fs.writeFileSync(target,JSON.stringify(manifest,null,2));
  } else if(fs.existsSync(target)) fs.unlinkSync(target);
  for(const args of [['node_modules/typescript/bin/tsc','--noEmit'],['node_modules/vite/bin/vite.js','build']]) {
    const result=spawnSync(process.execPath,args,{stdio:'inherit'});
    if(result.status!==0)throw new Error('Public build failed.');
  }
} finally {
  if(previous)fs.writeFileSync(target,previous);
  else if(fs.existsSync(target))fs.unlinkSync(target);
}

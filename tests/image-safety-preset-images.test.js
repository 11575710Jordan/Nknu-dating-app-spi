
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
globalThis.crypto = webcrypto;
const records = new Map();
globalThis.localStorage = {
 getItem: (k)=>records.has(k)?records.get(k):null,
 setItem: (k,v)=>records.set(k,String(v)),
 removeItem: (k)=>records.delete(k)
};
const api = require('../js/image-safety.js');
function imgFile(filename) {
 const data = fs.readFileSync(path.join(__dirname,'..','data',filename));
 return { name:filename, type:'image/png', size:data.length,
   async arrayBuffer() {return data.buffer.slice(data.byteOffset,data.byteOffset+data.length);} };
}
test('three bundled images match the three configured hashes', async()=>{
 api.resetToDefaults();
 const names=['scam_investment.png','scam_fake_support.png','scam_romance.png'];
 for (let i=0;i<names.length;i++) {
  const verdict=await api.analyzeFile(imgFile(names[i]));
  assert.equal(verdict.status,'blocked',names[i]);
  assert.equal(verdict.match.hash,api.DEFAULT_REFERENCES[i].hash);
 }
});
test('different PNG not in list is allowed', async()=>{
 const filename='good.png';
 const bytes=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082','hex');
 const verdict=await api.analyzeFile({name:filename,type:'image/png',size:bytes.length,
 async arrayBuffer(){return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length);}});
 assert.equal(verdict.status,'safe');
});

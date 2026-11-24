const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const local = new Map();
globalThis.localStorage = {
  getItem: k => local.has(k) ? local.get(k) : null,
  setItem: (k,v) => { local.set(k,String(v)); },
  removeItem: k => local.delete(k)
};
if (!globalThis.crypto) globalThis.crypto = crypto.webcrypto;
const Safety = require('../js/image-safety.js');
const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082', 'hex');
function makeFile(name, content, type='image/png') {
 const data=Buffer.isBuffer(content)?content:Buffer.from(content);
 return { name,type,size:data.length,async arrayBuffer(){return data.buffer.slice(data.byteOffset,data.byteOffset+data.length);} };
}
const ref=makeFile('sample.png',png);
const other=makeFile('another.png',Buffer.concat([png,Buffer.from('changed')]));

test('第一次載入自動帶入三張預設測試圖',()=>{
  local.clear();
  assert.equal(Safety.listReferences().length,3);
});

test('清空後不會自動再種回來',()=>{
  Safety.clearReferences();
  assert.equal(Safety.listReferences().length,0);
});

test('可恢復三張預設圖',()=>{
  assert.equal(Safety.resetToDefaults(),3);
  assert.equal(Safety.listReferences().length,3);
});

test('格式錯誤拒絕',()=>assert.match(Safety.validateFile(makeFile('wrong.txt','x','text/plain')),/僅支援/));

test('超過10MB拒絕',()=>assert.match(Safety.validateFile({type:'image/png',size:10*1024*1024+1,arrayBuffer:async()=>new ArrayBuffer(1)}),/10 MB/));

test('尚未登錄的圖片不觸發警告',async()=>{
  Safety.clearReferences();
  assert.equal((await Safety.analyzeFile(ref)).status,'safe');
});

test('登錄圖片後可以命中',async()=>{
  const x=await Safety.registerFile(ref);assert.equal(x.added,true);assert.equal((await Safety.analyzeFile(ref)).status,'blocked');
});

test('更改檔名不影響同內容比對',async()=>assert.equal((await Safety.analyzeFile(makeFile('renamed.png',png))).status,'blocked'));

test('同一張圖不重複登錄',async()=>{const x=await Safety.registerFile(ref);assert.equal(x.added,false);assert.equal(Safety.listReferences().length,1);});

test('不同檔案不觸發警告',async()=>assert.equal((await Safety.analyzeFile(other)).status,'safe'));

test('移除參考圖片後不再警告',async()=>{const hash=(await Safety.hashFile(ref));assert.equal(Safety.removeReference(hash),true);assert.equal((await Safety.analyzeFile(ref)).status,'safe');});


test('file:// 純 JS SHA-256 後備演算法和 Node 產生相同 hash',async()=>{
  const old=globalThis.crypto;
  try {
    globalThis.crypto={};
    const hash=await Safety.hashFile(ref);
    assert.equal(hash,crypto.createHash('sha256').update(png).digest('hex'));
  }finally{globalThis.crypto=old;}
});

/*
 * NKNu Dating App — 指定圖片比對 Demo（已預載入 3 張詐騙測試圖）
 * 以檔案 SHA-256 (位元組完全相同) 比對測試照片。
 * 不是 AI，也不是影像內容審核系統；修改裁切/壓縮後將無法命中。
 * 規則存在本機瀏覽器 localStorage，僅適用課堂展示。
 */
(function (root, create) {
  const api = create(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ImageSafety = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const STORE_KEY = 'nknu-demo-flagged-photo-sha256-direct-v3';
  const SEEDED_FLAG_KEY = 'nknu-demo-flagged-photo-seeded-direct-v3';
  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const DEFAULT_REFERENCES = [
    {
      hash: 'ff646272a0387f4e289521059582f7f33d8318afd27cc2a571f2f13e01623c56',
      name: '交友 app 投資詐騙模擬廣告.png',
      size: 0,
      addedAt: '2026-11-16T18:40:00.000Z',
      preset: true,
      category: '投資詐騙'
    },
    {
      hash: 'd7db6d0b70741cf43e0fe35e7d0d89447a74e62e7211c1be96e2a45f7cf28b98',
      name: '模擬客服驗證詐騙訊息.png',
      size: 0,
      addedAt: '2026-11-16T18:40:00.000Z',
      preset: true,
      category: '假客服驗證'
    },
    {
      hash: 'ac5bb3e083533facc3a243e6588e3ec8ce084f08899d117dcac4bab17ecd3635',
      name: '戀愛詐騙對話模擬畫面.png',
      size: 0,
      addedAt: '2026-11-16T18:40:00.000Z',
      preset: true,
      category: '戀愛借錢詐騙'
    }
  ];

  function validateFile(file) {
    if (!file) return '請先選擇一張圖片。';
    if (!ACCEPTED_TYPES.includes(file.type)) return '僅支援 JPG、PNG、WebP 圖片。';
    if (!Number.isFinite(file.size) || file.size <= 0) return '圖片檔案為空或大小異常。';
    if (file.size > MAX_BYTES) return '圖片不可超過 10 MB。';
    if (typeof file.arrayBuffer !== 'function') return '目前的檔案無法讀取。';
    return null;
  }

  // 直接以 file:// 開啟時，有些瀏覽器會限制 localStorage。
  // 此時退回記憶體清單：三張內建圖片仍可用，自行新增的照片重新開頁面後不保證保留。
  const memoryStore = new Map();
  const fallbackStorage = {
    getItem(k) { return memoryStore.has(k) ? memoryStore.get(k) : null; },
    setItem(k,v) { memoryStore.set(k,String(v)); }
  };
  let chosenStorage = null;
  function storage() {
    if (chosenStorage) return chosenStorage;
    try {
      if (root && root.localStorage) {
        const key='__nknu_storage_test__';
        root.localStorage.setItem(key,'ok');
        root.localStorage.removeItem(key);
        chosenStorage=root.localStorage;
        return chosenStorage;
      }
    } catch (_) { /* file:// storage may be blocked */ }
    chosenStorage=fallbackStorage;
    return chosenStorage;
  }

  function normalizeRecords(records) {
    return records
      .filter(x => x && /^[a-f0-9]{64}$/.test(x.hash))
      .map(x => ({
        hash: x.hash,
        name: String(x.name || '未命名圖片'),
        size: Number(x.size || 0),
        addedAt: String(x.addedAt || ''),
        preset: Boolean(x.preset),
        category: String(x.category || '')
      }));
  }

  function readRawRecords() {
    try { return JSON.parse(storage().getItem(STORE_KEY) || '[]'); }
    catch (err) { throw new Error('無法讀取指定圖片清單：' + err.message); }
  }

  function save(records) { storage().setItem(STORE_KEY, JSON.stringify(records)); }

  function seedDefaultsIfNeeded() {
    const store = storage();
    const seeded = store.getItem(SEEDED_FLAG_KEY) === '1';
    const existing = normalizeRecords(readRawRecords());
    if (!seeded && existing.length === 0) {
      save(DEFAULT_REFERENCES.slice());
      store.setItem(SEEDED_FLAG_KEY, '1');
      return DEFAULT_REFERENCES.slice();
    }
    return existing;
  }

  function listReferences() {
    const records = seedDefaultsIfNeeded();
    return normalizeRecords(records);
  }


  // FIPS 180-4 SHA-256（pure JavaScript fallback；無第三方套件）
  // 專供 file:// 雙擊 HTML 的教學展示，處理上限 10 MB 的圖片。
  function sha256Fallback(data) {
    const K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const paddedLen=(data.length + 9 + 63) & ~63;
    const padded=new Uint8Array(paddedLen);
    padded.set(data);
    padded[data.length]=0x80;
    const byteLen=data.length;
    const dv=new DataView(padded.buffer);
    dv.setUint32(paddedLen - 8, Math.floor(byteLen * 8 / 0x100000000), false);
    dv.setUint32(paddedLen - 4, (byteLen * 8) >>> 0, false);
    const w=new Uint32Array(64);
    const rotr=(x,n)=> (x>>>n) | (x<<(32-n));
    for(let base=0;base<paddedLen;base+=64){
      for(let t=0;t<16;t++) w[t]=dv.getUint32(base+4*t,false);
      for(let t=16;t<64;t++){
        const s0=rotr(w[t-15],7)^rotr(w[t-15],18)^(w[t-15]>>>3);
        const s1=rotr(w[t-2],17)^rotr(w[t-2],19)^(w[t-2]>>>10);
        w[t]=(w[t-16]+s0+w[t-7]+s1)>>>0;
      }
      let [a,b,c,d,e,f,g,hh]=h;
      for(let t=0;t<64;t++){
        const s1=rotr(e,6)^rotr(e,11)^rotr(e,25);
        const ch=(e&f)^(~e&g);
        const t1=(hh+s1+ch+K[t]+w[t])>>>0;
        const s0=rotr(a,2)^rotr(a,13)^rotr(a,22);
        const maj=(a&b)^(a&c)^(b&c);
        const t2=(s0+maj)>>>0;
        hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      h=[(h[0]+a)>>>0,(h[1]+b)>>>0,(h[2]+c)>>>0,(h[3]+d)>>>0,
         (h[4]+e)>>>0,(h[5]+f)>>>0,(h[6]+g)>>>0,(h[7]+hh)>>>0];
    }
    return h.map(x=>x.toString(16).padStart(8,'0')).join('');
  }

  async function hashFile(file) {
    const error = validateFile(file);
    if (error) throw new Error(error);
    const buf = await file.arrayBuffer();
    // HTTPS/localhost 優先使用原生 WebCrypto，file:// 改用純 JS 雜湊，不需要 Python。
    if (root.crypto && root.crypto.subtle) {
      const digest = await root.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return sha256Fallback(new Uint8Array(buf));
  }

  async function registerFile(file) {
    const hash = await hashFile(file);
    const refs = listReferences();
    const existing = refs.find(x => x.hash === hash);
    if (existing) return { added: false, reference: existing, count: refs.length };
    const ref = { hash, name: file.name, size: file.size, addedAt: new Date().toISOString(), preset: false, category: '' };
    refs.push(ref);
    save(refs);
    storage().setItem(SEEDED_FLAG_KEY, '1');
    return { added: true, reference: ref, count: refs.length };
  }

  function removeReference(hash) {
    const refs = listReferences();
    const remain = refs.filter(x => x.hash !== hash);
    save(remain);
    storage().setItem(SEEDED_FLAG_KEY, '1');
    return remain.length !== refs.length;
  }

  function clearReferences() {
    save([]);
    storage().setItem(SEEDED_FLAG_KEY, '1');
  }

  function resetToDefaults() {
    save(DEFAULT_REFERENCES.slice());
    storage().setItem(SEEDED_FLAG_KEY, '1');
    return DEFAULT_REFERENCES.length;
  }

  async function analyzeFile(file) {
    const hash = await hashFile(file);
    const refs = listReferences();
    const matched = refs.find(x => x.hash === hash);
    return matched ? {
      status: 'blocked',
      title: '⚠️ 偵測到指定測試圖片',
      message: '此檔案與事先登錄的圖片完全相同，本次不會更新照片。',
      match: { name: matched.name, hash: matched.hash, category: matched.category || '' },
      referenceCount: refs.length
    } : {
      status: 'safe',
      title: '✓ 未命中指定圖片',
      message: '這張照片不在目前的指定清單中，可繼續操作。這不代表圖片內容已通過 AI 安全審查。',
      match: null,
      referenceCount: refs.length
    };
  }

  return {
    STORE_KEY, SEEDED_FLAG_KEY, DEFAULT_REFERENCES,
    validateFile, listReferences, hashFile, registerFile, removeReference,
    clearReferences, resetToDefaults, analyzeFile
  };
});

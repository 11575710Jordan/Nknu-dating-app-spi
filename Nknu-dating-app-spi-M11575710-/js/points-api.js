/* =========================================================
   點數系統共用模組（任務系統／集點系統／課金系統共用）
   - 與配對頁共用同一份點數錢包（pages/match.js）：
     localStorage 鍵 'nknu-match-demo-v5'，形狀 { ratings, petOverrides, wallets }
     wallets: { userId: { points, unlocked[] } }
     這裡只讀寫 wallets 欄位，絕不覆蓋 ratings／petOverrides，避免跟配對頁資料互相蓋掉。
   - 另外用獨立的 'nknu-points-log-v1' 記錄點數異動明細（任務領取／儲值／兌換扣點），
     配對頁本身沒有記明細，這裡額外補上，集點系統的「異動紀錄」靠這份資料顯示。
   - 全域變數 PointsAPI，純前端、無框架；可在 Node 以 module.exports 測試。
   ========================================================= */
const PointsAPI = (() => {
  const WALLET_KEY = 'nknu-match-demo-v5';
  const LOG_KEY = 'nknu-points-log-v1';
  const LOG_MAX = 100;

  function readWalletState() {
    try {
      const raw = localStorage.getItem(WALLET_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('[points-api] 讀取點數資料失敗，視為沒有存檔', err);
      return {};
    }
  }

  function writeWalletState(partial) {
    try {
      const current = readWalletState();
      localStorage.setItem(WALLET_KEY, JSON.stringify({ ...current, ...partial }));
      return true;
    } catch (err) {
      console.warn('[points-api] 寫入點數資料失敗，重新整理後可能會消失', err);
      return false;
    }
  }

  /** 取得某使用者目前的錢包；沒動過點數時回傳初始值（跟配對頁 myWallet() 邏輯一致） */
  function getWallet(userId, basePoints) {
    const state = readWalletState();
    const wallets = state.wallets || {};
    return wallets[userId] || { points: basePoints, unlocked: [] };
  }

  function setWallet(userId, wallet) {
    const state = readWalletState();
    const wallets = { ...(state.wallets || {}), [userId]: wallet };
    return writeWalletState({ wallets });
  }

  /* ---------- 點數異動明細 ---------- */
  function readLog() {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('[points-api] 讀取點數明細失敗', err);
      return {};
    }
  }

  function writeLog(all) {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(all));
      return true;
    } catch (err) {
      console.warn('[points-api] 寫入點數明細失敗', err);
      return false;
    }
  }

  /** 某使用者的點數明細，新到舊 */
  function getLog(userId) {
    const all = readLog();
    return all[userId] || [];
  }

  function appendLog(userId, entry) {
    const all = readLog();
    const list = all[userId] || [];
    all[userId] = [{ ...entry, at: new Date().toISOString() }, ...list].slice(0, LOG_MAX);
    writeLog(all);
  }

  /** 增加點數並記錄明細（任務獎勵／儲值入帳）；回傳新錢包 */
  function earn(userId, basePoints, amount, type, note) {
    const wallet = getWallet(userId, basePoints);
    const next = { ...wallet, points: wallet.points + amount };
    setWallet(userId, next);
    appendLog(userId, { kind: 'earn', type, amount, note });
    return next;
  }

  /** 扣點數並記錄明細（兌換商店）；點數不足回傳 null，成功回傳新錢包 */
  function spend(userId, basePoints, amount, type, note) {
    const wallet = getWallet(userId, basePoints);
    if (wallet.points < amount) return null;
    const next = { ...wallet, points: wallet.points - amount };
    setWallet(userId, next);
    appendLog(userId, { kind: 'spend', type, amount, note });
    return next;
  }

  return { getWallet, setWallet, getLog, appendLog, earn, spend };
})();

if (typeof module !== 'undefined') module.exports = PointsAPI;

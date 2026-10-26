/* =========================================================
   登入狀態（純前端模擬）
   - 登入狀態存在 localStorage 的 userToken：個人中心的登出按鈕原本就會清掉這個 key
   - 沒勾「保持登入」時，另在 sessionStorage 記一個存活標記；關掉瀏覽器後標記消失，視為登出
   - 核心函式都把 storage 當參數傳入，方便在 Node 測試；瀏覽器用的包裝在檔案最下方
   ========================================================= */
const Session = (() => {
  const TOKEN_KEY = 'userToken';
  const ALIVE_KEY = 'nknu-session-alive';
  const DEFAULT_NEXT = 'match.html';
  const LOGIN_FAILED = '電子郵件或密碼不正確，請再確認一次。';

  /** 驗證帳密：回傳 { user } 或 { error }；不透露是帳號還是密碼錯 */
  function authenticate(users, email, password) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !password) return { error: '請填寫完整帳號與密碼。' };
    const user = users.find((u) => u.email.toLowerCase() === normalized);
    if (!user || user.password !== password) return { error: LOGIN_FAILED };
    return { user };
  }

  function start(local, tab, userId, remember, nowIso) {
    local.setItem(TOKEN_KEY, JSON.stringify({ userId, remember: Boolean(remember), loginAt: nowIso }));
    if (!remember) tab.setItem(ALIVE_KEY, userId);
  }

  function end(local, tab) {
    local.removeItem(TOKEN_KEY);
    tab.removeItem(ALIVE_KEY);
  }

  /** 目前登入者 id；沒有登入、已失效或資料壞掉都回傳 null（並清掉失效的狀態） */
  function currentUserId(local, tab, users) {
    const raw = local.getItem(TOKEN_KEY);
    if (!raw) return null;
    let token;
    try {
      token = JSON.parse(raw);
    } catch (err) {
      end(local, tab);
      return null;
    }
    const expired = !token.remember && tab.getItem(ALIVE_KEY) !== token.userId;
    if (expired || !users.some((u) => u.id === token.userId)) {
      end(local, tab);
      return null;
    }
    return token.userId;
  }

  /** 登入後要回去的頁面：只接受同資料夾的 .html（可帶查詢參數），避免被導到外部網站 */
  function safeNext(next) {
    return /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(String(next || '')) ? next : DEFAULT_NEXT;
  }

  return { TOKEN_KEY, ALIVE_KEY, authenticate, start, end, currentUserId, safeNext };
})();

if (typeof module !== 'undefined') {
  module.exports = Session;
} else {
  /* ---------- 瀏覽器用 ---------- */
  Session.login = (userId, remember) => Session.start(localStorage, sessionStorage, userId, remember, new Date().toISOString());
  Session.logout = () => Session.end(localStorage, sessionStorage);
  Session.currentUser = (users) => {
    const id = Session.currentUserId(localStorage, sessionStorage, users);
    return id ? users.find((u) => u.id === id) : null;
  };
  /** 需要登入的頁面呼叫：沒登入就導回登入頁，登入後回到這一頁 */
  Session.requireUser = (users) => {
    const user = Session.currentUser(users);
    if (user) return user;
    const here = location.pathname.split('/').pop() + location.search;
    location.replace(`login.html?next=${encodeURIComponent(here)}`);
    return null;
  };
}

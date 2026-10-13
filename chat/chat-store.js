/* =========================================================
   聊天資料邏輯（純前端模擬後端）
   - 對話：{ id, members:[a,b], createdAt, lastRead:{ userId: ISO }, messages:[{ from, text, at }] }
   - 純函式都不改動傳入的陣列，回傳新的；可在 Node 以 `npm test` 測試
   - 瀏覽器用的 load / save（localStorage）在檔案最下方；配對頁與聊天頁共用
   ========================================================= */
const ChatStore = (() => {
  const STORAGE_KEY = 'nknu-chat-demo-v2';
  const MESSAGE_MAX = 500;
  const MINUTE = 60000;
  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  const ago = (now, minutes) => new Date(now.getTime() - minutes * MINUTE).toISOString();

  /** 把模擬資料的「幾分鐘前」換成實際時間 */
  function seed(mock, now) {
    return mock.conversations.map((c) => ({
      id: c.id,
      members: [...c.members],
      createdAt: ago(now, c.createdMinutesAgo || 0),
      lastRead: Object.fromEntries(Object.entries(c.lastReadMinutesAgo || {}).map(([id, m]) => [id, ago(now, m)])),
      messages: c.messages.map((m) => ({ from: m.from, text: m.text, at: ago(now, m.minutesAgo) })),
    }));
  }

  const lastMessage = (conv) => conv.messages[conv.messages.length - 1] || null;
  const lastActivity = (conv) => (lastMessage(conv) || { at: conv.createdAt }).at;
  const peerOf = (conv, userId) => conv.members.find((id) => id !== userId);

  /** 登入者參與的對話，最近有動靜的在前面 */
  function conversationsFor(conversations, userId) {
    return conversations
      .filter((c) => c.members.includes(userId))
      .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
  }

  function find(conversations, a, b) {
    return conversations.find((c) => c.members.includes(a) && c.members.includes(b)) || null;
  }

  /** 對方在我最後讀取之後傳來的訊息數 */
  function unreadCount(conv, userId) {
    const readAt = conv.lastRead[userId] || '';
    return conv.messages.filter((m) => m.from !== userId && m.at > readAt).length;
  }

  /** 已有對話就沿用，沒有就新建（配對分數達門檻時呼叫，模擬後端開通聊天） */
  function ensure(conversations, a, b, now) {
    if (a === b) throw new Error('不能和自己建立對話');
    const existing = find(conversations, a, b);
    if (existing) return { conversations, conversation: existing, created: false };
    const conversation = { id: `c-${a}-${b}`, members: [a, b], createdAt: now.toISOString(), lastRead: {}, messages: [] };
    return { conversations: [...conversations, conversation], conversation, created: true };
  }

  function updateOne(conversations, convId, update) {
    if (!conversations.some((c) => c.id === convId)) throw new Error(`找不到對話 ${convId}`);
    return conversations.map((c) => (c.id === convId ? update(c) : c));
  }

  function send(conversations, convId, from, text, now) {
    const clean = String(text || '').trim();
    if (!clean) throw new Error('訊息不能是空白');
    if (clean.length > MESSAGE_MAX) throw new Error(`訊息最多 ${MESSAGE_MAX} 字`);
    const at = now.toISOString();
    return updateOne(conversations, convId, (c) => {
      if (!c.members.includes(from)) throw new Error(`${from} 不是這段對話的成員`);
      return { ...c, messages: [...c.messages, { from, text: clean, at }], lastRead: { ...c.lastRead, [from]: at } };
    });
  }

  function markRead(conversations, convId, userId, now) {
    return updateOne(conversations, convId, (c) => ({ ...c, lastRead: { ...c.lastRead, [userId]: now.toISOString() } }));
  }

  /* ---------- 時間顯示（使用者所在時區） ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysBetween = (date, now) => Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  /** 對話列表右側：今天顯示時刻、昨天、一週內顯示星期、更早顯示日期 */
  function formatListTime(iso, now) {
    const d = new Date(iso);
    const days = daysBetween(d, now);
    if (days <= 0) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (days === 1) return '昨天';
    if (days < 7) return `週${WEEKDAYS[d.getDay()]}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /** 對話中的時間分隔線 */
  function formatDivider(iso, now) {
    const d = new Date(iso);
    const days = daysBetween(d, now);
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (days <= 0) return `今天 ${time}`;
    if (days === 1) return `昨天 ${time}`;
    if (days < 7) return `週${WEEKDAYS[d.getDay()]} ${time}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  }

  return {
    STORAGE_KEY, MESSAGE_MAX,
    seed, conversationsFor, find, peerOf, lastMessage, unreadCount, ensure, send, markRead,
    formatListTime, formatDivider,
  };
})();

if (typeof module !== 'undefined') {
  module.exports = ChatStore;
} else {
  /* ---------- 瀏覽器用：localStorage 讀寫 ---------- */
  /** 讀取對話；第一次使用（或資料壞掉）時從 MOCK_CHATS 產生 */
  ChatStore.load = (mock) => {
    try {
      const raw = localStorage.getItem(ChatStore.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('[chat] 讀取對話失敗，改用模擬資料', err);
    }
    const seeded = ChatStore.seed(mock, new Date());
    ChatStore.save(seeded);
    return seeded;
  };
  /** 寫入成功回傳 true；失敗回傳 false 讓呼叫端提示使用者 */
  ChatStore.save = (conversations) => {
    try {
      localStorage.setItem(ChatStore.STORAGE_KEY, JSON.stringify(conversations));
      return true;
    } catch (err) {
      console.warn('[chat] 無法寫入 localStorage，重新整理後訊息會消失', err);
      return false;
    }
  };
}

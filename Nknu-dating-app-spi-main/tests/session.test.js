const { test } = require('node:test');
const assert = require('node:assert/strict');
const Session = require('../js/session.js');
const DB = require('../data/mock-data.js');

/** 模擬瀏覽器的 localStorage / sessionStorage */
function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    dump: () => Object.fromEntries(data),
  };
}

const users = [
  { id: 'u01', name: '陳彥廷', email: 'u01@nknu-demo.app', password: 'demo1234' },
  { id: 'u02', name: '林予晴', email: 'u02@nknu-demo.app', password: 'demo1234' },
];

test('登入驗證：email 不分大小寫、會去掉前後空白，帳密正確才通過', () => {
  assert.equal(Session.authenticate(users, ' U01@nknu-demo.app ', 'demo1234').user.id, 'u01');
  assert.match(Session.authenticate(users, 'u01@nknu-demo.app', 'wrong').error, /電子郵件或密碼不正確/);
  assert.match(Session.authenticate(users, 'nobody@x.com', 'demo1234').error, /電子郵件或密碼不正確/);
  assert.match(Session.authenticate(users, '', '').error, /請填寫/);
});

test('登入錯誤訊息不透露是帳號還是密碼錯', () => {
  const wrongPassword = Session.authenticate(users, 'u01@nknu-demo.app', 'x').error;
  const unknownEmail = Session.authenticate(users, 'zz@nknu-demo.app', 'x').error;
  assert.equal(wrongPassword, unknownEmail);
});

test('勾選保持登入：關掉瀏覽器（sessionStorage 清空）後仍是登入狀態', () => {
  const local = fakeStorage();
  Session.start(local, fakeStorage(), 'u01', true, '2026-10-07T10:00:00.000Z');
  assert.equal(Session.currentUserId(local, fakeStorage(), users), 'u01');
});

test('未勾選保持登入：同一個分頁有效，關掉瀏覽器後就要重新登入', () => {
  const local = fakeStorage();
  const tab = fakeStorage();
  Session.start(local, tab, 'u01', false, '2026-10-07T10:00:00.000Z');
  assert.equal(Session.currentUserId(local, tab, users), 'u01');
  assert.equal(Session.currentUserId(local, fakeStorage(), users), null);
  assert.equal(local.getItem(Session.TOKEN_KEY), null, '失效的登入狀態要清掉');
});

test('登出只要清掉 userToken（個人中心原本的登出程式就是這樣做）', () => {
  const local = fakeStorage();
  const tab = fakeStorage();
  Session.start(local, tab, 'u01', true, '2026-10-07T10:00:00.000Z');
  local.removeItem('userToken');
  assert.equal(Session.currentUserId(local, tab, users), null);
});

test('登入狀態裡的用戶不存在或內容壞掉時，視為未登入', () => {
  const local = fakeStorage();
  local.setItem(Session.TOKEN_KEY, JSON.stringify({ userId: 'u99', remember: true }));
  assert.equal(Session.currentUserId(local, fakeStorage(), users), null);
  local.setItem(Session.TOKEN_KEY, '{not json');
  assert.equal(Session.currentUserId(local, fakeStorage(), users), null);
});

test('登入後的跳轉頁只接受站內頁面，避免被導到外部網站', () => {
  assert.equal(Session.safeNext('chat.html?peer=u02'), 'chat.html?peer=u02');
  assert.equal(Session.safeNext('match.html'), 'match.html');
  assert.equal(Session.safeNext('https://evil.example.com'), 'match.html');
  assert.equal(Session.safeNext('//evil.example.com/a.html'), 'match.html');
  assert.equal(Session.safeNext('javascript:alert(1)'), 'match.html');
  assert.equal(Session.safeNext(null), 'match.html');
});

test('模擬資料：每位用戶都有不重複的登入 email 與密碼', () => {
  const emails = DB.users.map((u) => u.email);
  assert.equal(new Set(emails).size, DB.users.length);
  for (const u of DB.users) {
    assert.equal(u.email, `${u.id}@nknu-demo.app`);
    assert.equal(u.password, 'demo1234');
  }
});

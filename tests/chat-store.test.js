const { test } = require('node:test');
const assert = require('node:assert/strict');
const Chat = require('../chat/chat-store.js');
const MOCK_CHATS = require('../data/mock-chats.js');
const DB = require('../data/mock-data.js');
const L = require('../js/match-logic.js');

// 用本地時間建立日期，讓「今天／昨天」的判斷不受時區影響
const now = new Date(2026, 9, 7, 21, 0); // 2026-10-07（週三）21:00
const at = (d, h, m) => new Date(2026, 9, d, h, m).toISOString();

const base = [
  { id: 'c1', members: ['u01', 'u08'], createdAt: at(6, 10, 0), lastRead: { u01: at(7, 20, 30) },
    messages: [
      { from: 'u08', text: '嗨', at: at(7, 20, 38) },
      { from: 'u01', text: '有空', at: at(7, 20, 39) },
      { from: 'u08', text: '拉麵', at: at(7, 20, 41) },
    ] },
  { id: 'c2', members: ['u01', 'u03'], createdAt: at(5, 10, 0), lastRead: {},
    messages: [{ from: 'u03', text: '咖啡', at: at(6, 16, 12) }] },
  { id: 'c3', members: ['u02', 'u05'], createdAt: at(1, 10, 0), lastRead: {}, messages: [] },
];

test('種子資料：把「幾分鐘前」換成實際時間', () => {
  const seeded = Chat.seed({ conversations: [{ id: 'x', members: ['u01', 'u08'], createdMinutesAgo: 60,
    lastReadMinutesAgo: { u01: 30 }, messages: [{ from: 'u08', text: 'hi', minutesAgo: 30 }] }] }, now);
  const c = seeded[0];
  assert.equal(c.messages[0].at, new Date(now.getTime() - 30 * 60000).toISOString());
  assert.equal(c.createdAt, new Date(now.getTime() - 60 * 60000).toISOString());
  assert.equal(c.lastRead.u01, new Date(now.getTime() - 30 * 60000).toISOString());
});

test('對話列表：只列出登入者參與的對話，最新的在前面', () => {
  assert.deepEqual(Chat.conversationsFor(base, 'u01').map((c) => c.id), ['c1', 'c2']);
  assert.deepEqual(Chat.conversationsFor(base, 'u05').map((c) => c.id), ['c3']);
  assert.equal(Chat.peerOf(base[0], 'u01'), 'u08');
  assert.equal(Chat.peerOf(base[0], 'u08'), 'u01');
});

test('未讀數：對方在我最後讀取之後傳的訊息', () => {
  assert.equal(Chat.unreadCount(base[0], 'u01'), 2);
  assert.equal(Chat.unreadCount(base[0], 'u08'), 1, '從沒讀過，自己傳的不算');
  assert.equal(Chat.unreadCount(base[1], 'u01'), 1);
  const read = Chat.markRead(base, 'c1', 'u01', now);
  assert.equal(Chat.unreadCount(read.find((c) => c.id === 'c1'), 'u01'), 0);
  assert.equal(Chat.unreadCount(base[0], 'u01'), 2, '不可改動原陣列');
});

test('建立對話：已有就沿用，沒有才新建，不分成員順序', () => {
  const existing = Chat.ensure(base, 'u08', 'u01', now);
  assert.equal(existing.created, false);
  assert.equal(existing.conversation.id, 'c1');
  const made = Chat.ensure(base, 'u01', 'u02', now);
  assert.equal(made.created, true);
  assert.deepEqual(made.conversation.members, ['u01', 'u02']);
  assert.equal(made.conversation.messages.length, 0);
  assert.equal(made.conversations.length, base.length + 1);
  assert.throws(() => Chat.ensure(base, 'u01', 'u01', now), /自己/);
});

test('傳送訊息：去掉前後空白、不可空白、最多 500 字、只有成員能傳', () => {
  const sent = Chat.send(base, 'c2', 'u01', '  好啊，三點  ', now);
  const c2 = sent.find((c) => c.id === 'c2');
  assert.deepEqual(c2.messages.at(-1), { from: 'u01', text: '好啊，三點', at: now.toISOString() });
  assert.equal(c2.lastRead.u01, now.toISOString(), '自己傳訊息等於已讀到最新');
  assert.throws(() => Chat.send(base, 'c2', 'u01', '   ', now), /空白/);
  assert.throws(() => Chat.send(base, 'c2', 'u01', '字'.repeat(501), now), /500/);
  assert.throws(() => Chat.send(base, 'c2', 'u09', 'hi', now), /成員/);
  assert.throws(() => Chat.send(base, 'nope', 'u01', 'hi', now), /nope/);
});

test('時間顯示：今天顯示時刻、昨天、一週內顯示星期、更早顯示日期', () => {
  assert.equal(Chat.formatListTime(at(7, 20, 41), now), '20:41');
  assert.equal(Chat.formatListTime(at(6, 16, 12), now), '昨天');
  assert.equal(Chat.formatListTime(at(4, 11, 4), now), '週日');
  assert.equal(Chat.formatListTime(at(1, 9, 0), now), '週四', '6 天前仍在一週內');
  assert.equal(Chat.formatListTime(new Date(2026, 8, 28, 9, 0).toISOString(), now), '9/28');
  assert.equal(Chat.formatDivider(at(7, 20, 38), now), '今天 20:38');
  assert.equal(Chat.formatDivider(at(6, 16, 12), now), '昨天 16:12');
  assert.equal(Chat.formatDivider(at(4, 9, 5), now), '週日 09:05');
});

test('模擬對話：成員都存在，且每段對話的關係分數都達到可聊天門檻', () => {
  const byId = new Map(DB.users.map((u) => [u.id, u]));
  const points = (from, to) => (DB.ratings.find((r) => r.kind === 'person' && r.from === from && r.to === to) || { points: 0 }).points;
  for (const c of MOCK_CHATS.conversations) {
    const [a, b] = c.members;
    assert.ok(byId.has(a) && byId.has(b), `${c.id} 的成員不存在`);
    for (const m of c.messages) assert.ok(c.members.includes(m.from), `${c.id} 有非成員的訊息`);
    const score = points(a, b) + points(b, a);
    assert.ok(L.canOpenChat(score), `${c.id}（${a}↔${b}）關係分數只有 ${score}%，還不能聊天`);
  }
});

test('demo 豐富度：每位用戶都有人給他加過分，登入後看得到「給你 +N」', () => {
  const lonely = DB.users.filter((u) => !DB.ratings.some((r) => r.kind === 'person' && r.to === u.id && r.points > 0));
  assert.deepEqual(lonely.map((u) => u.id), []);
});

test('demo 豐富度：除了留給空狀態示範的 u09，每位用戶都至少有一段對話', () => {
  const noChat = DB.users.filter((u) => !MOCK_CHATS.conversations.some((c) => c.members.includes(u.id)));
  assert.deepEqual(noChat.map((u) => u.id), ['u09']);
  assert.ok(MOCK_CHATS.conversations.length >= 9, `對話只有 ${MOCK_CHATS.conversations.length} 段`);
  for (const c of MOCK_CHATS.conversations) assert.ok(c.messages.length >= 3, `${c.id} 訊息太少`);
});

test('demo 情境：u01 第一次幫周品妤加分可留言；u12 再按一次 + 就和林秀蘭配對成功', () => {
  const rating = (from, to) => DB.ratings.find((r) => r.kind === 'person' && r.from === from && r.to === to);
  assert.equal(rating('u01', 'u09'), undefined);
  assert.ok(rating('u09', 'u01').points > 0);
  assert.equal(rating('u12', 'u11'), undefined);
  assert.ok(rating('u11', 'u12').points > 0);
});

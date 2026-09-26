const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/match-logic.js');
const DB = require('../data/mock-data.js');

const female = { id: 'f', gender: 'female', age: 27 };
const male = { id: 'm', gender: 'male', age: 29 };
const female2 = { id: 'f2', gender: 'female', age: 30 };

test('評分上限：異性女 60 男 40、同性各 50、寵物各 50', () => {
  assert.equal(L.capFor(female, male, 'person'), 60);
  assert.equal(L.capFor(male, female, 'person'), 40);
  assert.equal(L.capFor(female, female2, 'person'), 50);
  assert.equal(L.capFor(female, male, 'pet'), 50);
  assert.equal(L.capFor(male, female, 'pet'), 50);
});

test('每次 ±5，且不能低於 0 或超過上限', () => {
  assert.equal(L.applyDelta(0, 1, 40), 5);
  assert.equal(L.applyDelta(5, -1, 40), 0);
  assert.throws(() => L.applyDelta(0, -1, 40), /0/);
  assert.throws(() => L.applyDelta(40, 1, 40), /上限/);
  assert.throws(() => L.applyDelta(10, 2, 40), /delta/);
});

test('初始只能 +，到上限只能 -', () => {
  assert.equal(L.canDecrease(0), false);
  assert.equal(L.canIncrease(0, 60), true);
  assert.equal(L.canIncrease(60, 60), false);
  assert.equal(L.canDecrease(60), true);
});

test('只有第一次 + 可以留一句話', () => {
  assert.equal(L.canLeaveMessage(undefined), true);
  assert.equal(L.canLeaveMessage({ points: 0, messageUsed: false }), true);
  assert.equal(L.canLeaveMessage({ points: 0, messageUsed: true }), false);
});

test('關係分數為雙方加總；雙方都按過 + 才算配對成功', () => {
  assert.equal(L.relationshipScore(20, 35), 55);
  assert.equal(L.isMatched(5, 5), true);
  assert.equal(L.isMatched(5, 0), false);
  assert.equal(L.isMatched(0, 0), false);
});

test('長輩模式：65 歲以上才可使用，且預設開啟', () => {
  assert.equal(L.isSeniorEligible({ age: 64 }), false);
  assert.equal(L.isSeniorEligible({ age: 65 }), true);
  assert.equal(L.defaultMode({ age: 70 }), 'senior');
  assert.equal(L.defaultMode({ age: 30 }), 'person');
});

test('距離：高雄火車站到高師大和平校區約 3 公里', () => {
  const station = { lat: 22.6394, lng: 120.3024 };
  const nknu = { lat: 22.6252, lng: 120.3150 };
  const km = L.distanceKm(station, nknu);
  assert.ok(km > 1.5 && km < 3, `got ${km}`);
});

test('共同興趣', () => {
  assert.deepEqual(L.sharedInterests(['登山', '咖啡', '電影'], ['電影', '登山']), ['登山', '電影']);
});

const pool = [
  { id: 'me', gender: 'male', age: 28, lat: 22.62, lng: 120.31, interests: ['登山'], school: 'A', jobCategory: '科技' },
  { id: 'a', gender: 'female', age: 26, lat: 22.62, lng: 120.31, interests: ['登山', '咖啡'], school: 'A', jobCategory: '教育' },
  { id: 'b', gender: 'female', age: 40, lat: 23.00, lng: 120.20, interests: ['電影'], school: 'B', jobCategory: '科技' },
  { id: 'c', gender: 'male', age: 30, lat: 22.62, lng: 120.31, interests: ['登山'], school: 'A', jobCategory: '科技' },
  { id: 'd', gender: 'female', age: 70, lat: 22.62, lng: 120.31, interests: ['登山'], school: 'A', jobCategory: '退休' },
];
const me = pool[0];
const ids = (list) => list.map((u) => u.id);

test('篩選：排除自己，並依性別、年齡、距離、興趣、學校、工作過濾', () => {
  assert.deepEqual(ids(L.filterPeople(pool, me, {})), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(L.filterPeople(pool, me, { gender: 'female' })), ['a', 'b', 'd']);
  assert.deepEqual(ids(L.filterPeople(pool, me, { ageMin: 25, ageMax: 35 })), ['a', 'c']);
  assert.deepEqual(ids(L.filterPeople(pool, me, { maxKm: 10 })), ['a', 'c', 'd']);
  assert.deepEqual(ids(L.filterPeople(pool, me, { interests: ['咖啡'] })), ['a']);
  assert.deepEqual(ids(L.filterPeople(pool, me, { school: 'B' })), ['b']);
  assert.deepEqual(ids(L.filterPeople(pool, me, { jobCategory: '科技' })), ['b', 'c']);
});

test('篩選：長輩模式只留 65 歲以上', () => {
  assert.deepEqual(ids(L.filterPeople(pool, me, { seniorOnly: true })), ['d']);
});

test('寵物篩選：排除自己的寵物，依種類、體型、個性過濾', () => {
  const pets = [
    { id: 'p1', ownerId: 'me', species: '狗', size: '中型', personality: ['親人'] },
    { id: 'p2', ownerId: 'a', species: '狗', size: '小型', personality: ['親人', '活潑'] },
    { id: 'p3', ownerId: 'b', species: '貓', size: '小型', personality: ['獨立'] },
  ];
  assert.deepEqual(ids(L.filterPets(pets, 'me', {})), ['p2', 'p3']);
  assert.deepEqual(ids(L.filterPets(pets, 'me', { species: '貓' })), ['p3']);
  assert.deepEqual(ids(L.filterPets(pets, 'me', { size: '小型', personality: ['活潑'] })), ['p2']);
});

test('模擬資料：10~15 位用戶、欄位齊全、有 65+ 用戶與寵物', () => {
  const users = DB.users;
  assert.ok(users.length >= 10 && users.length <= 15, `users: ${users.length}`);
  for (const u of users) {
    for (const key of ['id', 'name', 'gender', 'age', 'lat', 'lng', 'job', 'jobCategory', 'school', 'interests', 'pets']) {
      assert.ok(key in u, `${u.id} 缺少 ${key}`);
    }
  }
  assert.ok(users.filter((u) => u.age >= 65).length >= 3, '65+ 用戶至少 3 位');
  const pets = L.allPets(users);
  assert.ok(pets.length >= 5, '寵物至少 5 隻');
  for (const p of pets) assert.ok(p.ownerId, `${p.id} 缺少 ownerId`);
  assert.ok(users.some((u) => u.id === DB.currentUserId), 'currentUserId 必須存在');
});

test('模擬資料：預設評分都在上限內且為 5 的倍數', () => {
  const byId = Object.fromEntries(DB.users.map((u) => [u.id, u]));
  const petOwner = Object.fromEntries(L.allPets(DB.users).map((p) => [p.id, byId[p.ownerId]]));
  for (const r of DB.ratings) {
    const from = r.kind === 'pet' ? petOwner[r.from] : byId[r.from];
    const to = r.kind === 'pet' ? petOwner[r.to] : byId[r.to];
    assert.ok(from && to, `評分 ${r.from}->${r.to} 對象不存在`);
    assert.equal(r.points % 5, 0);
    assert.ok(r.points > 0 && r.points <= L.capFor(from, to, r.kind), `評分 ${r.from}->${r.to} 超過上限`);
  }
});

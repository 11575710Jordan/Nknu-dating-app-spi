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

const validPet = {
  name: '湯圓', species: '貓', breed: '布偶貓', gender: '母', age: '2', size: '中型',
  personality: ['親人'], appearance: '藍眼長毛', bio: '',
};

test('新增寵物：合法資料沒有錯誤，並把年齡轉成數字', () => {
  const { errors, pet } = L.validatePet(validPet);
  assert.deepEqual(errors, {});
  assert.equal(pet.age, 2);
  assert.equal(pet.name, '湯圓');
});

test('新增寵物：必填欄位、長度、範圍與選項都要檢查', () => {
  const { errors } = L.validatePet({
    ...validPet, name: ' ', species: '恐龍', breed: '', gender: '', age: '31', size: '超大', personality: [],
  });
  assert.deepEqual(Object.keys(errors).sort(), ['age', 'breed', 'gender', 'name', 'personality', 'size', 'species']);
  assert.match(L.validatePet({ ...validPet, name: '一二三四五六七八九十一二三' }).errors.name, /12/);
  assert.match(L.validatePet({ ...validPet, age: '1.5' }).errors.age, /整數/);
  assert.match(L.validatePet({ ...validPet, personality: ['a', 'b', 'c', 'd', 'e', 'f'] }).errors.personality, /5/);
  assert.match(L.validatePet({ ...validPet, bio: '字'.repeat(61) }).errors.bio, /60/);
});

test('新增寵物：照片只收圖片且不超過 10 MB', () => {
  assert.equal(L.validatePhoto({ type: 'image/jpeg', size: 3 * 1024 * 1024 }), null);
  assert.match(L.validatePhoto({ type: 'application/pdf', size: 100 }), /圖片/);
  assert.match(L.validatePhoto({ type: 'image/png', size: 11 * 1024 * 1024 }), /10 MB/);
});

test('新增寵物：id 接在現有最大編號之後', () => {
  assert.equal(L.nextPetId([{ id: 'p01' }, { id: 'p12' }, { id: 'p03' }]), 'p13');
  assert.equal(L.nextPetId([]), 'p01');
});

test('測試帳號：可輸入 id（不分大小寫）或完整姓名，找不到回傳 null', () => {
  const users = [{ id: 'u01', name: '陳彥廷' }, { id: 'u02', name: '林予晴' }];
  assert.equal(L.resolveAccount(users, ' U02 ').id, 'u02');
  assert.equal(L.resolveAccount(users, '陳彥廷').id, 'u01');
  assert.equal(L.resolveAccount(users, 'u99'), null);
  assert.equal(L.resolveAccount(users, ''), null);
});

test('寵物清單：同 id 取代（編輯），新 id 附加在最後（新增）', () => {
  const list = [{ id: 'p01', name: '豆花' }, { id: 'p02', name: '麻糬' }];
  assert.deepEqual(L.upsertPet(list, { id: 'p01', name: '豆花二號' }).map((p) => p.name), ['豆花二號', '麻糬']);
  assert.deepEqual(L.upsertPet(list, { id: 'p03', name: '湯圓' }).map((p) => p.id), ['p01', 'p02', 'p03']);
  assert.equal(list[0].name, '豆花', '不可改動原陣列');
});

test('刪除寵物時，移除牠給出與收到的寵物評分，人的評分不受影響', () => {
  const ratings = [
    { kind: 'pet', from: 'p01', to: 'p05' },
    { kind: 'pet', from: 'p05', to: 'p01' },
    { kind: 'pet', from: 'p05', to: 'p06' },
    { kind: 'person', from: 'p01', to: 'u02' },
  ];
  const left = L.removeRatingsOf(ratings, 'pet', 'p01');
  assert.deepEqual(left.map((r) => `${r.kind}:${r.from}>${r.to}`), ['pet:p05>p06', 'person:p01>u02']);
});

test('已啟用的篩選條件數：和預設值不同的欄位才算', () => {
  const defaults = { gender: 'all', maxKm: 30, interests: [], school: '' };
  assert.equal(L.activeFilterCount(defaults, defaults), 0);
  assert.equal(L.activeFilterCount({ ...defaults, gender: 'female', interests: ['登山'] }, defaults), 2);
  assert.equal(L.activeFilterCount({ ...defaults, maxKm: 10 }, defaults), 1);
});

test('照片切換：不循環，停在第一張和最後一張', () => {
  assert.equal(L.stepPhoto(0, 1, 3), 1);
  assert.equal(L.stepPhoto(2, 1, 3), 2);
  assert.equal(L.stepPhoto(0, -1, 3), 0);
  assert.equal(L.stepPhoto(5, -1, 3), 1, '索引超出範圍時先收斂再移動');
});

test('寵物照片最多 4 張', () => {
  assert.equal(L.validatePhotoCount(2, 2), null);
  assert.match(L.validatePhotoCount(3, 2), /4 張/);
});

test('點數輸入：只接受 1~10000 的正整數', () => {
  assert.deepEqual(L.parsePointsInput(' 50 '), { value: 50 });
  assert.match(L.parsePointsInput('').error, /輸入/);
  assert.match(L.parsePointsInput('0').error, /1/);
  assert.match(L.parsePointsInput('2.5').error, /整數/);
  assert.match(L.parsePointsInput('abc').error, /整數/);
  assert.match(L.parsePointsInput('10001').error, /10000/);
});

test('加點數：回傳新錢包，不改動原本的', () => {
  const wallet = { points: 40, unlocked: [] };
  assert.deepEqual(L.addPoints(wallet, 100), { points: 140, unlocked: [] });
  assert.equal(wallet.points, 40);
});

test('解鎖動態：每個對象 30 點、永久解鎖、點數不足或重複解鎖都要擋下', () => {
  const key = L.momentKey('person', 'u02');
  assert.equal(key, 'person:u02');
  const after = L.unlockMoments({ points: 40, unlocked: [] }, key);
  assert.deepEqual(after, { points: 10, unlocked: ['person:u02'] });
  assert.equal(L.isUnlocked(after, key), true);
  assert.equal(L.isUnlocked(after, 'pet:p05'), false);
  assert.throws(() => L.unlockMoments(after, key), /已解鎖/);
  assert.throws(() => L.unlockMoments(after, 'pet:p05'), /點數不足/);
  assert.equal(L.UNLOCK_COST, 30);
});

test('課金方案：價格與點數皆為正整數', () => {
  assert.ok(L.TOPUP_PLANS.length >= 3);
  for (const plan of L.TOPUP_PLANS) {
    assert.ok(Number.isInteger(plan.price) && plan.price > 0);
    assert.ok(Number.isInteger(plan.points) && plan.points > 0);
  }
});

test('模擬資料：每位用戶與寵物都有多張照片與動態，用戶有初始點數', () => {
  for (const u of DB.users) {
    assert.ok(u.photos.length >= 2, `${u.id} 照片少於 2 張`);
    assert.ok(u.moments.length >= 1, `${u.id} 沒有動態`);
    assert.ok(Number.isInteger(u.points) && u.points >= 0, `${u.id} 點數不正確`);
    for (const p of u.pets) {
      assert.ok(p.photos.length >= 2, `${p.id} 照片少於 2 張`);
      assert.ok(p.moments.length >= 1, `${p.id} 沒有動態`);
    }
  }
});

test('照片清晰度：關係分數 0% 最模糊、隨分數線性變清楚、60% 以上完全清晰', () => {
  assert.equal(L.PHOTO_CLEAR_SCORE, 60);
  assert.equal(L.photoVeil(0), 1);
  assert.equal(L.photoVeil(30), 0.5);
  assert.equal(L.photoVeil(55), 1 / 12);
  assert.equal(L.photoVeil(60), 0);
  assert.equal(L.photoVeil(100), 0);
});

/* =========================================================
   配對頁純邏輯（不碰 DOM，可在 Node 以 `npm test` 測試）
   瀏覽器：<script src="../js/match-logic.js"> 後使用全域 MatchLogic
   ========================================================= */
const MatchLogic = (() => {
  const STEP = 5;
  const SENIOR_AGE = 65;

  /**
   * 評分者在這段關係中最多能給的分數。
   * 寵物：雙方各 50；人：同性各 50，異性女 60 / 男 40。
   */
  function capFor(rater, target, kind) {
    if (kind === 'pet') return 50;
    if (rater.gender === target.gender) return 50;
    return rater.gender === 'female' ? 60 : 40;
  }

  function canIncrease(points, cap) {
    return points + STEP <= cap;
  }

  /** 初始（0 分）只能加分 */
  function canDecrease(points) {
    return points - STEP >= 0;
  }

  /** delta 只接受 +1 / -1，代表按一次 + 或 - */
  function applyDelta(points, delta, cap) {
    if (delta !== 1 && delta !== -1) throw new Error(`delta 只能是 1 或 -1，收到 ${delta}`);
    if (delta === 1 && !canIncrease(points, cap)) throw new Error(`已達上限 ${cap}，不能再加分`);
    if (delta === -1 && !canDecrease(points)) throw new Error('分數為 0 時不能扣分');
    return points + delta * STEP;
  }

  /** 第一次按 + 才能留一句話，之後就算扣回 0 也不能再留 */
  function canLeaveMessage(record) {
    return !record || !record.messageUsed;
  }

  function relationshipScore(myPoints, theirPoints) {
    return myPoints + theirPoints;
  }

  function isMatched(myPoints, theirPoints) {
    return myPoints > 0 && theirPoints > 0;
  }

  function isSeniorEligible(user) {
    return user.age >= SENIOR_AGE;
  }

  function defaultMode(user) {
    return isSeniorEligible(user) ? 'senior' : 'person';
  }

  /** 兩點間直線距離（公里，Haversine 公式） */
  function distanceKm(a, b) {
    const R = 6371;
    const rad = (deg) => (deg * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function sharedInterests(mine, theirs) {
    return mine.filter((item) => theirs.includes(item));
  }

  const includesAll = (list, required) => required.every((item) => list.includes(item));

  /**
   * filters: { gender, ageMin, ageMax, maxKm, interests[], school, jobCategory, seniorOnly }
   * 沒給的條件不過濾；interests 為「全部都要有」。
   */
  function filterPeople(users, me, filters) {
    const f = filters || {};
    return users.filter((u) => {
      if (u.id === me.id) return false;
      if (f.seniorOnly && !isSeniorEligible(u)) return false;
      if (f.gender && f.gender !== 'all' && u.gender !== f.gender) return false;
      if (f.ageMin != null && u.age < f.ageMin) return false;
      if (f.ageMax != null && u.age > f.ageMax) return false;
      if (f.maxKm != null && distanceKm(me, u) > f.maxKm) return false;
      if (f.interests && !includesAll(u.interests, f.interests)) return false;
      if (f.school && u.school !== f.school) return false;
      if (f.jobCategory && u.jobCategory !== f.jobCategory) return false;
      return true;
    });
  }

  /** 攤平所有用戶的寵物，並補上 ownerId */
  function allPets(users) {
    return users.flatMap((u) => u.pets.map((p) => ({ ...p, ownerId: u.id })));
  }

  /** filters: { species, size, personality[] } */
  function filterPets(pets, myId, filters) {
    const f = filters || {};
    return pets.filter((p) => {
      if (p.ownerId === myId) return false;
      if (f.species && p.species !== f.species) return false;
      if (f.size && p.size !== f.size) return false;
      if (f.personality && !includesAll(p.personality, f.personality)) return false;
      return true;
    });
  }

  const PET_SPECIES = ['狗', '貓', '兔', '其他'];
  const PET_GENDERS = ['公', '母'];
  const PET_SIZES = ['小型', '中型', '大型'];
  const PHOTO_MAX_MB = 10;

  /**
   * 驗證新增寵物表單。回傳 { errors: {欄位: 訊息}, pet: 整理後的資料 }
   * errors 為空物件代表可以儲存。
   */
  function validatePet(input) {
    const pet = {
      name: String(input.name || '').trim(),
      species: input.species,
      breed: String(input.breed || '').trim(),
      gender: input.gender,
      age: Number(input.age),
      size: input.size,
      personality: input.personality || [],
      appearance: String(input.appearance || '').trim(),
      bio: String(input.bio || '').trim(),
    };
    const errors = {};
    if (!pet.name) errors.name = '請輸入寵物的名字。';
    else if (pet.name.length > 12) errors.name = '名字最多 12 個字。';
    if (!PET_SPECIES.includes(pet.species)) errors.species = '請選擇種類。';
    if (!pet.breed) errors.breed = '請輸入品種，不確定可以寫「米克斯」。';
    else if (pet.breed.length > 20) errors.breed = '品種最多 20 個字。';
    if (!PET_GENDERS.includes(pet.gender)) errors.gender = '請選擇性別。';
    if (input.age === '' || input.age == null || Number.isNaN(pet.age)) errors.age = '請輸入年齡。';
    else if (!Number.isInteger(pet.age)) errors.age = '年齡請輸入整數，未滿 1 歲請填 0。';
    else if (pet.age < 0 || pet.age > 30) errors.age = '年齡請介於 0 到 30 歲。';
    if (!PET_SIZES.includes(pet.size)) errors.size = '請選擇體型。';
    if (pet.personality.length === 0) errors.personality = '至少選一個個性。';
    else if (pet.personality.length > 5) errors.personality = '個性最多選 5 個。';
    if (pet.appearance.length > 30) errors.appearance = '外觀描述最多 30 個字。';
    if (pet.bio.length > 60) errors.bio = '介紹最多 60 個字。';
    return { errors, pet };
  }

  /** file: { type, size }；合法回傳 null，否則回傳錯誤訊息 */
  function validatePhoto(file) {
    if (!file.type.startsWith('image/')) return '只能上傳圖片檔（JPG、PNG 等）。';
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `檔案超過 ${PHOTO_MAX_MB} MB，請壓縮後再試一次。`;
    return null;
  }

  function nextPetId(pets) {
    const max = pets.reduce((m, p) => Math.max(m, Number(p.id.slice(1)) || 0), 0);
    return `p${String(max + 1).padStart(2, '0')}`;
  }

  /** 同 id 取代（編輯），否則附加（新增）；回傳新陣列 */
  function upsertPet(list, pet) {
    return list.some((p) => p.id === pet.id)
      ? list.map((p) => (p.id === pet.id ? pet : p))
      : [...list, pet];
  }

  /** 移除某個對象（kind 相同）給出與收到的評分 */
  function removeRatingsOf(ratings, kind, id) {
    return ratings.filter((r) => r.kind !== kind || (r.from !== id && r.to !== id));
  }

  /** 以 id（不分大小寫）或完整姓名找測試帳號 */
  function resolveAccount(users, input) {
    const text = String(input || '').trim();
    if (!text) return null;
    return users.find((u) => u.id.toLowerCase() === text.toLowerCase() || u.name === text) || null;
  }

  /** 和預設值不同的篩選欄位數，給篩選按鈕上的數字用 */
  function activeFilterCount(filters, defaults) {
    return Object.keys(defaults).filter((key) => JSON.stringify(filters[key]) !== JSON.stringify(defaults[key])).length;
  }

  return {
    STEP, SENIOR_AGE, PET_SPECIES, PET_GENDERS, PET_SIZES,
    validatePet, validatePhoto, nextPetId,
    upsertPet, removeRatingsOf, resolveAccount, activeFilterCount,
    capFor, canIncrease, canDecrease, applyDelta, canLeaveMessage,
    relationshipScore, isMatched, isSeniorEligible, defaultMode,
    distanceKm, sharedInterests, filterPeople, allPets, filterPets,
  };
})();

if (typeof module !== 'undefined') module.exports = MatchLogic;

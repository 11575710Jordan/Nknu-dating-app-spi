/* =========================================================
   配對頁畫面邏輯
   依賴：../data/mock-data.js（MOCK_DB）、../js/match-logic.js（MatchLogic）
   評分結果存在 localStorage，模擬「後端已保存」；可用示範工具重設
   ========================================================= */
(() => {
  'use strict';

  const L = MatchLogic;
  const STORAGE_KEY = 'nknu-match-demo-v1';
  const MESSAGE_MAX = 40;
  const DISTANCE_MAX = 30;
  const MODES = [
    { id: 'person', label: '一般', icon: 'i-people' },
    { id: 'pet', label: '寵物', icon: 'i-paw' },
    { id: 'senior', label: '長輩', icon: 'i-sun' },
  ];
  const GENDER_LABEL = { female: '女', male: '男' };
  const PHOTO_EDGE = 800; // 上傳照片縮到長邊 800px 再存，避免塞爆 localStorage

  const $ = (id) => document.getElementById(id);
  const el = {
    title: $('match-title'), subtitle: $('match-subtitle'),
    modes: $('mode-switch'), petPicker: $('pet-picker'),
    filterToggle: $('filter-toggle'), filter: $('filter-panel'),
    stage: $('match-stage'),
    matchedList: $('matched-list'), matchedCount: $('matched-count'),
    incomingList: $('incoming-list'), incomingCount: $('incoming-count'),
    demoUser: $('demo-user'), demoReset: $('demo-reset'),
    modalRoot: $('modal-root'),
  };

  /* ---------- 狀態 ---------- */
  const saved = loadSaved();
  const state = {
    meId: saved && MOCK_DB.users.some((u) => u.id === saved.meId) ? saved.meId : MOCK_DB.currentUserId,
    ratings: saved ? saved.ratings : structuredClone(MOCK_DB.ratings),
    addedPets: (saved && saved.addedPets) || {}, // { userId: [寵物] }，使用者在頁面上新增的寵物
    mode: 'person',
    petId: null,
    index: 0,
    filters: null,
  };

  /* 模擬資料 + 新增的寵物合併後的索引；新增寵物後要重建 */
  let users, usersById, pets, petsById;
  function rebuildIndex() {
    users = MOCK_DB.users.map((u) => ({ ...u, pets: [...u.pets, ...(state.addedPets[u.id] || [])] }));
    usersById = new Map(users.map((u) => [u.id, u]));
    pets = L.allPets(users);
    petsById = new Map(pets.map((p) => [p.id, p]));
  }
  rebuildIndex();

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('[match] 讀取 localStorage 失敗，改用預設模擬資料', err);
      return null;
    }
  }

  /** 寫入成功回傳 true；失敗（例如容量不足）回傳 false 讓呼叫端決定怎麼處理 */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meId: state.meId, ratings: state.ratings, addedPets: state.addedPets }));
      return true;
    } catch (err) {
      console.warn('[match] 無法寫入 localStorage，重新整理後資料會消失', err);
      return false;
    }
  }

  function defaultFilters(me) {
    return {
      person: { gender: me.lookingFor, ageMin: null, ageMax: null, maxKm: DISTANCE_MAX, interests: [], school: '', jobCategory: '' },
      senior: { gender: me.lookingFor, maxKm: DISTANCE_MAX },
      pet: { species: '', size: '', personality: [] },
    };
  }

  function resetForUser() {
    const me = currentUser();
    state.mode = L.defaultMode(me);
    state.petId = me.pets.length ? me.pets[0].id : null;
    state.index = 0;
    state.filters = defaultFilters(me);
  }

  const currentUser = () => usersById.get(state.meId);
  const kindOf = (mode) => (mode === 'pet' ? 'pet' : 'person');

  /** 目前「我方」的 id：一般／長輩模式是自己，寵物模式是選中的寵物 */
  const myEntityId = () => (state.mode === 'pet' ? state.petId : state.meId);

  /* ---------- 評分資料存取 ---------- */
  function findRating(kind, from, to) {
    return state.ratings.find((r) => r.kind === kind && r.from === from && r.to === to);
  }

  function pointsOf(kind, from, to) {
    const record = findRating(kind, from, to);
    return record ? record.points : 0;
  }

  function ownerOf(kind, id) {
    return kind === 'pet' ? usersById.get(petsById.get(id).ownerId) : usersById.get(id);
  }

  function pairInfo(kind, myId, theirId) {
    const myOwner = ownerOf(kind, myId);
    const theirOwner = ownerOf(kind, theirId);
    const mine = pointsOf(kind, myId, theirId);
    const theirs = pointsOf(kind, theirId, myId);
    return {
      mine, theirs,
      myCap: L.capFor(myOwner, theirOwner, kind),
      theirCap: L.capFor(theirOwner, myOwner, kind),
      total: L.relationshipScore(mine, theirs),
      matched: L.isMatched(mine, theirs),
    };
  }

  /* ---------- 卡池 ---------- */
  const distanceTo = (user) => L.distanceKm(currentUser(), user);

  /** 模式本身的硬性條件（不含使用者篩選），給右側清單用 */
  function basePool(mode) {
    const me = currentUser();
    if (mode === 'pet') return L.filterPets(pets, me.id, {});
    return L.filterPeople(users, me, { seniorOnly: mode === 'senior' });
  }

  function currentPool() {
    const me = currentUser();
    if (state.mode === 'pet') {
      if (!state.petId) return [];
      return L.filterPets(pets, me.id, state.filters.pet)
        .sort((a, b) => distanceTo(usersById.get(a.ownerId)) - distanceTo(usersById.get(b.ownerId)));
    }
    const f = state.mode === 'senior' ? { ...state.filters.senior, seniorOnly: true } : state.filters.person;
    return L.filterPeople(users, me, f).sort((a, b) => distanceTo(a) - distanceTo(b));
  }

  /* ---------- 小工具 ---------- */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const lastChar = (name) => esc(Array.from(name).pop());
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const unique = (list) => [...new Set(list)];

  function displayName(kind, id) {
    return kind === 'pet' ? petsById.get(id).name : usersById.get(id).name;
  }

  function toneOf(kind, id) {
    return ownerOf(kind, id).photoTone;
  }

  function avatar(kind, id, extraClass = '') {
    return `<span class="dp-avatar match-tone-${toneOf(kind, id)} ${extraClass}">${lastChar(displayName(kind, id))}</span>`;
  }

  function photo(entity, tone) {
    if (entity.photo) return `<img src="${esc(entity.photo)}" alt="${esc(entity.name)}的照片">`;
    return `<div class="match-photo match-tone-${tone}" aria-hidden="true">${lastChar(entity.name)}</div>`;
  }

  /* ---------- 頁首、模式、寵物選擇 ---------- */
  function renderHeader(poolSize) {
    const me = currentUser();
    if (state.mode === 'pet') {
      const myPet = state.petId ? petsById.get(state.petId) : null;
      el.title.textContent = myPet ? `幫${myPet.name}找朋友` : '寵物模式';
      el.subtitle.textContent = myPet ? `共 ${poolSize} 隻寵物，寵物配對雙方各佔 50%。` : '新增寵物後，就能用寵物身分配對。';
    } else if (state.mode === 'senior') {
      el.title.textContent = '長輩模式';
      el.subtitle.textContent = `只顯示 65 歲以上的朋友，共 ${poolSize} 位。`;
    } else {
      el.title.textContent = '今天想認識誰？';
      el.subtitle.textContent = `共 ${poolSize} 位，依距離由近到遠排列。${me.name}你好！`;
    }
    document.documentElement.classList.toggle('match--senior', state.mode === 'senior');
  }

  function renderModes() {
    const me = currentUser();
    el.modes.innerHTML = MODES
      .filter((m) => m.id !== 'senior' || L.isSeniorEligible(me))
      .map((m) => `<button class="dp-tag" type="button" data-mode="${m.id}" aria-pressed="${state.mode === m.id}">${icon(m.icon)}${m.label}模式</button>`)
      .join('');
  }

  function renderPetPicker() {
    const me = currentUser();
    const show = state.mode === 'pet' && me.pets.length > 0;
    el.petPicker.hidden = !show;
    if (!show) return;
    el.petPicker.innerHTML = `<span class="dp-sm dp-muted">用哪隻寵物配對：</span>` + me.pets
      .map((p) => `<button class="dp-tag" type="button" data-pet="${p.id}" aria-pressed="${state.petId === p.id}">${esc(p.name)}・${esc(p.breed)}</button>`)
      .join('')
      + `<button class="dp-tag" type="button" data-action="add-pet">${icon('i-plus')}新增寵物</button>`;
  }

  /* ---------- 篩選 ---------- */
  function selectField(id, label, value, options) {
    const opts = options.map(([v, text]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(text)}</option>`).join('');
    return `<div class="dp-field"><label class="dp-label" for="${id}">${label}</label><select class="dp-input" id="${id}" name="${id}">${opts}</select></div>`;
  }

  function distanceField(value) {
    return `<div class="dp-field">
      <label class="dp-label" for="f-km">距離</label>
      <div class="match-filter__range">
        <input type="range" id="f-km" name="f-km" min="1" max="${DISTANCE_MAX}" value="${value}">
        <output for="f-km" class="dp-sm">${value} 公里內</output>
      </div>
    </div>`;
  }

  function tagGroup(name, label, options, selected) {
    const tags = options.map((o) => `<button class="dp-tag" type="button" data-toggle="${name}" data-value="${esc(o)}" aria-pressed="${selected.includes(o)}">${esc(o)}</button>`).join('');
    return `<div class="dp-field"><span class="dp-label">${label}</span><div class="dp-tag-list">${tags}</div></div>`;
  }

  const genderOptions = [['all', '不限'], ['female', '女性'], ['male', '男性']];

  function renderFilters() {
    const f = state.filters[state.mode];
    let html;
    if (state.mode === 'pet') {
      html = `<div class="match-filter__grid">
          ${selectField('f-species', '種類', f.species, [['', '不限'], ...unique(pets.map((p) => p.species)).map((s) => [s, s])])}
          ${selectField('f-size', '體型', f.size, [['', '不限'], ['小型', '小型'], ['中型', '中型'], ['大型', '大型']])}
        </div>
        ${tagGroup('personality', '個性（全部符合）', unique(pets.flatMap((p) => p.personality)), f.personality)}`;
    } else if (state.mode === 'senior') {
      html = `<div class="match-filter__grid">
          ${selectField('f-gender', '想認識', f.gender, genderOptions)}
          ${distanceField(f.maxKm)}
        </div>`;
    } else {
      html = `<div class="match-filter__grid">
          ${selectField('f-gender', '想認識', f.gender, genderOptions)}
          <div class="dp-field">
            <label class="dp-label" for="f-age-min">年齡</label>
            <div class="match-filter__age">
              <input class="dp-input" type="number" id="f-age-min" name="f-age-min" min="18" max="99" placeholder="最小" value="${f.ageMin ?? ''}">
              <span aria-hidden="true">–</span>
              <input class="dp-input" type="number" id="f-age-max" name="f-age-max" min="18" max="99" placeholder="最大" aria-label="年齡上限" value="${f.ageMax ?? ''}">
            </div>
          </div>
          ${distanceField(f.maxKm)}
          ${selectField('f-school', '學校', f.school, [['', '不限'], ...unique(users.map((u) => u.school)).map((s) => [s, s])])}
          ${selectField('f-job', '工作領域', f.jobCategory, [['', '不限'], ...unique(users.map((u) => u.jobCategory)).map((s) => [s, s])])}
        </div>
        ${tagGroup('interests', '興趣（全部符合）', unique(users.flatMap((u) => u.interests)), f.interests)}`;
    }
    el.filter.innerHTML = html + `<div class="match-filter__foot">
        <span class="dp-xs dp-muted">條件會立即套用</span>
        <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-action="clear-filters">清除條件</button>
      </div>`;
  }

  function readNumber(name) {
    const input = el.filter.elements[name];
    return input && input.value !== '' ? Number(input.value) : null;
  }

  function readFilters() {
    const f = state.filters[state.mode];
    const form = el.filter.elements;
    if (state.mode === 'pet') {
      f.species = form['f-species'].value;
      f.size = form['f-size'].value;
      return;
    }
    f.gender = form['f-gender'].value;
    f.maxKm = readNumber('f-km');
    el.filter.querySelector('output').textContent = `${f.maxKm} 公里內`;
    if (state.mode === 'person') {
      f.ageMin = readNumber('f-age-min');
      f.ageMax = readNumber('f-age-max');
      f.school = form['f-school'].value;
      f.jobCategory = form['f-job'].value;
    }
  }

  function clearFilters() {
    state.filters[state.mode] = defaultFilters(currentUser())[state.mode];
    state.index = 0;
    renderFilters();
    renderStage();
  }

  /* ---------- 卡片 ---------- */
  function incomingBlock(kind, theirId, myId) {
    const record = findRating(kind, theirId, myId);
    if (!record || record.points === 0) return '';
    const quote = record.message ? `<span class="match-incoming__quote">「${esc(record.message)}」</span>` : '';
    return `<div class="match-incoming">${esc(displayName(kind, theirId))}給${kind === 'pet' ? esc(displayName(kind, myId)) : '你'}加了 ${record.points} 分${quote ? '，並留言：' : ''}${quote}</div>`;
  }

  function facts(rows) {
    return `<dl class="match-facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }

  function personCard(u) {
    const me = currentUser();
    const shared = L.sharedInterests(u.interests, me.interests);
    const tags = [
      u.verified ? `<span class="dp-tag dp-tag--verified">${icon('i-check')}已驗證</span>` : '',
      ...shared.map((i) => `<span class="dp-tag dp-tag--shared">${esc(i)}（共同興趣）</span>`),
      ...u.interests.filter((i) => !shared.includes(i)).map((i) => `<span class="dp-tag">${esc(i)}</span>`),
    ].join('');
    const prompts = u.prompts.map((p) => `<div class="dp-profile-card__prompt">
        <p class="dp-profile-card__prompt-q">${esc(p.q)}</p>
        <p class="dp-profile-card__prompt-a">${esc(p.a)}</p>
      </div>`).join('');
    const petTags = u.pets.length ? `<div>
        <p class="match-section-label">養的寵物</p>
        <div class="dp-tag-list">${u.pets.map((p) => `<span class="dp-tag">${icon('i-paw')}${esc(p.name)}・${esc(p.breed)}</span>`).join('')}</div>
      </div>` : '';

    return `<article class="dp-profile-card" aria-label="${esc(u.name)}的個人檔案">
      <div class="dp-profile-card__photo">
        ${photo(u, u.photoTone)}
        ${u.online ? `<div class="match-photo__badges"><span class="dp-tag dp-xs"><span class="match-online-dot"></span>在線上</span></div>` : ''}
        <div class="dp-profile-card__overlay">
          <div class="dp-profile-card__name">${esc(u.name)}，${u.age}</div>
          <div class="dp-profile-card__meta">${esc(u.job)}　距離 ${distanceTo(u).toFixed(1)} 公里</div>
        </div>
      </div>
      <div class="dp-profile-card__body">
        ${incomingBlock('person', u.id, me.id)}
        <div class="dp-tag-list">${tags}</div>
        ${facts([
          ['學校', u.school], ['學歷', u.education], ['身高', `${u.height} 公分`], ['星座', u.zodiac],
          ['想找的關係', u.relationshipGoal], ['地區', u.area], ['喝酒', u.drinking], ['抽菸', u.smoking],
        ])}
        ${prompts}
        ${petTags}
      </div>
    </article>`;
  }

  function petCard(p) {
    const owner = usersById.get(p.ownerId);
    const myPet = petsById.get(state.petId);
    const shared = L.sharedInterests(p.personality, myPet.personality);
    const tags = p.personality.map((t) => `<span class="dp-tag${shared.includes(t) ? ' dp-tag--shared' : ''}">${esc(t)}${shared.includes(t) ? `（和${esc(myPet.name)}一樣）` : ''}</span>`).join('');

    return `<article class="dp-profile-card" aria-label="${esc(p.name)}的寵物檔案">
      <div class="dp-profile-card__photo">
        ${photo(p, owner.photoTone)}
        <div class="match-photo__badges"><span class="dp-tag dp-xs">${icon('i-paw')}${esc(p.species)}</span></div>
        <div class="dp-profile-card__overlay">
          <div class="dp-profile-card__name">${esc(p.name)}，${p.age} 歲</div>
          <div class="dp-profile-card__meta">${esc(p.breed)}・${esc(p.size)}　距離 ${distanceTo(owner).toFixed(1)} 公里</div>
        </div>
      </div>
      <div class="dp-profile-card__body">
        ${incomingBlock('pet', p.id, myPet.id)}
        <div class="dp-tag-list">${tags}</div>
        ${facts([
          ['品種', p.breed], ['性別', p.gender], ['體型', p.size], ['外觀', p.appearance],
          ['主人', `${owner.name}（${GENDER_LABEL[owner.gender]}，${owner.age}）`], ['地區', owner.area],
        ])}
        <div class="dp-profile-card__prompt">
          <p class="dp-profile-card__prompt-q">關於${esc(p.name)}</p>
          <p class="dp-profile-card__prompt-a">${esc(p.bio)}</p>
        </div>
      </div>
    </article>`;
  }

  /* ---------- 評分區 ---------- */
  function ratingBlock(kind, myId, theirId) {
    const info = pairInfo(kind, myId, theirId);
    const myRecord = findRating(kind, myId, theirId);
    const myLabel = kind === 'pet' ? displayName(kind, myId) : '你';
    const theirLabel = displayName(kind, theirId);

    let hint = '';
    if (info.matched) hint = '你們已配對成功，可以開始聊天了。';
    else if (info.mine === 0) hint = L.canLeaveMessage(myRecord) ? '按 + 給對方加分，第一次加分可以留一句話。' : '按 + 給對方加分。';
    else hint = `等${esc(theirLabel)}也加分，就會配對成功。`;

    const sent = myRecord && myRecord.message
      ? `<p class="match-rating__sent">${esc(myLabel)}留言：「${esc(myRecord.message)}」</p>` : '';

    return `<section class="match-rating" aria-label="評分">
      <div class="match-rating__head">
        <span class="dp-sm dp-muted">關係分數</span>
        <span class="match-rating__value">${info.total}%</span>
      </div>
      <div class="match-rating__bar" role="img" aria-label="${esc(myLabel)} ${info.mine} 分（上限 ${info.myCap}），${esc(theirLabel)} ${info.theirs} 分（上限 ${info.theirCap}）">
        <div class="match-rating__seg" style="flex-grow:${info.myCap}"><div class="match-rating__fill" style="width:${(info.mine / info.myCap) * 100}%"></div></div>
        <div class="match-rating__seg match-rating__seg--them" style="flex-grow:${info.theirCap}"><div class="match-rating__fill" style="width:${(info.theirs / info.theirCap) * 100}%"></div></div>
      </div>
      <div class="match-rating__legend">
        <span>${esc(myLabel)} <strong>+${info.mine}</strong> / ${info.myCap}</span>
        <span>${esc(theirLabel)} <strong>+${info.theirs}</strong> / ${info.theirCap}</span>
      </div>
      <div class="dp-actions">
        <button class="dp-action dp-action--pass" type="button" data-action="minus" aria-label="扣 ${L.STEP} 分"${L.canDecrease(info.mine) ? '' : ' disabled'}>${icon('i-minus')}</button>
        <button class="dp-action dp-action--like" type="button" data-action="plus" aria-label="加 ${L.STEP} 分"${L.canIncrease(info.mine, info.myCap) ? '' : ' disabled'}>${icon('i-plus')}</button>
      </div>
      <p class="match-rating__hint">${hint}</p>
      ${sent}
    </section>`;
  }

  function pager(total) {
    return `<div class="match-pager">
      <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-action="prev" aria-label="上一位">${icon('i-chevron-left')}上一位</button>
      <span class="dp-sm dp-muted">${state.index + 1} / ${total}</span>
      <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-action="next" aria-label="下一位">下一位${icon('i-chevron-right')}</button>
    </div>`;
  }

  function renderStage() {
    const pool = currentPool();
    renderHeader(pool.length);

    if (state.mode === 'pet' && !state.petId) {
      el.stage.innerHTML = `<div class="dp-panel dp-empty">
        <h2 class="dp-h3">你還沒有新增寵物</h2>
        <p class="dp-sm dp-muted dp-prose">填好寵物的品種、個性和照片，就能用寵物身分配對。</p>
        <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-action="add-pet">新增寵物</button>
      </div>`;
      return;
    }
    if (!pool.length) {
      el.stage.innerHTML = `<div class="dp-panel dp-empty">
        <h2 class="dp-h3">沒有符合條件的${state.mode === 'pet' ? '寵物' : '人'}</h2>
        <p class="dp-sm dp-muted dp-prose">放寬距離或少選幾個興趣，就會出現更多對象。</p>
        <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-action="clear-filters">清除篩選條件</button>
      </div>`;
      return;
    }

    state.index = Math.min(state.index, pool.length - 1);
    const target = pool[state.index];
    const kind = kindOf(state.mode);
    el.stage.innerHTML = (kind === 'pet' ? petCard(target) : personCard(target))
      + ratingBlock(kind, myEntityId(), target.id)
      + pager(pool.length);
  }

  /* ---------- 右側欄 ---------- */
  function listItem(kind, id, sub, trailing = '') {
    const title = kind === 'pet'
      ? `${esc(displayName(kind, id))}<span class="dp-xs dp-muted">（${esc(ownerOf(kind, id).name)}的${esc(petsById.get(id).species)}）</span>`
      : esc(displayName(kind, id));
    return `<li><button class="dp-list-item" type="button" data-jump="${id}">
      ${avatar(kind, id)}
      <span class="dp-list-item__text"><span class="dp-list-item__title">${title}</span><span class="dp-list-item__sub">${sub}</span></span>
      ${trailing}
    </button></li>`;
  }

  function renderAside() {
    const kind = kindOf(state.mode);
    const myId = myEntityId();
    const candidates = myId ? basePool(state.mode) : [];

    const matched = candidates.filter((c) => pairInfo(kind, myId, c.id).matched);
    el.matchedCount.textContent = `${matched.length} 位`;
    el.matchedList.innerHTML = matched.length
      ? matched.map((c) => listItem(kind, c.id, '雙方都加過分了', `<span class="match-score">${pairInfo(kind, myId, c.id).total}%</span>`)).join('')
      : '<li class="match-aside-empty">還沒有配對成功的對象，先給喜歡的人加分吧。</li>';

    const incoming = candidates.filter((c) => pointsOf(kind, c.id, myId) > 0 && pointsOf(kind, myId, c.id) === 0);
    el.incomingCount.textContent = `${incoming.length} 位`;
    el.incomingList.innerHTML = incoming.length
      ? incoming.map((c) => {
        const r = findRating(kind, c.id, myId);
        return listItem(kind, c.id, r.message ? esc(r.message) : `給你加了 ${r.points} 分`, `<span class="dp-badge">+${r.points}</span>`);
      }).join('')
      : '<li class="match-aside-empty">目前沒有人在等你回應。</li>';
  }

  function jumpTo(id) {
    const findIndex = () => currentPool().findIndex((item) => item.id === id);
    let index = findIndex();
    if (index < 0) {
      // 被篩選條件擋住：先回到預設條件，還找不到就放寬性別
      state.filters[state.mode] = defaultFilters(currentUser())[state.mode];
      if ('gender' in state.filters[state.mode]) state.filters[state.mode].gender = 'all';
      renderFilters();
      index = findIndex();
    }
    if (index < 0) {
      console.error(`[match] 在目前模式 ${state.mode} 的卡池找不到 ${id}`);
      return;
    }
    state.index = index;
    renderStage();
    el.stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- 彈窗 ---------- */
  let lastFocus = null;

  function openModal(html, onMount) {
    lastFocus = document.activeElement;
    el.modalRoot.innerHTML = `<div class="dp-modal-backdrop" data-backdrop>${html}</div>`;
    const dialog = el.modalRoot.querySelector('.dp-modal');
    onMount(dialog);
  }

  function closeModal() {
    el.modalRoot.innerHTML = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  el.modalRoot.addEventListener('click', (e) => {
    // 表單彈窗（data-keep-open）點背景不關閉，避免誤觸清掉填到一半的內容
    const onBackdrop = e.target.matches('[data-backdrop]') && !el.modalRoot.querySelector('[data-keep-open]');
    if (onBackdrop || e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.modalRoot.firstChild) closeModal();
  });

  function openMessageModal(theirName, onConfirm) {
    openModal(`<div class="dp-modal" role="dialog" aria-modal="true" aria-labelledby="msg-title">
        <h2 class="dp-h2" id="msg-title">留一句話給${esc(theirName)}</h2>
        <p class="dp-sm dp-muted">這是第一次加分，只有這一次可以留言。</p>
        <form class="match-modal__form" novalidate>
          <div class="dp-field">
            <label class="dp-label" for="first-message">想說的話</label>
            <input class="dp-input" id="first-message" maxlength="${MESSAGE_MAX}" autocomplete="off" placeholder="例如：你照片裡的步道是哪裡？" aria-describedby="first-message-help">
            <p class="dp-help match-modal__counter" id="first-message-help">0 / ${MESSAGE_MAX}</p>
          </div>
          <div class="match-modal__actions">
            <button class="dp-btn dp-btn--primary" type="submit">加 ${L.STEP} 分並送出</button>
            <button class="dp-btn dp-btn--ghost" type="button" data-skip>只加分，不留言</button>
            <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>取消</button>
          </div>
        </form>
      </div>`, (dialog) => {
      const form = dialog.querySelector('form');
      const input = dialog.querySelector('#first-message');
      const help = dialog.querySelector('#first-message-help');
      input.focus();
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        help.classList.remove('dp-help--error');
        help.textContent = `${input.value.length} / ${MESSAGE_MAX}`;
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) {
          input.setAttribute('aria-invalid', 'true');
          help.classList.add('dp-help--error');
          help.textContent = '請輸入想說的話，或選擇「只加分，不留言」。';
          input.focus();
          return;
        }
        closeModal();
        onConfirm(text);
      });
      dialog.querySelector('[data-skip]').addEventListener('click', () => {
        closeModal();
        onConfirm('');
      });
    });
  }

  function openMatchModal(kind, myId, theirId) {
    const info = pairInfo(kind, myId, theirId);
    const theirRecord = findRating(kind, theirId, myId);
    const theirName = displayName(kind, theirId);
    const who = kind === 'pet' ? `${esc(displayName(kind, myId))}和${esc(theirName)}` : `你和${esc(theirName)}`;
    const quote = theirRecord && theirRecord.message
      ? `<p class="dp-sm dp-muted">${esc(theirName)}曾對${kind === 'pet' ? esc(displayName(kind, myId)) : '你'}說：「${esc(theirRecord.message)}」</p>` : '';

    openModal(`<div class="dp-modal" role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
        <div class="match-modal__pair">${avatar(kind, myId, 'dp-avatar--lg')}${avatar(kind, theirId, 'dp-avatar--lg')}</div>
        <h2 class="dp-h2" id="match-modal-title">${who}配對成功</h2>
        <p class="dp-sm">目前關係分數 <strong>${info.total}%</strong>，繼續加分讓關係升溫。</p>
        ${quote}
        <div class="match-modal__actions">
          <a class="dp-btn dp-btn--primary" href="#">傳送第一則訊息</a>
          <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>繼續配對</button>
        </div>
      </div>`, (dialog) => dialog.querySelector('.dp-btn--primary').focus());
  }

  /* ---------- 新增寵物 ---------- */
  /** 把圖片縮到長邊 PHOTO_EDGE 並轉成 JPEG data URL */
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, PHOTO_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('這張圖片無法讀取，請換一張照片再試一次。'));
      };
      img.src = url;
    });
  }

  function formField(id, label, control, optional = false) {
    return `<div class="dp-field">
      <label class="dp-label" for="${id}">${label}${optional ? '<span class="dp-muted">（選填）</span>' : ''}</label>
      ${control}
      <p class="dp-help dp-help--error" id="${id}-error" hidden></p>
    </div>`;
  }

  function formSelect(id, options) {
    return `<select class="dp-input" id="${id}" name="${id}" aria-describedby="${id}-error">
      <option value="">請選擇</option>${options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
    </select>`;
  }

  function openPetForm() {
    const me = currentUser();
    const personalityOptions = unique(pets.flatMap((p) => p.personality));
    let photoData = null;

    openModal(`<div class="dp-modal match-modal--form" role="dialog" aria-modal="true" aria-labelledby="pet-form-title" data-keep-open>
        <h2 class="dp-h2" id="pet-form-title">新增寵物</h2>
        <p class="dp-sm dp-muted">新增後就能用牠的身分在寵物模式配對。</p>
        <form class="match-pet-form" novalidate>
          <div class="dp-alert dp-alert--danger" id="pet-form-alert" role="alert" hidden></div>
          ${formField('pet-name', '名字', `<input class="dp-input" id="pet-name" name="pet-name" maxlength="12" autocomplete="off" placeholder="例如：湯圓" aria-describedby="pet-name-error">`)}
          <div class="match-pet-form__grid">
            ${formField('pet-species', '種類', formSelect('pet-species', L.PET_SPECIES))}
            ${formField('pet-breed', '品種', `<input class="dp-input" id="pet-breed" name="pet-breed" maxlength="20" autocomplete="off" placeholder="例如：柴犬、米克斯" aria-describedby="pet-breed-error">`)}
            ${formField('pet-gender', '性別', formSelect('pet-gender', L.PET_GENDERS))}
            ${formField('pet-age', '年齡（歲）', `<input class="dp-input" id="pet-age" name="pet-age" type="number" min="0" max="30" step="1" inputmode="numeric" placeholder="未滿 1 歲填 0" aria-describedby="pet-age-error">`)}
            ${formField('pet-size', '體型', formSelect('pet-size', L.PET_SIZES))}
          </div>
          <div class="dp-field" role="group" aria-labelledby="pet-personality-label">
            <span class="dp-label" id="pet-personality-label">個性（1～5 個）</span>
            <div class="dp-tag-list" id="pet-personality">
              ${personalityOptions.map((o) => `<button class="dp-tag" type="button" data-value="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}
            </div>
            <p class="dp-help dp-help--error" id="pet-personality-error" hidden></p>
          </div>
          ${formField('pet-appearance', '外觀', `<input class="dp-input" id="pet-appearance" name="pet-appearance" maxlength="30" autocomplete="off" placeholder="例如：白底灰斑、捲尾巴" aria-describedby="pet-appearance-error">`, true)}
          ${formField('pet-bio', '介紹', `<input class="dp-input" id="pet-bio" name="pet-bio" maxlength="60" autocomplete="off" placeholder="一句話介紹牠的小習慣" aria-describedby="pet-bio-error">`, true)}
          <div class="dp-field">
            <label class="dp-label" for="pet-photo">照片<span class="dp-muted">（選填，10 MB 以內）</span></label>
            <div class="match-pet-form__photo">
              <div class="match-pet-form__preview match-tone-${me.photoTone}" id="pet-photo-preview" aria-hidden="true">${icon('i-paw')}</div>
              <input class="dp-input" id="pet-photo" name="pet-photo" type="file" accept="image/*" aria-describedby="pet-photo-error">
            </div>
            <p class="dp-help dp-help--error" id="pet-photo-error" hidden></p>
          </div>
          <div class="match-modal__actions">
            <button class="dp-btn dp-btn--primary" type="submit">新增寵物</button>
            <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>取消</button>
          </div>
        </form>
      </div>`, (dialog) => {
      const form = dialog.querySelector('form');
      const alertBox = dialog.querySelector('#pet-form-alert');
      const personalityBox = dialog.querySelector('#pet-personality');
      const photoInput = dialog.querySelector('#pet-photo');
      const preview = dialog.querySelector('#pet-photo-preview');
      const fieldIds = ['name', 'species', 'breed', 'gender', 'age', 'size', 'personality', 'appearance', 'bio'];

      function setError(field, message) {
        const help = dialog.querySelector(`#pet-${field}-error`);
        const control = dialog.querySelector(`#pet-${field}`);
        help.hidden = !message;
        help.textContent = message || '';
        if (control.matches('input, select')) {
          if (message) control.setAttribute('aria-invalid', 'true');
          else control.removeAttribute('aria-invalid');
        }
      }

      dialog.querySelector('#pet-name').focus();

      personalityBox.addEventListener('click', (e) => {
        const tag = e.target.closest('[data-value]');
        if (!tag) return;
        tag.setAttribute('aria-pressed', String(tag.getAttribute('aria-pressed') !== 'true'));
        setError('personality', '');
      });

      form.addEventListener('input', (e) => {
        if (e.target.id && e.target.id !== 'pet-photo') setError(e.target.id.replace('pet-', ''), '');
      });

      photoInput.addEventListener('change', async () => {
        const file = photoInput.files[0];
        photoData = null;
        preview.innerHTML = icon('i-paw');
        setError('photo', '');
        if (!file) return;
        const problem = L.validatePhoto(file);
        if (problem) {
          setError('photo', problem);
          photoInput.value = '';
          return;
        }
        try {
          photoData = await compressImage(file);
          preview.innerHTML = `<img src="${photoData}" alt="">`;
        } catch (err) {
          console.warn('[match] 照片處理失敗', err);
          setError('photo', err.message);
          photoInput.value = '';
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alertBox.hidden = true;
        const read = (name) => form.elements[`pet-${name}`].value;
        const { errors, pet } = L.validatePet({
          name: read('name'), species: read('species'), breed: read('breed'), gender: read('gender'),
          age: read('age'), size: read('size'), appearance: read('appearance'), bio: read('bio'),
          personality: [...personalityBox.querySelectorAll('[aria-pressed="true"]')].map((t) => t.dataset.value),
        });
        fieldIds.forEach((f) => setError(f, errors[f]));
        const firstInvalid = fieldIds.find((f) => errors[f]);
        if (firstInvalid) {
          const target = dialog.querySelector(`#pet-${firstInvalid}`);
          (target.matches('input, select') ? target : target.querySelector('button')).focus();
          return;
        }

        const newPet = { id: L.nextPetId(pets), ...pet, photo: photoData };
        const previous = state.addedPets[me.id] || [];
        state.addedPets[me.id] = [...previous, newPet];
        if (!save()) {
          state.addedPets[me.id] = previous;
          alertBox.textContent = '瀏覽器的儲存空間不夠，請換一張較小的照片，或先不附照片。';
          alertBox.hidden = false;
          alertBox.scrollIntoView({ block: 'nearest' });
          return;
        }
        rebuildIndex();
        state.mode = 'pet';
        state.petId = newPet.id;
        state.index = 0;
        closeModal();
        renderAll();
      });
    });
  }

  /* ---------- 加減分 ---------- */
  function currentTargetId() {
    return currentPool()[state.index].id;
  }

  function changePoints(delta, message) {
    const kind = kindOf(state.mode);
    const myId = myEntityId();
    const theirId = currentTargetId();
    const before = pairInfo(kind, myId, theirId);

    let record = findRating(kind, myId, theirId);
    if (!record) {
      record = { kind, from: myId, to: theirId, points: 0, messageUsed: false, message: '' };
      state.ratings.push(record);
    }
    record.points = L.applyDelta(record.points, delta, before.myCap);
    if (message !== undefined) {
      record.messageUsed = true;
      record.message = message;
    }
    save();
    renderStage();
    renderAside();

    if (!before.matched && pairInfo(kind, myId, theirId).matched) openMatchModal(kind, myId, theirId);
  }

  function handlePlus() {
    const kind = kindOf(state.mode);
    const theirId = currentTargetId();
    const record = findRating(kind, myEntityId(), theirId);
    if (L.canLeaveMessage(record)) {
      openMessageModal(displayName(kind, theirId), (message) => changePoints(1, message));
      return;
    }
    changePoints(1);
  }

  function step(offset) {
    const total = currentPool().length;
    state.index = (state.index + offset + total) % total;
    renderStage();
  }

  /* ---------- 事件 ---------- */
  el.stage.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const actions = {
      plus: handlePlus,
      minus: () => changePoints(-1),
      prev: () => step(-1),
      next: () => step(1),
      'clear-filters': clearFilters,
      'add-pet': openPetForm,
    };
    actions[button.dataset.action]();
  });

  el.modes.addEventListener('click', (e) => {
    const button = e.target.closest('[data-mode]');
    if (!button || button.dataset.mode === state.mode) return;
    state.mode = button.dataset.mode;
    state.index = 0;
    renderAll();
  });

  el.petPicker.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="add-pet"]')) {
      openPetForm();
      return;
    }
    const button = e.target.closest('[data-pet]');
    if (!button) return;
    state.petId = button.dataset.pet;
    state.index = 0;
    renderAll();
  });

  el.filterToggle.addEventListener('click', () => {
    const open = el.filter.hidden;
    el.filter.hidden = !open;
    el.filterToggle.setAttribute('aria-expanded', String(open));
  });

  el.filter.addEventListener('input', () => {
    readFilters();
    state.index = 0;
    renderStage();
  });

  el.filter.addEventListener('click', (e) => {
    const tag = e.target.closest('[data-toggle]');
    if (tag) {
      const list = state.filters[state.mode][tag.dataset.toggle];
      const value = tag.dataset.value;
      const pressed = list.includes(value);
      if (pressed) list.splice(list.indexOf(value), 1);
      else list.push(value);
      tag.setAttribute('aria-pressed', String(!pressed));
      state.index = 0;
      renderStage();
      return;
    }
    if (e.target.closest('[data-action="clear-filters"]')) clearFilters();
  });

  document.querySelector('.dp-shell__aside').addEventListener('click', (e) => {
    const item = e.target.closest('[data-jump]');
    if (item) jumpTo(item.dataset.jump);
  });

  el.demoUser.addEventListener('change', () => {
    state.meId = el.demoUser.value;
    resetForUser();
    save();
    renderAll();
  });

  el.demoReset.addEventListener('click', () => {
    state.ratings = structuredClone(MOCK_DB.ratings);
    state.addedPets = {};
    rebuildIndex();
    save();
    resetForUser();
    renderAll();
  });

  /* ---------- 初始化 ---------- */
  function renderDemo() {
    el.demoUser.innerHTML = MOCK_DB.users
      .map((u) => `<option value="${u.id}"${u.id === state.meId ? ' selected' : ''}>${esc(u.name)}（${GENDER_LABEL[u.gender]}，${u.age}）</option>`)
      .join('');
  }

  function renderAll() {
    renderModes();
    renderPetPicker();
    renderFilters();
    renderStage();
    renderAside();
    renderDemo();
  }

  resetForUser();
  renderAll();
})();

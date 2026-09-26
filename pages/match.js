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

  const usersById = new Map(MOCK_DB.users.map((u) => [u.id, u]));
  const pets = L.allPets(MOCK_DB.users);
  const petsById = new Map(pets.map((p) => [p.id, p]));

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
    meId: saved && usersById.has(saved.meId) ? saved.meId : MOCK_DB.currentUserId,
    ratings: saved ? saved.ratings : structuredClone(MOCK_DB.ratings),
    mode: 'person',
    petId: null,
    index: 0,
    filters: null,
  };

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('[match] 讀取 localStorage 失敗，改用預設模擬資料', err);
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meId: state.meId, ratings: state.ratings }));
    } catch (err) {
      console.warn('[match] 無法寫入 localStorage，重新整理後評分會消失', err);
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
    return L.filterPeople(MOCK_DB.users, me, { seniorOnly: mode === 'senior' });
  }

  function currentPool() {
    const me = currentUser();
    if (state.mode === 'pet') {
      if (!state.petId) return [];
      return L.filterPets(pets, me.id, state.filters.pet)
        .sort((a, b) => distanceTo(usersById.get(a.ownerId)) - distanceTo(usersById.get(b.ownerId)));
    }
    const f = state.mode === 'senior' ? { ...state.filters.senior, seniorOnly: true } : state.filters.person;
    return L.filterPeople(MOCK_DB.users, me, f).sort((a, b) => distanceTo(a) - distanceTo(b));
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
      .join('');
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
      const users = MOCK_DB.users;
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
        <p class="dp-sm dp-muted dp-prose">在「我的檔案」新增寵物的品種、個性和照片後，就能用寵物身分配對。</p>
        <a class="dp-btn dp-btn--secondary dp-btn--sm" href="#">前往我的檔案新增寵物</a>
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
    if (e.target.matches('[data-backdrop]') || e.target.closest('[data-close]')) closeModal();
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
    save();
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

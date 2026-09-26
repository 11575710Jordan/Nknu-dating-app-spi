/* =========================================================
   配對頁畫面邏輯
   依賴：../data/mock-data.js（MOCK_DB）、../js/match-logic.js（MatchLogic）
   - 登入者：網址 ?user=u01 > localStorage 記住的帳號 > MOCK_DB.currentUserId
   - 評分、寵物異動、點數與解鎖紀錄存在 localStorage，模擬「後端已保存」
   ========================================================= */
(() => {
  'use strict';

  const L = MatchLogic;
  const STORAGE_KEY = 'nknu-match-demo-v3';
  const MESSAGE_MAX = 40;
  const DISTANCE_MAX = 30;
  const PHOTO_EDGE = 800; // 上傳照片縮到長邊 800px 再存，避免塞爆 localStorage
  const MODES = [
    { id: 'person', label: '一般', icon: 'i-people' },
    { id: 'pet', label: '寵物', icon: 'i-paw' },
    { id: 'senior', label: '長輩', icon: 'i-sun' },
  ];
  const GENDER_LABEL = { female: '女', male: '男' };

  const $ = (id) => document.getElementById(id);
  const el = {
    accountForm: $('account-form'), accountInput: $('account-input'),
    accountList: $('account-list'), accountHelp: $('account-help'), demoReset: $('demo-reset'),
    modes: $('mode-switch'), petPicker: $('pet-picker'),
    pointsToggle: $('points-toggle'),
    filterToggle: $('filter-toggle'), filter: $('filter-panel'),
    stage: $('match-stage'), live: $('match-live'),
    modalRoot: $('modal-root'),
  };

  /* ---------- 狀態 ---------- */
  const saved = loadSaved();
  const urlAccount = new URLSearchParams(location.search).get('user');
  const urlUser = urlAccount ? L.resolveAccount(MOCK_DB.users, urlAccount) : null;
  const savedUser = saved ? L.resolveAccount(MOCK_DB.users, saved.meId) : null;

  const state = {
    meId: (urlUser || savedUser || { id: MOCK_DB.currentUserId }).id,
    ratings: saved ? saved.ratings : structuredClone(MOCK_DB.ratings),
    petOverrides: (saved && saved.petOverrides) || {}, // { userId: 完整寵物清單 }，有改過寵物的用戶才會有
    wallets: (saved && saved.wallets) || {},           // { userId: { points, unlocked[] } }，有動過點數的用戶才會有
    mode: 'person',
    petId: null,
    index: 0,
    photoIndex: 0,
    expanded: false,
    filters: null,
  };

  /* 模擬資料套用寵物異動後的索引；寵物有變動就要重建 */
  let users, usersById, pets, petsById;
  function rebuildIndex() {
    users = MOCK_DB.users.map((u) => ({ ...u, pets: state.petOverrides[u.id] || u.pets }));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        meId: state.meId, ratings: state.ratings, petOverrides: state.petOverrides, wallets: state.wallets,
      }));
      return true;
    } catch (err) {
      console.warn('[match] 無法寫入 localStorage，重新整理後資料會消失', err);
      return false;
    }
  }

  /** 人的配對不限性別，預設「不限」，由使用者在篩選裡自己設定 */
  function defaultFilters() {
    return {
      person: { gender: 'all', ageMin: null, ageMax: null, maxKm: DISTANCE_MAX, interests: [], school: '', jobCategory: '' },
      senior: { gender: 'all', maxKm: DISTANCE_MAX },
      pet: { species: '', size: '', personality: [] },
    };
  }

  /** 換對象時卡片回到第一張照片、收合狀態 */
  function resetCardView() {
    state.photoIndex = 0;
    state.expanded = false;
  }

  function resetForUser() {
    const me = currentUser();
    state.mode = L.defaultMode(me);
    state.petId = me.pets.length ? me.pets[0].id : null;
    state.index = 0;
    state.filters = defaultFilters();
    resetCardView();
  }

  const currentUser = () => usersById.get(state.meId);
  const kindOf = (mode) => (mode === 'pet' ? 'pet' : 'person');

  /** 目前「我方」的 id：一般／長輩模式是自己，寵物模式是選中的寵物 */
  const myEntityId = () => (state.mode === 'pet' ? state.petId : state.meId);

  function myWallet() {
    const me = currentUser();
    return state.wallets[me.id] || { points: me.points, unlocked: [] };
  }

  /** 更新錢包並儲存；失敗會還原並回傳 false */
  function commitWallet(next) {
    const meId = state.meId;
    const prev = state.wallets[meId];
    state.wallets[meId] = next;
    if (save()) return true;
    if (prev) state.wallets[meId] = prev;
    else delete state.wallets[meId];
    return false;
  }

  function announce(text) {
    el.live.textContent = text;
  }

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

  function avatar(kind, id, extraClass = '') {
    return `<span class="dp-avatar match-tone-${ownerOf(kind, id).photoTone} ${extraClass}">${lastChar(displayName(kind, id))}</span>`;
  }

  /* ---------- 測試帳號 ---------- */
  function renderAccount(problem) {
    const me = currentUser();
    el.accountList.innerHTML = MOCK_DB.users
      .map((u) => `<option value="${u.id}">${esc(u.name)}（${GENDER_LABEL[u.gender]}，${u.age}）</option>`)
      .join('');
    el.accountInput.value = '';
    el.accountInput.placeholder = `目前：${me.id}`;
    el.accountHelp.classList.toggle('dp-help--error', Boolean(problem));
    el.accountHelp.textContent = problem || `目前登入：${me.name}（${me.id}，${GENDER_LABEL[me.gender]}，${me.age} 歲）`;
  }

  function accountError(input) {
    return `找不到帳號「${input}」，請輸入 u01～u${String(MOCK_DB.users.length).padStart(2, '0')} 或完整姓名。`;
  }

  el.accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = el.accountInput.value.trim();
    const user = L.resolveAccount(MOCK_DB.users, input);
    if (!user) {
      el.accountInput.setAttribute('aria-invalid', 'true');
      el.accountHelp.classList.add('dp-help--error');
      el.accountHelp.textContent = input ? accountError(input) : '請輸入要測試的帳號。';
      el.accountInput.focus();
      return;
    }
    state.meId = user.id;
    save();
    // 以新的登入者重新整理整頁，確保所有狀態都從頭載入
    const url = new URL(location.href);
    url.searchParams.set('user', user.id);
    location.assign(url);
  });

  el.accountInput.addEventListener('input', () => {
    el.accountInput.removeAttribute('aria-invalid');
  });

  el.demoReset.addEventListener('click', () => {
    state.ratings = structuredClone(MOCK_DB.ratings);
    state.petOverrides = {};
    state.wallets = {};
    rebuildIndex();
    save();
    resetForUser();
    renderAll();
    announce('示範資料已重設。');
  });

  /* ---------- 工具列：模式、點數、寵物選擇 ---------- */
  function renderModes() {
    const me = currentUser();
    el.modes.innerHTML = MODES
      .filter((m) => m.id !== 'senior' || L.isSeniorEligible(me))
      .map((m) => `<button class="dp-tag" type="button" data-mode="${m.id}" aria-pressed="${state.mode === m.id}">${icon(m.icon)}${m.label}</button>`)
      .join('');
    document.documentElement.classList.toggle('match--senior', state.mode === 'senior');
  }

  function renderPointsToggle() {
    const { points } = myWallet();
    el.pointsToggle.innerHTML = `${icon('i-coin')}<span>${points}<span class="match-hide-mobile"> 點</span></span>`;
    el.pointsToggle.setAttribute('aria-label', `我的點數：${points} 點，開啟加值`);
  }

  function renderPetPicker() {
    const me = currentUser();
    const show = state.mode === 'pet' && me.pets.length > 0;
    el.petPicker.hidden = !show;
    if (!show) return;
    const myPet = petsById.get(state.petId);
    el.petPicker.innerHTML = `<span class="dp-sm dp-muted match-hide-mobile">用哪隻寵物配對：</span>
      ${me.pets.map((p) => `<button class="dp-tag" type="button" data-pet="${p.id}" aria-pressed="${state.petId === p.id}">${esc(p.name)}</button>`).join('')}
      <span class="match-pet-picker__actions">
        <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-action="edit-pet" aria-label="編輯${esc(myPet.name)}">${icon('i-edit')}<span class="match-hide-mobile">編輯</span></button>
        <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-action="delete-pet" aria-label="刪除${esc(myPet.name)}">${icon('i-trash')}<span class="match-hide-mobile">刪除</span></button>
        <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-action="add-pet" aria-label="新增寵物">${icon('i-plus')}<span class="match-hide-mobile">新增寵物</span></button>
      </span>`;
  }

  /* ---------- 篩選（浮動面板，按「確定」才套用） ---------- */
  let draft = null; // 面板開啟期間編輯中的條件，取消就丟掉

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

  function renderFilterToggle() {
    const count = L.activeFilterCount(state.filters[state.mode], defaultFilters()[state.mode]);
    el.filterToggle.innerHTML = `${icon('i-filter')}<span class="match-hide-mobile">篩選</span>${count ? `<span class="dp-badge">${count}</span>` : ''}`;
    el.filterToggle.setAttribute('aria-label', count ? `篩選，已設定 ${count} 個條件` : '篩選');
  }

  function renderFilterForm() {
    const f = draft;
    let html;
    if (state.mode === 'pet') {
      html = `<div class="match-filter__grid">
          ${selectField('f-species', '種類', f.species, [['', '不限'], ...L.PET_SPECIES.map((s) => [s, s])])}
          ${selectField('f-size', '體型', f.size, [['', '不限'], ...L.PET_SIZES.map((s) => [s, s])])}
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
          ${distanceField(f.maxKm)}
          <div class="dp-field">
            <label class="dp-label" for="f-age-min">年齡</label>
            <div class="match-filter__age">
              <input class="dp-input" type="number" id="f-age-min" name="f-age-min" min="18" max="99" placeholder="最小" value="${f.ageMin ?? ''}" aria-describedby="f-age-error">
              <span aria-hidden="true">–</span>
              <input class="dp-input" type="number" id="f-age-max" name="f-age-max" min="18" max="99" placeholder="最大" aria-label="年齡上限" value="${f.ageMax ?? ''}" aria-describedby="f-age-error">
            </div>
            <p class="dp-help dp-help--error" id="f-age-error" hidden></p>
          </div>
          ${selectField('f-school', '學校', f.school, [['', '不限'], ...unique(users.map((u) => u.school)).map((s) => [s, s])])}
          ${selectField('f-job', '工作領域', f.jobCategory, [['', '不限'], ...unique(users.map((u) => u.jobCategory)).map((s) => [s, s])])}
        </div>
        ${tagGroup('interests', '興趣（全部符合）', unique(users.flatMap((u) => u.interests)), f.interests)}`;
    }
    el.filter.innerHTML = `<h2 class="dp-h3">篩選條件</h2>${html}
      <div class="match-filter__foot">
        <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-filter="reset">清除條件</button>
        <span class="match-filter__foot-main">
          <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-filter="cancel">取消</button>
          <button class="dp-btn dp-btn--primary dp-btn--sm" type="submit">確定</button>
        </span>
      </div>`;
  }

  function openFilter() {
    draft = structuredClone(state.filters[state.mode]);
    renderFilterForm();
    el.filter.hidden = false;
    el.filterToggle.setAttribute('aria-expanded', 'true');
    el.filter.querySelector('select, input, button').focus();
  }

  function closeFilter({ restoreFocus = true } = {}) {
    if (el.filter.hidden) return;
    draft = null;
    el.filter.hidden = true;
    el.filterToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) el.filterToggle.focus();
  }

  const readNumber = (name) => {
    const input = el.filter.elements[name];
    return input && input.value !== '' ? Number(input.value) : null;
  };

  /** 把表單值讀進 draft；有錯回傳 false */
  function readDraft() {
    const form = el.filter.elements;
    if (state.mode === 'pet') {
      draft.species = form['f-species'].value;
      draft.size = form['f-size'].value;
      return true;
    }
    draft.gender = form['f-gender'].value;
    draft.maxKm = readNumber('f-km');
    if (state.mode !== 'person') return true;
    draft.ageMin = readNumber('f-age-min');
    draft.ageMax = readNumber('f-age-max');
    draft.school = form['f-school'].value;
    draft.jobCategory = form['f-job'].value;
    const ageError = el.filter.querySelector('#f-age-error');
    const invalid = draft.ageMin != null && draft.ageMax != null && draft.ageMin > draft.ageMax;
    ageError.hidden = !invalid;
    ageError.textContent = invalid ? '最小年齡不能大於最大年齡，請調整其中一個。' : '';
    ['f-age-min', 'f-age-max'].forEach((id) => {
      if (invalid) form[id].setAttribute('aria-invalid', 'true');
      else form[id].removeAttribute('aria-invalid');
    });
    return !invalid;
  }

  el.filterToggle.addEventListener('click', () => {
    if (el.filter.hidden) openFilter();
    else closeFilter();
  });

  el.filter.addEventListener('input', (e) => {
    if (e.target.id === 'f-km') el.filter.querySelector('output').textContent = `${e.target.value} 公里內`;
  });

  el.filter.addEventListener('click', (e) => {
    const tag = e.target.closest('[data-toggle]');
    if (tag) {
      const list = draft[tag.dataset.toggle];
      const value = tag.dataset.value;
      const pressed = list.includes(value);
      if (pressed) list.splice(list.indexOf(value), 1);
      else list.push(value);
      tag.setAttribute('aria-pressed', String(!pressed));
      return;
    }
    const action = e.target.closest('[data-filter]');
    if (!action) return;
    if (action.dataset.filter === 'cancel') closeFilter();
    if (action.dataset.filter === 'reset') {
      draft = defaultFilters()[state.mode];
      renderFilterForm();
    }
  });

  el.filter.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!readDraft()) return;
    state.filters[state.mode] = draft;
    state.index = 0;
    resetCardView();
    closeFilter();
    renderFilterToggle();
    renderStage();
    announce(`已套用篩選，共 ${currentPool().length} 個對象。`);
  });

  // 點面板外面或按 Esc：不套用，直接關閉
  // 用 composedPath 而非 closest：面板內按鈕可能在點擊時被重畫而脫離 DOM
  const filterAnchor = document.querySelector('.match-filter-anchor');
  document.addEventListener('click', (e) => {
    if (!el.filter.hidden && !e.composedPath().includes(filterAnchor)) closeFilter({ restoreFocus: false });
  });

  function clearFilters() {
    state.filters[state.mode] = defaultFilters()[state.mode];
    state.index = 0;
    resetCardView();
    renderFilterToggle();
    renderStage();
  }

  /* ---------- 卡片：照片輪播 ---------- */
  /** 沒有照片時仍給一張佔位圖，讓卡片版面一致 */
  const photosOf = (entity) => (entity.photos && entity.photos.length ? entity.photos : [{ src: null, caption: '' }]);

  /**
   * veil：照片霧化程度（0～1，見 L.photoVeil）。人的照片隨關係分數變清楚，寵物照片傳 0。
   * 霧化程度用 CSS 變數交給 match.css 換算成模糊半徑，JS 不寫死 px。
   */
  function gallery(entity, tone, badges, veil = 0) {
    const list = photosOf(entity);
    const i = L.stepPhoto(state.photoIndex, 0, list.length);
    const current = list[i];
    const veiled = veil > 0;
    const label = `${esc(entity.name)}的照片 ${i + 1}／${list.length}${current.caption ? `：${esc(current.caption)}` : ''}${veiled ? '（尚未完全清晰）' : ''}`;
    const veilAttr = veiled ? ` style="--match-veil:${veil}"` : '';
    const veilClass = veiled ? ' match-veiled' : '';
    const slide = current.src
      ? `<img class="${veilClass.trim()}" src="${esc(current.src)}" alt="${label}"${veilAttr}>`
      : `<div class="match-photo match-tone-${(tone + i) % 4}${veilClass}" role="img" aria-label="${label}"${veilAttr}>
          <span class="match-photo__char" aria-hidden="true">${lastChar(entity.name)}</span>
          ${current.caption ? `<span class="match-photo__caption" aria-hidden="true">${esc(current.caption)}</span>` : ''}
        </div>`;
    const multi = list.length > 1;
    return `${slide}
      ${multi ? `<div class="match-gallery__bars" aria-hidden="true">${list.map((_, n) => `<span${n === i ? ' class="is-active"' : ''}></span>`).join('')}</div>
        <button class="match-gallery__nav match-gallery__nav--prev" type="button" data-action="photo-prev" aria-label="上一張照片"${i === 0 ? ' disabled' : ''}></button>
        <button class="match-gallery__nav match-gallery__nav--next" type="button" data-action="photo-next" aria-label="下一張照片"${i === list.length - 1 ? ' disabled' : ''}></button>` : ''}
      <div class="match-photo__badges">${badges}</div>`;
  }

  /* ---------- 卡片：內容 ---------- */
  function incomingPill(kind, theirId, myId) {
    const points = pointsOf(kind, theirId, myId);
    return points ? `<span class="dp-tag dp-tag--shared dp-xs match-photo__badge-end">${icon('i-heart')}給${kind === 'pet' ? esc(displayName(kind, myId)) : '你'} +${points}</span>` : '';
  }

  function incomingBlock(kind, theirId, myId) {
    const record = findRating(kind, theirId, myId);
    if (!record || record.points === 0) return '';
    const quote = record.message ? `<span class="match-incoming__quote">「${esc(record.message)}」</span>` : '';
    return `<div class="match-incoming">${esc(displayName(kind, theirId))}給${kind === 'pet' ? esc(displayName(kind, myId)) : '你'}加了 ${record.points} 分${quote ? '，並留言：' : ''}${quote}</div>`;
  }

  function facts(rows) {
    return `<dl class="match-facts">${rows.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }

  function momentsBlock(kind, target) {
    const key = L.momentKey(kind, target.id);
    const wallet = myWallet();
    const count = target.moments.length;
    const unlocked = L.isUnlocked(wallet, key);
    const heading = `<h3 class="dp-h3 match-moments__title">${unlocked ? '' : icon('i-lock')}動態<span class="dp-sm dp-muted">${count} 則</span></h3>`;

    if (unlocked) {
      return `<section class="match-moments" aria-label="${esc(target.name)}的動態">
        ${heading}
        <ol class="match-moments__list">
          ${target.moments.map((m) => `<li class="match-moments__item"><time class="dp-xs dp-muted" datetime="${esc(m.date)}">${esc(m.date.slice(5).replace('-', '/'))}</time><p>${esc(m.text)}</p></li>`).join('')}
        </ol>
      </section>`;
    }

    const enough = wallet.points >= L.UNLOCK_COST;
    return `<section class="match-moments match-moments--locked" aria-label="${esc(target.name)}的動態（未解鎖）">
      ${heading}
      <div class="match-moments__teaser" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="dp-sm">用 ${L.UNLOCK_COST} 點解鎖${esc(target.name)}的 ${count} 則動態，解鎖後永久可看。</p>
      ${enough
        ? `<button class="dp-btn dp-btn--primary dp-btn--sm" type="button" data-action="unlock">${icon('i-lock')}用 ${L.UNLOCK_COST} 點解鎖（你有 ${wallet.points} 點）</button>`
        : `<p class="dp-sm dp-muted">你目前有 ${wallet.points} 點，還差 ${L.UNLOCK_COST - wallet.points} 點。</p>
           <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-action="open-points">${icon('i-coin')}加值點數</button>`}
    </section>`;
  }

  /**
   * 點卡片空白處切換展開／收合（見 el.stage 的 click）。
   * 另放一顆只有鍵盤聚焦時才看得到的按鈕，讓鍵盤與螢幕閱讀器也能操作。
   */
  function cardToggle() {
    return `<button class="match-card__toggle" type="button" data-action="toggle-expand" aria-expanded="${state.expanded}">${state.expanded ? '收合完整資料' : '展開完整資料'}</button>`;
  }

  /** 收合時只露出一排標籤＋提示箭頭；展開時顯示完整資料 */
  function cardBody(summaryTags, detailHtml) {
    if (!state.expanded) {
      return `<div class="dp-profile-card__body match-card__summary">
        ${cardToggle()}
        <div class="match-card__tags">${summaryTags}</div>
        <span class="match-card__hint" aria-hidden="true">${icon('i-expand')}</span>
      </div>`;
    }
    return `<div class="dp-profile-card__body">
      ${cardToggle()}
      ${detailHtml}
      <span class="match-card__hint match-card__hint--up" aria-hidden="true">${icon('i-expand')}</span>
    </div>`;
  }

  function personCard(u) {
    const me = currentUser();
    const shared = L.sharedInterests(u.interests, me.interests);
    const tagHtml = [
      u.verified ? `<span class="dp-tag dp-tag--verified">${icon('i-check')}已驗證</span>` : '',
      ...shared.map((i) => `<span class="dp-tag dp-tag--shared">${esc(i)}</span>`),
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
    const sharedNote = shared.length ? `<p class="dp-xs dp-muted">杏色標籤是你們的共同興趣</p>` : '';

    const detail = `${incomingBlock('person', u.id, me.id)}
      <div class="dp-tag-list">${tagHtml}</div>${sharedNote}
      ${facts([
        ['性別', GENDER_LABEL[u.gender]], ['學校', u.school], ['學歷', u.education], ['身高', `${u.height} 公分`],
        ['星座', u.zodiac], ['想找的關係', u.relationshipGoal], ['地區', u.area], ['喝酒', u.drinking], ['抽菸', u.smoking],
      ])}
      ${prompts}
      ${petTags}
      ${momentsBlock('person', u)}`;

    const badges = (u.online ? `<span class="dp-tag dp-xs"><span class="match-online-dot"></span>在線上</span>` : '')
      + incomingPill('person', u.id, me.id);

    // 照片隨雙方加總的關係分數變清楚，到 PHOTO_CLEAR_SCORE 才完全清晰
    const score = pairInfo('person', me.id, u.id).total;
    const veil = L.photoVeil(score);
    const veilNote = veil > 0
      ? `<div class="match-photo__veil-note">${icon('i-lock')}關係分數 ${L.PHOTO_CLEAR_SCORE}% 照片完全清晰（目前 ${score}%）</div>` : '';

    return `<article class="dp-profile-card match-card" aria-label="${esc(u.name)}的個人檔案">
      <div class="dp-profile-card__photo match-gallery">
        ${gallery(u, u.photoTone, badges, veil)}
        <div class="dp-profile-card__overlay">
          <div class="dp-profile-card__name">${esc(u.name)}，${u.age}</div>
          <div class="dp-profile-card__meta">${esc(u.job)}　距離 ${distanceTo(u).toFixed(1)} 公里</div>
          ${veilNote}
        </div>
      </div>
      ${cardBody(tagHtml, detail)}
    </article>`;
  }

  function petCard(p) {
    const owner = usersById.get(p.ownerId);
    const myPet = petsById.get(state.petId);
    const shared = L.sharedInterests(p.personality, myPet.personality);
    const tagHtml = p.personality.map((t) => `<span class="dp-tag${shared.includes(t) ? ' dp-tag--shared' : ''}">${esc(t)}</span>`).join('');
    const sharedNote = shared.length ? `<p class="dp-xs dp-muted">杏色標籤是和${esc(myPet.name)}一樣的個性</p>` : '';
    const bio = p.bio ? `<div class="dp-profile-card__prompt">
          <p class="dp-profile-card__prompt-q">關於${esc(p.name)}</p>
          <p class="dp-profile-card__prompt-a">${esc(p.bio)}</p>
        </div>` : '';

    const detail = `${incomingBlock('pet', p.id, myPet.id)}
      <div class="dp-tag-list">${tagHtml}</div>${sharedNote}
      ${facts([
        ['品種', p.breed], ['性別', p.gender], ['體型', p.size], ['外觀', p.appearance],
        ['主人', `${owner.name}（${GENDER_LABEL[owner.gender]}，${owner.age}）`], ['地區', owner.area],
      ])}
      ${bio}
      ${momentsBlock('pet', p)}`;

    const badges = `<span class="dp-tag dp-xs">${icon('i-paw')}${esc(p.species)}</span>` + incomingPill('pet', p.id, myPet.id);

    return `<article class="dp-profile-card match-card" aria-label="${esc(p.name)}的寵物檔案">
      <div class="dp-profile-card__photo match-gallery">
        ${gallery(p, owner.photoTone, badges)}
        <div class="dp-profile-card__overlay">
          <div class="dp-profile-card__name">${esc(p.name)}，${p.age} 歲</div>
          <div class="dp-profile-card__meta">${esc(p.breed)}・${esc(p.size)}　距離 ${distanceTo(owner).toFixed(1)} 公里</div>
        </div>
      </div>
      ${cardBody(tagHtml, detail)}
    </article>`;
  }

  /* ---------- 評分欄（桌機在卡片右側，手機在卡片下方一列） ---------- */
  function ratingBlock(kind, myId, theirId, total) {
    const info = pairInfo(kind, myId, theirId);
    const myRecord = findRating(kind, myId, theirId);
    const myLabel = kind === 'pet' ? displayName(kind, myId) : '你';
    const theirLabel = displayName(kind, theirId);

    let hint = '';
    if (info.matched) hint = '已配對成功，可以開始聊天了。';
    else if (info.mine === 0) hint = L.canLeaveMessage(myRecord) ? '按 + 加分，第一次加分可以留一句話。' : '按 + 給對方加分。';
    else hint = `等${esc(theirLabel)}也加分就會配對成功。`;

    const sent = myRecord && myRecord.message
      ? `<p class="match-rating__sent">${esc(myLabel)}留言：「${esc(myRecord.message)}」</p>` : '';

    return `<aside class="match-rating" aria-label="評分">
      <div class="match-rating__summary">
        <div class="match-rating__head">
          <span class="dp-xs dp-muted match-hide-mobile">關係分數</span>
          <span class="match-rating__value">${info.total}%</span>
        </div>
        <div class="match-rating__bar" role="img" aria-label="${esc(myLabel)} ${info.mine} 分（上限 ${info.myCap}），${esc(theirLabel)} ${info.theirs} 分（上限 ${info.theirCap}）">
          <div class="match-rating__seg" style="flex-grow:${info.myCap}"><div class="match-rating__fill" style="width:${(info.mine / info.myCap) * 100}%"></div></div>
          <div class="match-rating__seg match-rating__seg--them" style="flex-grow:${info.theirCap}"><div class="match-rating__fill" style="width:${(info.theirs / info.theirCap) * 100}%"></div></div>
        </div>
        <div class="match-rating__legend">
          <span><span class="match-hide-mobile">${esc(myLabel)} </span><strong>+${info.mine}</strong>/${info.myCap}</span>
          <span><span class="match-hide-mobile">${esc(theirLabel)} </span><strong>+${info.theirs}</strong>/${info.theirCap}</span>
        </div>
      </div>
      <div class="match-rating__buttons">
        <button class="dp-action dp-action--pass match-rating__minus" type="button" data-action="minus" aria-label="扣 ${L.STEP} 分"${L.canDecrease(info.mine) ? '' : ' disabled'}>${icon('i-minus')}</button>
        <button class="dp-action dp-action--like match-rating__plus" type="button" data-action="plus" aria-label="加 ${L.STEP} 分"${L.canIncrease(info.mine, info.myCap) ? '' : ' disabled'}>${icon('i-plus')}</button>
      </div>
      <p class="match-rating__hint">${hint}</p>
      ${sent}
      <div class="match-pager">
        <button class="dp-btn dp-btn--ghost dp-btn--sm match-pager__prev" type="button" data-action="prev" aria-label="上一位">${icon('i-chevron-left')}</button>
        <span class="dp-sm dp-muted match-pager__count">${state.index + 1} / ${total}</span>
        <button class="dp-btn dp-btn--ghost dp-btn--sm match-pager__next" type="button" data-action="next" aria-label="下一位">${icon('i-chevron-right')}</button>
      </div>
    </aside>`;
  }

  function renderStage() {
    const pool = currentPool();
    let fit = false;

    if (state.mode === 'pet' && !state.petId) {
      el.stage.innerHTML = `<div class="dp-panel dp-empty">
        <h2 class="dp-h3">你還沒有新增寵物</h2>
        <p class="dp-sm dp-muted dp-prose">填好寵物的品種、個性和照片，就能用寵物身分配對。</p>
        <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-action="add-pet">新增寵物</button>
      </div>`;
    } else if (!pool.length) {
      el.stage.innerHTML = `<div class="dp-panel dp-empty">
        <h2 class="dp-h3">沒有符合條件的${state.mode === 'pet' ? '寵物' : '人'}</h2>
        <p class="dp-sm dp-muted dp-prose">放寬距離或少選幾個條件，就會出現更多對象。</p>
        <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-action="clear-filters">清除篩選條件</button>
      </div>`;
    } else {
      state.index = Math.min(state.index, pool.length - 1);
      const target = pool[state.index];
      const kind = kindOf(state.mode);
      el.stage.innerHTML = `<div class="match-layout">
          <div class="match-card-col">${kind === 'pet' ? petCard(target) : personCard(target)}</div>
          ${ratingBlock(kind, myEntityId(), target.id, pool.length)}
        </div>`;
      fit = !state.expanded;
    }
    // 收合時整頁鎖在一個畫面高；展開時恢復正常捲動
    document.documentElement.classList.toggle('match--fit', fit);
  }

  /* ---------- 彈窗 ---------- */
  let lastFocus = null;

  function openModal(html, onMount) {
    lastFocus = document.activeElement;
    el.modalRoot.innerHTML = `<div class="dp-modal-backdrop" data-backdrop>${html}</div>`;
    onMount(el.modalRoot.querySelector('.dp-modal'));
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
    if (e.key !== 'Escape') return;
    if (el.modalRoot.firstChild) closeModal();
    else closeFilter();
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

  /* ---------- 點數：加值與解鎖 ---------- */
  function openPointsModal() {
    openModal(`<div class="dp-modal match-modal--form" role="dialog" aria-modal="true" aria-labelledby="points-title">
        <h2 class="dp-h2" id="points-title">我的點數</h2>
        <p class="match-points__balance"><span id="points-balance">${myWallet().points}</span> 點</p>
        <p class="dp-sm dp-muted">解鎖一位對象的動態需要 ${L.UNLOCK_COST} 點，解鎖後永久可看。</p>
        <div class="dp-alert dp-alert--success" id="points-alert" role="status" hidden></div>

        <section class="match-points__section" aria-labelledby="topup-title">
          <h3 class="dp-h3" id="topup-title">加值方案</h3>
          <ul class="match-points__plans">
            ${L.TOPUP_PLANS.map((plan) => `<li class="match-points__plan" data-plan="${plan.id}">
              <span><strong>${plan.points} 點</strong><span class="dp-sm dp-muted">　NT$${plan.price}</span></span>
              <span class="match-points__plan-actions">
                <button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-buy="${plan.id}">購買</button>
              </span>
            </li>`).join('')}
          </ul>
          <p class="dp-xs dp-muted">示範用的模擬付款，不會真的扣款。</p>
        </section>

        <form class="match-points__section" id="points-manual" novalidate>
          <h3 class="dp-h3">示範用：手動增加點數</h3>
          <p class="dp-xs dp-muted">任務系統之後由其他組員製作，目前先在這裡輸入數字模擬。</p>
          <div class="match-points__manual">
            <label class="match-sr-only" for="points-amount">要增加的點數</label>
            <input class="dp-input" id="points-amount" inputmode="numeric" autocomplete="off" placeholder="例如：50" aria-describedby="points-amount-error">
            <button class="dp-btn dp-btn--ghost dp-btn--sm" type="submit">加入</button>
          </div>
          <p class="dp-help dp-help--error" id="points-amount-error" hidden></p>
        </form>

        <div class="match-modal__actions">
          <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>關閉</button>
        </div>
      </div>`, (dialog) => {
      const alertBox = dialog.querySelector('#points-alert');
      const amountInput = dialog.querySelector('#points-amount');
      const amountError = dialog.querySelector('#points-amount-error');

      function credit(amount, source) {
        if (!commitWallet(L.addPoints(myWallet(), amount))) {
          alertBox.className = 'dp-alert dp-alert--danger';
          alertBox.textContent = '無法寫入瀏覽器儲存空間，點數沒有加入，請重新整理後再試一次。';
          alertBox.hidden = false;
          return;
        }
        const total = myWallet().points;
        dialog.querySelector('#points-balance').textContent = total;
        alertBox.className = 'dp-alert dp-alert--success';
        alertBox.textContent = `${source}：已加入 ${amount} 點，目前共 ${total} 點。`;
        alertBox.hidden = false;
        renderPointsToggle();
        renderStage(); // 解鎖按鈕的狀態會跟著點數變
      }

      dialog.querySelector('.match-points__plans').addEventListener('click', (e) => {
        const row = e.target.closest('[data-plan]');
        if (!row) return;
        const plan = L.TOPUP_PLANS.find((p) => p.id === row.dataset.plan);
        const actions = row.querySelector('.match-points__plan-actions');
        if (e.target.closest('[data-buy]')) {
          // 在同一列換成付款確認，不另開彈窗
          actions.innerHTML = `<button class="dp-btn dp-btn--primary dp-btn--sm" type="button" data-pay>確認付款 NT$${plan.price}</button>
            <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-cancel-pay>取消</button>`;
          actions.querySelector('[data-pay]').focus();
          return;
        }
        if (e.target.closest('[data-pay]') || e.target.closest('[data-cancel-pay]')) {
          const paid = Boolean(e.target.closest('[data-pay]'));
          actions.innerHTML = `<button class="dp-btn dp-btn--secondary dp-btn--sm" type="button" data-buy="${plan.id}">購買</button>`;
          actions.querySelector('[data-buy]').focus();
          if (paid) credit(plan.points, `購買 ${plan.points} 點方案`);
        }
      });

      dialog.querySelector('#points-manual').addEventListener('submit', (e) => {
        e.preventDefault();
        const { value, error } = L.parsePointsInput(amountInput.value);
        amountError.hidden = !error;
        amountError.textContent = error || '';
        if (error) {
          amountInput.setAttribute('aria-invalid', 'true');
          amountInput.focus();
          return;
        }
        amountInput.removeAttribute('aria-invalid');
        amountInput.value = '';
        credit(value, '手動增加');
      });

      dialog.querySelector('[data-buy]').focus();
    });
  }

  function openUnlockModal() {
    const kind = kindOf(state.mode);
    const target = currentPool()[state.index];
    const wallet = myWallet();
    openModal(`<div class="dp-modal" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
        <h2 class="dp-h2" id="unlock-title">解鎖${esc(target.name)}的動態？</h2>
        <p class="dp-sm">會花 ${L.UNLOCK_COST} 點，剩下 ${wallet.points - L.UNLOCK_COST} 點。解鎖後永久可看這 ${target.moments.length} 則動態。</p>
        <div class="dp-alert dp-alert--danger" id="unlock-alert" role="alert" hidden></div>
        <div class="match-modal__actions">
          <button class="dp-btn dp-btn--primary" type="button" data-confirm>用 ${L.UNLOCK_COST} 點解鎖</button>
          <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>取消</button>
        </div>
      </div>`, (dialog) => {
      const confirm = dialog.querySelector('[data-confirm]');
      confirm.focus();
      confirm.addEventListener('click', () => {
        const alertBox = dialog.querySelector('#unlock-alert');
        let next;
        try {
          next = L.unlockMoments(myWallet(), L.momentKey(kind, target.id));
        } catch (err) {
          alertBox.textContent = err.message;
          alertBox.hidden = false;
          return;
        }
        if (!commitWallet(next)) {
          alertBox.textContent = '無法寫入瀏覽器儲存空間，點數沒有扣除，請重新整理後再試一次。';
          alertBox.hidden = false;
          return;
        }
        closeModal();
        renderPointsToggle();
        renderStage();
        announce(`已解鎖${target.name}的動態，剩下 ${next.points} 點。`);
        const moments = el.stage.querySelector('.match-moments');
        if (moments) moments.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  el.pointsToggle.addEventListener('click', openPointsModal);

  /* ---------- 寵物：新增／編輯／刪除 ---------- */
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
        reject(new Error(`「${file.name}」無法讀取，請換一張照片再試一次。`));
      };
      img.src = url;
    });
  }

  /** 把我的寵物清單換成 nextPets 並儲存；失敗會還原並回傳 false */
  function commitMyPets(nextPets, nextRatings = state.ratings) {
    const me = currentUser();
    const prev = { pets: state.petOverrides[me.id], ratings: state.ratings };
    state.petOverrides[me.id] = nextPets;
    state.ratings = nextRatings;
    if (save()) {
      rebuildIndex();
      return true;
    }
    if (prev.pets) state.petOverrides[me.id] = prev.pets;
    else delete state.petOverrides[me.id];
    state.ratings = prev.ratings;
    return false;
  }

  function formField(id, label, control, optional = false) {
    return `<div class="dp-field">
      <label class="dp-label" for="${id}">${label}${optional ? '<span class="dp-muted">（選填）</span>' : ''}</label>
      ${control}
      <p class="dp-help dp-help--error" id="${id}-error" hidden></p>
    </div>`;
  }

  function formInput(id, value, attrs) {
    return `<input class="dp-input" id="${id}" name="${id}" value="${esc(value ?? '')}" autocomplete="off" aria-describedby="${id}-error" ${attrs}>`;
  }

  function formSelect(id, value, options) {
    return `<select class="dp-input" id="${id}" name="${id}" aria-describedby="${id}-error">
      <option value="">請選擇</option>${options.map((o) => `<option value="${esc(o)}"${o === value ? ' selected' : ''}>${esc(o)}</option>`).join('')}
    </select>`;
  }

  /** existing 為 undefined 時是新增，否則是編輯該寵物 */
  function openPetForm(existing) {
    const me = currentUser();
    const p = existing || { personality: [], photos: [], moments: [] };
    const personalityOptions = unique([...pets.flatMap((x) => x.personality), ...p.personality]);
    let photoList = [...(p.photos || [])];
    const title = existing ? `編輯${esc(p.name)}` : '新增寵物';

    openModal(`<div class="dp-modal match-modal--form" role="dialog" aria-modal="true" aria-labelledby="pet-form-title" data-keep-open>
        <h2 class="dp-h2" id="pet-form-title">${title}</h2>
        <p class="dp-sm dp-muted">${existing ? '修改後會立即更新寵物檔案。' : '新增後就能用牠的身分在寵物模式配對。'}</p>
        <form class="match-pet-form" novalidate>
          <div class="dp-alert dp-alert--danger" id="pet-form-alert" role="alert" hidden></div>
          ${formField('pet-name', '名字', formInput('pet-name', p.name, 'maxlength="12" placeholder="例如：湯圓"'))}
          <div class="match-pet-form__grid">
            ${formField('pet-species', '種類', formSelect('pet-species', p.species, L.PET_SPECIES))}
            ${formField('pet-breed', '品種', formInput('pet-breed', p.breed, 'maxlength="20" placeholder="例如：柴犬、米克斯"'))}
            ${formField('pet-gender', '性別', formSelect('pet-gender', p.gender, L.PET_GENDERS))}
            ${formField('pet-age', '年齡（歲）', formInput('pet-age', p.age, 'type="number" min="0" max="30" step="1" inputmode="numeric" placeholder="未滿 1 歲填 0"'))}
            ${formField('pet-size', '體型', formSelect('pet-size', p.size, L.PET_SIZES))}
          </div>
          <div class="dp-field" role="group" aria-labelledby="pet-personality-label">
            <span class="dp-label" id="pet-personality-label">個性（1～5 個）</span>
            <div class="dp-tag-list" id="pet-personality">
              ${personalityOptions.map((o) => `<button class="dp-tag" type="button" data-value="${esc(o)}" aria-pressed="${p.personality.includes(o)}">${esc(o)}</button>`).join('')}
            </div>
            <p class="dp-help dp-help--error" id="pet-personality-error" hidden></p>
          </div>
          ${formField('pet-appearance', '外觀', formInput('pet-appearance', p.appearance, 'maxlength="30" placeholder="例如：白底灰斑、捲尾巴"'), true)}
          ${formField('pet-bio', '介紹', formInput('pet-bio', p.bio, 'maxlength="60" placeholder="一句話介紹牠的小習慣"'), true)}
          <div class="dp-field">
            <label class="dp-label" for="pet-photo">照片<span class="dp-muted">（選填，最多 ${L.PET_PHOTO_MAX} 張，每張 10 MB 以內）</span></label>
            <ul class="match-pet-form__photos" id="pet-photo-list"></ul>
            <input class="dp-input" id="pet-photo" name="pet-photo" type="file" accept="image/*" multiple aria-describedby="pet-photo-error">
            <p class="dp-help dp-help--error" id="pet-photo-error" hidden></p>
          </div>
          <div class="match-modal__actions">
            <button class="dp-btn dp-btn--primary" type="submit">${existing ? '儲存變更' : '新增寵物'}</button>
            <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>取消</button>
          </div>
        </form>
      </div>`, (dialog) => {
      const form = dialog.querySelector('form');
      const alertBox = dialog.querySelector('#pet-form-alert');
      const personalityBox = dialog.querySelector('#pet-personality');
      const photoInput = dialog.querySelector('#pet-photo');
      const photoListEl = dialog.querySelector('#pet-photo-list');
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

      function renderPhotoList() {
        photoListEl.innerHTML = photoList.map((ph, i) => `<li class="match-pet-form__thumb match-tone-${(me.photoTone + i) % 4}">
            ${ph.src ? `<img src="${esc(ph.src)}" alt="">` : `<span class="dp-xs">${esc(ph.caption || `照片 ${i + 1}`)}</span>`}
            <button class="match-pet-form__thumb-remove" type="button" data-remove-photo="${i}" aria-label="移除第 ${i + 1} 張照片">${icon('i-minus')}</button>
          </li>`).join('');
        photoListEl.hidden = photoList.length === 0;
        photoInput.disabled = photoList.length >= L.PET_PHOTO_MAX;
      }
      renderPhotoList();

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

      photoListEl.addEventListener('click', (e) => {
        const remove = e.target.closest('[data-remove-photo]');
        if (!remove) return;
        photoList.splice(Number(remove.dataset.removePhoto), 1);
        renderPhotoList();
        photoInput.focus();
      });

      photoInput.addEventListener('change', async () => {
        const files = [...photoInput.files];
        setError('photo', '');
        if (!files.length) return;
        const problem = L.validatePhotoCount(photoList.length, files.length)
          || files.map((f) => L.validatePhoto(f)).find(Boolean);
        if (problem) {
          setError('photo', problem);
          photoInput.value = '';
          return;
        }
        try {
          const srcs = await Promise.all(files.map(compressImage));
          photoList = [...photoList, ...srcs.map((src) => ({ src, caption: '' }))];
          renderPhotoList();
        } catch (err) {
          console.warn('[match] 照片處理失敗', err);
          setError('photo', err.message);
        }
        photoInput.value = '';
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

        const savedPet = {
          id: existing ? existing.id : L.nextPetId(pets),
          ...pet,
          photos: photoList,
          moments: p.moments || [], // 動態由其他功能產生，表單不編輯
        };
        const myPets = me.pets.map(({ ownerId, ...rest }) => rest); // 存檔不含 ownerId（由 allPets 補）
        if (!commitMyPets(L.upsertPet(myPets, savedPet))) {
          alertBox.textContent = '瀏覽器的儲存空間不夠，請少放幾張照片再試一次。';
          alertBox.hidden = false;
          alertBox.scrollIntoView({ block: 'nearest' });
          return;
        }
        state.mode = 'pet';
        state.petId = savedPet.id;
        if (!existing) state.index = 0;
        resetCardView();
        closeModal();
        renderAll();
        announce(existing ? `已儲存${savedPet.name}的變更。` : `已新增${savedPet.name}。`);
      });
    });
  }

  function openDeletePet(pet) {
    openModal(`<div class="dp-modal" role="dialog" aria-modal="true" aria-labelledby="delete-pet-title">
        <h2 class="dp-h2" id="delete-pet-title">刪除${esc(pet.name)}？</h2>
        <p class="dp-sm dp-muted">${esc(pet.name)}的資料，以及牠在寵物模式給出和收到的評分都會一起刪除，刪除後無法復原。</p>
        <div class="dp-alert dp-alert--danger" id="delete-pet-alert" role="alert" hidden></div>
        <div class="match-modal__actions">
          <button class="dp-btn dp-btn--primary" type="button" data-confirm>刪除${esc(pet.name)}</button>
          <button class="dp-btn dp-btn--ghost dp-btn--sm" type="button" data-close>取消</button>
        </div>
      </div>`, (dialog) => {
      dialog.querySelector('[data-close]').focus(); // 破壞性動作預設聚焦在「取消」
      dialog.querySelector('[data-confirm]').addEventListener('click', () => {
        const me = currentUser();
        const remaining = me.pets.filter((p) => p.id !== pet.id).map(({ ownerId, ...rest }) => rest);
        if (!commitMyPets(remaining, L.removeRatingsOf(state.ratings, 'pet', pet.id))) {
          const alertBox = dialog.querySelector('#delete-pet-alert');
          alertBox.textContent = '無法寫入瀏覽器儲存空間，請重新整理頁面後再試一次。';
          alertBox.hidden = false;
          return;
        }
        state.petId = remaining.length ? remaining[0].id : null;
        state.index = 0;
        resetCardView();
        closeModal();
        renderAll();
        announce(`已刪除${pet.name}。`);
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

    const after = pairInfo(kind, myId, theirId);
    announce(`${delta > 0 ? '加' : '扣'} ${L.STEP} 分，關係分數 ${after.total}%。`);
    if (!before.matched && after.matched) openMatchModal(kind, myId, theirId);
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
    resetCardView();
    renderStage();
  }

  function stepPhotoBy(delta) {
    const target = currentPool()[state.index];
    state.photoIndex = L.stepPhoto(state.photoIndex, delta, photosOf(target).length);
    renderStage();
  }

  function toggleExpand() {
    state.expanded = !state.expanded;
    renderStage();
    if (!state.expanded) window.scrollTo({ top: 0 });
  }

  /* ---------- 事件 ---------- */
  const actions = {
    plus: handlePlus,
    minus: () => changePoints(-1),
    prev: () => step(-1),
    next: () => step(1),
    'photo-prev': () => stepPhotoBy(-1),
    'photo-next': () => stepPhotoBy(1),
    'toggle-expand': toggleExpand,
    unlock: openUnlockModal,
    'open-points': openPointsModal,
    'clear-filters': clearFilters,
    'add-pet': () => openPetForm(),
    'edit-pet': () => openPetForm(petsById.get(state.petId)),
    'delete-pet': () => openDeletePet(petsById.get(state.petId)),
  };

  function handleAction(e) {
    const button = e.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const key = button.dataset.action;
    actions[key]();
    // 重畫後原按鈕已被換掉：把焦點放回同一個動作的新按鈕，鍵盤使用者才不會跳回頁首
    if (!document.contains(button) && !el.modalRoot.firstChild) {
      const again = document.querySelector(`[data-action="${key}"]:not([disabled])`);
      if (again) again.focus({ preventScroll: true });
    }
  }

  el.stage.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]')) {
      handleAction(e);
      return;
    }
    // 點卡片上非互動元素的地方＝切換展開；正在反白選字時不觸發
    const onCard = e.target.closest('.match-card');
    const interactive = e.target.closest('a, button, input, select, textarea, label');
    if (onCard && !interactive && !window.getSelection().toString()) {
      toggleExpand();
      const toggle = el.stage.querySelector('.match-card__toggle');
      if (toggle && e.detail === 0) toggle.focus({ preventScroll: true });
    }
  });

  el.petPicker.addEventListener('click', (e) => {
    const petButton = e.target.closest('[data-pet]');
    if (!petButton) {
      handleAction(e);
      return;
    }
    state.petId = petButton.dataset.pet;
    state.index = 0;
    resetCardView();
    renderAll();
  });

  el.modes.addEventListener('click', (e) => {
    const button = e.target.closest('[data-mode]');
    if (!button || button.dataset.mode === state.mode) return;
    state.mode = button.dataset.mode;
    state.index = 0;
    resetCardView();
    closeFilter({ restoreFocus: false });
    renderAll();
  });

  /* ---------- 初始化 ---------- */
  function renderAll() {
    renderModes();
    renderPointsToggle();
    renderPetPicker();
    renderFilterToggle();
    renderStage();
  }

  resetForUser();
  renderAccount(urlAccount && !urlUser ? accountError(urlAccount) : '');
  renderAll();
})();

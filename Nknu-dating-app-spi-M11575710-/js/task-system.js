/* =========================================================
   任務系統（純前端 demo）
   - 登入狀態：沿用 js/session.js 的 Session.currentUser（不自動導頁，
     因為這一頁在 project/task-system/ 子資料夾，safeNext 只接受同層 .html）
   - 點數：透過 ../shared/points-api.js 的 PointsAPI 讀寫，
     跟配對頁共用同一個錢包（localStorage: nknu-match-demo-v5）
   - 每日簽到、成就任務的「有沒有領過」記在獨立的 localStorage 鍵 nknu-tasks-v1，
     不會動到配對頁或點數錢包本身的資料
   - 成就任務的「有沒有達成」都是即時偵測別的頁面留下的資料，
     沒有另外存一份「進度」，避免兩邊資料兜不起來
   ========================================================= */
(function () {
  const TASKS_KEY = 'nknu-tasks-v1';
  const CHECKIN_REWARD = 10;

  /* ---------- 日期（用使用者本機時間，一天一次） ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateStr(d);
  }

  /* ---------- nknu-tasks-v1 讀寫 ---------- */
  function readAll() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('[task-system] 讀取任務紀錄失敗，視為沒有存檔', err);
      return {};
    }
  }

  function writeAll(all) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(all));
      return true;
    } catch (err) {
      console.warn('[task-system] 寫入任務紀錄失敗', err);
      return false;
    }
  }

  function getUserState(userId) {
    const all = readAll();
    return all[userId] || { checkin: { lastDate: null, streak: 0 }, claimed: {} };
  }

  function setUserState(userId, next) {
    const all = readAll();
    all[userId] = next;
    return writeAll(all);
  }

  /* ---------- 讀其他頁面留下的資料，判斷任務是否達成 ---------- */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function hasRated(userId) {
    const state = readJSON('nknu-match-demo-v5', null);
    const ratings = (state && Array.isArray(state.ratings)) ? state.ratings : [];
    return ratings.some((r) => r.from === userId && r.points > 0);
  }

  function hasUnlockedMoment(userId, basePoints) {
    const wallet = PointsAPI.getWallet(userId, basePoints);
    return Array.isArray(wallet.unlocked) && wallet.unlocked.length > 0;
  }

  function hasSentChatMessage(userId) {
    const conversations = readJSON('nknu-chat-demo-v2', []);
    if (!Array.isArray(conversations)) return false;
    return conversations.some((c) => Array.isArray(c.messages) && c.messages.some((m) => m.from === userId));
  }

  function hasToppedUp(userId) {
    const log = PointsAPI.getLog(userId);
    return log.some((entry) => entry.kind === 'earn' && entry.type === 'topup');
  }

  function hasUsedItinerary(userId) {
    return localStorage.getItem(`nknu-itinerary-used-${userId}`) === '1';
  }

  /* ---------- 成就任務清單 ---------- */
  function buildTasks(userId, basePoints) {
    return [
      {
        id: 'firstRating',
        title: '完成第一次配對評分',
        desc: '到配對頁幫任一位對象或寵物加減好感分數。',
        reward: 15,
        icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
        detect: () => hasRated(userId),
      },
      {
        id: 'firstUnlock',
        title: '解鎖第一則動態',
        desc: '在配對頁用點數解鎖一則對象的動態內容。',
        reward: 10,
        icon: '<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
        detect: () => hasUnlockedMoment(userId, basePoints),
      },
      {
        id: 'firstChat',
        title: '傳送第一則訊息',
        desc: '跟已配對成功的對象在聊天室送出一則訊息。',
        reward: 15,
        icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
        detect: () => hasSentChatMessage(userId),
      },
      {
        id: 'firstTopup',
        title: '完成第一次儲值',
        desc: '到課金系統完成任一方案的儲值（模擬付款）。',
        reward: 20,
        icon: '<rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>',
        detect: () => hasToppedUp(userId),
      },
      {
        id: 'firstItinerary',
        title: '使用 AI 規劃行程',
        desc: '到 AI 規劃行程產生一次屬於你的約會行程。',
        reward: 15,
        icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
        detect: () => hasUsedItinerary(userId),
      },
    ];
  }

  /* ---------- 畫面渲染 ---------- */
  function showAlert(message, kind) {
    const alertBox = document.getElementById('taskAlert');
    alertBox.className = `dp-alert dp-alert--${kind || 'success'}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    window.clearTimeout(showAlert._t);
    showAlert._t = window.setTimeout(() => { alertBox.style.display = 'none'; }, 3200);
  }

  function iconSvg(pathMarkup, extra) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"${extra || ''}>${pathMarkup}</svg>`;
  }

  function renderCheckin(userId) {
    const userState = getUserState(userId);
    const card = document.getElementById('checkinCard');
    const streakEl = document.getElementById('checkinStreak');
    const btn = document.getElementById('checkinBtn');
    const doneToday = userState.checkin.lastDate === todayStr();

    streakEl.textContent = `連續簽到 ${userState.checkin.streak} 天`;
    card.classList.toggle('is-done', doneToday);
    btn.disabled = doneToday;
    btn.textContent = doneToday ? '今日已簽到' : `簽到領 +${CHECKIN_REWARD} 點`;
  }

  function renderTasks(userId, basePoints) {
    const listEl = document.getElementById('taskList');
    const userState = getUserState(userId);
    const tasks = buildTasks(userId, basePoints);

    listEl.innerHTML = '';
    tasks.forEach((task) => {
      const claimed = Boolean(userState.claimed[task.id]);
      const achieved = claimed || task.detect();

      const li = document.createElement('li');
      li.className = `task-card${claimed ? ' is-claimed' : ''}${!achieved ? ' is-locked' : ''}`;

      const iconClass = claimed ? 'task-card__icon' : 'task-card__icon';
      const doneIcon = iconSvg('<polyline points="20 6 9 17 4 12"></polyline>');

      let actionHtml;
      if (claimed) {
        actionHtml = `<span class="task-card__done-label">${doneIcon}已領取</span>`;
      } else if (achieved) {
        actionHtml = `<button type="button" class="dp-btn dp-btn--primary dp-btn--sm" data-task="${task.id}">領取獎勵</button>`;
      } else {
        actionHtml = `<button type="button" class="dp-btn dp-btn--secondary dp-btn--sm" disabled>尚未達成</button>`;
      }

      li.innerHTML = `
        <div class="${iconClass}">${iconSvg(task.icon)}</div>
        <div class="task-card__body">
          <strong>${task.title}</strong>
          <p>${task.desc}</p>
          <span class="task-card__reward">+${task.reward} 點</span>
        </div>
        <div class="task-card__action">${actionHtml}</div>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('button[data-task]').forEach((btn) => {
      btn.addEventListener('click', () => claimTask(btn.dataset.task, userId, basePoints));
    });
  }

  function claimTask(taskId, userId, basePoints) {
    const tasks = buildTasks(userId, basePoints);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const userState = getUserState(userId);
    if (userState.claimed[taskId] || !task.detect()) {
      renderTasks(userId, basePoints);
      return;
    }

    PointsAPI.earn(userId, basePoints, task.reward, task.id, task.title);
    userState.claimed[taskId] = true;
    const ok = setUserState(userId, userState);

    if (ok) {
      showAlert(`已領取「${task.title}」獎勵，+${task.reward} 點！`, 'success');
    } else {
      showAlert('獎勵已發放，但紀錄寫入失敗，重新整理後可能需要重新領取。', 'warning');
    }
    renderTasks(userId, basePoints);
  }

  function doCheckin(userId, basePoints) {
    const userState = getUserState(userId);
    if (userState.checkin.lastDate === todayStr()) return;

    const streak = userState.checkin.lastDate === yesterdayStr() ? userState.checkin.streak + 1 : 1;
    userState.checkin = { lastDate: todayStr(), streak };

    PointsAPI.earn(userId, basePoints, CHECKIN_REWARD, 'checkin', `每日簽到（連續 ${streak} 天）`);
    const ok = setUserState(userId, userState);

    if (ok) {
      showAlert(`簽到成功，+${CHECKIN_REWARD} 點！目前連續 ${streak} 天。`, 'success');
    } else {
      showAlert('點數已發放，但簽到紀錄寫入失敗，重新整理後連續天數可能不準。', 'warning');
    }
    renderCheckin(userId);
  }

  /* ---------- 進入點 ---------- */
  function init() {
    const user = Session.currentUser(MOCK_DB.users);

    if (!user) {
      document.getElementById('guestNotice').style.display = 'block';
      document.getElementById('taskRoot').style.display = 'none';
      return;
    }

    document.getElementById('guestNotice').style.display = 'none';
    document.getElementById('taskRoot').style.display = 'block';

    const basePoints = typeof user.points === 'number' ? user.points : 0;

    renderCheckin(user.id);
    renderTasks(user.id, basePoints);

    document.getElementById('checkinBtn').addEventListener('click', () => doCheckin(user.id, basePoints));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

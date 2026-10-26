/* =========================================================
   集點系統（純前端 demo）
   - 點數餘額與異動紀錄都來自 ../shared/points-api.js 的 PointsAPI，
     跟配對頁、任務系統共用同一個錢包（localStorage: nknu-match-demo-v5）
     與同一份異動紀錄（localStorage: nknu-points-log-v1）
   - 兌換商店是這頁獨有的功能：用點數換「裝飾」，一生只能兌換一次，
     已擁有的裝飾記在獨立的 localStorage 鍵 nknu-shop-v1，
     不會動到點數錢包本身的資料結構
   ========================================================= */
(function () {
  const SHOP_KEY = 'nknu-shop-v1';

  const SHOP_ITEMS = [
    {
      id: 'frame-halo',
      name: '頭像外框「光環」',
      desc: '個人頭像加上一圈柔和的光環邊框。',
      cost: 50,
      icon: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle>',
    },
    {
      id: 'chat-theme-lavender',
      name: '聊天氣泡主題「薰衣草」',
      desc: '把聊天室的訊息氣泡換成薰衣草配色。',
      cost: 80,
      icon: '<path d="M12 3c-3 3-6 6-6 10a6 6 0 0 0 12 0c0-4-3-7-6-10z"></path>',
    },
    {
      id: 'card-effect-stardust',
      name: '配對卡片特效「星塵」',
      desc: '配對卡片滑動時灑落星塵粒子效果。',
      cost: 120,
      icon: '<path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z"></path>',
    },
    {
      id: 'badge-popular',
      name: '專屬稱號「人氣王」',
      desc: '在個人資料旁顯示限定稱號徽章。',
      cost: 200,
      icon: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"></path>',
    },
  ];

  /* ---------- nknu-shop-v1 讀寫 ---------- */
  function readShopAll() {
    try {
      const raw = localStorage.getItem(SHOP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('[points-system] 讀取兌換紀錄失敗，視為沒有存檔', err);
      return {};
    }
  }

  function writeShopAll(all) {
    try {
      localStorage.setItem(SHOP_KEY, JSON.stringify(all));
      return true;
    } catch (err) {
      console.warn('[points-system] 寫入兌換紀錄失敗', err);
      return false;
    }
  }

  function getOwned(userId) {
    const all = readShopAll();
    return Array.isArray(all[userId]) ? all[userId] : [];
  }

  function setOwned(userId, owned) {
    const all = readShopAll();
    all[userId] = owned;
    return writeShopAll(all);
  }

  /* ---------- 小工具 ---------- */
  function iconSvg(pathMarkup) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pathMarkup}</svg>`;
  }

  function showAlert(message, kind) {
    const alertBox = document.getElementById('pointsAlert');
    alertBox.className = `dp-alert dp-alert--${kind || 'success'}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    window.clearTimeout(showAlert._t);
    showAlert._t = window.setTimeout(() => { alertBox.style.display = 'none'; }, 3200);
  }

  function formatTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------- 畫面渲染 ---------- */
  function renderBalance(userId, basePoints) {
    const wallet = PointsAPI.getWallet(userId, basePoints);
    document.getElementById('balanceNumber').textContent = wallet.points;
    return wallet;
  }

  function renderShop(userId, basePoints) {
    const wallet = renderBalance(userId, basePoints);
    const owned = getOwned(userId);
    const listEl = document.getElementById('shopList');

    listEl.innerHTML = '';
    SHOP_ITEMS.forEach((item) => {
      const isOwned = owned.includes(item.id);
      const canAfford = wallet.points >= item.cost;

      const li = document.createElement('li');
      li.className = `shop-item${isOwned ? ' is-owned' : ''}`;

      let actionHtml;
      if (isOwned) {
        actionHtml = `<span class="shop-item__owned-label">${iconSvg('<polyline points="20 6 9 17 4 12"></polyline>')}已擁有</span>`;
      } else {
        actionHtml = `<button type="button" class="dp-btn dp-btn--primary dp-btn--sm" data-item="${item.id}"${canAfford ? '' : ' disabled'}>兌換</button>`;
      }

      li.innerHTML = `
        <div class="shop-item__icon">${iconSvg(item.icon)}</div>
        <div class="shop-item__body">
          <strong>${item.name}</strong>
          <p>${item.desc}</p>
          <span class="shop-item__cost">${item.cost} 點</span>
        </div>
        <div class="shop-item__action">${actionHtml}</div>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('button[data-item]').forEach((btn) => {
      btn.addEventListener('click', () => redeemItem(btn.dataset.item, userId, basePoints));
    });
  }

  function renderLog(userId) {
    const log = PointsAPI.getLog(userId);
    const listEl = document.getElementById('logList');
    const emptyEl = document.getElementById('logEmpty');

    listEl.innerHTML = '';
    if (log.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    log.slice(0, 15).forEach((entry) => {
      const isEarn = entry.kind === 'earn';
      const li = document.createElement('li');
      li.className = 'log-item';
      li.innerHTML = `
        <div class="log-item__info">
          <strong>${entry.note || (isEarn ? '點數增加' : '點數使用')}</strong>
          <span>${formatTime(entry.at)}</span>
        </div>
        <div class="log-item__amount ${isEarn ? 'is-earn' : 'is-spend'}">${isEarn ? '+' : '-'}${entry.amount}</div>
      `;
      listEl.appendChild(li);
    });
  }

  function redeemItem(itemId, userId, basePoints) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const owned = getOwned(userId);
    if (owned.includes(itemId)) {
      renderShop(userId, basePoints);
      return;
    }

    const result = PointsAPI.spend(userId, basePoints, item.cost, 'shop', item.name);
    if (!result) {
      showAlert('點數不足，無法兌換這項裝飾。', 'danger');
      return;
    }

    owned.push(itemId);
    const ok = setOwned(userId, owned);

    if (ok) {
      showAlert(`已兌換「${item.name}」！`, 'success');
    } else {
      showAlert('點數已扣除，但兌換紀錄寫入失敗，重新整理後可能需要重新確認。', 'warning');
    }

    renderShop(userId, basePoints);
    renderLog(userId);
  }

  /* ---------- 進入點 ---------- */
  function init() {
    const user = Session.currentUser(MOCK_DB.users);

    if (!user) {
      document.getElementById('guestNotice').style.display = 'block';
      document.getElementById('pointsRoot').style.display = 'none';
      return;
    }

    document.getElementById('guestNotice').style.display = 'none';
    document.getElementById('pointsRoot').style.display = 'block';

    const basePoints = typeof user.points === 'number' ? user.points : 0;

    renderShop(user.id, basePoints);
    renderLog(user.id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

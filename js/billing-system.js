/* =========================================================
   課金系統（純前端 demo，無真實金流）
   - 方案直接沿用 js/match-logic.js 的 MatchLogic.TOPUP_PLANS，
     跟配對頁儲值彈窗用的是同一份方案資料，不會兩邊兜不起來
   - 點數透過 ../shared/points-api.js 的 PointsAPI 入帳，
     跟配對頁共用同一個錢包（localStorage: nknu-match-demo-v5）
   - 「處理中」只是用 setTimeout 模擬金流延遲，沒有任何網路請求或真實扣款
   ========================================================= */
(function () {
  let processing = false;

  function iconSvg(pathMarkup) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pathMarkup}</svg>`;
  }

  function showAlert(message, kind) {
    const alertBox = document.getElementById('billingAlert');
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

  function renderBalance(userId, basePoints) {
    const wallet = PointsAPI.getWallet(userId, basePoints);
    document.getElementById('balanceNumber').textContent = wallet.points;
  }

  function renderPlans(userId, basePoints) {
    const listEl = document.getElementById('planList');
    listEl.innerHTML = '';

    MatchLogic.TOPUP_PLANS.forEach((plan, index) => {
      const isPopular = index === 1; // 中方案標記為推薦
      const li = document.createElement('li');
      li.className = `plan-item${isPopular ? ' is-popular' : ''}`;
      li.innerHTML = `
        <div class="plan-item__icon">${iconSvg('<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>')}</div>
        <div class="plan-item__body">
          <strong>${plan.points} 點${isPopular ? '（推薦）' : ''}</strong>
          <p>一次性儲值方案</p>
          <div class="plan-item__price">NT$ ${plan.price} 元</div>
        </div>
        <div class="plan-item__action">
          <button type="button" class="dp-btn dp-btn--primary dp-btn--sm" data-plan="${plan.id}">立即儲值</button>
        </div>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('button[data-plan]').forEach((btn) => {
      btn.addEventListener('click', () => startCheckout(btn.dataset.plan, userId, basePoints));
    });
  }

  function renderLog(userId) {
    const log = PointsAPI.getLog(userId).filter((entry) => entry.type === 'topup');
    const listEl = document.getElementById('logList');
    const emptyEl = document.getElementById('logEmpty');

    listEl.innerHTML = '';
    if (log.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    log.slice(0, 15).forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'log-item';
      li.innerHTML = `
        <div class="log-item__info">
          <strong>${entry.note || '點數儲值'}</strong>
          <span>${formatTime(entry.at)}</span>
        </div>
        <div class="log-item__amount">+${entry.amount}</div>
      `;
      listEl.appendChild(li);
    });
  }

  function setButtonsDisabled(disabled) {
    document.querySelectorAll('#planList button[data-plan]').forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  function startCheckout(planId, userId, basePoints) {
    if (processing) return;
    const plan = MatchLogic.TOPUP_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    processing = true;
    setButtonsDisabled(true);
    showAlert(`處理中，模擬付款 NT$ ${plan.price} 元...`, 'info');

    window.setTimeout(() => {
      PointsAPI.earn(userId, basePoints, plan.points, 'topup', `儲值 NT$ ${plan.price} 元 → +${plan.points} 點`);
      processing = false;
      setButtonsDisabled(false);

      showAlert(`儲值成功！已入帳 ${plan.points} 點。`, 'success');
      renderBalance(userId, basePoints);
      renderLog(userId);
    }, 1200);
  }

  /* ---------- 進入點 ---------- */
  function init() {
    const user = Session.currentUser(MOCK_DB.users);

    if (!user) {
      document.getElementById('guestNotice').style.display = 'block';
      document.getElementById('billingRoot').style.display = 'none';
      return;
    }

    document.getElementById('guestNotice').style.display = 'none';
    document.getElementById('billingRoot').style.display = 'block';

    const basePoints = typeof user.points === 'number' ? user.points : 0;

    renderBalance(user.id, basePoints);
    renderPlans(user.id, basePoints);
    renderLog(user.id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

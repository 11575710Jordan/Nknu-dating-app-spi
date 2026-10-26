/* =========================================================
   AI 規劃行程（純前端 demo，規則比對，不是真的呼叫 AI 模型）
   - 景點資料來自同資料夾的 itinerary-data.js（ItineraryData）
   - 比對邏輯模仿 chat/chat-ai.js 的作法：針對使用者選的條件，
     一條一條判斷、把符合的理由往陣列裡 push，最後排序挑出幾站
   - 第一次成功產生行程後，設定 localStorage 旗標
     nknu-itinerary-used-<userId> = '1'，讓任務系統可以偵測到「使用過 AI 規劃行程」
   ========================================================= */
(function () {
  const TIME_PRESETS = {
    全天: [
      { time: '09:00', label: '早上' },
      { time: '13:00', label: '下午' },
      { time: '18:00', label: '晚上' },
    ],
    早上: [
      { time: '09:00', label: '早上' },
      { time: '10:30', label: '早上' },
    ],
    下午: [
      { time: '13:00', label: '下午' },
      { time: '15:00', label: '下午' },
    ],
    晚上: [
      { time: '18:00', label: '晚上' },
      { time: '19:30', label: '晚上' },
    ],
  };

  const BUDGET_LABEL = { free: '免費', low: '平價', mid: '中等消費' };

  function iconSvg(pathMarkup) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pathMarkup}</svg>`;
  }

  function showAlert(message, kind) {
    const alertBox = document.getElementById('itineraryAlert');
    alertBox.className = `dp-alert dp-alert--${kind || 'success'}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    window.clearTimeout(showAlert._t);
    showAlert._t = window.setTimeout(() => { alertBox.style.display = 'none'; }, 3600);
  }

  /* ---------- 初始化表單選項 ---------- */
  function populateForm() {
    const regionSelect = document.getElementById('regionSelect');
    ItineraryData.AREAS.forEach((area) => {
      const opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      regionSelect.appendChild(opt);
    });

    const tagGrid = document.getElementById('interestTags');
    ItineraryData.INTERESTS.forEach((tag, i) => {
      const label = document.createElement('label');
      label.className = 'tag-chip';
      label.innerHTML = `<input type="checkbox" value="${tag}" id="tag-${i}"><span>${tag}</span>`;
      tagGrid.appendChild(label);
    });
  }

  /* ---------- 篩選：依序套用地區 / 寵物友善 / 預算，任一條件篩到空集合就退回上一步 ---------- */
  function applyFilters(region, petOnly, budget) {
    let notes = [];
    let pool = ItineraryData.SPOTS.slice();

    if (region) {
      const next = pool.filter((s) => s.area === region);
      if (next.length) {
        pool = next;
      } else {
        notes.push(`「${region}」目前沒有符合其他條件的景點，改成在高雄市全區挑選。`);
      }
    }

    if (petOnly) {
      const next = pool.filter((s) => s.petFriendly);
      if (next.length) {
        pool = next;
      } else {
        notes.push('這個範圍內找不到完全寵物友善的地點，以下仍列出一般景點，出發前建議再確認現場規定。');
      }
    }

    if (budget && budget !== 'any') {
      const allowed = budget === 'free' ? ['free'] : ['free', 'low'];
      const next = pool.filter((s) => allowed.includes(s.budgetLevel));
      if (next.length) {
        pool = next;
      } else {
        notes.push('這個範圍內的景點消費等級都比預設的高，以下保留所有符合地區／寵物條件的地點。');
      }
    }

    return { pool, notes };
  }

  /* ---------- 評分：興趣符合愈多分數愈高，時段吻合加分（模仿 chat-ai.js 的 push 理由寫法） ---------- */
  function scoreSpots(pool, interests, timeSlot) {
    return pool.map((spot) => {
      const matchedTags = spot.tags.filter((tag) => interests.indexOf(tag) !== -1);
      let score = matchedTags.length * 2;
      if (timeSlot === '全天' || spot.timeSlots.indexOf(timeSlot) !== -1) score += 1;
      return { spot, matchedTags, score };
    }).sort((a, b) => b.score - a.score);
  }

  function buildWhy(matchedTags, timeSlot, spot) {
    if (matchedTags.length) {
      return `因為你勾選了「${matchedTags.join('、')}」`;
    }
    if (timeSlot !== '全天' && spot.timeSlots.indexOf(timeSlot) !== -1) {
      return `這裡在${timeSlot}去氣氛比較好`;
    }
    return '這個條件下的推薦景點';
  }

  /* ---------- 挑站並排進時間軸 ---------- */
  function buildTimeline(ranked, timeSlot) {
    const slots = TIME_PRESETS[timeSlot] || TIME_PRESETS['全天'];
    const picked = [];
    const usedIds = {};

    slots.forEach((slot) => {
      const candidate = ranked.find((r) => !usedIds[r.spot.id]);
      if (!candidate) return;
      usedIds[candidate.spot.id] = true;
      picked.push({ slot, entry: candidate });
    });

    return picked;
  }

  function render(picked, notes, region, timeSlot, budget) {
    const timeline = document.getElementById('timeline');
    const resultNote = document.getElementById('resultNote');
    timeline.innerHTML = '';

    const scopeText = region ? region : '高雄市全區';
    let noteText = `依「${scopeText}・${timeSlot}・預算${budget === 'free' ? '小資' : budget === 'any' ? '不限' : '中等'}」排的行程建議：`;
    if (notes.length) noteText += ' ' + notes.join(' ');
    resultNote.textContent = noteText;

    picked.forEach(({ slot, entry }) => {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.innerHTML = `
        <div class="timeline-item__time">${slot.time}</div>
        <div class="timeline-item__body">
          <strong>${entry.spot.name}</strong>
          <div class="timeline-item__meta">${entry.spot.area} · ${BUDGET_LABEL[entry.spot.budgetLevel]}${entry.spot.petFriendly ? ' · 寵物友善' : ''}</div>
          <p class="timeline-item__note">${entry.spot.note}</p>
          <span class="timeline-item__why">${buildWhy(entry.matchedTags, timeSlot, entry.spot)}</span>
        </div>
      `;
      timeline.appendChild(li);
    });

    document.getElementById('resultSection').style.display = 'block';
  }

  function markUsed(userId) {
    try {
      localStorage.setItem(`nknu-itinerary-used-${userId}`, '1');
    } catch (err) {
      console.warn('[ai-itinerary] 無法寫入使用紀錄', err);
    }
  }

  /* ---------- 進入點 ---------- */
  function init() {
    const user = Session.currentUser(MOCK_DB.users);

    if (!user) {
      document.getElementById('guestNotice').style.display = 'block';
      document.getElementById('itineraryRoot').style.display = 'none';
      return;
    }

    document.getElementById('guestNotice').style.display = 'none';
    document.getElementById('itineraryRoot').style.display = 'block';

    populateForm();

    document.getElementById('planForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const region = document.getElementById('regionSelect').value;
      const timeSlot = document.getElementById('timeSelect').value;
      const budget = document.getElementById('budgetSelect').value;
      const petOnly = document.getElementById('petToggle').checked;
      const interests = Array.from(document.querySelectorAll('#interestTags input:checked')).map((el) => el.value);

      const { pool, notes } = applyFilters(region, petOnly, budget);
      const ranked = scoreSpots(pool, interests, timeSlot);
      const picked = buildTimeline(ranked, timeSlot);

      if (!picked.length) {
        showAlert('目前條件下找不到可以安排的景點，請放寬條件再試一次。', 'warning');
        document.getElementById('resultSection').style.display = 'none';
        return;
      }

      render(picked, notes, region, timeSlot, budget);
      markUsed(user.id);
      showAlert('行程已產生，已記錄到你的任務進度！', 'success');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

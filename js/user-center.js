document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  // 1. 讀取並顯示用戶基本身分與頭像（優先順序：localStorage 編輯資料 > Session / Mock 預設資料）
  try {
    let userName = "CcCo";
    let userId = "chiahuei_l";
    let userAvatar = "https://picsum.photos/120/120?random=20";

    // 取得 Session 預設資料
    const mockUser = (typeof Session !== 'undefined' && typeof MOCK_DB !== 'undefined')
      ? Session.currentUser(MOCK_DB.users)
      : null;
    
    if (mockUser) {
      userName = mockUser.name;
      userId = mockUser.id;
      const firstPhoto = mockUser.photos && mockUser.photos.find((p) => p.src);
      if (firstPhoto) {
        userAvatar = firstPhoto.src;
      }
    }

    // 檢查是否有透過「編輯個人資料」覆寫的 LocalStorage 數據
    const profile = JSON.parse(localStorage.getItem('nknu-profile') || 'null');
    if (profile) {
      if (profile.nickname) userName = profile.nickname;
      if (profile.avatar) userAvatar = profile.avatar;
    }

    // 渲染至前端 DOM
    document.querySelector('.dp-user-name').textContent = userName;
    document.querySelector('.dp-user-id').textContent = `ID: @${userId}`;
    document.querySelector('.dp-avatar').src = userAvatar;

  } catch (err) {
    console.warn('[user-center] 讀取個人資料身分失敗，使用預設顯示', err);
  }

  // 2. 動態讀取與渲染「社群健康度與仇恨值指數」（對應 SPI.md 仇恨值系統規格）
  try {
    const hateScore = parseInt(localStorage.getItem('nknu-hate-score') || '15', 10);
    const healthCard = document.querySelector('.dp-health-card');
    const healthStatusText = document.querySelector('.dp-health-status');

    if (healthStatusText) {
      let statusDesc = "良好";
      if (hateScore >= 50) {
        statusDesc = "高風險警告";
        if (healthCard) {
          healthCard.style.backgroundColor = 'var(--status-danger-bg)';
          healthCard.style.borderColor = 'var(--status-danger)';
        }
      } else if (hateScore >= 30) {
        statusDesc = "注意觀察";
        if (healthCard) {
          healthCard.style.backgroundColor = 'var(--status-warning-bg)';
          healthCard.style.borderColor = 'var(--status-warning)';
        }
      }
      healthStatusText.textContent = `${statusDesc} (Hate Score: ${hateScore}/100)`;
    }
  } catch (err) {
    console.warn('[user-center] 讀取仇恨值紀錄失敗', err);
  }

  // 3. 動態讀取與渲染「實名與真人認證狀態」（對應 SPI.md 審核機制規格）
  try {
    const auditStatus = localStorage.getItem('nknu-audit-status') || 'approved'; // 預設模擬已驗證
    const badgeContainer = document.querySelector('.dp-menu-content');
    
    if (badgeContainer) {
      // 尋找或建立狀態標籤
      let tagEl = badgeContainer.querySelector('.dp-tag-success, .dp-tag-warning, .dp-tag-danger');
      if (!tagEl) {
        tagEl = document.createElement('span');
        badgeContainer.appendChild(tagEl);
      }

      if (auditStatus === 'approved') {
        tagEl.className = 'dp-tag-success';
        tagEl.textContent = '已驗證';
        document.querySelector('.dp-badge-verified').style.display = 'flex';
      } else if (auditStatus === 'pending') {
        tagEl.className = 'dp-tag-warning';
        tagEl.style.backgroundColor = 'var(--status-warning-bg)';
        tagEl.style.color = 'var(--status-warning)';
        tagEl.style.fontSize = '11px';
        tagEl.style.padding = '2px var(--sp-2)';
        tagEl.style.borderRadius = 'var(--r-pill)';
        tagEl.style.fontWeight = 'var(--fw-bold)';
        tagEl.textContent = '待審核';
        document.querySelector('.dp-badge-verified').style.display = 'none';
      } else if (auditStatus === 'rejected') {
        tagEl.className = 'dp-tag-danger';
        tagEl.style.backgroundColor = 'var(--status-danger-bg)';
        tagEl.style.color = 'var(--status-danger)';
        tagEl.style.fontSize = '11px';
        tagEl.style.padding = '2px var(--sp-2)';
        tagEl.style.borderRadius = 'var(--r-pill)';
        tagEl.style.fontWeight = 'var(--fw-bold)';
        tagEl.textContent = '未通過 (需補件)';
        document.querySelector('.dp-badge-verified').style.display = 'none';
      }
    }
  } catch (err) {
    console.warn('[user-center] 讀取實名認證狀態失敗', err);
  }

  // 4. 處理登出邏輯
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('確定要登出系統嗎？')) {
        if (typeof Session !== 'undefined') {
          Session.logout();
        } else {
          localStorage.removeItem('userToken');
        }

        // 重導向至登入頁面
        window.location.href = 'login.html';
      }
    });
  }
});
/* =========================================================
   通知中心 (符合 SPI.md 規格與純前端 LocalStorage 完整實作)
   - key: nknu-notifications (儲存通知清單陣列與已讀/未讀狀態)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_NOTIF_KEY = 'nknu-notifications';

  const tabs = document.querySelectorAll('.dp-tab-btn');
  const container = document.getElementById('notificationContainer');
  const emptyState = document.getElementById('emptyState');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const unreadBadge = document.getElementById('unreadBadge');
  const alertMessage = document.getElementById('alertMessage');

  // 預設初始通知資料（若 LocalStorage 尚無資料時寫入）
  const defaultNotifications = [
    {
      id: 'notif_1',
      category: 'system',
      title: '實名與真人認證成功',
      desc: '恭喜！您的實名認證與照片審核已完成，獲得「已驗證」藍色標章。',
      time: '10 分鐘前',
      unread: true,
      href: 'identity-verification.html',
      iconType: 'icon-success',
      iconSvg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path>'
    },
    {
      id: 'notif_2',
      category: 'system',
      title: '伺服器例行維護通知',
      desc: '系統預計將於今晚 02:00 ~ 04:00 進行伺服器優化維護，屆時暫時無法登入與配對。',
      time: '2 小時前',
      unread: true,
      href: '',
      iconType: 'icon-warning',
      iconSvg: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
    },
    {
      id: 'notif_3',
      category: 'interactive',
      title: '成功獲得新配對！',
      desc: '你與「雅婷」互相對彼此送入了喜歡，快去打個招呼吧！',
      time: '昨天 18:30',
      unread: false,
      href: 'chat.html',
      iconType: 'icon-heart',
      iconSvg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>'
    },
    {
      id: 'notif_4',
      category: 'system',
      title: '檢舉案件處理結果',
      desc: '您提交的案件 #RP-8842 已審核完畢，違規用戶已受到系統處分。',
      time: '3 天前',
      unread: false,
      href: 'report-user.html',
      iconType: 'icon-shield',
      iconSvg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'
    }
  ];

  // 讀取或初始化 LocalStorage 通知資料
  function getNotifications() {
    try {
      const data = localStorage.getItem(STORAGE_NOTIF_KEY);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(defaultNotifications));
      return defaultNotifications;
    } catch (err) {
      console.warn('[notifications] 讀取 LocalStorage 失敗', err);
      return defaultNotifications;
    }
  }

  function saveNotifications(notifications) {
    try {
      localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(notifications));
    } catch (err) {
      console.warn('[notifications] 寫入 LocalStorage 失敗', err);
    }
  }

  let notifications = getNotifications();

  // 輔助函式：顯示提示訊息
  function showAlert(message, type = 'success') {
    if (!alertMessage) return;
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert dp-alert-${type}`;
    alertMessage.style.display = 'block';

    setTimeout(() => {
      alertMessage.style.display = 'none';
    }, 2500);
  }

  // 渲染通知清單至 DOM
  function renderNotifications(filter = 'all') {
    if (!container) return;
    container.innerHTML = '';

    const filtered = notifications.filter(item => {
      if (filter === 'all') return true;
      if (filter === 'unread') return item.unread;
      return item.category === filter;
    });

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    filtered.forEach(item => {
      const el = document.createElement('div');
      el.className = `dp-notification-item ${item.unread ? 'unread' : ''}`;
      el.setAttribute('data-id', item.id);
      el.setAttribute('data-category', item.category);
      if (item.href) el.setAttribute('data-href', item.href);

      el.innerHTML = `
        <div class="dp-notif-icon ${item.iconType}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.iconSvg}</svg>
        </div>
        <div class="dp-notif-body">
          <div class="dp-notif-header">
            <span class="dp-notif-title">${item.title}</span>
            <span class="dp-notif-time">${item.time}</span>
          </div>
          <p class="dp-notif-desc">${item.desc}</p>
        </div>
        ${item.unread ? '<span class="dp-notif-dot"></span>' : ''}
      `;

      // 綁定點擊事件 (標示已讀 & 導航)
      el.addEventListener('click', () => {
        if (item.unread) {
          item.unread = false;
          saveNotifications(notifications);
          updateUnreadBadge();
          
          // 重新渲染以更新畫面
          const currentTab = document.querySelector('.dp-tab-btn.active');
          renderNotifications(currentTab ? currentTab.getAttribute('data-tab') : 'all');
        }

        if (item.href) {
          window.location.href = item.href;
        }
      });

      container.appendChild(el);
    });
  }

  // 更新未讀紅點計數
  function updateUnreadBadge() {
    const unreadCount = notifications.filter(i => i.unread).length;
    if (unreadBadge) {
      if (unreadCount > 0) {
        unreadBadge.textContent = unreadCount;
        unreadBadge.style.display = 'inline-block';
      } else {
        unreadBadge.style.display = 'none';
      }
    }
  }

  // 1. Tab 切換過濾邏輯
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-tab');
      renderNotifications(filter);
    });
  });

  // 2. 全部標示為已讀功能
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      const hasUnread = notifications.some(i => i.unread);
      if (!hasUnread) {
        showAlert('目前沒有未讀通知喔！', 'warning');
        return;
      }

      notifications.forEach(i => { i.unread = false; });
      saveNotifications(notifications);
      updateUnreadBadge();

      const activeTab = document.querySelector('.dp-tab-btn.active');
      renderNotifications(activeTab ? activeTab.getAttribute('data-tab') : 'all');

      showAlert('已成功將所有通知標示為已讀！', 'success');
    });
  }

  // 初始化執行
  updateUnreadBadge();
  renderNotifications('all');
});
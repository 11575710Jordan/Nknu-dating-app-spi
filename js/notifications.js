/* =========================================================
   通知中心 (UI/UX 最佳化版本)
   - 支援單條通知點擊標示已讀、動態未讀計數更新與 Tab 過濾
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.dp-tab-btn');
  const items = document.querySelectorAll('.dp-notification-item');
  const emptyState = document.getElementById('emptyState');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const unreadBadge = document.getElementById('unreadBadge');
  const alertMessage = document.getElementById('alertMessage');

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

  // 更新未讀徽章 (Visibility of System Status)
  function updateUnreadBadge() {
    const unreadCount = document.querySelectorAll('.dp-notification-item.unread').length;
    if (unreadBadge) {
      if (unreadCount > 0) {
        unreadBadge.textContent = unreadCount;
        unreadBadge.style.display = 'inline-block';
      } else {
        unreadBadge.style.display = 'none';
      }
    }
  }

  // 1. 單條通知點擊事件 (點擊標示已讀 & 功能跳轉)
  items.forEach(item => {
    item.addEventListener('click', () => {
      // 標示為已讀
      if (item.classList.contains('unread')) {
        item.classList.remove('unread');
        const dot = item.querySelector('.dp-notif-dot');
        if (dot) dot.remove();

        updateUnreadBadge();

        // 若當前在「未讀」Tab，消除後需即時重新過濾
        const activeTab = document.querySelector('.dp-tab-btn.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'unread') {
          item.style.display = 'none';
          checkEmptyState('unread');
        }
      }

      // 若有帶入跳轉連結則進行導覽
      const targetHref = item.getAttribute('data-href');
      if (targetHref) {
        window.location.href = targetHref;
      }
    });
  });

  // 檢查目前顯示狀態與空狀態
  function checkEmptyState(currentFilter) {
    let visibleCount = 0;
    items.forEach(item => {
      const isUnread = item.classList.contains('unread');
      const category = item.getAttribute('data-category');

      if (
        currentFilter === 'all' ||
        (currentFilter === 'unread' && isUnread) ||
        (currentFilter === category)
      ) {
        item.style.display = 'flex';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // 2. Tab 切換過濾邏輯
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-tab');
      checkEmptyState(filter);
    });
  });

  // 3. 全部標示為已讀功能 (Visibility of System Status)
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      const unreadItems = document.querySelectorAll('.dp-notification-item.unread');
      
      if (unreadItems.length === 0) {
        showAlert('目前沒有未讀通知喔！', 'warning');
        return;
      }

      unreadItems.forEach(item => {
        item.classList.remove('unread');
        const dot = item.querySelector('.dp-notif-dot');
        if (dot) dot.remove();
      });

      updateUnreadBadge();

      // 若當前在「未讀」Tab，立即重新整理顯示
      const activeTab = document.querySelector('.dp-tab-btn.active');
      if (activeTab && activeTab.getAttribute('data-tab') === 'unread') {
        checkEmptyState('unread');
      }

      showAlert('已成功將所有通知標示為已讀！', 'success');
    });
  }

  // 初始化未讀數字
  updateUnreadBadge();
});
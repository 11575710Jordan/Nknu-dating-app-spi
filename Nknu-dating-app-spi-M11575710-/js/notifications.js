document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.dp-tab-btn');
  const items = document.querySelectorAll('.dp-notification-item');
  const emptyState = document.getElementById('emptyState');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  // 1. Tab 切換過濾邏輯
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-tab');
      let visibleCount = 0;

      items.forEach(item => {
        const isUnread = item.classList.contains('unread');
        const category = item.getAttribute('data-category');

        if (
          filter === 'all' ||
          (filter === 'unread' && isUnread) ||
          (filter === category)
        ) {
          item.style.display = 'flex';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });

      // 顯示/隱藏空狀態
      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    });
  });

  // 2. 全部標示為已讀功能
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      items.forEach(item => {
        item.classList.remove('unread');
        const dot = item.querySelector('.dp-notif-dot');
        if (dot) dot.remove();
      });

      // 清除 Badge 數字
      const badge = document.querySelector('.dp-tab-badge');
      if (badge) badge.remove();

      alert('已將所有通知標示為已讀');
    });
  }
});
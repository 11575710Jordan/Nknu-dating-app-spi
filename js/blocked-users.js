document.addEventListener('DOMContentLoaded', () => {
  const blockedList = document.getElementById('blockedList');
  const emptyState = document.getElementById('emptyState');
  const alertMessage = document.getElementById('alertMessage');

  // 監聽解除封鎖按鈕事件 (事件代理)
  blockedList.addEventListener('click', (e) => {
    if (e.target.classList.contains('dp-btn-unblock')) {
      const button = e.target;
      const userName = button.getAttribute('data-name');
      const item = button.closest('.dp-blocked-item');

      if (confirm(`確定要解除對「${userName}」的封鎖嗎？`)) {
        // 動態移除項目動畫
        item.style.opacity = '0';
        
        setTimeout(() => {
          item.remove();
          checkEmptyState();
          showAlert(`已順利解除對 ${userName} 的封鎖。`, 'success');
        }, 300);
      }
    }
  });

  // 檢查是否沒有封鎖用戶，並切換空狀態顯示
  function checkEmptyState() {
    const remainingItems = blockedList.querySelectorAll('.dp-blocked-item');
    if (remainingItems.length === 0) {
      blockedList.style.display = 'none';
      emptyState.style.display = 'block';
    }
  }

  function showAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert ${type}`;
    
    // 3 秒後自動隱藏提示
    setTimeout(() => {
      alertMessage.style.display = 'none';
    }, 3000);
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  // 處理登出邏輯
  logoutBtn.addEventListener('click', () => {
    if (confirm('確定要登出系統嗎？')) {
      // 清除本地 Token / Session（依據實際架構調整）
      localStorage.removeItem('userToken');
      
      // 重導向至登入頁面
      window.location.href = 'login.html';
    }
  });
});
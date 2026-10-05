document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  // 若在「編輯個人資料」存過資料（localStorage: nknu-profile），就換成使用者自己的頭像與暱稱
  try {
    const profile = JSON.parse(localStorage.getItem('nknu-profile') || 'null');
    if (profile) {
      if (profile.avatar) {
        document.querySelector('.dp-avatar').src = profile.avatar;
      }
      if (profile.nickname) {
        document.querySelector('.dp-user-name').textContent = profile.nickname;
      }
    }
  } catch (err) {
    console.warn('[user-center] 讀取個人資料失敗，使用預設頭像', err);
  }

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

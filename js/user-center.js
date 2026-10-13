document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  // 1. 登入身分：顯示登入頁、配對頁、訊息頁共用的登入狀態（js/session.js）
  try {
    const mockUser = (typeof Session !== 'undefined' && typeof MOCK_DB !== 'undefined')
      ? Session.currentUser(MOCK_DB.users)
      : null;
    if (mockUser) {
      document.querySelector('.dp-user-name').textContent = mockUser.name;
      document.querySelector('.dp-user-id').textContent = `ID: @${mockUser.id}`;
      const firstPhoto = mockUser.photos && mockUser.photos.find((p) => p.src);
      if (firstPhoto) {
        document.querySelector('.dp-avatar').src = firstPhoto.src;
      }
    }
  } catch (err) {
    console.warn('[user-center] 讀取登入身分失敗，使用預設顯示', err);
  }

  // 2. 若在「編輯個人資料」存過資料（localStorage: nknu-profile），用使用者自己編輯過的頭像與暱稱覆蓋
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

  // 3. 處理登出邏輯（與配對頁、訊息頁共用 js/session.js 的登入狀態）
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
});

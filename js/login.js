document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const submitBtn = document.getElementById('submitBtn');
  const alertMessage = document.getElementById('alertMessage');

  // 1. 密碼顯示 / 隱藏切換
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

    // 切換眼睛 SVG 圖示 (睜眼 / 閉眼)
    if (isPassword) {
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    } else {
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  });

  // 2. 表單提交處理
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showAlert('請填寫完整帳號與密碼。', 'error');
      return;
    }

    // 模擬驗證登入
    submitBtn.disabled = true;
    submitBtn.textContent = '登入中...';
    alertMessage.style.display = 'none';

    setTimeout(() => {
      // 模擬成功驗證（可直接引導至編輯資料或主頁）
      showAlert('登入成功！正在跳轉頁面...', 'success');
      
      setTimeout(() => {
        window.location.href = 'user-center.html';
      }, 1000);

    }, 1200);
  });

  function showAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert ${type}`;
  }
});
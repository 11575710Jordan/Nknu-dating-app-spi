document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotPasswordForm');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('submitBtn');
  const alertMessage = document.getElementById('alertMessage');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      showAlert('請輸入有效的電子郵件地址。', 'error');
      return;
    }

    // 模擬發送狀態（商業產品常用之 Loading 狀態）
    submitBtn.disabled = true;
    submitBtn.textContent = '發送中...';
    alertMessage.style.display = 'none';

    // 模擬非同步 API 請求 (1.5 秒後響應)
    setTimeout(() => {
      // 成功發送提示
      showAlert(`重設密碼連結已發送至 ${email}，請至信箱查收（若未收到請檢查垃圾郵件匣）。`, 'success');
      
      submitBtn.textContent = '重新發送連結';
      submitBtn.disabled = false;
      
      // 清空輸入欄位
      emailInput.value = '';
    }, 1500);
  });

  // 顯示 alert 訊息的輔助函式
  function showAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert ${type}`;
  }
});
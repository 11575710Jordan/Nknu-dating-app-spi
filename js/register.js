document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const alertMessage = document.getElementById('alertMessage');
  const fields = ['email', 'password', 'confirm', 'nickname'];

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {};
    fields.forEach((f) => { data[f] = document.getElementById(f).value; });

    // 既有測試帳號 + 已註冊的帳號都不能重複
    const users = MOCK_DB.users.concat(Register.loadUsers(localStorage));
    const errors = Register.validate(data, users);

    fields.forEach((f) => {
      document.getElementById(f + 'Error').textContent = errors[f] || '';
      document.getElementById(f).setAttribute('aria-invalid', errors[f] ? 'true' : 'false');
    });

    const firstError = fields.find((f) => errors[f]);
    if (firstError) {
      document.getElementById(firstError).focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '註冊中...';

    setTimeout(() => {
      const user = Register.create(localStorage, data, 'r' + Date.now());
      alertMessage.className = 'dp-alert success';
      alertMessage.textContent = `註冊成功！歡迎 ${user.name}，請登入後完成個人資料。`;
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    }, 800);
  });
});

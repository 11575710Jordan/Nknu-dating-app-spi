/* =========================================================
   註冊（純前端模擬）
   - 檢查欄位、建立帳號
   - 新帳號存在 localStorage 的 nknu-registered-users（JSON 陣列）
   ========================================================= */
const Register = (() => {
  const USERS_KEY = 'nknu-registered-users';

  /** 檢查表單，回傳 { 欄位: 錯誤訊息 }，沒有錯誤回傳空物件 */
  function validate(form, users) {
    const errors = {};
    const email = String(form.email || '').trim().toLowerCase();

    if (!email) errors.email = '請輸入電子郵件。';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = '電子郵件格式不正確。';
    else if (users.some((u) => u.email.toLowerCase() === email)) errors.email = '這個電子郵件已經註冊過了。';

    const password = String(form.password || '');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = '密碼必須至少 8 碼，英文和數字混合。';
    } else if (form.password !== form.confirm) {
      errors.confirm = '兩次輸入的密碼不一樣。';
    }

    if (!String(form.nickname || '').trim()) errors.nickname = '請輸入暱稱。';
    return errors;
  }

  function loadUsers(storage) {
    try {
      return JSON.parse(storage.getItem(USERS_KEY) || '[]');
    } catch (err) {
      return [];
    }
  }

  /** 建立帳號並存起來，回傳新帳號 */
  function create(storage, form, id) {
    const user = {
      id,
      email: String(form.email).trim().toLowerCase(),
      password: form.password, // demo 用，和 mock-data 一樣沒有加密
      name: String(form.nickname).trim(),
    };
    const list = loadUsers(storage);
    list.push(user);
    storage.setItem(USERS_KEY, JSON.stringify(list));
    return user;
  }

  return { USERS_KEY, validate, loadUsers, create };
})();

if (typeof module !== 'undefined') module.exports = Register;

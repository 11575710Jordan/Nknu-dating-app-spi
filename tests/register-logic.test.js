const test = require('node:test');
const assert = require('node:assert/strict');
const Register = require('../js/register-logic.js');

const users = [{ id: 'u01', email: 'u01@nknu-demo.app' }];
const ok = { email: 'new@example.com', password: 'abcd1234', confirm: 'abcd1234', nickname: '小明' };

function memoryStorage() {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

test('資料正確時沒有錯誤', () => {
  assert.deepEqual(Register.validate(ok, users), {});
});

test('Email 格式錯誤或已註冊', () => {
  assert.ok(Register.validate({ ...ok, email: 'abc' }, users).email);
  assert.ok(Register.validate({ ...ok, email: 'U01@nknu-demo.app' }, users).email);
});

test('密碼太短、沒有英數混合或兩次不一樣', () => {
  assert.ok(Register.validate({ ...ok, password: 'abc1234', confirm: 'abc1234' }, users).password);
  assert.ok(Register.validate({ ...ok, password: '12345678', confirm: '12345678' }, users).password);
  assert.ok(Register.validate({ ...ok, password: 'abcdefgh', confirm: 'abcdefgh' }, users).password);
  assert.ok(Register.validate({ ...ok, confirm: 'abcd12345' }, users).confirm);
});

test('建立帳號後存進 storage', () => {
  const storage = memoryStorage();
  Register.create(storage, ok, 'r1');
  assert.equal(Register.loadUsers(storage).length, 1);
  assert.equal(Register.loadUsers(storage)[0].name, '小明');
});

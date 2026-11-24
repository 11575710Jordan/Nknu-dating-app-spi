const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../chat/text-safety.js');
test('已知四項回歸測試：手機號碼觸發個資警告', ()=>{
  const r=S.analyzeText('我的手機是0912345678');
  assert.equal(r.flagged,true);assert.ok(r.codes.includes('PHONE'));
});
test('已知四項回歸測試：日常繳學費轉帳不應誤判', ()=>{
  assert.equal(S.analyzeText('我昨天去銀行匯款繳學費').flagged,false);
});
test('已知四項回歸測試：保 證 獲 利分隔字句仍觸發警告', ()=>{
  const r=S.analyzeText('保 證 獲 利，請先匯款');
  assert.equal(r.flagged,true);assert.ok(r.codes.includes('INVESTMENT'));
});
test('已知四項回歸測試：週末邀約正常', ()=>{
  assert.equal(S.analyzeText('週末想一起去看電影嗎？').flagged,false);
});
test('邊界值：9碼號碼不誤判完整手機號碼', ()=>{
  assert.equal(S.analyzeText('我的手機是091234567').codes.includes('PHONE'),false);
});
test('邊界值：11碼連續數字不誤判完整手機號碼', ()=>{
  assert.equal(S.analyzeText('測試 09123456789').codes.includes('PHONE'),false);
});
test('邊界值：10碼完整手機號碼觸發', ()=>{
  assert.equal(S.analyzeText('0912345678').codes.includes('PHONE'),true);
});
test('模擬交友借款：要求先借一萬', ()=>{
  assert.equal(S.analyzeText('我現在真的有急事，可以先借我一萬元嗎？').codes.includes('MONEY_REQUEST'),true);
});
test('模擬假客服：驗證身分', ()=>{
  assert.equal(S.analyzeText('帳戶異常，請立即驗證身分，點擊連結解除限制').codes.includes('PHISHING'),true);
});
test('空白與招呼語不警告', ()=>{
  assert.equal(S.analyzeText('').flagged,false);
  assert.equal(S.analyzeText('你好').flagged,false);
});
test('不得單靠「銀行」就警告', ()=>{
  assert.equal(S.analyzeText('我剛去銀行辦卡').flagged,false);
});
test('不應只因一般匯款就誤判', ()=>{
  assert.equal(S.analyzeText('我昨天匯款給學校繳學費').flagged,false);
});

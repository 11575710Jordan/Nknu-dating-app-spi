const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../chat/emotion-detect.js');
const predict=(x)=>E.analyzeText(x).code;
test('開心測試句',()=>assert.equal(predict('今天真的很開心，認識你真好！'),'happy'));
test('難過測試句',()=>assert.equal(predict('我今天心情很不好，真的很難過。'),'sad'));
test('生氣測試句',()=>assert.equal(predict('你怎麼可以這樣？我真的很生氣！'),'angry'));
test('中性測試句',()=>assert.equal(predict('我們明天下午三點見。'),'neutral'));
test('問候語中性',()=>assert.equal(predict('你好'),'neutral'));
test('空白輸入回無有效文字',()=>assert.equal(predict('    '),'empty'));
test('帶正向 emoji 表示開心',()=>assert.equal(predict('太好了 😊'),'happy'));
test('不開心不應誤判為開心',()=>assert.equal(predict('我很不開心'),'sad'));
test('混合情緒保守分類',()=>assert.equal(predict('我很開心但也很難過'),'mixed'));
test('聊天總覽計算五種數量',()=>{
 const r=E.analyzeConversation([
  {kind:'in',text:'今天很開心'}, {kind:'out',text:'我好難過'},
  {kind:'in',text:'真生氣'}, {kind:'out',text:'你好'}, {kind:'system',text:'系統訊息'}
 ]);
 assert.equal(r.total,4);assert.equal(r.counts.happy,1);assert.equal(r.counts.sad,1);
 assert.equal(r.counts.angry,1);assert.equal(r.counts.neutral,1);
});
test('預覽不修改原始聊天資料',()=>{
 const data=[{kind:'in',text:'我很開心'}];
 E.analyzeConversation(data);assert.deepEqual(data,[{kind:'in',text:'我很開心'}]);
});
test('不把缺少文字的系統紀錄納入計算',()=>assert.equal(E.analyzeConversation([{kind:'system'},{kind:'in',text:''}]).total,0));

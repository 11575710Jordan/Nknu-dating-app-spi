/*
 * NKNu Dating App — 聊天文字安全偵測（純前端教學版）
 * 只分析文字內容，沒有真正的 AI 模型與後端同步。
 * 此檔只處理文字安全；情緒分類由 chat/emotion-detect.js 負責。
 */
(function(root, make) {
  'use strict';
  const api = make();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ChatTextSafety = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function normalize(input) {
    // NFKC 同一化全形英數；移除字間空白、不可見的零寬字元，避免「保 證 獲 利」繞過比對。
    return String(input == null ? '' : input)
      .normalize('NFKC')
      .replace(/[\s\u200B-\u200D\uFEFF]+/g, '')
      .toLowerCase();
  }

  function analyzeText(input) {
    const original = String(input == null ? '' : input);
    const compressed = normalize(original);
    const notices = [];

    // 完整 10 碼台灣手機號碼；前後不可再接數字，9碼不屬於此規則。
    if (/(?:^|[^0-9])09[0-9]{8}(?![0-9])/.test(compressed)) {
      notices.push({ code: 'PHONE', category: '個人資訊', reason: '訊息包含可能的台灣手機號碼，公開分享個資可能有風險。' });
    }

    // 不單靠「銀行」、「匯款」或「學費」就視為詐騙；避免誤判日常繳費對話。
    const guaranteed = /(保證獲利|保本獲利|零風險投資|穩賺不賠|每日穩賺|穩定獲利|高報酬保證)/.test(compressed);
    const pressure = /(先匯款|先轉帳|立即匯款|立即轉帳|快速入金|投入資金|入群|加入老師群組)/.test(compressed);
    const investTerms = /(投資|獲利|高報酬|賺錢|帶單|老師群組)/.test(compressed);
    if (guaranteed || (investTerms && pressure)) {
      notices.push({ code: 'INVESTMENT', category: '疑似投資詐騙', reason: '內容出現保證獲利、誘導投資或要求先匯款等可疑訊號。' });
    }

    const romancePressure = /(可以先借我|借我一萬|先借我|幫我轉帳|幫我匯款|借錢給我)/.test(compressed);
    const urgentMoney = /(急事|緊急|救急|錢包不見|帳戶被凍結|遇到困難)/.test(compressed);
    if (romancePressure && (urgentMoney || /(?:借我|幫我(?:轉|匯)帳)/.test(compressed))) {
      notices.push({ code: 'MONEY_REQUEST', category: '疑似要求借款', reason: '對話中出現要求借款或轉帳的內容，請先確認對方身分。' });
    }

    const accountUrgency = /(帳戶異常|帳號異常|異常登入|帳戶凍結|解除限制)/.test(compressed);
    const credentialRequest = /(驗證身分|提供密碼|提供驗證碼|點擊連結|登入驗證)/.test(compressed);
    if (accountUrgency && credentialRequest) {
      notices.push({ code: 'PHISHING', category: '疑似假客服', reason: '要求透過連結或提供驗證資訊以處理帳戶異常，請透過官方管道查證。' });
    }

    return {
      flagged: notices.length > 0,
      level: notices.length > 0 ? 'warning' : 'normal',
      reasons: notices.map(x => x.reason),
      categories: notices.map(x => x.category),
      codes: notices.map(x => x.code),
      summary: notices.length ? notices.map(x => x.category).join('、') : '未偵測到已設定的風險關鍵字'
    };
  }

  return { normalize, analyzeText };
});

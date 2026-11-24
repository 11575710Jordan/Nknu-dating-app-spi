/*
 * NKNu 交友軟體：圖片上傳安全攔截器
 * 不修改原本 js/profile-settings.js，沿用其存檔／預覽邏輯。
 * 只在選擇新照片時進行 SHA-256 指定圖片檢查。
 */
(function () {
  'use strict';
  let latestScan = 0;
  let reroutingInput = null;

  function buildStatus(input) {
    let el = document.getElementById('nknu-image-guard-status');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'nknu-image-guard-status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = 'margin:12px auto;padding:12px 14px;border-radius:10px;max-width:500px;line-height:1.7;font-size:14px;background:#f5f2fa;color:#634f75;';
    const host = input.closest('.avatar-upload-group') || input.parentElement;
    host.appendChild(el);
    return el;
  }

  function message(input, kind, text) {
    const el = buildStatus(input);
    el.textContent = text;
    const styles = {
      loading: ['#eef2ff','#315588'],
      blocked: ['#ffe8e7','#a12736'],
      safe: ['#e8f7eb','#21663d'],
      error: ['#ffe8e7','#a12736']
    };
    const colors = styles[kind] || styles.loading;
    el.style.backgroundColor = colors[0];
    el.style.color = colors[1];
  }

  // 捕捉階段先攔截：避免原本 profile-settings.js 尚未檢查就更新頭像。
  document.addEventListener('change', async function (event) {
    const input = event.target;
    if (!input || input.id !== 'avatarInput') return;
    if (input === reroutingInput) return;

    event.stopImmediatePropagation();
    event.preventDefault();
    const token = ++latestScan;
    const file = input.files && input.files[0];
    if (!file) return;

    const api = window.ImageSafety;
    const fileError = api ? api.validateFile(file) : '圖片偵測程式未載入，請確認 js/image-safety.js。';
    if (fileError) {
      message(input,'error','⚠️ '+fileError);
      input.value = '';
      return;
    }

    const saveBtn = document.querySelector('#profileForm button[type="submit"]');
    const previousDisabled = saveBtn ? saveBtn.disabled : false;
    if (saveBtn) saveBtn.disabled = true;
    message(input,'loading','正在檢查是否命中指定詐騙測試圖片…');
    try {
      const result = await api.analyzeFile(file);
      if (token !== latestScan) return;
      if (result.status === 'blocked') {
        const category = result.match.category ? '｜'+result.match.category : '';
        message(input,'blocked',`⚠️ 偵測到指定圖片${category}：${result.match.name}。已阻止更新這張照片。`);
        input.value = '';
        return;
      }
      message(input,'safe','✓ 未命中三張指定詐騙測試圖片，可繼續上傳。（這不代表已經通過真正 AI 內容審查。）');
      reroutingInput = input;
      try { input.dispatchEvent(new Event('change', { bubbles: true })); }
      finally { reroutingInput = null; }
    } catch (error) {
      if (token !== latestScan) return;
      message(input,'error','⚠️ 圖片檢查失敗：'+(error.message || '未知錯誤')+'。沒有更新照片。');
      input.value = '';
    } finally {
      if (token === latestScan && saveBtn) saveBtn.disabled = previousDisabled;
    }
  }, true);
})();

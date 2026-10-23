/* =========================================================
   真人實名認證 (UI/UX 最佳化版本)
   - 包含表單防呆離開確認、身分證字號格式校驗、圖片大小檢查
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verifyForm');
  const submitBtn = document.getElementById('submitBtn');
  const alertMessage = document.getElementById('alertMessage');
  const startSelfieBtn = document.getElementById('startSelfieBtn');
  const backBtn = document.querySelector('.dp-btn-back');

  let isSelfieVerified = false;
  let isFormDirty = false; // 追蹤表單是否有異動

  // 輔助函式：顯示提示訊息
  function showAlert(message, type = 'error') {
    if (!alertMessage) return;
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert ${type}`;
    alertMessage.style.display = 'block';
    alertMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 追蹤表單變更 (User Control & Freedom)
  if (form) {
    form.addEventListener('input', () => {
      isFormDirty = true;
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      if (isFormDirty) {
        if (!confirm('您填寫的認證資料尚未提交，確定要離開嗎？')) {
          e.preventDefault();
        }
      }
    });
  }

  // 1. 處理證件圖片上傳預覽與大小限制 (Error Prevention)
  setupImagePreview('idFrontInput', 'idFrontPreview', 'idFrontPlaceholder');
  setupImagePreview('idBackInput', 'idBackPreview', 'idBackPlaceholder');

  function setupImagePreview(inputId, previewId, placeholderId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);

    if (!input) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // 檢查檔案大小限制 (最大 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showAlert('圖片檔案過大（上限 5MB），請壓縮後重新上傳。', 'error');
          input.value = ''; // 清空選擇
          return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
          preview.src = event.target.result;
          preview.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
          isFormDirty = true;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 2. 模擬真人動態自拍驗證 (Visibility of System Status)
  if (startSelfieBtn) {
    startSelfieBtn.addEventListener('click', () => {
      startSelfieBtn.disabled = true;
      startSelfieBtn.textContent = '鏡頭校正與比對中...';

      setTimeout(() => {
        isSelfieVerified = true;
        isFormDirty = true;
        startSelfieBtn.textContent = '✓ 真人動態比對成功';
        startSelfieBtn.style.backgroundColor = 'var(--sage-100, #e6f4ea)';
        startSelfieBtn.style.color = 'var(--sage-800, #137333)';
        startSelfieBtn.style.borderColor = 'var(--sage-500, #34a853)';
      }, 1800);
    });
  }

  // 3. 表單提交審核驗證 (Error Prevention)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const realName = document.getElementById('realName').value.trim();
      const idNumber = document.getElementById('idNumber').value.trim();
      const idFront = document.getElementById('idFrontInput').files[0];
      const idBack = document.getElementById('idBackInput').files[0];

      if (!realName || !idNumber) {
        showAlert('請填寫完整的真實姓名與身分證字號。', 'error');
        return;
      }

      // 身分證字號格式初步校驗 (台灣身分證正則表達式範例: 1碼大寫英文 + 9碼數字)
      const idRegex = /^[A-Z][12]\d{8}\$/;
      // 若非台灣身分證，也可以放寬支援護照格式，這裡以基本字數與格式做提醒
      if (idNumber.length < 8) {
        showAlert('請輸入有效的身分證字號或護照號碼格式。', 'error');
        return;
      }

      if (!idFront || !idBack) {
        showAlert('請完整上傳身分證件正面與反面照片。', 'error');
        return;
      }

      if (!isSelfieVerified) {
        showAlert('請先點擊完成「真人動態自拍比對」。', 'error');
        return;
      }

      // 模擬 AI 審核發送 (System Status)
      submitBtn.disabled = true;
      submitBtn.textContent = '安全加密傳輸與 AI 驗證中...';
      if (alertMessage) alertMessage.style.display = 'none';

      setTimeout(() => {
        isFormDirty = false;
        showAlert('實名驗證資料已成功提交！審核結果將於 10 分鐘內透過通知中心告知您。', 'success');
        submitBtn.textContent = '審核作業進行中';
      }, 2000);
    });
  }
});
/* =========================================================
   真人實名認證 (符合 SPI.md 規格與純前端 LocalStorage 完整實作)
   - key: nknu-audit-status (記錄審核狀態: pending / approved / rejected)
   - key: nknu-audit-data (儲存真實姓名、身分證號及證件 Base64 影像)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_STATUS_KEY = 'nknu-audit-status';
  const STORAGE_DATA_KEY = 'nknu-audit-data';
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB 限制
  const AVATAR_EDGE = 800; // 證件圖片壓縮最大邊長

  const form = document.getElementById('verifyForm');
  const submitBtn = document.getElementById('submitBtn');
  const alertMessage = document.getElementById('alertMessage');
  const startSelfieBtn = document.getElementById('startSelfieBtn');
  const backBtn = document.querySelector('.dp-btn-back');

  let isSelfieVerified = false;
  let isFormDirty = false; // 追蹤表單是否有異動未儲存
  let frontBase64 = '';
  let backBase64 = '';

  // 輔助函式：顯示提示訊息 (Nielsen 原則：狀態即時反饋)
  function showAlert(message, type = 'error') {
    if (!alertMessage) return;
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert ${type}`;
    alertMessage.style.display = 'block';
    alertMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideAlert() {
    if (alertMessage) alertMessage.style.display = 'none';
  }

  // 追蹤表單異動狀態
  if (form) {
    form.addEventListener('input', () => {
      isFormDirty = true;
      hideAlert();
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

  /** 圖片壓縮與轉 Base64 函式 */
  function resizeAndConvertToBase64(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, AVATAR_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // 1. 處理證件圖片上傳預覽與 Base64 轉換
  setupImagePreview('idFrontInput', 'idFrontPreview', 'idFrontPlaceholder', (base64) => { frontBase64 = base64; });
  setupImagePreview('idBackInput', 'idBackPreview', 'idBackPlaceholder', (base64) => { backBase64 = base64; });

  function setupImagePreview(inputId, previewId, placeholderId, onLoaded) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);

    if (!input) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          showAlert('圖片檔案過大（上限 5MB），請選擇較小或壓縮後的照片。', 'error');
          input.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
          resizeAndConvertToBase64(event.target.result)
            .then((compressedBase64) => {
              preview.src = compressedBase64;
              preview.style.display = 'block';
              if (placeholder) placeholder.style.display = 'none';
              isFormDirty = true;
              if (typeof onLoaded === 'function') {
                onLoaded(compressedBase64);
              }
              hideAlert();
            })
            .catch(() => showAlert('圖片讀取失敗，請更換其他照片嘗試。', 'error'));
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 2. 模擬真人動態自拍驗證
  if (startSelfieBtn) {
    startSelfieBtn.addEventListener('click', () => {
      startSelfieBtn.disabled = true;
      startSelfieBtn.textContent = '鏡頭校正與 AI 比對中...';

      setTimeout(() => {
        isSelfieVerified = true;
        isFormDirty = true;
        startSelfieBtn.textContent = '✓ 真人動態比對成功';
        startSelfieBtn.style.backgroundColor = 'var(--sage-100, #e6f4ea)';
        startSelfieBtn.style.color = 'var(--sage-800, #137333)';
        startSelfieBtn.style.borderColor = 'var(--sage-500, #34a853)';
        hideAlert();
      }, 1500);
    });
  }

  // 3. 表單提交審核驗證與 LocalStorage 持久化
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const realName = document.getElementById('realName').value.trim();
      const idNumber = document.getElementById('idNumber').value.trim();

      if (!realName || !idNumber) {
        showAlert('請填寫完整的真實姓名與身分證字號。', 'error');
        return;
      }

      // 簡易格式校驗（檢查長度與基本格式）
      if (idNumber.length < 8) {
        showAlert('請輸入有效的身分證字號或護照號碼格式。', 'error');
        return;
      }

      if (!frontBase64 || !backBase64) {
        showAlert('請完整上傳身分證件正面與反面照片。', 'error');
        return;
      }

      if (!isSelfieVerified) {
        showAlert('請先點擊完成「真人動態自拍比對」。', 'error');
        return;
      }

      // 停用按鈕並顯示處理中狀態 (System Status)
      submitBtn.disabled = true;
      submitBtn.textContent = '安全加密傳輸與 AI 審核中...';
      hideAlert();

      // 組織審核資料 payload
      const auditPayload = {
        realName: realName,
        idNumber: idNumber,
        frontImage: frontBase64,
        backImage: backBase64,
        submittedAt: new Date().toISOString()
      };

      // 寫入 LocalStorage（對應 SPI.md 與 C4 規格）
      try {
        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(auditPayload));
        // 設定狀態為待審核 (pending)，讓個人中心動態顯示
        localStorage.setItem(STORAGE_STATUS_KEY, 'pending');
      } catch (err) {
        console.warn('[audit] 寫入 LocalStorage 失敗', err);
        showAlert('儲存失敗！可能是圖片容量較大超過瀏覽器空間限制。', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '提交實名審核';
        return;
      }

      // 模擬非同步審核派送延遲
      setTimeout(() => {
        isFormDirty = false;
        showAlert('實名驗證資料已成功提交！審核結果將於 10 分鐘內透過通知中心告知您。', 'success');
        submitBtn.textContent = '審核作業進行中 (待審核)';
        
        // 2 秒後自動導回個人中心頁面
        setTimeout(() => {
          window.location.href = 'user-center.html';
        }, 2000);
      }, 1500);
    });
  }
});
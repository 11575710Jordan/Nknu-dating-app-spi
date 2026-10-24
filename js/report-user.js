/* =========================================================
   建立檢舉單 (符合 SPI.md 規格與純前端 LocalStorage 完整實作)
   - key: nknu-reports (儲存所有建立之檢舉單 Incident Log 陣列)
   - key: nknu-hate-scores (同步累加被檢舉人之仇恨值紀錄)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_REPORTS_KEY = 'nknu-reports';
  const STORAGE_HATE_KEY = 'nknu-hate-scores';

  // 解析 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const targetIdParam = urlParams.get('targetId');
  const targetNameParam = urlParams.get('targetName');
  const targetAvatarParam = urlParams.get('targetAvatar');

  // DOM 元素引用
  const userSelectGroup = document.getElementById('userSelectGroup');
  const userSelect = document.getElementById('reportedUserSelect');
  const targetPreview = document.getElementById('targetPreview');
  const targetAvatar = document.getElementById('targetAvatar');
  const targetName = document.getElementById('targetName');
  const targetDetail = document.getElementById('targetDetail');
  const manualIdGroup = document.getElementById('manualIdGroup');
  const manualUserId = document.getElementById('manualUserId');
  const screenshotInput = document.getElementById('screenshotInput');
  const screenshotGrid = document.getElementById('screenshotGrid');
  const reportForm = document.getElementById('reportForm');
  const alertMessage = document.getElementById('alertMessage');
  const submitBtn = document.getElementById('submitBtn');
  const backBtn = document.getElementById('backBtn');

  let isFormDirty = false; // 追蹤表單異動
  let screenshotBase64List = []; // 儲存證明截圖之 Base64 陣列

  // 輔助函式：顯示提示訊息 (Nielsen 原則：狀態即時反饋)
  function showAlert(message, type = 'error') {
    if (!alertMessage) return;
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert dp-alert-${type}`;
    alertMessage.style.display = 'block';
    alertMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideAlert() {
    if (alertMessage) alertMessage.style.display = 'none';
  }

  // 防呆：離開未儲存確認
  if (reportForm) {
    reportForm.addEventListener('input', () => {
      isFormDirty = true;
      hideAlert();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      if (isFormDirty) {
        if (!confirm('您輸入的檢舉內容尚未提交，確定要離開嗎？')) {
          e.preventDefault();
        }
      }
    });
  }

  // 1. 判斷檢舉對象來源 (自對話頁跳轉或個人中心選取)
  if (targetIdParam) {
    if (userSelectGroup) userSelectGroup.style.display = 'none';
    if (userSelect) userSelect.removeAttribute('required');

    if (targetName) targetName.textContent = targetNameParam || `使用者 (${targetIdParam})`;
    if (targetDetail) targetDetail.textContent = `User ID: ${targetIdParam}`;
    if (targetAvatarParam && targetAvatar) {
      targetAvatar.src = targetAvatarParam;
    }
    if (targetPreview) targetPreview.style.display = 'flex';
  } else if (userSelect) {
    userSelect.setAttribute('required', 'true');
  }

  // 2. 對話下拉選單切換事件
  if (userSelect) {
    userSelect.addEventListener('change', () => {
      const val = userSelect.value;
      const selectedOption = userSelect.options[userSelect.selectedIndex];

      if (val === 'manual_search') {
        if (targetPreview) targetPreview.style.display = 'none';
        if (manualIdGroup) manualIdGroup.style.display = 'block';
        if (manualUserId) manualUserId.setAttribute('required', 'true');
      } else if (val !== '') {
        if (manualIdGroup) manualIdGroup.style.display = 'none';
        if (manualUserId) manualUserId.removeAttribute('required');

        const avatarSrc = selectedOption.getAttribute('data-avatar');
        const timeInfo = selectedOption.getAttribute('data-time');
        const nameOnly = selectedOption.text.split(' (')[0];

        if (targetAvatar) targetAvatar.src = avatarSrc;
        if (targetName) targetName.textContent = nameOnly;
        if (targetDetail) targetDetail.textContent = `對話時間：${timeInfo}`;
        if (targetPreview) targetPreview.style.display = 'flex';
      } else {
        if (targetPreview) targetPreview.style.display = 'none';
        if (manualIdGroup) manualIdGroup.style.display = 'none';
        if (manualUserId) manualUserId.removeAttribute('required');
      }
    });
  }

  // 3. 截圖上傳與 Base64 轉換處理
  if (screenshotInput) {
    screenshotInput.addEventListener('change', (e) => {
      hideAlert();
      const files = Array.from(e.target.files);

      if (screenshotGrid.children.length + files.length > 3) {
        showAlert('最多只能上傳 3 張舉證截圖喔！', 'warning');
        screenshotInput.value = '';
        return;
      }

      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;

        // 檔案大小限制 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showAlert(`圖片「${file.name}」容量超過 5MB 限制，請挑選較小的照片。`, 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Src = event.target.result;
          screenshotBase64List.push(base64Src);

          const item = document.createElement('div');
          item.className = 'dp-screenshot-item';
          item.innerHTML = `
            <img src="${base64Src}" alt="對話截圖證明">
            <button type="button" class="dp-remove-img-btn" title="刪除圖片">&times;</button>
          `;

          // 刪除圖片事件
          item.querySelector('.dp-remove-img-btn').addEventListener('click', () => {
            const index = screenshotBase64List.indexOf(base64Src);
            if (index > -1) screenshotBase64List.splice(index, 1);
            item.remove();
            isFormDirty = true;
          });

          screenshotGrid.appendChild(item);
          isFormDirty = true;
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // 4. 表單提交處理與 LocalStorage 持久化 (對應 SPI.md 與 C4 規格)
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      let finalTargetId = targetIdParam || '';
      let finalTargetName = '';

      if (targetIdParam) {
        finalTargetName = targetNameParam || targetIdParam;
      } else if (userSelect.value === 'manual_search') {
        finalTargetId = manualUserId.value.trim();
        finalTargetName = manualUserId.value.trim();
      } else if (userSelect.selectedIndex >= 0) {
        finalTargetId = userSelect.value;
        finalTargetName = userSelect.options[userSelect.selectedIndex].text.split(' (')[0];
      }

      if (!finalTargetName) {
        showAlert('請選擇或輸入欲檢舉的對象！', 'error');
        return;
      }

      const category = document.getElementById('reportCategory').value;
      const reason = document.getElementById('reportReason').value.trim();

      if (!category) {
        showAlert('請選擇違規原因類別！', 'error');
        return;
      }
      if (!reason) {
        showAlert('請填寫詳細說明過程！', 'error');
        return;
      }

      // 建立檢舉單 Payload
      const reportPayload = {
        reportId: 'RPT_' + Date.now(),
        targetId: finalTargetId,
        targetName: finalTargetName,
        category: category,
        reason: reason,
        screenshots: screenshotBase64List,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      // 狀態更新：切換按鈕處理中
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '安全加密傳輸與檢舉單建立中...';
      }

      // (1) 寫入 LocalStorage 檢舉單陣列 (nknu-reports)
      try {
        const existingReports = JSON.parse(localStorage.getItem(STORAGE_REPORTS_KEY) || '[]');
        existingReports.push(reportPayload);
        localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(existingReports));

        // (2) 模擬觸發仇恨值計算邏輯（檢舉成立加算 10 分）
        const hateData = JSON.parse(localStorage.getItem(STORAGE_HATE_KEY) || '{}');
        const currentScore = hateData[finalTargetId] || 15;
        hateData[finalTargetId] = currentScore + 10;
        localStorage.setItem(STORAGE_HATE_KEY, JSON.stringify(hateData));

      } catch (err) {
        console.warn('[report] 寫入 LocalStorage 失敗', err);
        showAlert('儲存失敗！可能圖片較大超出瀏覽器容量限制。', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '提交檢舉單';
        return;
      }

      // 模擬順暢非同步處理反饋與跳轉
      setTimeout(() => {
        isFormDirty = false;
        alert(`已成功提交對「${finalTargetName}」的檢舉單（含 ${screenshotBase64List.length} 張舉證截圖），平台將於 24 小時內完成審核並通知您結果！`);
        window.location.href = 'user-center.html';
      }, 1200);
    });
  }
});
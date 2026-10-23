/* =========================================================
   建立檢舉單 (UI/UX 最佳化版本)
   - 包含未儲存離開防呆、圖片大小檢查、提交載入狀態反饋
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
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

  let isFormDirty = false; // 追蹤表單是否有填寫內容

  // 輔助函式：顯示頁面提示
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

  // 防呆：離開未儲存確認 (User Control & Freedom)
  if (reportForm) {
    reportForm.addEventListener('input', () => {
      isFormDirty = true;
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

  // 1. 判斷入口來源
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

  // 3. 截圖上傳與即時預覽處理 (含數量與檔案大小保護 Error Prevention)
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
          showAlert(`圖片「${file.name}」容量超過 5MB 限制，請壓縮後再試。`, 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const item = document.createElement('div');
          item.className = 'dp-screenshot-item';
          item.innerHTML = `
            <img src="${event.target.result}" alt="對話截圖證明">
            <button type="button" class="dp-remove-img-btn" title="刪除圖片">&times;</button>
          `;

          // 刪除圖片事件
          item.querySelector('.dp-remove-img-btn').addEventListener('click', () => {
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

  // 4. 表單提交處理 (Visibility of System Status)
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      let finalTargetName = '';

      if (targetIdParam) {
        finalTargetName = targetNameParam || targetIdParam;
      } else if (userSelect.value === 'manual_search') {
        finalTargetName = manualUserId.value.trim();
      } else if (userSelect.selectedIndex >= 0) {
        finalTargetName = userSelect.options[userSelect.selectedIndex].text.split(' (')[0];
      }

      if (!finalTargetName) {
        showAlert('請確定檢舉對象！', 'error');
        return;
      }

      const uploadedImgCount = screenshotGrid.children.length;

      // 切換為提交處理中狀態
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '安全加密傳輸與檢舉單建立中...';
      }

      // 模擬非同步請求傳輸
      setTimeout(() => {
        isFormDirty = false;
        alert(`已成功提交對「${finalTargetName}」的檢舉單（含 ${uploadedImgCount} 張舉證截圖），平台將於 24 小時內完成審核並通知您結果！`);
        window.location.href = 'user-center.html';
      }, 1500);
    });
  }
});
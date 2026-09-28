document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verifyForm');
  const submitBtn = document.getElementById('submitBtn');
  const alertMessage = document.getElementById('alertMessage');
  const startSelfieBtn = document.getElementById('startSelfieBtn');

  let isSelfieVerified = false;

  // 1. 處理證件圖片上傳預覽
  setupImagePreview('idFrontInput', 'idFrontPreview', 'idFrontPlaceholder');
  setupImagePreview('idBackInput', 'idBackPreview', 'idBackPlaceholder');

  function setupImagePreview(inputId, previewId, placeholderId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          preview.src = event.target.result;
          preview.style.display = 'block';
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 2. 模擬真人動態自拍驗證
  startSelfieBtn.addEventListener('click', () => {
    startSelfieBtn.disabled = true;
    startSelfieBtn.textContent = '拍攝認證中...';

    setTimeout(() => {
      isSelfieVerified = true;
      startSelfieBtn.textContent = '✓ 自拍比對成功';
      startSelfieBtn.style.backgroundColor = 'var(--sage-100)';
      startSelfieBtn.style.color = 'var(--sage-800)';
      startSelfieBtn.style.borderColor = 'var(--sage-500)';
    }, 1800);
  });

  // 3. 表單提交審核驗證
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

    if (!idFront || !idBack) {
      showAlert('請完整上傳身分證件正面與反面照片。', 'error');
      return;
    }

    if (!isSelfieVerified) {
      showAlert('請點擊完成「真人動態自拍比對」。', 'error');
      return;
    }

    // 模擬 AI 審核發送
    submitBtn.disabled = true;
    submitBtn.textContent = '安全加密傳輸中...';
    alertMessage.style.display = 'none';

    setTimeout(() => {
      showAlert('實名驗證資料已成功提交！審核結果將於 10 分鐘內通知您。', 'success');
      submitBtn.textContent = '審核中';
    }, 2000);
  });

  function showAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.className = `dp-alert ${type}`;
  }
});
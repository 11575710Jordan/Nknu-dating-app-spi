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

  // 1. 判斷入口來源
  if (targetIdParam) {
    userSelectGroup.style.display = 'none';
    userSelect.removeAttribute('required');

    targetName.textContent = targetNameParam || `使用者 (${targetIdParam})`;
    targetDetail.textContent = `User ID: ${targetIdParam}`;
    if (targetAvatarParam) {
      targetAvatar.src = targetAvatarParam;
    }
    targetPreview.style.display = 'flex';
  } else {
    userSelect.setAttribute('required', 'true');
  }

  // 2. 對話下拉選單切換事件
  userSelect.addEventListener('change', () => {
    const val = userSelect.value;
    const selectedOption = userSelect.options[userSelect.selectedIndex];

    if (val === 'manual_search') {
      targetPreview.style.display = 'none';
      manualIdGroup.style.display = 'block';
      manualUserId.setAttribute('required', 'true');
    } else if (val !== '') {
      manualIdGroup.style.display = 'none';
      manualUserId.removeAttribute('required');

      const avatarSrc = selectedOption.getAttribute('data-avatar');
      const timeInfo = selectedOption.getAttribute('data-time');
      const nameOnly = selectedOption.text.split(' (')[0];

      targetAvatar.src = avatarSrc;
      targetName.textContent = nameOnly;
      targetDetail.textContent = `對話時間：${timeInfo}`;
      targetPreview.style.display = 'flex';
    } else {
      targetPreview.style.display = 'none';
      manualIdGroup.style.display = 'none';
      manualUserId.removeAttribute('required');
    }
  });

  // 3. 截圖上傳與即時預覽處理
  screenshotInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);

    if (screenshotGrid.children.length + files.length > 3) {
      alert('最多只能上傳 3 張對話截圖！');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;

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
        });

        screenshotGrid.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  });

  // 4. 表單提交處理
  reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let finalTargetName = '';

    if (targetIdParam) {
      finalTargetName = targetNameParam || targetIdParam;
    } else if (userSelect.value === 'manual_search') {
      finalTargetName = manualUserId.value;
    } else {
      finalTargetName = userSelect.options[userSelect.selectedIndex].text.split(' (')[0];
    }

    const uploadedImgCount = screenshotGrid.children.length;
    alert(`已提交對「${finalTargetName}」的檢舉單（含 ${uploadedImgCount} 張舉證截圖），系統將盡快審核！`);
    window.location.href = 'user-center.html';
  });
});
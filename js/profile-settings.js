document.addEventListener('DOMContentLoaded', () => {
  // 1. 興趣標籤選取邏輯
  const tagContainer = document.getElementById('tagContainer');
  const MAX_TAGS = 5;

  if (tagContainer) {
    tagContainer.addEventListener('click', (event) => {
      // 確保點擊的是按鈕或按鈕內部
      const btn = event.target.closest('.dp-tag-btn');
      if (!btn) return;

      const selectedTags = tagContainer.querySelectorAll('.dp-tag-btn.active');
      const isSelected = btn.classList.contains('active');

      if (isSelected) {
        // 若已選取，則取消選取
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        // 若未選取，檢查是否超過 5 項限制
        if (selectedTags.length >= MAX_TAGS) {
          alert(`最多只能選擇 ${MAX_TAGS} 項興趣標籤喔！`);
          return;
        }
        // 標記為選取
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
    });
  }

  // 2. 大頭照上傳預覽
  const avatarInput = document.getElementById('avatarInput');
  const avatarImage = document.getElementById('avatarImage');
  const placeholderText = document.getElementById('placeholderText');

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImage.src = event.target.result;
          avatarImage.style.display = 'block';
          if (placeholderText) {
            placeholderText.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 3. 表單提交事件
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // 收集選中的標籤文字
      const activeBtnElements = tagContainer.querySelectorAll('.dp-tag-btn.active');
      const selectedTags = Array.from(activeBtnElements).map(btn => btn.getAttribute('data-tag'));

      const formData = {
        nickname: document.getElementById('nickname').value,
        gender: document.getElementById('gender').value,
        occupation: document.getElementById('occupation').value,
        age: document.getElementById('age').value,
        bio: document.getElementById('bio').value,
        tags: selectedTags
      };

      console.log('儲存的個人資料：', formData);
      alert('個人資料已成功儲存！');

      // 儲存完成後返回個人中心
      window.location.href = 'user-center.html';
    });
  }
});
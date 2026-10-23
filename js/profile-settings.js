/* =========================================================
   編輯個人資料 (UI/UX 最佳化版本)
   - 純前端 demo，資料存在瀏覽器的 localStorage (key: nknu-profile)
   - 包含標籤動態計數、未儲存離開防呆、以及提交載入狀態
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'nknu-profile';
  const AVATAR_EDGE = 400;
  let avatarDataUrl = '';
  let isFormDirty = false; // 追蹤表單是否有修改未儲存

  // 取得 DOM 元素
  const tagContainer = document.getElementById('tagContainer');
  const tagCounter = document.getElementById('tagCounter');
  const avatarInput = document.getElementById('avatarInput');
  const avatarImage = document.getElementById('avatarImage');
  const placeholderText = document.getElementById('placeholderText');
  const alertMessage = document.getElementById('alertMessage');
  const profileForm = document.getElementById('profileForm');
  const submitBtn = document.getElementById('submitBtn');
  const backBtn = document.getElementById('backBtn');
  const MAX_TAGS = 5;

  // 輔助函式：顯示提示訊息
  function showAlert(msg, type = 'warning') {
    if (!alertMessage) return;
    alertMessage.textContent = msg;
    alertMessage.className = `dp-alert dp-alert-${type}`;
    alertMessage.style.display = 'block';
    alertMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 更新標籤計數器文字
  function updateTagCounter() {
    if (!tagCounter || !tagContainer) return;
    const selectedCount = tagContainer.querySelectorAll('.dp-tag-btn.active').length;
    tagCounter.textContent = `(已選 ${selectedCount}/${MAX_TAGS})`;
  }

  // 1. 興趣標籤選取邏輯
  if (tagContainer) {
    tagContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('.dp-tag-btn');
      if (!btn) return;

      const selectedTags = tagContainer.querySelectorAll('.dp-tag-btn.active');
      const isSelected = btn.classList.contains('active');

      if (isSelected) {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        if (selectedTags.length >= MAX_TAGS) {
          showAlert(`最多只能選擇 ${MAX_TAGS} 項興趣標籤喔！`, 'warning');
          return;
        }
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
      
      isFormDirty = true;
      updateTagCounter();
    });
  }

  // 2. 大頭照上傳預覽
  function showAvatar(src) {
    if (avatarImage) {
      avatarImage.src = src;
      avatarImage.style.display = 'block';
    }
    if (placeholderText) {
      placeholderText.style.display = 'none';
    }
  }

  /** 把圖片縮到長邊 AVATAR_EDGE 並轉成 JPEG data URL */
  function resizeImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, AVATAR_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          resizeImage(event.target.result)
            .then((smallUrl) => {
              avatarDataUrl = smallUrl;
              showAvatar(smallUrl);
              isFormDirty = true;
            })
            .catch(() => showAlert('這張圖片無法讀取，請換一張試試', 'error'));
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 3. 進頁面時，把之前存過的資料帶回表單
  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('[profile] 讀取 localStorage 失敗', err);
      return null;
    }
  }

  const saved = loadProfile();
  if (saved) {
    if (document.getElementById('nickname')) document.getElementById('nickname').value = saved.nickname || '';
    if (document.getElementById('gender')) document.getElementById('gender').value = saved.gender || '';
    if (document.getElementById('occupation')) document.getElementById('occupation').value = saved.occupation || '';
    if (document.getElementById('age')) document.getElementById('age').value = saved.age || '';
    if (document.getElementById('bio')) document.getElementById('bio').value = saved.bio || '';
    
    (saved.tags || []).forEach((tag) => {
      const btn = tagContainer.querySelector(`.dp-tag-btn[data-tag="${tag}"]`);
      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
    });
    updateTagCounter();

    if (saved.avatar) {
      avatarDataUrl = saved.avatar;
      showAvatar(saved.avatar);
    }
  }

  // 4. 表單變更偵測 (防呆：離開未儲存確認)
  if (profileForm) {
    profileForm.addEventListener('input', () => {
      isFormDirty = true;
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      if (isFormDirty) {
        if (!confirm('您輸入的資料尚未儲存，確定要離開嗎？')) {
          e.preventDefault();
        }
      }
    });
  }

  // 5. 表單提交事件
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const ageVal = parseInt(document.getElementById('age').value, 10);
      if (ageVal < 18) {
        showAlert('依據服務條款，使用者需年滿 18 歲方可註冊與使用。', 'error');
        return;
      }

      // 收集選中的標籤文字
      const activeBtnElements = tagContainer.querySelectorAll('.dp-tag-btn.active');
      const selectedTags = Array.from(activeBtnElements).map(btn => btn.getAttribute('data-tag'));

      const formData = {
        nickname: document.getElementById('nickname').value.trim(),
        gender: document.getElementById('gender').value,
        occupation: document.getElementById('occupation').value,
        age: ageVal,
        bio: document.getElementById('bio').value.trim(),
        tags: selectedTags,
        avatar: avatarDataUrl,
        updatedAt: new Date().toISOString()
      };

      // 切換按鈕載入狀態 (System Status)
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '資料儲存中...';
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (err) {
        console.warn('[profile] 無法寫入 localStorage', err);
        showAlert('儲存失敗，可能是照片太大或瀏覽器空間不足，請換一張照片再試', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '儲存檔案並繼續';
        }
        return;
      }

      // 模擬順暢的非同步儲存回饋
      setTimeout(() => {
        isFormDirty = false;
        alert('個人資料已成功儲存！');
        window.location.href = 'user-center.html';
      }, 600);
    });
  }
});
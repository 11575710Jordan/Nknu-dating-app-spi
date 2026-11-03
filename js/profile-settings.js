/* =========================================================
   編輯個人資料
   - 純前端 demo，沒有資料庫：資料存在瀏覽器的 localStorage（key: nknu-profile）
   - 照片先縮到長邊 AVATAR_EDGE 再轉成 JPEG data URL 存起來，避免塞爆 localStorage
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'nknu-profile';
  const AVATAR_EDGE = 400;
  let avatarDataUrl = '';

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

  function showAvatar(src) {
    avatarImage.src = src;
    avatarImage.style.display = 'block';
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
            })
            .catch(() => alert('這張圖片無法讀取，請換一張試試'));
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
    document.getElementById('nickname').value = saved.nickname || '';
    document.getElementById('gender').value = saved.gender || '';
    document.getElementById('occupation').value = saved.occupation || '';
    document.getElementById('age').value = saved.age || '';
    document.getElementById('bio').value = saved.bio || '';
    (saved.tags || []).forEach((tag) => {
      const btn = tagContainer.querySelector(`.dp-tag-btn[data-tag="${tag}"]`);
      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
    });
    if (saved.avatar) {
      avatarDataUrl = saved.avatar;
      showAvatar(saved.avatar);
    }
  }

  // 4. 表單提交事件
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // 收集選中的標籤文字
      const activeBtnElements = tagContainer.querySelectorAll('.dp-tag-btn.active');
      const selectedTags = Array.from(activeBtnElements).map(btn => btn.getAttribute('data-tag'));

      const formData = {
        nickname: document.getElementById('nickname').value.trim(),
        gender: document.getElementById('gender').value,
        occupation: document.getElementById('occupation').value,
        age: document.getElementById('age').value,
        bio: document.getElementById('bio').value.trim(),
        tags: selectedTags,
        avatar: avatarDataUrl,
        updatedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (err) {
        console.warn('[profile] 無法寫入 localStorage', err);
        alert('儲存失敗，可能是照片太大或瀏覽器空間不足，請換一張照片再試');
        return;
      }

      console.log('儲存的個人資料：', formData);
      alert('個人資料已成功儲存！');

      // 儲存完成後返回個人中心
      window.location.href = 'user-center.html';
    });
  }
});

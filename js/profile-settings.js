/* =========================================================
   編輯個人資料 (符合 SPI.md 規格與純前端 LocalStorage 完整實作)
   - key: nknu-profile (儲存使用者編輯之基本資料與 Base64 大頭照)
   - 包含 HTML5 Canvas 圖片縮圖/ Base64 轉換、標籤動態控管與防呆提醒
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'nknu-profile';
  const AVATAR_EDGE = 400; // 圖片縮圖最大邊長 (防 LocalStorage 空間溢出)
  let avatarDataUrl = '';
  let isFormDirty = false; // 追蹤表單修改狀態

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

  /**
   * 輔助函式：顯示警示與提示訊息 (Nielsen 原則：狀態即時反饋)
   */
  function showAlert(msg, type = 'warning') {
    if (!alertMessage) return;
    alertMessage.textContent = msg;
    alertMessage.className = `dp-alert dp-alert-${type}`;
    alertMessage.style.display = 'block';
    alertMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideAlert() {
    if (alertMessage) alertMessage.style.display = 'none';
  }

  /**
   * 更新標籤選取計數器
   */
  function updateTagCounter() {
    if (!tagCounter || !tagContainer) return;
    const selectedCount = tagContainer.querySelectorAll('.dp-tag-btn.active, .dp-tag-btn[aria-pressed="true"]').length;
    tagCounter.textContent = `(已選 ${selectedCount}/${MAX_TAGS})`;
  }

  // 1. 興趣標籤選取邏輯
  if (tagContainer) {
    tagContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('.dp-tag-btn');
      if (!btn) return;

      const isSelected = btn.classList.contains('active') || btn.getAttribute('aria-pressed') === 'true';
      const selectedTags = tagContainer.querySelectorAll('.dp-tag-btn.active, .dp-tag-btn[aria-pressed="true"]');

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
      hideAlert();
      updateTagCounter();
    });
  }

  // 2. 大頭照上傳與 Canvas 壓縮/Base64 轉碼
  function showAvatar(src) {
    if (avatarImage) {
      avatarImage.src = src;
      avatarImage.style.display = 'block';
    }
    if (placeholderText) {
      placeholderText.style.display = 'none';
    }
  }

  /** 利用 Canvas 將上傳圖片轉成適當尺寸之 Base64 字串 */
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

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // 檢查圖片副檔名與大小 (超過 5MB 原圖進行攔截)
        if (file.size > 5 * 1024 * 1024) {
          showAlert('選擇的照片檔案過大，請選擇 5MB 以下的照片', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          resizeAndConvertToBase64(event.target.result)
            .then((base64Url) => {
              avatarDataUrl = base64Url;
              showAvatar(base64Url);
              isFormDirty = true;
              hideAlert();
            })
            .catch(() => showAlert('圖片解析失敗，請重新選擇其他格式之圖片', 'error'));
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 3. 頁面初始化：載入預設資料（優先順序：LocalStorage > Session / MockData）
  function loadProfileData() {
    try {
      // (1) 先試著讀取先前儲存於 LocalStorage 的 Profile
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);

      // (2) 若 LocalStorage 尚無紀錄，則載入預設的使用者身分 (Mock DB)
      if (typeof Session !== 'undefined' && typeof MOCK_DB !== 'undefined') {
        const mockUser = Session.currentUser(MOCK_DB.users);
        if (mockUser) {
          return {
            nickname: mockUser.name || '',
            gender: 'female',
            occupation: 'STUDENT',
            age: 22,
            bio: mockUser.bio || '熱愛生活與跨領域程式開發，期待在此遇見契合的朋友！',
            tags: ['咖啡品味', '美饌探索', '科技趨勢'],
            avatar: (mockUser.photos && mockUser.photos[0]) ? mockUser.photos[0].src : ''
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('[profile] 載入資料失敗', err);
      return null;
    }
  }

  // 填充表單 DOM 欄位
  const savedData = loadProfileData();
  if (savedData) {
    if (document.getElementById('nickname')) document.getElementById('nickname').value = savedData.nickname || '';
    if (document.getElementById('gender')) document.getElementById('gender').value = savedData.gender || '';
    if (document.getElementById('occupation')) document.getElementById('occupation').value = savedData.occupation || '';
    if (document.getElementById('age')) document.getElementById('age').value = savedData.age || '';
    if (document.getElementById('bio')) document.getElementById('bio').value = savedData.bio || '';
    
    // 選取已帶入之興趣標籤
    if (savedData.tags && Array.isArray(savedData.tags)) {
      savedData.tags.forEach((tag) => {
        const btn = tagContainer ? tagContainer.querySelector(`.dp-tag-btn[data-tag="${tag}"]`) : null;
        if (btn) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        }
      });
    }
    updateTagCounter();

    // 載入頭像
    if (savedData.avatar) {
      avatarDataUrl = savedData.avatar;
      showAvatar(savedData.avatar);
    }
  }

  // 4. 表單變更偵測與未儲存防呆
  if (profileForm) {
    profileForm.addEventListener('input', () => {
      isFormDirty = true;
      hideAlert();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      if (isFormDirty) {
        if (!confirm('您輸入或修改的資料尚未儲存，確定要返回嗎？')) {
          e.preventDefault();
        }
      }
    });
  }

  // 5. 表單提交與驗證 (驗收準則：必填欄位與格式檢查)
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nickname = document.getElementById('nickname').value.trim();
      const gender = document.getElementById('gender').value;
      const occupation = document.getElementById('occupation').value;
      const ageVal = parseInt(document.getElementById('age').value, 10);
      const bio = document.getElementById('bio').value.trim();

      // 欄位驗證
      if (!nickname) {
        showAlert('請輸入顯示暱稱！', 'error');
        return;
      }
      if (!gender) {
        showAlert('請選擇您的性別！', 'error');
        return;
      }
      if (!occupation) {
        showAlert('請選擇職業/專業領域！', 'error');
        return;
      }
      if (isNaN(ageVal) || ageVal < 18) {
        showAlert('依據平台服務條款，使用者需年滿 18 歲才可註冊與使用。', 'error');
        return;
      }

      // 取得選取之興趣標籤
      const activeBtns = tagContainer ? tagContainer.querySelectorAll('.dp-tag-btn.active, .dp-tag-btn[aria-pressed="true"]') : [];
      const selectedTags = Array.from(activeBtns).map(btn => btn.getAttribute('data-tag'));

      const profilePayload = {
        nickname: nickname,
        gender: gender,
        occupation: occupation,
        age: ageVal,
        bio: bio,
        tags: selectedTags,
        avatar: avatarDataUrl,
        updatedAt: new Date().toISOString()
      };

      // 狀態反饋：停用按鈕並顯示處理中
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '資料儲存中...';
      }

      // 寫入 LocalStorage 持久化
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profilePayload));
      } catch (err) {
        console.warn('[profile] 寫入 LocalStorage 失敗', err);
        showAlert('儲存失敗！可能是圖片尺寸較大超出瀏覽器容量，請更換一張照片再試。', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '儲存檔案並繼續';
        }
        return;
      }

      // 模擬順暢非同步處理延遲並重導向
      setTimeout(() => {
        isFormDirty = false;
        alert('個人資料已順利更新完成！');
        window.location.href = 'user-center.html';
      }, 500);
    });
  }
});
(function () {
  var page = document.getElementById("chat-page");
  var stream = document.getElementById("chat-stream");
  var thread = document.getElementById("chat-thread");
  var form = document.getElementById("chat-form");
  var input = document.getElementById("chat-input");
  var moreBtn = document.getElementById("chat-more");
  var morePanel = document.getElementById("chat-more-panel");
  var backBtn = document.getElementById("chat-back");
  var peerName = document.getElementById("peer-name");
  var peerStatus = document.getElementById("peer-status");
  var peerAvatar = document.getElementById("peer-avatar");
  var search = document.getElementById("chat-search");
  var aiBtn = document.getElementById("chat-ai-btn");
  var aiMenu = document.getElementById("chat-ai-menu");
  var aiSheet = document.getElementById("chat-ai-sheet");
  var aiTitle = document.getElementById("chat-ai-title");
  var aiLead = document.getElementById("chat-ai-lead");
  var aiList = document.getElementById("chat-ai-list");
  var aiClose = document.getElementById("chat-ai-close");
  var currentId = "zhe";
  // 新增：安全文字偵測的模擬接收者視角（不是真實雙向同步）。
  var receiverToggle = document.getElementById("chat-safety-receiver-toggle");
  var receiverPanel = document.getElementById("chat-safety-receiver-panel");
  var receiverExpanded = false;
  var emotionToggle = document.getElementById("chat-emotion-toggle");
  var emotionPanel = document.getElementById("chat-emotion-panel");
  var emotionLive = document.getElementById("chat-emotion-live");
  var emotionExpanded = false;
  // 照片：先檢查指定圖片清單，通過後才建立本機的縮圖與模擬聊天訊息。
  var photoButton = document.getElementById("chat-photo-button");
  var photoInput = document.getElementById("chat-photo-input");
  var photoPending = document.getElementById("chat-photo-pending");
  var photoPreview = document.getElementById("chat-photo-preview");
  var photoName = document.getElementById("chat-photo-name");
  var photoRemove = document.getElementById("chat-photo-remove");
  var photoFeedback = document.getElementById("chat-photo-feedback");
  var sendButton = document.getElementById("chat-send-button");
  var pendingPhoto = null;
  var photoChecking = false;
  var photoRevision = 0;


  var tones = ["chat-tone-plum", "chat-tone-sage", "chat-tone-apricot"];

  var threads = {
    zhe: {
      name: "陳彥哲",
      short: "彥哲",
      char: "哲",
      status: "現在在線",
      online: true,
      tone: "chat-tone-plum",
      userId: "u08",
      shared: "拉麵和登山",
      preview: "那家拉麵我週六也想去！",
      time: "20:41",
      unread: 2,
      items: [
        { kind: "system" },
        { kind: "time", text: "今天 20:38" },
        { kind: "in", text: "嗨，看到你也常去柴山，下週末有空嗎" },
        { kind: "out", text: "有！週六下午可以", meta: "已送出 20:39" },
        { kind: "in", text: "那家拉麵我週六也想去！", meta: "20:41" }
      ]
    },
    qi: {
      userId: "u03",
      name: "許安琪",
      short: "安琪",
      char: "琪",
      status: "昨天看過",
      online: false,
      tone: "chat-tone-sage",
      shared: "手沖咖啡",
      preview: "你：好啊，那就約下午三點",
      time: "昨天",
      unread: 0,
      items: [
        { kind: "system" },
        { kind: "time", text: "昨天 16:12" },
        { kind: "in", text: "你檔案裡那間咖啡店我也去過，窗邊位子很好坐" },
        { kind: "out", text: "對，週末常常客滿，要早一點去", meta: "已讀 16:20" },
        { kind: "in", text: "那明天下午要不要去坐一下？" },
        { kind: "out", text: "好啊，那就約下午三點", meta: "已讀 16:28" }
      ]
    },
    wei: {
      userId: "u04",
      name: "黃維倫",
      short: "維倫",
      char: "維",
      status: "現在在線",
      online: true,
      tone: "chat-tone-apricot",
      shared: "貓派",
      preview: "哈哈我也養了兩隻橘貓",
      time: "週日",
      unread: 0,
      items: [
        { kind: "system" },
        { kind: "time", text: "週日 11:04" },
        { kind: "in", text: "你那張和豆花的合照好可愛" },
        { kind: "out", text: "牠看到鏡頭會裝沒事，平常很瘋", meta: "已讀 11:10" },
        { kind: "in", text: "哈哈我也養了兩隻橘貓", meta: "11:14" }
      ]
    },
    yun: {
      userId: "u02",
      name: "林予晴",
      short: "予晴",
      char: "晴",
      status: "剛剛配對",
      online: false,
      tone: "chat-tone-apricot",
      shared: "登山和手沖咖啡",
      preview: "傳送第一則訊息",
      time: "剛剛",
      unread: 0,
      items: [
        { kind: "system" }
      ]
    }
  };

  function lastPreview(items) {
    for (var i = items.length - 1; i >= 0; i--) {
      if (items[i].kind === "in") return items[i].text || (items[i].image ? "[照片]" : "");
      if (items[i].kind === "out") return "你：" + (items[i].text || (items[i].image ? "[照片]" : ""));
    }
    return "傳送第一則訊息";
  }

  function setTone(el, tone) {
    tones.forEach(function (c) { el.classList.remove(c); });
    el.classList.add(tone);
  }

  function renderThread(id) {
    var peer = threads[id];
    if (!peer) return;
    if (currentId !== id) clearPendingPhoto(true);
    currentId = id;

    peerName.textContent = peer.name;
    peerStatus.textContent = peer.status;
    peerAvatar.textContent = peer.char;
    peerAvatar.classList.toggle("dp-avatar--online", peer.online);
    setTone(peerAvatar, peer.tone);

    input.placeholder = peer.items.some(function (item) { return item.kind === "in" || item.kind === "out"; })
      ? "寫一則訊息"
      : "傳送第一則訊息";

    stream.replaceChildren();
    peer.items.forEach(function (item) {
      if (item.kind === "system") {
        var sys = document.createElement("p");
        sys.className = "chat-system";
        sys.append("你和");
        var strong = document.createElement("strong");
        strong.textContent = peer.short;
        sys.append(strong);
        sys.append("互相喜歡，可以開始聊天了。你們都喜歡" + peer.shared + "。");
        stream.appendChild(sys);
        return;
      }
      if (item.kind === "time") {
        var time = document.createElement("span");
        time.className = "dp-chat__time";
        time.textContent = item.text;
        stream.appendChild(time);
        return;
      }
      var row = document.createElement("div");
      row.className = "chat-msg chat-msg--" + item.kind;
      if (item.kind === "in") {
        var av = document.createElement("span");
        av.className = "dp-avatar dp-avatar--sm " + peer.tone;
        av.textContent = peer.char;
        row.appendChild(av);
      }
      var col = document.createElement("div");
      col.className = "chat-msg__col";
      var bubble = document.createElement("div");
      bubble.className = "dp-bubble dp-bubble--" + item.kind;
      if (item.image && item.image.src) {
        var img = document.createElement("img");
        img.className = "chat-photo-image";
        img.src = item.image.src;
        img.alt = "聊天室照片：" + (item.image.name || "使用者上傳");
        bubble.appendChild(img);
        if (item.text) {
          var caption = document.createElement("p");
          caption.className = "chat-photo-caption";
          caption.textContent = item.text;
          bubble.appendChild(caption);
        }
      } else {
        bubble.textContent = item.text || "";
      }
      col.appendChild(bubble);
      // 新增：對已顯示的每一則聊天文字做本機規則式情緒判斷。
      if (window.ChatEmotion && item.text) {
        var emotion = window.ChatEmotion.analyzeText(item.text);
        var badge = document.createElement("span");
        badge.className = "chat-emotion-badge";
        badge.textContent = emotion.emoji + " " + emotion.label;
        badge.title = "本機關鍵字規則推測，並非真正 AI 模型，可能誤判。";
        col.appendChild(badge);
      }
      if (item.safety && item.safety.flagged) {
        var safetyTag = document.createElement("p");
        safetyTag.className = "chat-safety-tag";
        safetyTag.textContent = "⚠ 安全提醒｜" + item.safety.summary + "（" + item.safety.reasons.join("；") + "）";
        col.appendChild(safetyTag);
      }
      if (item.meta) {
        var meta = document.createElement("span");
        meta.className = "chat-msg__meta";
        meta.textContent = item.meta;
        col.appendChild(meta);
      }
      row.appendChild(col);
      stream.appendChild(row);
    });

    document.querySelectorAll("[data-open]").forEach(function (btn) {
      btn.setAttribute("aria-current", btn.getAttribute("data-open") === id ? "true" : "false");
    });

    var listBtn = document.querySelector('#inbox-list [data-open="' + id + '"]');
    if (listBtn) {
      var badge = listBtn.querySelector(".dp-badge");
      if (badge) badge.remove();
      peer.unread = 0;
    }

    page.classList.add("chat-page--thread");
    thread.scrollTop = thread.scrollHeight;
    closeAi();
    renderReceiverPanel();
    renderEmotionPanel();
  }

  // 這是單機教學展示版：照片保存在此頁的記憶體，重新整理頁面即重設。
  function showPhotoFeedback(text, kind) {
    if (!photoFeedback) return;
    photoFeedback.hidden = !text;
    photoFeedback.textContent = text || "";
    photoFeedback.className = "chat-photo-feedback" + (kind ? " is-" + kind : "");
  }

  function clearPendingPhoto(alsoMessage) {
    photoRevision++;
    pendingPhoto = null;
    photoChecking = false;
    if (photoPending) photoPending.hidden = true;
    if (photoPreview) photoPreview.removeAttribute("src");
    if (photoName) photoName.textContent = "";
    if (photoInput) photoInput.value = "";
    if (photoButton) photoButton.disabled = false;
    if (sendButton) sendButton.disabled = false;
    if (alsoMessage) showPhotoFeedback("", "");
  }

  function compressChatPhoto(file) {
    return new Promise(function(resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function() {
        URL.revokeObjectURL(url);
        if (!image.width || !image.height || image.width * image.height > 50000000) {
          reject(new Error("圖片像素尺寸異常，請改用較小的照片。"));
          return;
        }
        try {
          var scale = Math.min(1, 900 / Math.max(image.width, image.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          var ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("無法建立圖片預覽。 ");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.76));
        } catch(err) { reject(err); }
      };
      image.onerror = function() { URL.revokeObjectURL(url); reject(new Error("無法讀取圖片內容。")); };
      image.src = url;
    });
  }

  if (photoButton && photoInput && photoPending) {
    photoButton.addEventListener("click", function() { if (!photoChecking) photoInput.click(); });
    photoRemove.addEventListener("click", function() { clearPendingPhoto(true); });
    photoInput.addEventListener("change", async function() {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;
      clearPendingPhoto(true);
      var version = ++photoRevision;
      photoChecking = true;
      photoButton.disabled = true;
      sendButton.disabled = true;
      showPhotoFeedback("正在檢查圖片，請稍候…", "loading");
      try {
        if (!window.ImageSafety) throw new Error("圖片安全偵測程式尚未載入。 ");
        var verdict = await window.ImageSafety.analyzeFile(file);
        if (version !== photoRevision) return;
        if (verdict.status === "blocked") {
          var category = verdict.match && verdict.match.category ? verdict.match.category : "指定測試圖片";
          var warning = "⚠️ 已攔截圖片：" + category + "。這張照片屬於預先登錄的測試圖，無法在聊天室傳送。";
          showPhotoFeedback(warning, "error");
          window.alert(warning);
          return;
        }
        var src = await compressChatPhoto(file);
        if (version !== photoRevision) return;
        pendingPhoto = {src: src, name: file.name};
        photoPreview.src = src;
        photoName.textContent = file.name;
        photoPending.hidden = false;
        showPhotoFeedback("✓ 未命中指定圖片，可按『傳送』送出照片。（尚未進行 AI 內容安全審查）", "");
      } catch(err) {
        if (version === photoRevision) showPhotoFeedback("照片無法上傳：" + (err.message || "未知錯誤"), "error");
      } finally {
        if (version === photoRevision) {
          photoChecking = false;
          photoButton.disabled = false;
          sendButton.disabled = false;
          photoInput.value = "";
        }
      }
    });
  }

  // 模擬接收者視角：僅讀取本頁使用者剛送出的風險訊息。
  // 不代表另一台手機／真實帳號已經收到訊息或警告。
  function renderReceiverPanel() {
    if (!receiverPanel || !receiverToggle) return;
    receiverPanel.hidden = !receiverExpanded;
    receiverToggle.textContent = receiverExpanded ? "收起模擬接收方提醒" : "模擬接收方提醒";
    receiverToggle.setAttribute("aria-expanded", String(receiverExpanded));
    receiverPanel.replaceChildren();
    if (!receiverExpanded) return;
    var peer = threads[currentId];
    var riskItems = peer.items.filter(function(item) {
      return item.kind === "out" && item.safety && item.safety.flagged;
    });
    var heading = document.createElement("strong");
    heading.textContent = "接收者安全提示（本機模擬）";
    receiverPanel.appendChild(heading);
    if (!riskItems.length) {
      var empty = document.createElement("p");
      empty.textContent = "目前這段對話尚無本次操作送出的可疑訊息。";
      receiverPanel.appendChild(empty);
      return;
    }
    riskItems.forEach(function(item) {
      var card = document.createElement("div");
      card.className = "chat-safety-receiver-message";
      var content = document.createElement("p");
      content.textContent = "收到訊息：「" + item.text + "」";
      var warning = document.createElement("p");
      warning.className = "chat-safety-receiver-warning";
      warning.textContent = "⚠ 收件者提醒：" + item.safety.summary + "｜" + item.safety.reasons.join("；");
      card.append(content, warning);
      receiverPanel.appendChild(card);
    });
  }

  if (receiverToggle) {
    receiverToggle.addEventListener("click", function () {
      receiverExpanded = !receiverExpanded;
      renderReceiverPanel();
    });
  }

  // 情緒摘要：統計目前聊天室的訊息；不傳資料到外部伺服器。
  function renderEmotionPanel() {
    if (!emotionPanel || !emotionToggle || !window.ChatEmotion) return;
    emotionToggle.setAttribute("aria-expanded", String(emotionExpanded));
    emotionToggle.textContent = emotionExpanded ? "收起聊天情緒" : "聊天情緒偵測";
    emotionPanel.hidden = !emotionExpanded;
    emotionPanel.replaceChildren();
    if (!emotionExpanded) return;
    var summary = window.ChatEmotion.analyzeConversation(threads[currentId].items);
    var title = document.createElement("strong");
    title.textContent = "📊 聊天情緒分析（規則式展示）";
    var counts = document.createElement("div");
    counts.className = "chat-emotion-counts";
    counts.textContent = "共 " + summary.total + " 則文字｜😊 開心 " + summary.counts.happy +
      "｜😢 難過 " + summary.counts.sad + "｜😠 生氣 " + summary.counts.angry +
      "｜😐 中性 " + summary.counts.neutral + "｜🤔 混合 " + summary.counts.mixed;
    var latest = document.createElement("div");
    latest.textContent = summary.latest ? ("最近一則：" + summary.latest.emoji + " " + summary.latest.label) : "目前沒有聊天文字。";
    var note = document.createElement("p");
    note.className = "chat-emotion-note";
    note.textContent = "依訊息文字中的情緒詞推測；不代表真實心理狀態，雙關或反話容易誤判。本頁不需 API 或網路。";
    var quick = document.createElement("div");
    quick.className = "chat-emotion-quick-test";
    var examples = [
      ["😊 開心", "今天真的很開心，認識你真好！"],
      ["😢 難過", "我今天心情很不好，真的很難過。"],
      ["😠 生氣", "你怎麼可以這樣？我真的很生氣！"],
      ["😐 中性", "我們明天下午三點見。"]
    ];
    examples.forEach(function (entry) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = entry[0] + "測試";
      button.addEventListener("click", function () {
        input.value = entry[1];
        input.dispatchEvent(new Event("input", {bubbles:true}));
        input.focus();
      });
      quick.appendChild(button);
    });
    var recentTitle = document.createElement("div");
    recentTitle.textContent = "最近幾則訊息的分類：";
    var recent = document.createElement("ol");
    recent.className = "chat-emotion-recent";
    threads[currentId].items.filter(function(x){return (x.kind === 'in' || x.kind === 'out') && x.text;})
      .slice(-6).forEach(function(x){
        var li = document.createElement("li");
        var r = window.ChatEmotion.analyzeText(x.text);
        li.textContent = r.emoji + " " + r.label + "｜" + x.text;
        recent.appendChild(li);
      });
    emotionPanel.append(title, counts, latest, note, quick, recentTitle, recent);
  }
  if (emotionToggle) {
    emotionToggle.addEventListener("click", function () {
      emotionExpanded = !emotionExpanded;
      renderEmotionPanel();
    });
  }
  function refreshEmotionLive() {
    if (!emotionLive || !window.ChatEmotion) return;
    var text = input.value.trim();
    if (!text) {
      emotionLive.textContent = "輸入訊息即可預覽情緒分類（關鍵字規則展示版）。";
      return;
    }
    var r = window.ChatEmotion.analyzeText(text);
    emotionLive.textContent = "目前文字情緒預測：" + r.emoji + " " + r.label + "（僅供展示）";
  }
  input.addEventListener("input", refreshEmotionLive);

  function updateListPreview(id) {
    var peer = threads[id];
    var btn = document.querySelector('#inbox-list [data-open="' + id + '"]');
    if (!btn) return;
    btn.querySelector(".dp-list-item__sub").textContent = peer.preview;
    btn.querySelector(".chat-inbox__time").textContent = peer.time;
  }

  document.querySelectorAll("[data-open]").forEach(function (el) {
    el.addEventListener("click", function () {
      renderThread(el.getAttribute("data-open"));
      input.focus();
    });
  });

  backBtn.addEventListener("click", function () {
    page.classList.remove("chat-page--thread");
  });

  function closeAi(keepSheet) {
    aiMenu.hidden = true;
    aiBtn.setAttribute("aria-expanded", "false");
    if (!keepSheet) aiSheet.hidden = true;
  }

  function renderAiRows(title, lead, rows) {
    aiTitle.textContent = title;
    aiLead.textContent = lead;
    aiList.replaceChildren();
    rows.forEach(function (row) {
      var li = document.createElement("li");
      li.className = "chat-ai-card";
      var why = document.createElement("p");
      why.className = "chat-ai-card__why";
      why.textContent = row.why;
      li.appendChild(why);
      if (row.empty) {
        var hint = document.createElement("p");
        hint.className = "dp-sm dp-muted";
        hint.textContent = row.hint || "";
        li.appendChild(hint);
      } else {
        var text = document.createElement("p");
        text.className = "chat-ai-card__text";
        text.textContent = row.text;
        li.appendChild(text);
        var useBtn = document.createElement("button");
        useBtn.className = "dp-btn dp-btn--secondary dp-btn--sm";
        useBtn.type = "button";
        useBtn.textContent = "填入輸入框";
        useBtn.addEventListener("click", function () {
          input.value = row.text;
          input.dispatchEvent(new Event("input", {bubbles:true}));
          input.focus();
          closeAi();
        });
        li.appendChild(useBtn);
      }
      aiList.appendChild(li);
    });
    aiSheet.hidden = false;
  }

  function openAiFeature(kind) {
    var peer = threads[currentId];
    var profile = window.ChatAI && window.MOCK_DB
      ? window.ChatAI.findUser(peer, window.MOCK_DB)
      : null;
    if (kind === "reply") {
      renderAiRows(
        "聊天建議",
        "根據" + peer.short + "最近的訊息，建議你可以怎麼回。",
        window.ChatAI.suggestReplies(peer)
      );
    } else {
      var lead = profile
        ? "根據" + profile.name + "的檔案（興趣、問答、工作與寵物）想話題。"
        : "目前對不到模擬檔案，改用你們的共同點。";
      renderAiRows("破冰話題", lead, window.ChatAI.suggestIcebreakers(peer, window.MOCK_DB));
    }
  }

  aiBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    morePanel.hidden = true;
    moreBtn.setAttribute("aria-expanded", "false");
    var open = aiMenu.hidden;
    aiMenu.hidden = !open;
    aiBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  aiMenu.querySelectorAll("[data-ai]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openAiFeature(btn.getAttribute("data-ai"));
      aiMenu.hidden = true;
      aiBtn.setAttribute("aria-expanded", "false");
    });
  });

  aiClose.addEventListener("click", function () { closeAi(); });

  moreBtn.addEventListener("click", function () {
    var open = morePanel.hidden;
    morePanel.hidden = !open;
    moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", function (e) {
    if (!moreBtn.contains(e.target) && !morePanel.contains(e.target)) {
      morePanel.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
    }
    if (!aiBtn.contains(e.target) && !aiMenu.contains(e.target)) {
      aiMenu.hidden = true;
      aiBtn.setAttribute("aria-expanded", "false");
    }
  });

  search.addEventListener("input", function () {
    var q = search.value.trim();
    document.querySelectorAll("#inbox-list li").forEach(function (li) {
      li.hidden = q ? li.textContent.indexOf(q) === -1 : false;
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (photoChecking) {
      showPhotoFeedback("圖片正在檢查中，請稍候。", "loading");
      return;
    }
    if (!text && !pendingPhoto) return;
    var peer = threads[currentId];
    // 新增：送出前先比對文字風險；只有使用者確認後才送出。
    // 若風險訊息被送出，將標記存在這則模擬聊天資料內，切換對話後仍能顯示。
    var safety = window.ChatTextSafety ? window.ChatTextSafety.analyzeText(text) : null;
    if (safety && safety.flagged) {
      var proceed = window.confirm("⚠ 文字安全提醒：" + safety.summary + "\n" + safety.reasons.join("\n") + "\n\n仍要傳送這則訊息嗎？");
      if (!proceed) return;
    }
    peer.items.push({ kind: "out", text: text, image: pendingPhoto, meta: "已送出 剛剛", safety: safety });
    peer.preview = lastPreview(peer.items);
    peer.time = "剛剛";
    updateListPreview(currentId);
    input.value = "";
    clearPendingPhoto(false);
    showPhotoFeedback("", "");
    refreshEmotionLive();
    renderThread(currentId);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  renderThread(currentId);
})();

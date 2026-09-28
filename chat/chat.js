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
      if (items[i].kind === "in") return items[i].text;
      if (items[i].kind === "out") return "你：" + items[i].text;
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
      bubble.textContent = item.text;
      col.appendChild(bubble);
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
  }

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
    if (!text) return;
    var peer = threads[currentId];
    peer.items.push({ kind: "out", text: text, meta: "已送出 剛剛" });
    peer.preview = lastPreview(peer.items);
    peer.time = "剛剛";
    updateListPreview(currentId);
    input.value = "";
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

/* =========================================================
   訊息頁
   - 登入者：js/session.js（沒登入會導回登入頁）
   - 對話資料：chat/chat-store.js（第一次使用時由 data/mock-chats.js 產生，之後存在 localStorage）
   - 對象的姓名、頭像、在線狀態、興趣一律讀 MOCK_DB.users
   - 網址 ?peer=<用戶 id> 會直接開啟和該用戶的對話（由配對頁在關係分數達 60% 時建立）
   ========================================================= */
(function () {
    var me = Session.requireUser(MOCK_DB.users);
    if (!me) return; // 未登入，已導向登入頁

    var page = document.getElementById("chat-page");
    var room = document.getElementById("chat-room");
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
    var matchesRow = document.getElementById("chat-matches");
    var inboxList = document.getElementById("inbox-list");
    var routeNotice = document.getElementById("chat-route-notice");
    var aiBtn = document.getElementById("chat-ai-btn");
    var aiMenu = document.getElementById("chat-ai-menu");
    var aiSheet = document.getElementById("chat-ai-sheet");
    var aiTitle = document.getElementById("chat-ai-title");
    var aiLead = document.getElementById("chat-ai-lead");
    var aiList = document.getElementById("chat-ai-list");
    var aiClose = document.getElementById("chat-ai-close");
    var scheduleToggle = document.getElementById("chat-schedule-toggle");
    var schedulePanel = document.getElementById("chat-schedule-panel");
    var scheduleClose = document.getElementById("chat-schedule-close");
    var scheduleList = document.getElementById("chat-schedule-list");
    var scheduleForm = document.getElementById("chat-schedule-form");
    var voiceLink = document.getElementById("chat-voice-link");

    var tones = ["chat-tone-plum", "chat-tone-sage", "chat-tone-apricot"];
    // MOCK_DB.users[].photoTone（0~3）對應到本頁的頭像底色
    var TONE_BY_PHOTO = ["chat-tone-plum", "chat-tone-apricot", "chat-tone-sage", "chat-tone-plum"];
    var DIVIDER_GAP_MINUTES = 30;

    var usersById = {};
    MOCK_DB.users.forEach(function (u) { usersById[u.id] = u; });

    var conversations = ChatStore.load(MOCK_CHATS);
    var currentId = null;

    /* ---------- 資料轉換 ---------- */
    function findConv(id) {
        return conversations.find(function (c) { return c.id === id; }) || null;
    }

    function peerOf(conv) {
        return usersById[ChatStore.peerOf(conv, me.id)];
    }

    function shortName(name) {
        return name.length >= 3 ? name.slice(1) : name;
    }

    function lastChar(name) {
        return Array.from(name).pop();
    }

    function toneOf(user) {
        return TONE_BY_PHOTO[user.photoTone] || tones[0];
    }

    /** 雙方共同興趣，最多兩個，例如「登山和手沖咖啡」 */
    function sharedText(peer) {
        var shared = me.interests.filter(function (i) { return peer.interests.indexOf(i) !== -1; });
        return shared.slice(0, 2).join("和");
    }

    function preview(conv) {
        var last = ChatStore.lastMessage(conv);
        if (!last) return "傳送第一則訊息";
        return (last.from === me.id ? "你：" : "") + last.text;
    }

    /** 給 chat-ai.js 用的對話格式（沿用原本 threads 的欄位：name、userId、shared、items） */
    function aiPeerView(conv) {
        var peer = peerOf(conv);
        return {
            name: peer.name,
            short: shortName(peer.name),
            userId: peer.id,
            shared: sharedText(peer),
            items: conv.messages.map(function (m) {
                return { kind: m.from === me.id ? "out" : "in", text: m.text };
            })
        };
    }

    function persist() {
        if (!ChatStore.save(conversations)) {
            showNotice("瀏覽器儲存空間不足，訊息可能在重新整理後消失。");
        }
    }

    /* ---------- 畫面 ---------- */
    function setTone(el, tone) {
        tones.forEach(function (c) { el.classList.remove(c); });
        el.classList.add(tone);
    }

    function avatarEl(user, extraClass) {
        var av = document.createElement("span");
        av.className = "dp-avatar " + toneOf(user) + (extraClass ? " " + extraClass : "") + (user.online ? " dp-avatar--online" : "");
        av.textContent = lastChar(user.name);
        return av;
    }

    function showNotice(text) {
        routeNotice.textContent = text;
        routeNotice.hidden = !text;
    }

    function renderInbox() {
        var mine = ChatStore.conversationsFor(conversations, me.id);
        var fresh = mine.filter(function (c) { return c.messages.length === 0; });
        var talking = mine.filter(function (c) { return c.messages.length > 0; });

        // 新配對：還沒傳過訊息的對話
        matchesRow.replaceChildren();
        fresh.forEach(function (conv) {
            var peer = peerOf(conv);
            var btn = document.createElement("button");
            btn.className = "chat-match";
            btn.type = "button";
            btn.setAttribute("data-open", conv.id);
            btn.setAttribute("aria-current", conv.id === currentId ? "true" : "false");
            btn.appendChild(avatarEl(peer));
            var name = document.createElement("span");
            name.className = "chat-match__name";
            name.textContent = peer.name;
            btn.appendChild(name);
            matchesRow.appendChild(btn);
        });
        matchesRow.hidden = fresh.length === 0;

        inboxList.replaceChildren();
        talking.forEach(function (conv) {
            var peer = peerOf(conv);
            var li = document.createElement("li");
            var btn = document.createElement("button");
            btn.className = "dp-list-item";
            btn.type = "button";
            btn.setAttribute("data-open", conv.id);
            btn.setAttribute("aria-current", conv.id === currentId ? "true" : "false");
            btn.appendChild(avatarEl(peer));

            var text = document.createElement("span");
            text.className = "dp-list-item__text";
            var title = document.createElement("span");
            title.className = "dp-list-item__title";
            title.textContent = peer.name;
            var sub = document.createElement("span");
            sub.className = "dp-list-item__sub";
            sub.textContent = preview(conv);
            text.append(title, sub);
            btn.appendChild(text);

            var time = document.createElement("span");
            time.className = "chat-inbox__time";
            time.textContent = ChatStore.formatListTime(ChatStore.lastMessage(conv).at, new Date());
            btn.appendChild(time);

            var unread = ChatStore.unreadCount(conv, me.id);
            if (unread > 0) {
                var badge = document.createElement("span");
                badge.className = "dp-badge";
                badge.textContent = String(unread);
                btn.appendChild(badge);
            }
            li.appendChild(btn);
            inboxList.appendChild(li);
        });

        if (mine.length === 0) {
            var empty = document.createElement("li");
            empty.className = "dp-empty";
            var p = document.createElement("p");
            p.className = "dp-sm dp-muted";
            p.textContent = "還沒有對話。在配對頁把關係分數加到 60%，就能開始聊天。";
            var link = document.createElement("a");
            link.className = "dp-btn dp-btn--secondary dp-btn--sm";
            link.href = "match.html";
            link.textContent = "去配對";
            empty.append(p, link);
            inboxList.appendChild(empty);
        }
        applySearch();
    }

    /** 沒有任何對話時，聊天室顯示空狀態並停用輸入 */
    function renderEmptyRoom() {
        currentId = null;
        peerName.textContent = "訊息";
        peerStatus.textContent = "";
        peerAvatar.textContent = "";
        peerAvatar.classList.remove("dp-avatar--online");
        room.classList.add("chat-room--empty");
        stream.replaceChildren();
        var hint = document.createElement("p");
        hint.className = "chat-system";
        hint.textContent = "選擇一段對話開始聊天。";
        stream.appendChild(hint);
        input.disabled = true;
        form.querySelector("button[type=submit]").disabled = true;
        scheduleToggle.disabled = true;
        voiceLink.hidden = true;
    }

    function messageRow(peer, item, meta) {
        var row = document.createElement("div");
        row.className = "chat-msg chat-msg--" + item.kind;
        if (item.kind === "in") {
            var av = document.createElement("span");
            av.className = "dp-avatar dp-avatar--sm " + toneOf(peer);
            av.textContent = lastChar(peer.name);
            row.appendChild(av);
        }
        var col = document.createElement("div");
        col.className = "chat-msg__col";
        var bubble = document.createElement("div");
        bubble.className = "dp-bubble dp-bubble--" + item.kind;
        bubble.textContent = item.text;
        col.appendChild(bubble);
        if (meta) {
            var metaEl = document.createElement("span");
            metaEl.className = "chat-msg__meta";
            metaEl.textContent = meta;
            col.appendChild(metaEl);
        }
        row.appendChild(col);
        return row;
    }

    function hhmm(iso) {
        var d = new Date(iso);
        return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }

    function renderThread(id) {
        var conv = findConv(id);
        if (!conv) return;
        var peer = peerOf(conv);
        var now = new Date();
        currentId = id;

        room.classList.remove("chat-room--empty");
        input.disabled = false;
        form.querySelector("button[type=submit]").disabled = false;
        scheduleToggle.disabled = false;
        voiceLink.hidden = false;

        peerName.textContent = peer.name;
        peerStatus.textContent = peer.online ? "現在在線" : "最近上線";
        peerAvatar.textContent = lastChar(peer.name);
        peerAvatar.classList.toggle("dp-avatar--online", peer.online);
        setTone(peerAvatar, toneOf(peer));
        voiceLink.href = "talk.html?peer=" + encodeURIComponent(peer.id) + "&conversation=" + encodeURIComponent(id);
        renderSchedules(id, peer);

        input.placeholder = conv.messages.length ? "寫一則訊息" : "傳送第一則訊息";

        stream.replaceChildren();
        var sys = document.createElement("p");
        sys.className = "chat-system";
        sys.append("你和");
        var strong = document.createElement("strong");
        strong.textContent = shortName(peer.name);
        sys.append(strong);
        var shared = sharedText(peer);
        sys.append("的關係分數達到 60%，可以開始聊天了。" + (shared ? "你們都喜歡" + shared + "。" : ""));
        stream.appendChild(sys);

        // 只在最後一則訊息標示時間／已讀，避免畫面太雜
        var lastIndex = conv.messages.length - 1;
        var peerReadAt = conv.lastRead[peer.id] || "";
        var prevAt = null;
        conv.messages.forEach(function (m, i) {
            if (!prevAt || new Date(m.at) - new Date(prevAt) > DIVIDER_GAP_MINUTES * 60000) {
                var time = document.createElement("span");
                time.className = "dp-chat__time";
                time.textContent = ChatStore.formatDivider(m.at, now);
                stream.appendChild(time);
            }
            prevAt = m.at;
            var kind = m.from === me.id ? "out" : "in";
            var meta = "";
            if (i === lastIndex) {
                meta = kind === "out" ? (peerReadAt >= m.at ? "已讀 " : "已送出 ") + hhmm(m.at) : hhmm(m.at);
            }
            stream.appendChild(messageRow(peer, { kind: kind, text: m.text }, meta));
        });

        conversations = ChatStore.markRead(conversations, id, me.id, now);
        persist();
        renderInbox();

        page.classList.add("chat-page--thread");
        thread.scrollTop = thread.scrollHeight;
        closeAi();
    }

    function renderSchedules(conversationId, peer) {
        scheduleList.replaceChildren();
        ChatSchedule.list(conversationId, peer.name).forEach(function (event) {
            var item = document.createElement("li");
            item.className = "chat-schedule-item";
            var title = document.createElement("strong");
            title.textContent = event.title;
            var date = document.createElement("time");
            date.dateTime = event.startsAt;
            date.textContent = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(event.startsAt));
            item.append(title, date);
            if (event.location) {
                var location = document.createElement("span");
                location.textContent = event.location;
                item.appendChild(location);
            }
            scheduleList.appendChild(item);
        });
        var localNow = new Date();
        localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
        scheduleForm.elements.startsAt.min = localNow.toISOString().slice(0, 16);
    }

    /* ---------- 事件 ---------- */
    // 列表是動態產生的，用事件委派處理點擊
    [matchesRow, inboxList].forEach(function (container) {
        container.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-open]");
            if (!btn) return;
            showNotice("");
            renderThread(btn.getAttribute("data-open"));
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
        var conv = findConv(currentId);
        if (!conv) return;
        var peer = aiPeerView(conv);
        // MOCK_DB 以 const 宣告，不會掛在 window 上，要直接引用（原本寫 window.MOCK_DB 會一直是 undefined）
        var profile = window.ChatAI ? window.ChatAI.findUser(peer, MOCK_DB) : null;
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
            renderAiRows("破冰話題", lead, window.ChatAI.suggestIcebreakers(peer, MOCK_DB));
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

    scheduleToggle.addEventListener("click", function () {
        var open = schedulePanel.hidden;
        schedulePanel.hidden = !open;
        scheduleToggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
            aiSheet.hidden = true;
            aiMenu.hidden = true;
            aiBtn.setAttribute("aria-expanded", "false");
            morePanel.hidden = true;
            moreBtn.setAttribute("aria-expanded", "false");
        }
    });
    scheduleClose.addEventListener("click", function () {
        schedulePanel.hidden = true;
        scheduleToggle.setAttribute("aria-expanded", "false");
    });
    scheduleForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var conv = findConv(currentId);
        if (!conv) return;
        try {
            ChatSchedule.add(currentId, {
                title: scheduleForm.elements.title.value,
                startsAt: scheduleForm.elements.startsAt.value,
                location: scheduleForm.elements.location.value,
                createdBy: me.id
            });
            scheduleForm.reset();
            renderSchedules(currentId, peerOf(conv));
            showNotice("行程已加入你和" + shortName(peerOf(conv).name) + "的共同行事曆。");
        } catch (err) {
            showNotice(err.message);
        }
    });

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

    function applySearch() {
        var q = search.value.trim();
        inboxList.querySelectorAll("li").forEach(function (li) {
            li.hidden = q ? li.textContent.indexOf(q) === -1 : false;
        });
    }
    search.addEventListener("input", applySearch);

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!currentId || !input.value.trim()) return;
        try {
            conversations = ChatStore.send(conversations, currentId, me.id, input.value, new Date());
        } catch (err) {
            showNotice(err.message);
            return;
        }
        persist();
        input.value = "";
        renderThread(currentId);
    });

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.requestSubmit();
        }
    });

    /* ---------- 初始化：?peer= 指定對象，否則開最近的對話 ---------- */
    var peerParam = new URLSearchParams(location.search).get("peer");
    var mine = ChatStore.conversationsFor(conversations, me.id);
    var target = peerParam ? ChatStore.find(mine, me.id, peerParam) : null;

    if (peerParam && !target) {
        var wanted = usersById[peerParam];
        showNotice(wanted
            ? "你和" + wanted.name + "還不能聊天：在配對頁把關係分數加到 60% 就能開啟。"
            : "找不到這位用戶，已為你開啟最近的對話。");
    }

    renderInbox();
    if (target || mine[0]) {
        renderThread((target || mine[0]).id);
    } else {
        renderEmptyRoom();
    }
})();

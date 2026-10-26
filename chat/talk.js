(function () {
    var me = Session.requireUser(MOCK_DB.users);
    if (!me) return;
    var params = new URLSearchParams(location.search);
    var peer = MOCK_DB.users.find(function (user) { return user.id === params.get("peer"); });
    var avatar = document.getElementById("talk-avatar");
    var peerLabel = document.getElementById("talk-peer");
    var button = document.getElementById("talk-mic");
    var status = document.getElementById("talk-status");
    var back = document.getElementById("talk-back");
    var tones = ["chat-tone-plum", "chat-tone-apricot", "chat-tone-sage", "chat-tone-plum"];
    var stream = null;

    if (peer) {
        avatar.textContent = Array.from(peer.name).pop();
        avatar.classList.add(tones[peer.photoTone] || tones[0]);
        document.getElementById("talk-title").textContent = "與" + peer.name + "語音聊天";
        peerLabel.textContent = peer.online ? "對方目前在線" : "和對方開始語音聊天";
    } else {
        avatar.textContent = "?";
        peerLabel.textContent = "未指定聊天對象";
    }
    var conversation = params.get("conversation");
    if (conversation) back.href = "chat.html?peer=" + encodeURIComponent(peer ? peer.id : "");

    function setMicOn(on) {
        button.setAttribute("aria-pressed", on ? "true" : "false");
        button.textContent = on ? "關閉麥克風" : "開啟麥克風";
        status.textContent = on ? "麥克風已開啟" : "麥克風目前關閉";
    }

    button.addEventListener("click", async function () {
        if (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            stream = null;
            setMicOn(false);
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            status.textContent = "此瀏覽器或頁面環境不支援麥克風，請透過 localhost 或 HTTPS 開啟。";
            return;
        }
        button.disabled = true;
        status.textContent = "等待麥克風權限…";
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicOn(true);
        } catch (err) {
            status.textContent = err.name === "NotAllowedError" ? "麥克風權限未開啟，請在瀏覽器設定中允許使用。" : "無法啟用麥克風，請確認裝置已連接。";
        } finally {
            button.disabled = false;
        }
    });
    window.addEventListener("pagehide", function () {
        if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    });
})();

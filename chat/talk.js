(function () {
    var me = Session.requireUser(MOCK_DB.users);
    if (!me) return;
    var params = new URLSearchParams(location.search);
    var peer = MOCK_DB.users.find(function (user) { return user.id === params.get("peer"); });
    var avatar = document.getElementById("talk-avatar");
    var peerLabel = document.getElementById("talk-peer");
    var button = document.getElementById("talk-mic");
    var status = document.getElementById("talk-status");
    var speakerButton = document.getElementById("talk-speaker");
    var endButton = document.getElementById("talk-end");
    var remoteAudio = document.getElementById("talk-remote-audio");
    var tones = ["chat-tone-plum", "chat-tone-apricot", "chat-tone-sage", "chat-tone-plum"];
    var stream = null;
    var speakerOn = true;
    var ending = false;

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
    var returnUrl = conversation && peer
        ? "chat.html?peer=" + encodeURIComponent(peer.id)
        : "chat.html";

    function updateStatus(message) {
        status.textContent = message || ("麥克風" + (stream ? "已開啟" : "目前關閉") + " · 擴音" + (speakerOn ? "已開啟" : "已關閉") + (remoteAudio.srcObject ? "" : "（等待對方音訊）"));
    }

    function setMicOn(on) {
        button.setAttribute("aria-pressed", on ? "true" : "false");
        button.querySelector("span").textContent = on ? "關閉麥克風" : "開啟麥克風";
        updateStatus();
    }

    button.addEventListener("click", async function () {
        if (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            stream = null;
            setMicOn(false);
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            updateStatus("此瀏覽器或頁面環境不支援麥克風，請透過 localhost 或 HTTPS 開啟。");
            return;
        }
        button.disabled = true;
        updateStatus("等待麥克風權限…");
        try {
            var requestedStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (ending) {
                requestedStream.getTracks().forEach(function (track) { track.stop(); });
                return;
            }
            stream = requestedStream;
            setMicOn(true);
        } catch (err) {
            updateStatus(err.name === "NotAllowedError" ? "麥克風權限未開啟，請在瀏覽器設定中允許使用。" : "無法啟用麥克風，請確認裝置已連接。");
        } finally {
            button.disabled = false;
        }
    });

    speakerButton.addEventListener("click", function () {
        speakerOn = !speakerOn;
        remoteAudio.muted = !speakerOn;
        speakerButton.setAttribute("aria-pressed", speakerOn ? "true" : "false");
        speakerButton.querySelector("span").textContent = speakerOn ? "關閉擴音" : "開啟擴音";
        updateStatus();
    });

    endButton.addEventListener("click", function () {
        ending = true;
        if (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            stream = null;
        }
        remoteAudio.pause();
        remoteAudio.srcObject = null;
        setMicOn(false);
        window.location.href = returnUrl;
    });

    window.addEventListener("pagehide", function () {
        if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    });
})();

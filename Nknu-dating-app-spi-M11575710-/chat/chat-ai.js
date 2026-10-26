(function (global) {
  function findUser(peer, db) {
    if (!peer || !db || !db.users) return null;
    var byName = db.users.find(function (u) { return u.name === peer.name; });
    if (byName) return byName;
    return db.users.find(function (u) { return u.id === peer.userId; }) || null;
  }

  function lastIncoming(items) {
    var list = [];
    (items || []).forEach(function (item) {
      if (item.kind === "in" && item.text) list.push(item.text);
    });
    return list;
  }

  function clip(text, n) {
    n = n || 18;
    return text.length > n ? text.slice(0, n) + "…" : text;
  }

  function uniqueTexts(rows) {
    var seen = {};
    return rows.filter(function (row) {
      if (!row.text || seen[row.text]) return false;
      seen[row.text] = true;
      return true;
    }).slice(0, 3);
  }

  function suggestReplies(peer) {
    var incoming = lastIncoming(peer.items);
    if (!incoming.length) {
      return [{
        why: "對方還沒傳訊息，沒有可以接的句子。",
        text: "",
        empty: true,
        hint: "改用「破冰話題」，從對方檔案找一個好開場。"
      }];
    }

    var last = incoming[incoming.length - 1];
    var rows = [];

    if (/有空|週末|週六|週日|明天|下午|晚上|要不要|約/.test(last)) {
      rows.push({
        why: "對方在提時間或邀約。先說清自己能不能去，再讓對方選細節。",
        text: "可以啊，我這週有空。你比較想早一點還是傍晚？"
      });
      rows.push({
        why: "把邀請接住，順便問一個具體地點，對話比較容易往下走。",
        text: "好，我可以。你心裡已經有想去的店或路線了嗎？"
      });
    }

    if (/嗎|呢|？|\?/.test(last)) {
      rows.push({
        why: "對方在發問。先給明確答案，再回問一句，才不會聊死。",
        text: "有，我最近也常想這件事。你是怎麼開始的？"
      });
    }

    if (/柴山|爬山|登山|步道|合歡/.test(last)) {
      rows.push({
        why: "對方提到爬山。接興趣，比只回「好」更容易繼續。",
        text: "柴山那條我也很熟。你比較喜歡清晨去，還是傍晚看夕陽？"
      });
    }
    if (/拉麵|吃飯|餐廳|咖啡|手沖|誠品/.test(last)) {
      rows.push({
        why: "對方在聊吃喝或店家。回一個偏好，再請對方推薦。",
        text: "我也想去。你有私藏名單的話，下次可以一起排。"
      });
    }
    if (/貓|狗|寵物|豆花|橘子|橘寶|麻糬/.test(last)) {
      rows.push({
        why: "對方提到寵物。問日常細節，通常很好回。",
        text: "聽起來好可愛。牠平常最喜歡搗亂的是什麼時候？"
      });
    }

    rows.push({
      why: "把對方最後一句接住，讓人覺得你有認真看。",
      text: "「" + clip(last) + "」這句我有看到。我想聽你多講一點。"
    });
    rows.push({
      why: "輕鬆接話，適合還沒很熟的階段。",
      text: "哈哈好，那我們再對一下時間。你最近還有在忙什麼？"
    });

    return uniqueTexts(rows);
  }

  function suggestIcebreakers(peer, db) {
    var user = findUser(peer, db);
    var rows = [];

    if (user && user.prompts && user.prompts[0]) {
      var prompt = user.prompts[0];
      rows.push({
        why: "從對方的個人問答切入，比「你好」更容易回。",
        text: "你寫「" + prompt.q + "」是「" + prompt.a + "」，最近還有在做嗎？"
      });
    }

    if (user && user.interests && user.interests.length) {
      var interest = user.interests[0];
      if (peer.shared && user.interests.indexOf(peer.shared.replace(/和.*/, "")) !== -1) {
        interest = user.interests.filter(function (item) {
          return peer.shared.indexOf(item) !== -1;
        })[0] || interest;
      }
      rows.push({
        why: "用對方檔案上的興趣開場，話題具體。",
        text: "看到你也喜歡" + interest + "。你平常都去哪玩？"
      });
    }

    if (user && user.pets && user.pets[0]) {
      var pet = user.pets[0];
      rows.push({
        why: "寵物是很好的破冰題，對方通常願意多講。",
        text: "你和" + pet.name + "的照片好可愛。牠最常做的壞事是什麼？"
      });
    }

    if (user && user.job) {
      rows.push({
        why: "工作與生活節奏很好問，也不會太私人。",
        text: "你是" + user.job + "，下班之後通常怎麼放鬆？"
      });
    }

    if (user && user.area) {
      rows.push({
        why: "從住的地方問口袋名單，適合約見面之前。",
        text: "你在" + user.area + "，有沒有不會想跟太多人分享的店？"
      });
    }

    if (user && user.moments && user.moments[0]) {
      rows.push({
        why: "根據對方最近的動態提問，表示你有看過檔案。",
        text: "看到你最近寫「" + clip(user.moments[0].text, 16) + "」，後來怎麼樣了？"
      });
    }

    if (!rows.length) {
      rows.push({
        why: "對方檔案還不完整時，用配對時看到的共同點。",
        text: "我們都喜歡" + (peer.shared || "聊天") + "。你最近一次是什麼時候？"
      });
    }

    return uniqueTexts(rows);
  }

  global.ChatAI = {
    findUser: findUser,
    suggestReplies: suggestReplies,
    suggestIcebreakers: suggestIcebreakers
  };
})(window);

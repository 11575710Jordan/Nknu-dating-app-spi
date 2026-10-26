/* =========================================================
   模擬聊天資料（純前端 demo，沒有資料庫）
   - c-u01-* 由聊天頁原本寫死在 chat.js 的對話搬過來，其餘為 demo 補充；對象資料一律從 MOCK_DB.users 讀
   - u09 刻意沒有任何對話，用來示範訊息頁的空狀態
   - 時間用「幾分鐘前」記錄，第一次載入時由 ChatStore.seed() 換成實際時間，demo 時永遠是近期的對話
   - 能聊天的前提是雙方關係分數達 60%（見 MOCK_DB.ratings），tests/chat-store.test.js 會檢查
   欄位說明：
     conversations[].members              兩位成員的用戶 id
     conversations[].createdMinutesAgo    對話建立（配對分數達門檻）的時間
     conversations[].lastReadMinutesAgo   每位成員最後讀取的時間，用來算未讀數
     conversations[].messages[]           { from, text, minutesAgo }
   ========================================================= */
const MOCK_CHATS = {
    "conversations": [
        {
            "id": "c-u01-u08",
            "members": ["u01", "u08"],
            "createdMinutesAgo": 4320,
            "lastReadMinutesAgo": { "u01": 24, "u08": 23 },
            "messages": [
                { "from": "u08", "text": "嗨，看到你也常去柴山，下週末有空嗎", "minutesAgo": 25 },
                { "from": "u01", "text": "有！週六下午可以", "minutesAgo": 24 },
                { "from": "u08", "text": "那家拉麵我週六也想去！", "minutesAgo": 22 }
            ]
        },
        {
            "id": "c-u01-u03",
            "members": ["u01", "u03"],
            "createdMinutesAgo": 5760,
            "lastReadMinutesAgo": { "u01": 1472, "u03": 1472 },
            "messages": [
                { "from": "u03", "text": "你檔案裡那間咖啡店我也去過，窗邊位子很好坐", "minutesAgo": 1490 },
                { "from": "u01", "text": "對，週末常常客滿，要早一點去", "minutesAgo": 1482 },
                { "from": "u03", "text": "那明天下午要不要去坐一下？", "minutesAgo": 1478 },
                { "from": "u01", "text": "好啊，那就約下午三點", "minutesAgo": 1472 }
            ]
        },
        {
            "id": "c-u01-u04",
            "members": ["u01", "u04"],
            "createdMinutesAgo": 7200,
            "lastReadMinutesAgo": { "u01": 4306, "u04": 4310 },
            "messages": [
                { "from": "u04", "text": "你那張和豆花的合照好可愛", "minutesAgo": 4316 },
                { "from": "u01", "text": "牠看到鏡頭會裝沒事，平常很瘋", "minutesAgo": 4310 },
                { "from": "u04", "text": "哈哈我也養了兩隻橘貓", "minutesAgo": 4306 }
            ]
        },
        {
            "id": "c-u02-u10",
            "members": ["u02", "u10"],
            "createdMinutesAgo": 4400,
            "lastReadMinutesAgo": { "u02": 2880, "u10": 93 },
            "messages": [
                { "from": "u10", "text": "你上次說的那間有窗的咖啡店，是在鹽埕嗎？", "minutesAgo": 2900 },
                { "from": "u02", "text": "對！在大溝頂旁邊，二樓窗邊超好拍", "minutesAgo": 2880 },
                { "from": "u10", "text": "週末駁二有新展，要不要一起去看完再去喝？", "minutesAgo": 95 },
                { "from": "u10", "text": "我可以順便帶速寫本～", "minutesAgo": 93 }
            ]
        },
        {
            "id": "c-u03-u06",
            "members": ["u03", "u06"],
            "createdMinutesAgo": 4500,
            "lastReadMinutesAgo": { "u03": 120, "u06": 2985 },
            "messages": [
                { "from": "u06", "text": "上次你推薦的電影我去看了，結局真的沒想到", "minutesAgo": 3000 },
                { "from": "u03", "text": "對吧！我第一次看也愣住", "minutesAgo": 2990 },
                { "from": "u06", "text": "我們研究室週五晚上有桌遊團，你要不要來玩？", "minutesAgo": 2985 },
                { "from": "u03", "text": "好啊！我會帶自己烤的餅乾", "minutesAgo": 120 }
            ]
        },
        {
            "id": "c-u04-u07",
            "members": ["u04", "u07"],
            "createdMinutesAgo": 5000,
            "lastReadMinutesAgo": { "u04": 290, "u07": 285 },
            "messages": [
                { "from": "u07", "text": "橘子跟橘寶是兄弟嗎？好可愛", "minutesAgo": 4400 },
                { "from": "u04", "text": "對，橘寶是去年撿到的，現在比哥哥還兇", "minutesAgo": 4390 },
                { "from": "u07", "text": "週日要不要一起去鳳山市場？我想學你的番茄燉牛肉", "minutesAgo": 300 },
                { "from": "u04", "text": "可以！我週日剛好休假", "minutesAgo": 290 },
                { "from": "u07", "text": "那九點在市場口見～", "minutesAgo": 285 }
            ]
        },
        {
            "id": "c-u05-u08",
            "members": ["u05", "u08"],
            "createdMinutesAgo": 3000,
            "lastReadMinutesAgo": { "u05": 39, "u08": 1445 },
            "messages": [
                { "from": "u08", "text": "我也想學衝浪，初學者要準備什麼？", "minutesAgo": 1460 },
                { "from": "u05", "text": "先租一塊軟板就好，我可以當你的教練哈哈", "minutesAgo": 1450 },
                { "from": "u08", "text": "那我負責露營煮飯，下次墾丁衝浪加露營？", "minutesAgo": 1445 },
                { "from": "u05", "text": "成交！可可也要一起去", "minutesAgo": 40 },
                { "from": "u05", "text": "牠超愛沙灘", "minutesAgo": 39 }
            ]
        },
        {
            "id": "c-u11-u14",
            "members": ["u11", "u14"],
            "createdMinutesAgo": 7000,
            "lastReadMinutesAgo": { "u11": 200, "u14": 4970 },
            "messages": [
                { "from": "u14", "text": "看您喜歡合唱，我年輕時也在船上唱歌", "minutesAgo": 5000 },
                { "from": "u11", "text": "真的嗎？都唱些什麼歌呢？", "minutesAgo": 4980 },
                { "from": "u14", "text": "多半是〈港都夜雨〉，船員們最愛", "minutesAgo": 4970 },
                { "from": "u11", "text": "我們合唱團下個月要表演，歡迎您來聽", "minutesAgo": 200 }
            ]
        },
        {
            "id": "c-u12-u13",
            "members": ["u12", "u13"],
            "createdMinutesAgo": 7200,
            "lastReadMinutesAgo": { "u12": 1500, "u13": 1490 },
            "messages": [
                { "from": "u13", "text": "你平常都泡什麼茶呀？", "minutesAgo": 6000 },
                { "from": "u12", "text": "多半是凍頂烏龍，偶爾喝點東方美人", "minutesAgo": 5990 },
                { "from": "u13", "text": "改天來店裡，我請你吃蘿蔔糕配茶", "minutesAgo": 5980 },
                { "from": "u12", "text": "好啊，週三早上方便嗎？", "minutesAgo": 1500 },
                { "from": "u13", "text": "方便，我留一份給你", "minutesAgo": 1490 }
            ]
        }
    ]
};

if (typeof module !== 'undefined') module.exports = MOCK_CHATS;
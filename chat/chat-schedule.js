/* Shared calendar demo data and local browser storage for chat conversations. */
(function (global) {
    var STORAGE_KEY = "nknu-chat-schedule-v1";
    var DAY = 86400000;
    var MOCK_SCHEDULE_TEMPLATES = [
        { title: "一起喝咖啡", location: "高雄市・咖啡店", dayOffset: 3, hour: 15 },
        { title: "週末散步", location: "愛河沿岸", dayOffset: 7, hour: 16 },
        { title: "找間餐廳吃晚餐", location: "高雄市・餐廳", dayOffset: 12, hour: 18 }
    ];

    function readAll() {
        try {
            return JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}");
        } catch (err) {
            return {};
        }
    }

    function writeAll(data) {
        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (err) {
            return false;
        }
    }

    function seed(conversationId, peerName, now, random) {
        now = now || new Date();
        random = random || Math.random;
        return MOCK_SCHEDULE_TEMPLATES.map(function (template, index) {
            var date = new Date(now.getTime() + (template.dayOffset + Math.floor(random() * 4)) * DAY);
            date.setHours(template.hour, 0, 0, 0);
            return {
                id: conversationId + "-seed-" + (index + 1),
                conversationId: conversationId,
                title: template.title,
                location: template.location,
                startsAt: date.toISOString(),
                createdBy: "demo",
                with: peerName || "聊天對象"
            };
        });
    }

    function list(conversationId, peerName) {
        var all = readAll();
        if (!Array.isArray(all[conversationId])) {
            all[conversationId] = seed(conversationId, peerName);
            writeAll(all);
        }
        return all[conversationId].slice().sort(function (a, b) {
            return a.startsAt.localeCompare(b.startsAt);
        });
    }

    function add(conversationId, event) {
        if (!conversationId) throw new Error("請先選擇聊天室");
        var title = String(event && event.title || "").trim();
        var startsAt = new Date(event && event.startsAt);
        if (!title) throw new Error("請輸入行程名稱");
        if (isNaN(startsAt.getTime())) throw new Error("請選擇有效的日期與時間");
        var all = readAll();
        var item = {
            id: "event-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
            conversationId: conversationId,
            title: title,
            location: String(event.location || "").trim(),
            startsAt: startsAt.toISOString(),
            createdBy: event.createdBy || ""
        };
        all[conversationId] = (Array.isArray(all[conversationId]) ? all[conversationId] : []).concat(item);
        if (!writeAll(all)) throw new Error("無法儲存行程，請確認瀏覽器儲存空間");
        return item;
    }

    global.ChatSchedule = {
        STORAGE_KEY: STORAGE_KEY,
        MOCK_SCHEDULE_TEMPLATES: MOCK_SCHEDULE_TEMPLATES,
        seed: seed,
        list: list,
        add: add
    };
    if (typeof module !== "undefined") module.exports = global.ChatSchedule;
})(typeof window !== "undefined" ? window : globalThis);

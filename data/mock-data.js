/* =========================================================
   模擬後端資料（純前端 demo，沒有資料庫）
   - 以 <script> 載入，直接雙擊 HTML 就能用（避開 file:// 的 fetch 限制）
   - 內容維持 JSON 格式，之後要換成真的 API 只要把這個物件改成 fetch 回來的結果
   欄位說明：
     users[].gender         'female' | 'male'
     users[].lookingFor     想認識的性別 'female' | 'male' | 'all'
     users[].lat / lng      位置（高雄市），用來算距離
     users[].photo          照片網址；null 時顯示名字最後一字
     users[].photoTone      沒照片時的底色 0~3
     users[].pets[].size    '小型' | '中型' | '大型'
     ratings[]              其他用戶已經給出的評分（kind: 'person' | 'pet'）
                            from / to 在 kind='pet' 時是寵物 id
   ========================================================= */
const MOCK_DB = {
  "currentUserId": "u01",
  "users": [
    {
      "id": "u01", "name": "陳彥廷", "gender": "male", "age": 28, "height": 176, "zodiac": "獅子座",
      "area": "高雄市苓雅區", "lat": 22.6252, "lng": 120.3150,
      "job": "軟體工程師", "jobCategory": "科技", "school": "國立高雄師範大學", "education": "碩士",
      "relationshipGoal": "長期關係", "drinking": "社交場合", "smoking": "不抽菸",
      "lookingFor": "female", "verified": true, "online": true,
      "interests": ["登山", "手沖咖啡", "攝影", "桌遊"],
      "prompts": [{ "q": "理想的週末是", "a": "早上爬柴山，下午找間咖啡店把沒看完的書看完。" }],
      "photo": null, "photoTone": 0,
      "pets": [
        { "id": "p01", "name": "豆花", "species": "狗", "breed": "柴犬", "gender": "公", "age": 3, "size": "中型",
          "personality": ["親人", "愛散步", "貪吃"], "appearance": "赤柴、捲尾巴", "bio": "看到飼料袋會原地轉三圈。", "photo": null }
      ]
    },
    {
      "id": "u02", "name": "林予晴", "gender": "female", "age": 27, "height": 162, "zodiac": "雙魚座",
      "area": "高雄市新興區", "lat": 22.6273, "lng": 120.3014,
      "job": "室內設計師", "jobCategory": "設計", "school": "國立成功大學", "education": "學士",
      "relationshipGoal": "長期關係", "drinking": "偶爾", "smoking": "不抽菸",
      "lookingFor": "all", "verified": true, "online": false,
      "interests": ["登山", "手沖咖啡", "底片攝影", "看展"],
      "prompts": [{ "q": "我最近迷上", "a": "用底片機拍早餐店，老闆都以為我是記者。" }],
      "photo": null, "photoTone": 1,
      "pets": [
        { "id": "p02", "name": "麻糬", "species": "貓", "breed": "米克斯", "gender": "母", "age": 2, "size": "小型",
          "personality": ["獨立", "愛撒嬌"], "appearance": "白底灰斑", "bio": "只在半夜十二點撒嬌。", "photo": null }
      ]
    },
    {
      "id": "u03", "name": "許安琪", "gender": "female", "age": 25, "height": 158, "zodiac": "處女座",
      "area": "高雄市三民區", "lat": 22.6545, "lng": 120.3035,
      "job": "國小老師", "jobCategory": "教育", "school": "國立高雄師範大學", "education": "學士",
      "relationshipGoal": "還在探索", "drinking": "不喝酒", "smoking": "不抽菸",
      "lookingFor": "male", "verified": true, "online": true,
      "interests": ["烘焙", "閱讀", "瑜珈", "電影"],
      "prompts": [{ "q": "和我約會一定要", "a": "陪我去一次誠品，然後聽我介紹三本書。" }],
      "photo": null, "photoTone": 2,
      "pets": []
    },
    {
      "id": "u04", "name": "黃維倫", "gender": "male", "age": 31, "height": 180, "zodiac": "天蠍座",
      "area": "高雄市三民區", "lat": 22.6461, "lng": 120.3094,
      "job": "護理師", "jobCategory": "醫療", "school": "高雄醫學大學", "education": "學士",
      "relationshipGoal": "長期關係", "drinking": "偶爾", "smoking": "不抽菸",
      "lookingFor": "female", "verified": false, "online": true,
      "interests": ["健身", "電影", "料理", "貓"],
      "prompts": [{ "q": "我的拿手菜", "a": "番茄燉牛肉，燉四小時那種。" }],
      "photo": null, "photoTone": 3,
      "pets": [
        { "id": "p03", "name": "橘子", "species": "貓", "breed": "橘貓", "gender": "公", "age": 4, "size": "中型",
          "personality": ["貪吃", "親人"], "appearance": "橘色虎斑、圓臉", "bio": "體重是牠最大的秘密。", "photo": null },
        { "id": "p04", "name": "橘寶", "species": "貓", "breed": "橘貓", "gender": "公", "age": 1, "size": "小型",
          "personality": ["活潑", "好奇"], "appearance": "淺橘色、長尾巴", "bio": "會跟著哥哥橘子一起偷吃。", "photo": null }
      ]
    },
    {
      "id": "u05", "name": "張芸瑄", "gender": "female", "age": 29, "height": 165, "zodiac": "射手座",
      "area": "高雄市鼓山區", "lat": 22.6270, "lng": 120.2660,
      "job": "行銷企劃", "jobCategory": "行銷", "school": "國立中山大學", "education": "碩士",
      "relationshipGoal": "長期關係", "drinking": "社交場合", "smoking": "不抽菸",
      "lookingFor": "male", "verified": true, "online": false,
      "interests": ["衝浪", "旅行", "手沖咖啡", "音樂祭"],
      "prompts": [{ "q": "今年一定要做的事", "a": "去墾丁衝浪一次站起來超過五秒。" }],
      "photo": null, "photoTone": 1,
      "pets": [
        { "id": "p05", "name": "可可", "species": "狗", "breed": "玩具貴賓", "gender": "母", "age": 5, "size": "小型",
          "personality": ["活潑", "親人", "愛散步"], "appearance": "巧克力色捲毛", "bio": "去西子灣會自己找陰影躺。", "photo": null }
      ]
    },
    {
      "id": "u06", "name": "王宥翔", "gender": "male", "age": 26, "height": 172, "zodiac": "雙子座",
      "area": "高雄市燕巢區", "lat": 22.7305, "lng": 120.4060,
      "job": "研究生", "jobCategory": "學生", "school": "國立高雄師範大學", "education": "碩士在學",
      "relationshipGoal": "還在探索", "drinking": "不喝酒", "smoking": "不抽菸",
      "lookingFor": "female", "verified": false, "online": true,
      "interests": ["桌遊", "動漫", "羽球", "攝影"],
      "prompts": [{ "q": "別人對我的第一印象", "a": "很安靜，熟了之後會一直講桌遊規則。" }],
      "photo": null, "photoTone": 0,
      "pets": []
    },
    {
      "id": "u07", "name": "李心妤", "gender": "female", "age": 32, "height": 168, "zodiac": "金牛座",
      "area": "高雄市苓雅區", "lat": 22.6120, "lng": 120.3000,
      "job": "藥師", "jobCategory": "醫療", "school": "高雄醫學大學", "education": "學士",
      "relationshipGoal": "以結婚為前提", "drinking": "偶爾", "smoking": "不抽菸",
      "lookingFor": "male", "verified": true, "online": false,
      "interests": ["瑜珈", "閱讀", "旅行", "料理"],
      "prompts": [{ "q": "我在找的人", "a": "願意一起逛傳統市場、回家一起煮飯的人。" }],
      "photo": null, "photoTone": 2,
      "pets": [
        { "id": "p06", "name": "奶茶", "species": "狗", "breed": "黃金獵犬", "gender": "母", "age": 6, "size": "大型",
          "personality": ["溫和", "親人"], "appearance": "淺金色長毛", "bio": "最喜歡把頭靠在人腿上。", "photo": null }
      ]
    },
    {
      "id": "u08", "name": "吳承恩", "gender": "male", "age": 34, "height": 178, "zodiac": "摩羯座",
      "area": "高雄市楠梓區", "lat": 22.7250, "lng": 120.3150,
      "job": "機械工程師", "jobCategory": "製造", "school": "國立高雄科技大學", "education": "碩士",
      "relationshipGoal": "長期關係", "drinking": "社交場合", "smoking": "不抽菸",
      "lookingFor": "female", "verified": true, "online": false,
      "interests": ["露營", "登山", "釣魚", "料理"],
      "prompts": [{ "q": "最近一次冒險", "a": "帶黑糖去南橫露營，結果牠比我還早睡。" }],
      "photo": null, "photoTone": 3,
      "pets": [
        { "id": "p07", "name": "黑糖", "species": "狗", "breed": "拉布拉多", "gender": "公", "age": 4, "size": "大型",
          "personality": ["活潑", "愛玩水", "親人"], "appearance": "全黑短毛", "bio": "看到水就會衝，不管多冷。", "photo": null }
      ]
    },
    {
      "id": "u09", "name": "周品妤", "gender": "female", "age": 23, "height": 160, "zodiac": "水瓶座",
      "area": "高雄市苓雅區", "lat": 22.6240, "lng": 120.3170,
      "job": "大學生", "jobCategory": "學生", "school": "國立高雄師範大學", "education": "大學在學",
      "relationshipGoal": "先當朋友", "drinking": "不喝酒", "smoking": "不抽菸",
      "lookingFor": "male", "verified": false, "online": true,
      "interests": ["動漫", "桌遊", "手作", "電影"],
      "prompts": [{ "q": "我的冷知識", "a": "兔子開心的時候會在空中扭一下，叫做 binky。" }],
      "photo": null, "photoTone": 1,
      "pets": [
        { "id": "p08", "name": "QQ", "species": "兔", "breed": "荷蘭侏儒兔", "gender": "母", "age": 1, "size": "小型",
          "personality": ["膽小", "愛撒嬌"], "appearance": "灰白色、垂耳", "bio": "聽到塑膠袋聲音會立刻出現。", "photo": null }
      ]
    },
    {
      "id": "u10", "name": "蔡欣怡", "gender": "female", "age": 30, "height": 163, "zodiac": "天秤座",
      "area": "高雄市前鎮區", "lat": 22.6000, "lng": 120.3080,
      "job": "平面設計師", "jobCategory": "設計", "school": "實踐大學", "education": "學士",
      "relationshipGoal": "長期關係", "drinking": "偶爾", "smoking": "不抽菸",
      "lookingFor": "female", "verified": true, "online": true,
      "interests": ["插畫", "手沖咖啡", "看展", "貓"],
      "prompts": [{ "q": "一起去哪裡約會", "a": "駁二看展，然後在旁邊的倉庫咖啡坐到天黑。" }],
      "photo": null, "photoTone": 2,
      "pets": [
        { "id": "p09", "name": "芝麻", "species": "貓", "breed": "英國短毛貓", "gender": "母", "age": 3, "size": "中型",
          "personality": ["獨立", "安靜"], "appearance": "藍灰色短毛、金色眼睛", "bio": "只會在你工作時坐到鍵盤上。", "photo": null }
      ]
    },
    {
      "id": "u11", "name": "林秀蘭", "gender": "female", "age": 68, "height": 155, "zodiac": "巨蟹座",
      "area": "高雄市鳳山區", "lat": 22.6230, "lng": 120.3480,
      "job": "退休國中老師", "jobCategory": "退休", "school": "國立高雄師範大學", "education": "學士",
      "relationshipGoal": "找個伴", "drinking": "不喝酒", "smoking": "不抽菸",
      "lookingFor": "male", "verified": true, "online": true,
      "interests": ["太極拳", "園藝", "合唱", "旅行"],
      "prompts": [{ "q": "我每天早上", "a": "六點去衛武營打太極拳，打完喝一碗豆漿。" }],
      "photo": null, "photoTone": 0,
      "pets": [
        { "id": "p10", "name": "小白", "species": "狗", "breed": "馬爾濟斯", "gender": "母", "age": 8, "size": "小型",
          "personality": ["溫和", "安靜"], "appearance": "全白長毛", "bio": "每天陪我去公園，最愛曬太陽。", "photo": null }
      ]
    },
    {
      "id": "u12", "name": "陳文雄", "gender": "male", "age": 70, "height": 168, "zodiac": "牡羊座",
      "area": "高雄市鳳山區", "lat": 22.6270, "lng": 120.3570,
      "job": "退休公務員", "jobCategory": "退休", "school": "國立成功大學", "education": "學士",
      "relationshipGoal": "找個伴", "drinking": "偶爾", "smoking": "不抽菸",
      "lookingFor": "female", "verified": true, "online": false,
      "interests": ["登山", "書法", "泡茶", "園藝"],
      "prompts": [{ "q": "我想找的人", "a": "願意一起去澄清湖散步、聊聊天的朋友。" }],
      "photo": null, "photoTone": 3,
      "pets": []
    },
    {
      "id": "u13", "name": "王美惠", "gender": "female", "age": 66, "height": 157, "zodiac": "獅子座",
      "area": "高雄市三民區", "lat": 22.6700, "lng": 120.3050,
      "job": "早餐店老闆娘", "jobCategory": "餐飲", "school": "高雄高商", "education": "高中職",
      "relationshipGoal": "找個伴", "drinking": "不喝酒", "smoking": "不抽菸",
      "lookingFor": "male", "verified": false, "online": true,
      "interests": ["料理", "跳舞", "唱歌", "泡茶"],
      "prompts": [{ "q": "我的拿手菜", "a": "蘿蔔糕，街坊鄰居過年都跟我訂。" }],
      "photo": null, "photoTone": 1,
      "pets": [
        { "id": "p11", "name": "阿福", "species": "狗", "breed": "米克斯", "gender": "公", "age": 7, "size": "中型",
          "personality": ["看家", "親人"], "appearance": "黃色短毛、立耳", "bio": "早餐店的招牌店狗，客人都認識牠。", "photo": null }
      ]
    },
    {
      "id": "u14", "name": "李國榮", "gender": "male", "age": 72, "height": 170, "zodiac": "水瓶座",
      "area": "高雄市旗津區", "lat": 22.6150, "lng": 120.2800,
      "job": "退休船長", "jobCategory": "退休", "school": "國立臺灣海洋大學", "education": "學士",
      "relationshipGoal": "找個伴", "drinking": "偶爾", "smoking": "不抽菸",
      "lookingFor": "female", "verified": true, "online": false,
      "interests": ["釣魚", "下棋", "泡茶", "散步"],
      "prompts": [{ "q": "我最驕傲的事", "a": "跑船三十年，去過四十幾個國家，每個港口都有故事。" }],
      "photo": null, "photoTone": 2,
      "pets": [
        { "id": "p12", "name": "旺財", "species": "狗", "breed": "台灣犬", "gender": "公", "age": 5, "size": "中型",
          "personality": ["忠心", "看家", "愛散步"], "appearance": "黑色短毛、舌頭有斑", "bio": "每天傍晚陪我在旗津海邊走一圈。", "photo": null }
      ]
    }
  ],
  "ratings": [
    { "kind": "person", "from": "u02", "to": "u01", "points": 15, "messageUsed": true, "message": "你照片裡那條步道是哪裡？看起來好美" },
    { "kind": "person", "from": "u05", "to": "u01", "points": 10, "messageUsed": true, "message": "同樣喜歡手沖，有推薦的豆子嗎？" },
    { "kind": "person", "from": "u09", "to": "u01", "points": 5, "messageUsed": true, "message": "" },
    { "kind": "person", "from": "u07", "to": "u04", "points": 20, "messageUsed": true, "message": "橘子跟橘寶是兄弟嗎？好可愛" },
    { "kind": "person", "from": "u03", "to": "u06", "points": 5, "messageUsed": true, "message": "我也超愛玩桌遊！" },
    { "kind": "person", "from": "u10", "to": "u02", "points": 20, "messageUsed": true, "message": "我們好像常去同一間咖啡店" },
    { "kind": "person", "from": "u11", "to": "u12", "points": 20, "messageUsed": true, "message": "週末要不要一起去澄清湖走走？" },
    { "kind": "person", "from": "u13", "to": "u12", "points": 10, "messageUsed": true, "message": "你平常都泡什麼茶呀？" },
    { "kind": "person", "from": "u14", "to": "u11", "points": 10, "messageUsed": true, "message": "看您喜歡合唱，我年輕時也在船上唱歌" },
    { "kind": "pet", "from": "p05", "to": "p01", "points": 10, "messageUsed": true, "message": "可可想找豆花一起去衛武營跑跑" },
    { "kind": "pet", "from": "p06", "to": "p01", "points": 5, "messageUsed": true, "message": "" },
    { "kind": "pet", "from": "p10", "to": "p12", "points": 10, "messageUsed": true, "message": "小白想認識旺財，一起曬太陽" }
  ]
};

if (typeof module !== 'undefined') module.exports = MOCK_DB;

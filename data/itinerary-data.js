/* =========================================================
   AI 規劃行程 — 景點資料庫（純前端模擬資料）
   - 全部是高雄市真實地名，純粹作為 demo 內容，不含任何商家評價或真人資訊
   - area 盡量對齊 data/mock-data.js 使用者檔案裡出現的行政區（鼓山區、旗津區、
     苓雅區、新興區、三民區、前鎮區、鳳山區、楠梓區、燕巢區），另外加了鹽埕區
   - tags 對應下面的 INTERESTS 清單，ai-itinerary.js 會比對使用者勾選的興趣
   - timeSlots 是這個景點「比較適合」的時段，不是唯一能去的時段
   - budgetLevel：free（免費）／low（平價消費，數十到兩百元左右）／mid（中等消費，一餐或門票級）
   ========================================================= */
const ItineraryData = (() => {
  const AREAS = ['鼓山區', '旗津區', '苓雅區', '新興區', '三民區', '前鎮區', '鹽埕區', '鳳山區', '楠梓區', '燕巢區'];

  const INTERESTS = ['登山', '海邊', '夜景', '美食小吃', '攝影', '文化歷史', '散步放鬆', '秘境自然', '音樂藝術'];

  const SPOTS = [
    { id: 'chaishan', name: '柴山系統步道', area: '鼓山區', tags: ['登山', '秘境自然', '散步放鬆'], petFriendly: true, budgetLevel: 'free', timeSlots: ['早上', '下午'], note: '熱門登山步道，沿路能看猴群與港景，適合早上輕裝出發。' },
    { id: 'cijin-bay', name: '西子灣', area: '鼓山區', tags: ['海邊', '夜景', '攝影'], petFriendly: true, budgetLevel: 'free', timeSlots: ['下午', '晚上'], note: '看夕陽的經典地點，傍晚光線很適合拍照。' },
    { id: 'british-consulate', name: '打狗英國領事館文化園區', area: '鼓山區', tags: ['文化歷史', '攝影', '夜景'], petFriendly: false, budgetLevel: 'low', timeSlots: ['下午', '晚上'], note: '歷史建築配海景，傍晚燈亮起來氣氛很好。' },
    { id: 'cijin-coast-park', name: '旗津海岸公園', area: '旗津區', tags: ['海邊', '散步放鬆'], petFriendly: true, budgetLevel: 'free', timeSlots: ['早上', '下午', '晚上'], note: '沙灘、堤岸步道，吹海風聊天的好地方。' },
    { id: 'cijin-rainbow-church', name: '旗津彩虹教堂', area: '旗津區', tags: ['攝影', '海邊'], petFriendly: true, budgetLevel: 'free', timeSlots: ['下午'], note: '彩色拱門造景，是拍照打卡常去的小景點。' },
    { id: 'cijin-lighthouse', name: '旗後燈塔', area: '旗津區', tags: ['夜景', '攝影', '秘境自然'], petFriendly: true, budgetLevel: 'free', timeSlots: ['晚上'], note: '爬上山丘看夜景，人比西子灣少一些，比較安靜。' },
    { id: 'weiwuying', name: '衛武營國家藝術文化中心', area: '苓雅區', tags: ['音樂藝術', '文化歷史', '攝影'], petFriendly: true, budgetLevel: 'free', timeSlots: ['下午', '晚上'], note: '建築本身就很好拍，戶外榕樹廣場可以散步聊天。' },
    { id: 'central-park', name: '中央公園', area: '苓雅區', tags: ['散步放鬆', '秘境自然'], petFriendly: true, budgetLevel: 'free', timeSlots: ['早上', '下午', '晚上'], note: '市區裡的綠地，人流放鬆、方便帶寵物散步。' },
    { id: 'liuhe-night-market', name: '六合觀光夜市', area: '新興區', tags: ['美食小吃', '夜景'], petFriendly: false, budgetLevel: 'low', timeSlots: ['晚上'], note: '傳統夜市小吃，適合晚餐邊吃邊逛慢慢聊。' },
    { id: 'literature-museum', name: '高雄文學館', area: '新興區', tags: ['文化歷史', '散步放鬆'], petFriendly: false, budgetLevel: 'free', timeSlots: ['早上', '下午'], note: '安靜的展館與庭園，適合喜歡閱讀氣氛的約會。' },
    { id: 'love-river-heart', name: '愛河之心', area: '三民區', tags: ['夜景', '散步放鬆', '攝影'], petFriendly: true, budgetLevel: 'free', timeSlots: ['晚上'], note: '愛心形狀的河岸造景，晚上燈光倒映很浪漫。' },
    { id: 'sanfeng-street', name: '三鳳中街', area: '三民區', tags: ['美食小吃', '文化歷史'], petFriendly: false, budgetLevel: 'low', timeSlots: ['早上', '下午'], note: '南北貨與小吃老街，適合白天走走吃吃。' },
    { id: 'kmpc', name: '高雄流行音樂中心', area: '前鎮區', tags: ['音樂藝術', '夜景', '攝影'], petFriendly: true, budgetLevel: 'free', timeSlots: ['下午', '晚上'], note: '港邊特殊建築，傍晚配夕陽跟夜景都很好拍。' },
    { id: 'pier2', name: '駁二藝術特區', area: '鹽埕區', tags: ['攝影', '音樂藝術', '文化歷史'], petFriendly: true, budgetLevel: 'low', timeSlots: ['下午', '晚上'], note: '倉庫改建的藝術園區，常有展覽跟市集，適合慢慢逛。' },
    { id: 'fengyi-academy', name: '鳳儀書院', area: '鳳山區', tags: ['文化歷史', '攝影'], petFriendly: false, budgetLevel: 'low', timeSlots: ['早上', '下午'], note: '清代書院建築，適合喜歡古蹟跟拍照的人。' },
    { id: 'fengshan-memorial', name: '鳳山行啟紀念館', area: '鳳山區', tags: ['文化歷史', '攝影'], petFriendly: false, budgetLevel: 'free', timeSlots: ['早上', '下午'], note: '日式老建築，人比較少，可以安靜拍照散步。' },
    { id: 'yuanzhonggang', name: '援中港濕地公園', area: '楠梓區', tags: ['秘境自然', '散步放鬆', '攝影'], petFriendly: true, budgetLevel: 'free', timeSlots: ['早上', '下午', '晚上'], note: '濕地生態公園，遊客較少，適合喜歡安靜自然景的人。' },
    { id: 'yanchao-mud-volcano', name: '燕巢滾水坪泥火山', area: '燕巢區', tags: ['秘境自然', '登山'], petFriendly: true, budgetLevel: 'free', timeSlots: ['早上', '下午'], note: '特殊地質景觀，比較少人知道的秘境路線。' },
  ];

  return { AREAS, INTERESTS, SPOTS };
})();

if (typeof module !== 'undefined') module.exports = ItineraryData;

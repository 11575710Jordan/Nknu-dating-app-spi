/* =========================================================
   模擬後端資料（純前端 demo，沒有資料庫）
   - 以 <script> 載入，直接雙擊 HTML 就能用（避開 file:// 的 fetch 限制）
   - 內容維持 JSON 格式，之後要換成真的 API 只要把這個物件改成 fetch 回來的結果
   欄位說明：
     users[].email          登入帳號 u01@nknu-demo.app 格式；password 皆為 demo1234（僅供 demo）
     users[].gender         'female' | 'male'
     users[].lat / lng      位置（高雄市），用來算距離
     users[].photos[]       多張照片 { src, caption }；src 為 null 時顯示佔位圖與說明
     users[].moments[]      動態（需用點數解鎖才看得到）{ date, text }
     users[].points         初始點數
     users[].photoTone      沒照片時的底色 0~3
     users[].pets[].size    '小型' | '中型' | '大型'；寵物同樣有 photos[] 與 moments[]
     ratings[]              其他用戶已經給出的評分（kind: 'person' | 'pet'）
                            from / to 在 kind='pet' 時是寵物 id
   ========================================================= */
const MOCK_DB = {
  "currentUserId": "u01",
  "users": [
    {
      "id": "u01",
      "name": "陳彥廷",
      "email": "u01@nknu-demo.app",
      "password": "demo1234",
      "gender": "male",
      "age": 28,
      "height": 176,
      "zodiac": "獅子座",
      "area": "高雄市苓雅區",
      "lat": 22.6252,
      "lng": 120.315,
      "job": "軟體工程師",
      "jobCategory": "科技",
      "school": "國立高雄師範大學",
      "education": "碩士",
      "relationshipGoal": "長期關係",
      "drinking": "社交場合",
      "smoking": "不抽菸",
      "verified": true,
      "online": true,
      "interests": [
        "登山",
        "手沖咖啡",
        "攝影",
        "桌遊"
      ],
      "prompts": [
        {
          "q": "理想的週末是",
          "a": "早上爬柴山，下午找間咖啡店把沒看完的書看完。"
        },
        {
          "q": "我最近迷上",
          "a": "研究不同產地的咖啡豆，最喜歡衣索比亞的花香。"
        }
      ],
      "photoTone": 0,
      "pets": [
        {
          "id": "p01",
          "name": "豆花",
          "species": "狗",
          "breed": "柴犬",
          "gender": "公",
          "age": 3,
          "size": "中型",
          "personality": [
            "親人",
            "愛散步",
            "貪吃"
          ],
          "appearance": "赤柴、捲尾巴",
          "bio": "看到飼料袋會原地轉三圈。",
          "photos": [
            {
              "src": null,
              "caption": "豆花吐舌頭"
            },
            {
              "src": null,
              "caption": "河堤散步"
            }
          ],
          "moments": [
            {
              "date": "2026-09-24",
              "text": "今天在柴山遇到猴子，豆花嚇到躲到我後面。"
            }
          ]
        }
      ],
      "points": 40,
      "photos": [
        {
          "src": null,
          "caption": "柴山步道的清晨"
        },
        {
          "src": null,
          "caption": "手沖咖啡吧台"
        },
        {
          "src": null,
          "caption": "和豆花在河堤"
        }
      ],
      "moments": [
        {
          "date": "2026-09-24",
          "text": "週末去柴山，終於拍到獼猴跟豆花對看的畫面。"
        },
        {
          "date": "2026-09-18",
          "text": "新買的手搖磨豆機，第一杯就失敗了，太細。"
        }
      ]
    },
    {
      "id": "u02",
      "name": "林予晴",
      "email": "u02@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 27,
      "height": 162,
      "zodiac": "雙魚座",
      "area": "高雄市新興區",
      "lat": 22.6273,
      "lng": 120.3014,
      "job": "室內設計師",
      "jobCategory": "設計",
      "school": "國立成功大學",
      "education": "學士",
      "relationshipGoal": "長期關係",
      "drinking": "偶爾",
      "smoking": "不抽菸",
      "verified": true,
      "online": false,
      "interests": [
        "登山",
        "手沖咖啡",
        "底片攝影",
        "看展"
      ],
      "prompts": [
        {
          "q": "我最近迷上",
          "a": "用底片機拍早餐店，老闆都以為我是記者。"
        },
        {
          "q": "理想的週末是",
          "a": "早上去柴山走一圈，下午找一間有窗的咖啡店看書。"
        }
      ],
      "photoTone": 1,
      "pets": [
        {
          "id": "p02",
          "name": "麻糬",
          "species": "貓",
          "breed": "米克斯",
          "gender": "母",
          "age": 2,
          "size": "小型",
          "personality": [
            "獨立",
            "愛撒嬌"
          ],
          "appearance": "白底灰斑",
          "bio": "只在半夜十二點撒嬌。",
          "photos": [
            {
              "src": null,
              "caption": "麻糬伸懶腰"
            },
            {
              "src": null,
              "caption": "窗邊發呆"
            }
          ],
          "moments": [
            {
              "date": "2026-09-19",
              "text": "午夜撒嬌時間準時開始。"
            }
          ]
        }
      ],
      "points": 120,
      "photos": [
        {
          "src": null,
          "caption": "底片機自拍"
        },
        {
          "src": null,
          "caption": "駁二看展"
        },
        {
          "src": null,
          "caption": "麻糬在窗邊"
        }
      ],
      "moments": [
        {
          "date": "2026-09-23",
          "text": "這卷底片終於沖出來了，早餐店老闆那張最好看。"
        },
        {
          "date": "2026-09-15",
          "text": "設計案結案，獎勵自己一杯手沖。"
        },
        {
          "date": "2026-09-02",
          "text": "麻糬今天又把盆栽推下去了。"
        }
      ]
    },
    {
      "id": "u03",
      "name": "許安琪",
      "email": "u03@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 25,
      "height": 158,
      "zodiac": "處女座",
      "area": "高雄市三民區",
      "lat": 22.6545,
      "lng": 120.3035,
      "job": "國小老師",
      "jobCategory": "教育",
      "school": "國立高雄師範大學",
      "education": "學士",
      "relationshipGoal": "還在探索",
      "drinking": "不喝酒",
      "smoking": "不抽菸",
      "verified": true,
      "online": true,
      "interests": [
        "烘焙",
        "閱讀",
        "瑜珈",
        "電影"
      ],
      "prompts": [
        {
          "q": "和我約會一定要",
          "a": "陪我去一次誠品，然後聽我介紹三本書。"
        },
        {
          "q": "最近在讀",
          "a": "《小王子》重讀第五次，每次都看到不一樣的東西。"
        }
      ],
      "photoTone": 2,
      "pets": [],
      "points": 60,
      "photos": [
        {
          "src": null,
          "caption": "教室佈置"
        },
        {
          "src": null,
          "caption": "烘焙成品"
        }
      ],
      "moments": [
        {
          "date": "2026-09-22",
          "text": "學生送我一張畫，說我長得像哆啦A夢。"
        },
        {
          "date": "2026-09-10",
          "text": "第一次烤可頌，層次出來了！"
        }
      ]
    },
    {
      "id": "u04",
      "name": "黃維倫",
      "email": "u04@nknu-demo.app",
      "password": "demo1234",
      "gender": "male",
      "age": 31,
      "height": 180,
      "zodiac": "天蠍座",
      "area": "高雄市三民區",
      "lat": 22.6461,
      "lng": 120.3094,
      "job": "護理師",
      "jobCategory": "醫療",
      "school": "高雄醫學大學",
      "education": "學士",
      "relationshipGoal": "長期關係",
      "drinking": "偶爾",
      "smoking": "不抽菸",
      "verified": false,
      "online": true,
      "interests": [
        "健身",
        "電影",
        "料理",
        "貓"
      ],
      "prompts": [
        {
          "q": "我的拿手菜",
          "a": "番茄燉牛肉，燉四小時那種。"
        },
        {
          "q": "上完大夜班後",
          "a": "一定要吃一碗熱湯麵，再抱著橘子睡到中午。"
        }
      ],
      "photoTone": 3,
      "pets": [
        {
          "id": "p03",
          "name": "橘子",
          "species": "貓",
          "breed": "橘貓",
          "gender": "公",
          "age": 4,
          "size": "中型",
          "personality": [
            "貪吃",
            "親人"
          ],
          "appearance": "橘色虎斑、圓臉",
          "bio": "體重是牠最大的秘密。",
          "photos": [
            {
              "src": null,
              "caption": "橘子的圓臉"
            },
            {
              "src": null,
              "caption": "橘子睡覺"
            }
          ],
          "moments": [
            {
              "date": "2026-09-16",
              "text": "偷吃橘寶的飯被抓到。"
            }
          ]
        },
        {
          "id": "p04",
          "name": "橘寶",
          "species": "貓",
          "breed": "橘貓",
          "gender": "公",
          "age": 1,
          "size": "小型",
          "personality": [
            "活潑",
            "好奇"
          ],
          "appearance": "淺橘色、長尾巴",
          "bio": "會跟著哥哥橘子一起偷吃。",
          "photos": [
            {
              "src": null,
              "caption": "橘寶探險"
            },
            {
              "src": null,
              "caption": "橘寶和逗貓棒"
            }
          ],
          "moments": [
            {
              "date": "2026-09-18",
              "text": "第一次跳上冰箱，下不來。"
            }
          ]
        }
      ],
      "points": 30,
      "photos": [
        {
          "src": null,
          "caption": "健身房"
        },
        {
          "src": null,
          "caption": "番茄燉牛肉"
        },
        {
          "src": null,
          "caption": "橘子和橘寶"
        }
      ],
      "moments": [
        {
          "date": "2026-09-21",
          "text": "大夜班下班，橘子在門口等我。"
        },
        {
          "date": "2026-09-12",
          "text": "燉了四小時的牛肉，同事說可以開店。"
        }
      ]
    },
    {
      "id": "u05",
      "name": "張芸瑄",
      "email": "u05@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 29,
      "height": 165,
      "zodiac": "射手座",
      "area": "高雄市鼓山區",
      "lat": 22.627,
      "lng": 120.266,
      "job": "行銷企劃",
      "jobCategory": "行銷",
      "school": "國立中山大學",
      "education": "碩士",
      "relationshipGoal": "長期關係",
      "drinking": "社交場合",
      "smoking": "不抽菸",
      "verified": true,
      "online": false,
      "interests": [
        "衝浪",
        "旅行",
        "手沖咖啡",
        "音樂祭"
      ],
      "prompts": [
        {
          "q": "今年一定要做的事",
          "a": "去墾丁衝浪一次站起來超過五秒。"
        },
        {
          "q": "最想一起去的地方",
          "a": "墾丁南灣看日出，然後在海邊吃早餐。"
        }
      ],
      "photoTone": 1,
      "pets": [
        {
          "id": "p05",
          "name": "可可",
          "species": "狗",
          "breed": "玩具貴賓",
          "gender": "母",
          "age": 5,
          "size": "小型",
          "personality": [
            "活潑",
            "親人",
            "愛散步"
          ],
          "appearance": "巧克力色捲毛",
          "bio": "去西子灣會自己找陰影躺。",
          "photos": [
            {
              "src": null,
              "caption": "可可在沙灘"
            },
            {
              "src": null,
              "caption": "可可穿雨衣"
            }
          ],
          "moments": [
            {
              "date": "2026-09-20",
              "text": "在西子灣找到最愛的陰影位置。"
            }
          ]
        }
      ],
      "points": 200,
      "photos": [
        {
          "src": null,
          "caption": "墾丁衝浪"
        },
        {
          "src": null,
          "caption": "音樂祭"
        },
        {
          "src": null,
          "caption": "可可在西子灣"
        }
      ],
      "moments": [
        {
          "date": "2026-09-20",
          "text": "今天站起來 3 秒，離目標又近了一點。"
        },
        {
          "date": "2026-09-06",
          "text": "大港開唱買好票了，有人要一起嗎？"
        }
      ]
    },
    {
      "id": "u06",
      "name": "王宥翔",
      "email": "u06@nknu-demo.app",
      "password": "demo1234",
      "gender": "male",
      "age": 26,
      "height": 172,
      "zodiac": "雙子座",
      "area": "高雄市燕巢區",
      "lat": 22.7305,
      "lng": 120.406,
      "job": "研究生",
      "jobCategory": "學生",
      "school": "國立高雄師範大學",
      "education": "碩士在學",
      "relationshipGoal": "還在探索",
      "drinking": "不喝酒",
      "smoking": "不抽菸",
      "verified": false,
      "online": true,
      "interests": [
        "桌遊",
        "動漫",
        "羽球",
        "攝影"
      ],
      "prompts": [
        {
          "q": "別人對我的第一印象",
          "a": "很安靜，熟了之後會一直講桌遊規則。"
        },
        {
          "q": "最近在玩的桌遊",
          "a": "卡坦島和璀璨寶石，輸了會一直想再來一局。"
        }
      ],
      "photoTone": 0,
      "pets": [],
      "points": 10,
      "photos": [
        {
          "src": null,
          "caption": "桌遊聚會"
        },
        {
          "src": null,
          "caption": "羽球場"
        }
      ],
      "moments": [
        {
          "date": "2026-09-19",
          "text": "論文進度 30%，先來一場卡坦島。"
        }
      ]
    },
    {
      "id": "u07",
      "name": "李心妤",
      "email": "u07@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 32,
      "height": 168,
      "zodiac": "金牛座",
      "area": "高雄市苓雅區",
      "lat": 22.612,
      "lng": 120.3,
      "job": "藥師",
      "jobCategory": "醫療",
      "school": "高雄醫學大學",
      "education": "學士",
      "relationshipGoal": "以結婚為前提",
      "drinking": "偶爾",
      "smoking": "不抽菸",
      "verified": true,
      "online": false,
      "interests": [
        "瑜珈",
        "閱讀",
        "旅行",
        "料理"
      ],
      "prompts": [
        {
          "q": "我在找的人",
          "a": "願意一起逛傳統市場、回家一起煮飯的人。"
        },
        {
          "q": "我的週日儀式",
          "a": "早上瑜珈、中午煮一鍋湯、晚上帶奶茶去河堤散步。"
        }
      ],
      "photoTone": 2,
      "pets": [
        {
          "id": "p06",
          "name": "奶茶",
          "species": "狗",
          "breed": "黃金獵犬",
          "gender": "母",
          "age": 6,
          "size": "大型",
          "personality": [
            "溫和",
            "親人"
          ],
          "appearance": "淺金色長毛",
          "bio": "最喜歡把頭靠在人腿上。",
          "photos": [
            {
              "src": null,
              "caption": "奶茶的笑臉"
            },
            {
              "src": null,
              "caption": "奶茶靠腿"
            }
          ],
          "moments": [
            {
              "date": "2026-09-11",
              "text": "六歲生日快樂！吃了一整塊狗蛋糕。"
            }
          ]
        }
      ],
      "points": 80,
      "photos": [
        {
          "src": null,
          "caption": "瑜珈課"
        },
        {
          "src": null,
          "caption": "傳統市場"
        },
        {
          "src": null,
          "caption": "奶茶的笑臉"
        }
      ],
      "moments": [
        {
          "date": "2026-09-24",
          "text": "週日去鳳山市場買菜，老闆多送我一把蔥。"
        },
        {
          "date": "2026-09-11",
          "text": "奶茶六歲生日，買了狗狗蛋糕。"
        }
      ]
    },
    {
      "id": "u08",
      "name": "吳承恩",
      "email": "u08@nknu-demo.app",
      "password": "demo1234",
      "gender": "male",
      "age": 34,
      "height": 178,
      "zodiac": "摩羯座",
      "area": "高雄市楠梓區",
      "lat": 22.725,
      "lng": 120.315,
      "job": "機械工程師",
      "jobCategory": "製造",
      "school": "國立高雄科技大學",
      "education": "碩士",
      "relationshipGoal": "長期關係",
      "drinking": "社交場合",
      "smoking": "不抽菸",
      "verified": true,
      "online": false,
      "interests": [
        "露營",
        "登山",
        "釣魚",
        "料理"
      ],
      "prompts": [
        {
          "q": "最近一次冒險",
          "a": "帶黑糖去南橫露營，結果牠比我還早睡。"
        },
        {
          "q": "我的拿手菜",
          "a": "露營時用荷蘭鍋燉的番茄牛肉，連黑糖都想偷吃。"
        }
      ],
      "photoTone": 3,
      "pets": [
        {
          "id": "p07",
          "name": "黑糖",
          "species": "狗",
          "breed": "拉布拉多",
          "gender": "公",
          "age": 4,
          "size": "大型",
          "personality": [
            "活潑",
            "愛玩水",
            "親人"
          ],
          "appearance": "全黑短毛",
          "bio": "看到水就會衝，不管多冷。",
          "photos": [
            {
              "src": null,
              "caption": "黑糖玩水"
            },
            {
              "src": null,
              "caption": "黑糖在帳篷"
            }
          ],
          "moments": [
            {
              "date": "2026-09-17",
              "text": "溪水好冰，但還是要衝。"
            }
          ]
        }
      ],
      "points": 50,
      "photos": [
        {
          "src": null,
          "caption": "南橫露營"
        },
        {
          "src": null,
          "caption": "釣到的魚"
        },
        {
          "src": null,
          "caption": "黑糖玩水"
        }
      ],
      "moments": [
        {
          "date": "2026-09-17",
          "text": "黑糖在溪邊玩到不想回家。"
        },
        {
          "date": "2026-09-03",
          "text": "新帳篷到貨，下週去試搭。"
        }
      ]
    },
    {
      "id": "u09",
      "name": "周品妤",
      "email": "u09@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 23,
      "height": 160,
      "zodiac": "水瓶座",
      "area": "高雄市苓雅區",
      "lat": 22.624,
      "lng": 120.317,
      "job": "大學生",
      "jobCategory": "學生",
      "school": "國立高雄師範大學",
      "education": "大學在學",
      "relationshipGoal": "先當朋友",
      "drinking": "不喝酒",
      "smoking": "不抽菸",
      "verified": false,
      "online": true,
      "interests": [
        "動漫",
        "桌遊",
        "手作",
        "電影"
      ],
      "prompts": [
        {
          "q": "我的冷知識",
          "a": "兔子開心的時候會在空中扭一下，叫做 binky。"
        },
        {
          "q": "最近在做的手作",
          "a": "用黏土捏 QQ 的公仔，已經捏壞三隻了。"
        }
      ],
      "photoTone": 1,
      "pets": [
        {
          "id": "p08",
          "name": "QQ",
          "species": "兔",
          "breed": "荷蘭侏儒兔",
          "gender": "母",
          "age": 1,
          "size": "小型",
          "personality": [
            "膽小",
            "愛撒嬌"
          ],
          "appearance": "灰白色、垂耳",
          "bio": "聽到塑膠袋聲音會立刻出現。",
          "photos": [
            {
              "src": null,
              "caption": "QQ 垂耳"
            },
            {
              "src": null,
              "caption": "QQ 吃草"
            }
          ],
          "moments": [
            {
              "date": "2026-09-25",
              "text": "聽到塑膠袋聲，三秒內出現。"
            }
          ]
        }
      ],
      "points": 15,
      "photos": [
        {
          "src": null,
          "caption": "動漫展"
        },
        {
          "src": null,
          "caption": "手作飾品"
        },
        {
          "src": null,
          "caption": "QQ 在草地"
        }
      ],
      "moments": [
        {
          "date": "2026-09-25",
          "text": "QQ 今天 binky 了三次，好開心。"
        },
        {
          "date": "2026-09-14",
          "text": "手作耳環在市集賣完了！"
        }
      ]
    },
    {
      "id": "u10",
      "name": "蔡欣怡",
      "email": "u10@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 30,
      "height": 163,
      "zodiac": "天秤座",
      "area": "高雄市前鎮區",
      "lat": 22.6,
      "lng": 120.308,
      "job": "平面設計師",
      "jobCategory": "設計",
      "school": "實踐大學",
      "education": "學士",
      "relationshipGoal": "長期關係",
      "drinking": "偶爾",
      "smoking": "不抽菸",
      "verified": true,
      "online": true,
      "interests": [
        "插畫",
        "手沖咖啡",
        "看展",
        "貓"
      ],
      "prompts": [
        {
          "q": "一起去哪裡約會",
          "a": "駁二看展，然後在旁邊的倉庫咖啡坐到天黑。"
        },
        {
          "q": "我最近迷上",
          "a": "畫高雄老街的轉角，特別是傍晚的光。"
        }
      ],
      "photoTone": 2,
      "pets": [
        {
          "id": "p09",
          "name": "芝麻",
          "species": "貓",
          "breed": "英國短毛貓",
          "gender": "母",
          "age": 3,
          "size": "中型",
          "personality": [
            "獨立",
            "安靜"
          ],
          "appearance": "藍灰色短毛、金色眼睛",
          "bio": "只會在你工作時坐到鍵盤上。",
          "photos": [
            {
              "src": null,
              "caption": "芝麻金色眼睛"
            },
            {
              "src": null,
              "caption": "芝麻坐鍵盤"
            }
          ],
          "moments": [
            {
              "date": "2026-09-08",
              "text": "今天又幫忙「修改」了一份檔案。"
            }
          ]
        }
      ],
      "points": 90,
      "photos": [
        {
          "src": null,
          "caption": "插畫工作桌"
        },
        {
          "src": null,
          "caption": "看展"
        },
        {
          "src": null,
          "caption": "芝麻坐鍵盤"
        }
      ],
      "moments": [
        {
          "date": "2026-09-22",
          "text": "新的插畫系列完成，主題是高雄的巷弄。"
        },
        {
          "date": "2026-09-08",
          "text": "芝麻又坐在繪圖板上了。"
        }
      ]
    },
    {
      "id": "u11",
      "name": "林秀蘭",
      "email": "u11@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 68,
      "height": 155,
      "zodiac": "巨蟹座",
      "area": "高雄市鳳山區",
      "lat": 22.623,
      "lng": 120.348,
      "job": "退休國中老師",
      "jobCategory": "退休",
      "school": "國立高雄師範大學",
      "education": "學士",
      "relationshipGoal": "找個伴",
      "drinking": "不喝酒",
      "smoking": "不抽菸",
      "verified": true,
      "online": true,
      "interests": [
        "太極拳",
        "園藝",
        "合唱",
        "旅行"
      ],
      "prompts": [
        {
          "q": "我每天早上",
          "a": "六點去衛武營打太極拳，打完喝一碗豆漿。"
        },
        {
          "q": "我的拿手菜",
          "a": "鳳梨苦瓜雞湯，孫子每次回來都指定要喝。"
        }
      ],
      "photoTone": 0,
      "pets": [
        {
          "id": "p10",
          "name": "小白",
          "species": "狗",
          "breed": "馬爾濟斯",
          "gender": "母",
          "age": 8,
          "size": "小型",
          "personality": [
            "溫和",
            "安靜"
          ],
          "appearance": "全白長毛",
          "bio": "每天陪我去公園，最愛曬太陽。",
          "photos": [
            {
              "src": null,
              "caption": "小白曬太陽"
            },
            {
              "src": null,
              "caption": "小白在公園"
            }
          ],
          "moments": [
            {
              "date": "2026-09-09",
              "text": "在衛武營的草地上睡著了。"
            }
          ]
        }
      ],
      "points": 70,
      "photos": [
        {
          "src": null,
          "caption": "衛武營太極拳"
        },
        {
          "src": null,
          "caption": "合唱團演出"
        },
        {
          "src": null,
          "caption": "小白曬太陽"
        }
      ],
      "moments": [
        {
          "date": "2026-09-23",
          "text": "合唱團下個月要去台南表演，大家都很期待。"
        },
        {
          "date": "2026-09-09",
          "text": "陽台的茉莉花開了，好香。"
        }
      ]
    },
    {
      "id": "u12",
      "name": "陳文雄",
      "email": "u12@nknu-demo.app",
      "password": "demo1234",
      "gender": "male",
      "age": 70,
      "height": 168,
      "zodiac": "牡羊座",
      "area": "高雄市鳳山區",
      "lat": 22.627,
      "lng": 120.357,
      "job": "退休公務員",
      "jobCategory": "退休",
      "school": "國立成功大學",
      "education": "學士",
      "relationshipGoal": "找個伴",
      "drinking": "偶爾",
      "smoking": "不抽菸",
      "verified": true,
      "online": false,
      "interests": [
        "登山",
        "書法",
        "泡茶",
        "園藝"
      ],
      "prompts": [
        {
          "q": "我想找的人",
          "a": "願意一起去澄清湖散步、聊聊天的朋友。"
        },
        {
          "q": "年輕時的夢想",
          "a": "想當書法老師，退休後終於在社區大學開課了。"
        }
      ],
      "photoTone": 3,
      "pets": [],
      "points": 45,
      "photos": [
        {
          "src": null,
          "caption": "澄清湖散步"
        },
        {
          "src": null,
          "caption": "書法作品"
        }
      ],
      "moments": [
        {
          "date": "2026-09-21",
          "text": "今天寫了「知足常樂」四個字，送給老朋友。"
        },
        {
          "date": "2026-09-05",
          "text": "澄清湖的九曲橋，走了四十年還是很喜歡。"
        }
      ]
    },
    {
      "id": "u13",
      "name": "王美惠",
      "email": "u13@nknu-demo.app",
      "password": "demo1234",
      "gender": "female",
      "age": 66,
      "height": 157,
      "zodiac": "獅子座",
      "area": "高雄市三民區",
      "lat": 22.67,
      "lng": 120.305,
      "job": "早餐店老闆娘",
      "jobCategory": "餐飲",
      "school": "高雄高商",
      "education": "高中職",
      "relationshipGoal": "找個伴",
      "drinking": "不喝酒",
      "smoking": "不抽菸",
      "verified": false,
      "online": true,
      "interests": [
        "料理",
        "跳舞",
        "唱歌",
        "泡茶"
      ],
      "prompts": [
        {
          "q": "我的拿手菜",
          "a": "蘿蔔糕，街坊鄰居過年都跟我訂。"
        },
        {
          "q": "理想的約會",
          "a": "一起去市場買菜，回家煮一桌菜配老歌。"
        }
      ],
      "photoTone": 1,
      "pets": [
        {
          "id": "p11",
          "name": "阿福",
          "species": "狗",
          "breed": "米克斯",
          "gender": "公",
          "age": 7,
          "size": "中型",
          "personality": [
            "看家",
            "親人"
          ],
          "appearance": "黃色短毛、立耳",
          "bio": "早餐店的招牌店狗，客人都認識牠。",
          "photos": [
            {
              "src": null,
              "caption": "阿福顧店"
            },
            {
              "src": null,
              "caption": "阿福和客人"
            }
          ],
          "moments": [
            {
              "date": "2026-09-13",
              "text": "客人帶了肉乾給阿福，尾巴搖不停。"
            }
          ]
        }
      ],
      "points": 35,
      "photos": [
        {
          "src": null,
          "caption": "早餐店"
        },
        {
          "src": null,
          "caption": "跳舞班"
        },
        {
          "src": null,
          "caption": "阿福顧店"
        }
      ],
      "moments": [
        {
          "date": "2026-09-24",
          "text": "今天的蘿蔔糕十點就賣完了。"
        },
        {
          "date": "2026-09-13",
          "text": "社區跳舞班學了新的曲子。"
        }
      ]
    },
    {
      "id": "u14",
      "name": "李國榮",
      "email": "u14@nknu-demo.app",
      "password": "demo1234",
      "gender": "male",
      "age": 72,
      "height": 170,
      "zodiac": "水瓶座",
      "area": "高雄市旗津區",
      "lat": 22.615,
      "lng": 120.28,
      "job": "退休船長",
      "jobCategory": "退休",
      "school": "國立臺灣海洋大學",
      "education": "學士",
      "relationshipGoal": "找個伴",
      "drinking": "偶爾",
      "smoking": "不抽菸",
      "verified": true,
      "online": false,
      "interests": [
        "釣魚",
        "下棋",
        "泡茶",
        "散步"
      ],
      "prompts": [
        {
          "q": "我最驕傲的事",
          "a": "跑船三十年，去過四十幾個國家，每個港口都有故事。"
        },
        {
          "q": "想帶你去的地方",
          "a": "旗津的燈塔，那裡看夕陽是全高雄最美的。"
        }
      ],
      "photoTone": 2,
      "pets": [
        {
          "id": "p12",
          "name": "旺財",
          "species": "狗",
          "breed": "台灣犬",
          "gender": "公",
          "age": 5,
          "size": "中型",
          "personality": [
            "忠心",
            "看家",
            "愛散步"
          ],
          "appearance": "黑色短毛、舌頭有斑",
          "bio": "每天傍晚陪我在旗津海邊走一圈。",
          "photos": [
            {
              "src": null,
              "caption": "旺財看海"
            },
            {
              "src": null,
              "caption": "旺財守門"
            }
          ],
          "moments": [
            {
              "date": "2026-09-20",
              "text": "陪主人在旗津看夕陽。"
            }
          ]
        }
      ],
      "points": 55,
      "photos": [
        {
          "src": null,
          "caption": "旗津海邊"
        },
        {
          "src": null,
          "caption": "年輕時的船"
        },
        {
          "src": null,
          "caption": "旺財散步"
        }
      ],
      "moments": [
        {
          "date": "2026-09-20",
          "text": "在旗津看夕陽，想起以前停靠過的港口。"
        },
        {
          "date": "2026-09-07",
          "text": "和老朋友下棋，連贏三盤。"
        }
      ]
    }
  ],
  "ratings": [
    {
      "kind": "person",
      "from": "u02",
      "to": "u01",
      "points": 20,
      "messageUsed": true,
      "message": "你照片裡那條步道是哪裡？看起來好美"
    },
    {
      "kind": "person",
      "from": "u05",
      "to": "u01",
      "points": 10,
      "messageUsed": true,
      "message": "同樣喜歡手沖，有推薦的豆子嗎？"
    },
    {
      "kind": "person",
      "from": "u09",
      "to": "u01",
      "points": 5,
      "messageUsed": true,
      "message": ""
    },
    {
      "kind": "person",
      "from": "u07",
      "to": "u04",
      "points": 30,
      "messageUsed": true,
      "message": "橘子跟橘寶是兄弟嗎？好可愛"
    },
    {
      "kind": "person",
      "from": "u03",
      "to": "u06",
      "points": 30,
      "messageUsed": true,
      "message": "我也超愛玩桌遊！"
    },
    {
      "kind": "person",
      "from": "u10",
      "to": "u02",
      "points": 30,
      "messageUsed": true,
      "message": "我們好像常去同一間咖啡店"
    },
    {
      "kind": "person",
      "from": "u11",
      "to": "u12",
      "points": 20,
      "messageUsed": true,
      "message": "週末要不要一起去澄清湖走走？"
    },
    {
      "kind": "person",
      "from": "u13",
      "to": "u12",
      "points": 25,
      "messageUsed": true,
      "message": "你平常都泡什麼茶呀？"
    },
    {
      "kind": "person",
      "from": "u14",
      "to": "u11",
      "points": 25,
      "messageUsed": true,
      "message": "看您喜歡合唱，我年輕時也在船上唱歌"
    },
    {
      "kind": "pet",
      "from": "p05",
      "to": "p01",
      "points": 10,
      "messageUsed": true,
      "message": "可可想找豆花一起去衛武營跑跑"
    },
    {
      "kind": "pet",
      "from": "p06",
      "to": "p01",
      "points": 5,
      "messageUsed": true,
      "message": ""
    },
    {
      "kind": "pet",
      "from": "p10",
      "to": "p12",
      "points": 10,
      "messageUsed": true,
      "message": "小白想認識旺財，一起曬太陽"
    },
    {
      "kind": "person",
      "from": "u01",
      "to": "u08",
      "points": 30,
      "messageUsed": true,
      "message": "週末一起去柴山嗎？"
    },
    {
      "kind": "person",
      "from": "u08",
      "to": "u01",
      "points": 30,
      "messageUsed": true,
      "message": "看到你也常去柴山，下次一起！"
    },
    {
      "kind": "person",
      "from": "u01",
      "to": "u03",
      "points": 40,
      "messageUsed": true,
      "message": "你推薦的書我也想看"
    },
    {
      "kind": "person",
      "from": "u03",
      "to": "u01",
      "points": 25,
      "messageUsed": true,
      "message": "你常去的咖啡店我也去過"
    },
    {
      "kind": "person",
      "from": "u01",
      "to": "u04",
      "points": 30,
      "messageUsed": true,
      "message": "橘子跟橘寶好可愛"
    },
    {
      "kind": "person",
      "from": "u04",
      "to": "u01",
      "points": 30,
      "messageUsed": true,
      "message": "你和豆花的合照好可愛"
    },
    {
      "kind": "person",
      "from": "u02",
      "to": "u10",
      "points": 30,
      "messageUsed": true,
      "message": "你畫的老街轉角我都有去過！"
    },
    {
      "kind": "person",
      "from": "u06",
      "to": "u03",
      "points": 35,
      "messageUsed": true,
      "message": "你推薦的電影我上週去看了"
    },
    {
      "kind": "person",
      "from": "u04",
      "to": "u07",
      "points": 35,
      "messageUsed": true,
      "message": "週日也想去河堤散步"
    },
    {
      "kind": "person",
      "from": "u05",
      "to": "u08",
      "points": 30,
      "messageUsed": true,
      "message": "你的荷蘭鍋牛肉看起來好好吃"
    },
    {
      "kind": "person",
      "from": "u08",
      "to": "u05",
      "points": 35,
      "messageUsed": true,
      "message": "我也想學衝浪，可以教我嗎？"
    },
    {
      "kind": "person",
      "from": "u11",
      "to": "u14",
      "points": 40,
      "messageUsed": true,
      "message": "旗津的燈塔我好久沒去了"
    },
    {
      "kind": "person",
      "from": "u12",
      "to": "u13",
      "points": 35,
      "messageUsed": true,
      "message": "你的蘿蔔糕我想訂一份"
    },
    {
      "kind": "person",
      "from": "u06",
      "to": "u09",
      "points": 15,
      "messageUsed": true,
      "message": "你也喜歡桌遊！下次一起去桌遊店？"
    },
    {
      "kind": "person",
      "from": "u08",
      "to": "u07",
      "points": 20,
      "messageUsed": true,
      "message": "看到你也喜歡料理，有推薦的市場嗎？"
    },
    {
      "kind": "person",
      "from": "u04",
      "to": "u05",
      "points": 15,
      "messageUsed": true,
      "message": "衝浪聽起來好酷，初學者會很難嗎？"
    },
    {
      "kind": "person",
      "from": "u14",
      "to": "u13",
      "points": 15,
      "messageUsed": true,
      "message": "早餐店的阿福好可愛"
    },
    {
      "kind": "pet",
      "from": "p07",
      "to": "p05",
      "points": 15,
      "messageUsed": true,
      "message": "黑糖想和可可去西子灣玩水"
    },
    {
      "kind": "pet",
      "from": "p11",
      "to": "p10",
      "points": 10,
      "messageUsed": true,
      "message": "阿福想認識小白，一起曬太陽"
    },
    {
      "kind": "pet",
      "from": "p03",
      "to": "p09",
      "points": 10,
      "messageUsed": true,
      "message": ""
    }
  ]
};

if (typeof module !== 'undefined') module.exports = MOCK_DB;

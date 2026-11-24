# M11475701｜交友軟體自動偵測功能

**分支：** `M11475701@自動偵測`  
**GitHub 專案：** `11575710Jordan/Nknu-dating-app-spi`  
**範圍：** 圖片安全偵測、文字安全偵測、聊天情緒偵測（課堂展示原型）

## 一、開發範圍

本次程式直接沿用團隊既有的 `chat`、`data`、`js`、`pages`、`testCase`、`tests` 資料夾，不新增功能專屬資料夾，也不修改登入、配對、會員資料模型與全站主題樣式。

| 功能 | 檔案 | 行為 |
|---|---|---|
| 文字安全警示 | `chat/text-safety.js` | 正規化文字，檢查個資與可疑投資／匯款／假客服訊息 |
| 聊天情緒預測 | `chat/emotion-detect.js` | 規則式分析開心、難過、生氣、中性、混合情緒 |
| 指定圖片偵測 | `js/image-safety.js` | SHA-256 檔案比對，命中三張固定模擬詐騙圖時阻止上傳 |
| 個人資料照片檢查 | `js/profile-image-guard.js`、`pages/profile-settings.html` | 原個人照片頁的上傳前攔截 |
| 聊天室功能整合 | `chat/chat.js`、`chat/chat.css`、`pages/chat.html` | 聊天輸入、上傳圖片、送出前風險提醒及情緒標籤 |
| 獨立測試頁 | `pages/auto-detection-test.html` | 直接雙擊 HTML 測試三項功能 |
| 自動測試 | `tests/*test.js` | 搭配 Node.js `node --test` 執行 |
| 測試案例文件 | `testCase/M11475701_test_cases.md` | 對應 Lab 1 測試條件與預期結果 |

## 二、如何手動驗證

在完整的團隊交友軟體專案根目錄，可直接用 Edge 雙擊：

- `pages/auto-detection-test.html`：測試文字、情緒、圖片
- `pages/chat.html`：實測聊天訊息、情緒分類、照片附件與風險警告
- `pages/profile-settings.html`：實測上傳個人照片攔截

注意：本上傳包**只包含本次新增／修改的檔案**。單獨解壓縮後沒有所有組員的原始程式，若要測試原聊天室，需要與完整專案的本機副本合併；不要覆蓋其他組員的 GitHub 分支。

### A. 文字安全偵測

| 輸入 | 預期 |
|---|---|
| `我的手機是0912345678` | 個資警告 |
| `我昨天去銀行匯款繳學費` | 正常 |
| `保 證 獲 利，請先匯款` | 疑似投資詐騙警告 |
| `週末想一起去看電影嗎？` | 正常 |

聊天室按「傳送」後，命中規則時會先提示；確認傳送後可顯示風險標記，並提供**本機模擬**接收方提醒。

### B. 指定圖片偵測

在 `pages/auto-detection-test.html` 或聊天室圖片上傳按鈕，選擇 `data` 裡的三張原始 PNG：

- `scam_investment.png` → 投資詐騙警告
- `scam_fake_support.png` → 假客服警告
- `scam_romance.png` → 戀愛借錢警告
- 其他一般照片 → 沒有命中指定檔案

檔案名稱變更仍可命中；**重新存圖、截圖、裁切、壓縮**後指紋會不同，不保證命中。未命中不等於照片安全。

### C. 聊天情緒偵測

| 輸入 | 預期分類 |
|---|---|
| `今天真的很開心，認識你真好！` | 開心 |
| `我今天心情很不好，真的很難過。` | 難過 |
| `你怎麼可以這樣？我真的很生氣！` | 生氣 |
| `我們明天下午三點見。` | 中性 |
| `你好` | 中性 |
| 空白內容 | 無有效文字 |

聊天室上方「聊天情緒偵測」可以查看當前對話的分類結果與數量；此功能不會替使用者做心理診斷。

**測試指令提醒：** 目前團隊原有 `package.json` 的 `npm test` 指向 `node --test tests/`，部分 Node.js 版本無法將資料夾當作測試入口。請直接執行 `node --test`；本次未修改團隊原有 `package.json`。

## 三、提供給整合組員的注意事項

### 共用檔案（合併時需人工對照）

- `chat/chat.js`
- `chat/chat.css`
- `pages/chat.html`
- `pages/profile-settings.html`

其他分支也可能更新聊天室流程與 UI，請整合者以**三方合併與逐段比較**方式保留聊天儲存、登入狀態、配對及通知等功能，不建議直接用本分支的共用檔案覆蓋其他同學版本。

### 獨立模組（較容易移植）

- `chat/text-safety.js`
- `chat/emotion-detect.js`
- `js/image-safety.js`
- `js/profile-image-guard.js`
- `data/scam_*.png`

### 程式載入順序

`pages/chat.html` 須先載入 `chat/text-safety.js`、`chat/emotion-detect.js`、`js/image-safety.js`，再載入 `chat/chat.js`，避免找不到功能物件。

`pages/profile-settings.html` 須先載入 `js/image-safety.js`、`js/profile-image-guard.js`，再載入既有 `js/profile-settings.js`。

## 四、實作性質與限制

- 圖片：**固定圖片 SHA-256 比對**，非 OCR 或 AI 內容辨識。
- 文字：關鍵字與格式規則，可能誤判與漏判。
- 情緒：關鍵字加權規則式原型，**非已訓練的 AI／ML 模型**。
- 資料與聊天流程：前端教學 Demo，尚未實作真正跨裝置同步或正式後端審核。
- 安全警告旨在提醒而非判斷詐騙的法律事實。

## 五、GitHub 提交方式

1. 進入 `M11475701@自動偵測` 分支的**根目錄**。
2. 選 `Add file` → `Upload files`。
3. 解壓後將 `chat`、`data`、`js`、`pages`、`tests`、`testCase` 資料夾及本檔案拖曳進去（**不要把 ZIP 當檔案上傳**）。
4. 確認路徑如 `pages/chat.html`，不要出現額外一層 `M11475701.../` 或 `Nknu-dating-app-spi-main/`。
5. Commit message：`M11475701: Add image text and emotion detection`。
6. 只提交到自己的分支，不修改 `main`，交由負責整合的組員合併。

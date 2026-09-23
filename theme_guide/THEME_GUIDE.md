# Dating POC 主題規範 v0.1

## 0. 檔案說明

| 檔案 | 用途 | 誰會改 |
|---|---|---|
| `theme.json` | Design Tokens 唯一真實來源（色彩、字體、間距、圓角、陰影、動畫、斷點） | 主題負責人 |
| `theme.css` | 由 token 轉成的 CSS 變數 + 共用元件 class | 主題負責人 |
| `THEME_GUIDE.md` | 本文件：使用規則、元件規範、文案語氣 | 主題負責人 |
| `preview.html` | 視覺樣板，所有元件的實際樣子（已內嵌 theme.css） | 改完 theme.css 後重新產生 |

每個頁面的做法：`<head>` 引入 Google Fonts 與 `theme.css`，頁面專屬樣式另外寫在 `pages/xxx.css`。

## 1. 三條鐵律

1. **只用變數**：頁面 CSS 不得出現色碼、px 間距、字級數字，一律 `var(--*)`。需要新值時提出，由主題負責人加 token。
2. **只用 `dp-` 元件**：已有的元件不得在頁面內重寫一份。要改外觀就改 `theme.css`，所有頁面一起生效。
3. **頁面 class 加頁面前綴**：例如探索頁用 `discover-`、聊天頁用 `chat-`，避免多人命名衝突。命名規則採 BEM：`.dp-profile-card__photo`、`.dp-btn--primary`。

## 2. 風格方向

溫暖真誠（B）為底、熱情活力（A）為點綴。以李子紫墨色與暖白建立沉穩、可信任的底色，**珊瑚到杏桃的漸層只留給「喜歡／配對」等情感動作**，讓整個介面最搶眼的永遠是使用者的心動按鈕。

整套系統只有一個「大膽」的地方：配對動作按鈕（漸層 + 彈跳動畫）與配對成功彈窗。其他元件保持安靜。

## 3. 色彩使用

| 角色 | Token | 用在哪 | 禁止 |
|---|---|---|---|
| 文字主色 | `--text-primary` (plum-900) | 標題、內文 | 用純黑 #000 |
| 次要文字 | `--text-secondary` (mist-600) | 說明、時間、副標 | 用在按鈕文字 |
| 主要按鈕 | `--action-primary-bg` (coral-600) | 每個畫面最重要的一個動作 | 一個畫面超過一顆 |
| 次要按鈕 | `--action-secondary-bg` (plum-100) | 查看、編輯等一般動作 | — |
| 喜歡 | `--emotion-like`（漸層） | 喜歡按鈕、配對成功 | 用在一般按鈕或背景裝飾 |
| 超級喜歡 | `--emotion-super-like` (apricot-500) | 超級喜歡按鈕 | — |
| 略過 | `--emotion-pass` (plum-500) | 略過按鈕 | 用紅色表示略過 |
| 在線／驗證 | `--state-online` / `--state-verified` (sage) | 在線圓點、已驗證標籤 | 用在成功以外的語意 |
| 錯誤 | `--status-danger` | 表單錯誤、上傳失敗 | 與珊瑚色混用 |

對比度已檢查：主要按鈕白字 4.66:1、次要文字 6.22:1，皆符合 WCAG AA。`--text-placeholder`（4.13:1）只能用在 placeholder 與 16px 以上的輔助文字。

## 4. 字體

| 層級 | 桌機 | 手機 | 字族 | 用途 |
|---|---|---|---|---|
| display | 40px | 32px | 霞鶩文楷 | 登入頁、歡迎頁大標 |
| h1 | 32px | 26px | 霞鶩文楷 | 頁面標題、檔案卡姓名 |
| h2 | 24px | 22px | 霞鶩文楷 | 區塊標題、彈窗標題 |
| h3 | 20px | 18px | 思源黑體 粗 | 卡片標題、側欄標題 |
| body-lg | 18px | 17px | 思源黑體 | 個人問答的回答 |
| body | 16px | 16px | 思源黑體 | 一般內文 |
| sm | 14px | 14px | 思源黑體 | 說明、標籤 |
| xs | 12px | 12px | 思源黑體 中 | 時間戳、徽章 |

手機字級由 `theme.css` 在 767px 以下自動切換，頁面不需要自己寫。長段文字加 `.dp-prose` 限制行寬。

## 5. 間距、圓角、陰影

間距以 4px 為基準：`--sp-1`(4) `--sp-2`(8) `--sp-3`(12) `--sp-4`(16) `--sp-5`(20) `--sp-6`(24) `--sp-8`(32) `--sp-10`(40) `--sp-12`(48) `--sp-16`(64) `--sp-20`(80)。元件內部用 1–6，區塊之間用 8–16。

圓角有層級，不是全部一樣：

| Token | 值 | 只用在 |
|---|---|---|
| `--r-sm` | 8px | 輸入框、提示框 |
| `--r-md` | 14px | 面板、清單項目、問答區塊 |
| `--r-lg` | 24px | 個人檔案卡片、彈窗（最高層級） |
| `--r-pill` | 999px | 按鈕、標籤、徽章 |
| `--r-bubble` | 20px | 聊天泡泡（靠說話者那側下角為 6px） |

陰影一律帶李子紫色調。`--shadow-lg` 只給個人檔案卡片與彈窗，`--shadow-like` 只給喜歡按鈕。

## 6. 版面與 RWD（桌機優先）

基礎樣式寫給桌機，再用 `max-width` 往下覆寫。

| 斷點 | 寬度 | 版面 |
|---|---|---|
| desktop | ≥ 1280px | 三欄：左側欄 248px + 主內容（最寬 760px 置中）+ 右側面板 340px |
| laptop | ≤ 1279px | 隱藏右側面板 |
| tablet | ≤ 1023px | 左側欄縮成 76px 圖示列 |
| mobile | ≤ 767px | 單欄，導覽改為底部分頁列 `.dp-tabbar` |

頁面骨架（每個頁面照抄）：

```html
<div class="dp-shell">
  <nav class="dp-shell__nav">…</nav>
  <main class="dp-shell__main"><div class="dp-shell__main-inner">…</div></main>
  <aside class="dp-shell__aside">…</aside>   <!-- 沒有右側內容：刪掉 aside，並在 dp-shell 加 dp-shell--no-aside -->
</div>
<nav class="dp-tabbar">…</nav>
```

頁面自己的 media query 必須使用上表同樣的四個數值，不得自訂斷點。

## 7. 元件清單

| 元件 | Class | 變體 | 規範 |
|---|---|---|---|
| 按鈕 | `.dp-btn` | `--primary` `--secondary` `--ghost` `--sm`、`disabled` | 最小高度 44px；文字寫動作本身（「傳送訊息」而非「確定」） |
| 配對動作 | `.dp-action` | `--pass` `--like` `--super` | 順序固定：略過、喜歡、超級喜歡；喜歡永遠最大且置中；必須有 `aria-label` |
| 標籤 | `.dp-tag` | `--shared`（共同興趣）`--verified`、`button.dp-tag[aria-pressed]` 可選取 | 興趣選擇用 button，純顯示用 span |
| 頭像 | `.dp-avatar` | `--sm` `--lg` `--online` | 無照片時顯示名字最後一字 |
| 個人檔案卡 | `.dp-profile-card` | `__photo` `__overlay` `__name` `__meta` `__body` `__prompt` | 照片比例 4:5；姓名與年齡用全形逗號「林予晴，27」 |
| 清單項目 | `.dp-list-item` | `__title` `__sub`，搭配 `.dp-badge` | 訊息預覽單行截斷；自己最後發言時前綴「你：」 |
| 聊天 | `.dp-chat` `.dp-bubble` | `--in` `--out`、`.dp-chat__time` | 對方白底靠左，自己紫底靠右 |
| 表單 | `.dp-field` `.dp-label` `.dp-input` `.dp-help` | `aria-invalid="true"`、`.dp-help--error` | label 必須綁 `for`；錯誤訊息寫出怎麼修正 |
| 提示框 | `.dp-alert` | `--success` `--warning` `--danger` `--info` | — |
| 面板 | `.dp-panel` | — | 一般容器 |
| 空狀態 | `.dp-empty` | — | 一句說明 + 一個可以做的動作 |
| 彈窗 | `.dp-modal-backdrop` `.dp-modal` | — | 目前只用於配對成功 |
| 導覽 | `.dp-nav-item` | `aria-current="page"` 表示目前頁 | 桌機在側欄、手機在 `.dp-tabbar` |

每個元件的實際樣子請開 `preview.html` 對照。

## 8. 動畫

| 情境 | 時長 | Easing |
|---|---|---|
| hover、顏色變化 | `--dur-fast` 120ms | `--ease-standard` |
| 展開、切換 | `--dur-base` 200ms | `--ease-standard` |
| 喜歡按鈕、配對成功 | `--dur-slow` 320ms | `--ease-spring`（整套系統只有這裡用） |

不要給每個區塊加進場動畫。`theme.css` 已處理 `prefers-reduced-motion`。

## 9. 文案語氣

口語、直接、不賣弄。按鈕寫動作（「傳送第一則訊息」），同一個動作在流程中名稱一致（按「喜歡」→ 提示「已喜歡」）。錯誤訊息說明發生什麼與怎麼修正，不道歉、不模糊（「檔案超過 10 MB，請壓縮後再試一次」）。空狀態給下一步，不寫「空空如也」。

## 10. 品牌待定事項

品牌名稱、Logo 尚未決定。目前：
- 側欄 Logo 位置以 `.dp-logo` 文字「品牌名稱」佔位，Logo 定案後只改這一處。
- `theme.json` 的 `brand` 區塊全部為 `TBD`。
- class 前綴 `dp-` 為中性前綴，品牌定案後不需更改。

## 11. 提交前檢查

- [ ] 頁面 CSS 沒有寫死的色碼、px 間距、字級
- [ ] 沒有重寫已存在的 `dp-` 元件
- [ ] 在 1440、1024、768、390 四個寬度都看過
- [ ] 所有互動元素可用鍵盤操作，焦點框看得到
- [ ] 圖示按鈕都有 `aria-label`
- [ ] 一個畫面最多一顆 `dp-btn--primary`

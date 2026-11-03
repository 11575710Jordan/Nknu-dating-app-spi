# 商業化交友 App - AI 偵測聊天溫度（聊天熱絡度評估）效能測試與 Workload Model 規劃

本文件依據軟體效能測試課程規範（參考 P47-P49 流量、頻寬與儲存空間估算模型），針對交友 App 的「AI 聊天建議與聊天溫度評估」模組（`chat/chat-ai.js` 及其延伸之 `ChatWarmthAnalyzer`）進行系統化的 Workload Model 建立與效能指標推導。

---

## 一、 業務情境與假設指標設定 (Business Assumptions)

1. **目標用戶規模**：假設平台每日有 20,000 組配對成功的對話在聊天室中互動，平均每組對話每日觸發 15 次 AI 建議／溫度評估（開啟 `chat-ai-sheet` 或收到新訊息時）：20,000 × 15 = 300,000 次評估請求/天。
2. **作業時間分佈**：約會聊天屬夜間行為，假設 45% 的請求量集中在晚間聊天高峰時段（3 小時內）。
3. **酬載大小假設**：
   * 近期對話訊息窗格（供 `suggestReplies` 判斷最後一句語意）：約 10 則訊息 × 0.1 KB 約等於 1 KB
   * 對方個人檔案摘要（`prompts`、`interests`、`pets` 等，供 `suggestIcebreakers` 使用）：約 0.5 KB
   * **單次評估請求總酬載**：1 KB + 0.5 KB = 1.5 KB

---

## 二、 流量與到達率估算 (Arrival Rate / TPS)

參照講義 P47 URL Shortening Service 的計算邏輯：

* **每日平均請求數**：
  300,000 次評估請求/天，換算每秒：
  300,000 / 86,400 約等於 3.47 requests/sec

* **尖峰時刻每秒請求數 (Peak TPS)**：
  若 45% 的流量（135,000 次）集中在晚間高峰時段的 3 小時（3 × 3600 = 10,800 秒）內發生：
  Peak TPS = 135,000 / 10,800 約等於 12.5 requests/sec
  *(註：若逢情人節、七夕等戀愛主題行銷活動，瞬時流量可能達平均值的 2 至 3 倍，約 25 ~ 37.5 TPS)*。

---

## 三、 頻寬需求估算 (Bandwidth Estimates)

參照講義 P48 的頻寬估算方式（每秒請求數 × 檔案大小）：

* **尖峰頻寬需求**：
  Bandwidth = 12.5 req/s × 1.5 KB 約等於 18.75 KB/s
  轉換為位元率 (Mbps)：
  18.75 KB/s × 8 bits/byte 約等於 0.15 Mbps
* **架構師評估**：
  與 AI 偵測文字模組相同，聊天溫度評估屬「高頻、低酬載」請求，頻寬需求極低，非效能瓶頸所在。真正瓶頸在於 `WarmthScoreCalculator` 須即時比對多組正規表達式分類（邀約／疑問／興趣關鍵字）並結合訊息頻率運算，屬**運算密集型**服務，應優先規劃運算資源（CPU／快取）的水平擴展，而非頻寬。

---

## 四、 儲存空間需求估算 (Storage Estimates)

參照講義 P47 的儲存空間估算方式（物件數量 × 檔案大小 × 保留年限）：

* **每月儲存量**：
  每次評估需保存溫度分數、分類結果與時間戳記（供 `WarmthIndicatorBadge` 顯示趨勢），單筆紀錄約 0.3 KB：
  300,000 次/天 × 30 天 × 0.3 KB = 2,700,000 KB 約等於 2.7 GB/月

* **年度與合規保留**：
  為供 AI 建議模型持續迭代優化，假設保留 3 個月歷史資料：
  2.7 GB × 3 個月 約等於 8.1 GB

---

## 五、 Workload Model 總結規格表

依據講義 P79 Workload Model 規範，AI 偵測聊天溫度模組的效能測試設定如下：

* **Arrival Rate (到達率)**：預期正常約 3.47 TPS；晚間尖峰約 12.5 TPS；活動期尖峰約 25 ~ 37.5 TPS。
* **Concurrent Users (並行使用者數)**：約 2,000 ~ 3,000 組配對同時在聊天室互動並開啟 AI 助手抽屜。
* **Transaction Mix (交易組合比例)**：
  1. GET /api/chat/ai/suggest (取得回覆建議／破冰話題，對應 `suggestReplies` / `suggestIcebreakers`)：佔 60%
  2. POST /api/chat/ai/warmth (背景計算並寫入聊天溫度分數)：佔 30%
  3. GET /api/chat/ai/warmth-history (查詢 `WarmthIndicatorBadge` 溫度趨勢)：佔 10%
* **Payload Size (酬載大小)**：每個 Request 約 1.5 KB（含近期訊息窗格與對方檔案摘要）。
* **Think Time (思考時間)**：使用者查看 AI 建議後決定採用或自行輸入訊息，平均間隔 10 ~ 20 秒。

# Lab 2 題目 2-1：類別圖設計（M11575708）

> 依據期中報告中 M11575708 負責之 6 張 User Story，分析設計對應之類別圖。
> 本版已依 Lab 3 實作結果（分支 `M11575708@帳號審核`，`js/models_*.js`）同步修訂，類別、屬性與方法名稱皆與程式一致。

| 卡片 | User Story | 主要類別 | 程式檔 |
|---|---|---|---|
| 共用 | 帳號、資料層、圖片處理 | `Account`、`User`、`Admin`、`AccountRepository`、`DataStore`、`ImageProcessor` | `models_account.js`、`models_data-store.js`、`models_image-processor.js` |
| [02] | 忘記密碼 | `PasswordResetRequest`、`MailService`、`MockMailService`、`AuthController` | `models_password-reset.js` |
| [03] | 個人基本設定 | `UserProfile`、`Photo`、`ProfileController` | `models_user-profile.js` |
| [04] | 通知中心 | `Notification`、`NotificationCenter` | `models_notification-center.js` |
| [06] | 審核機制（實名制） | `IdentityVerification`、`RealNameAuditController` | `models_audit.js` |
| [09] | 仇恨值（系統） | `HateScore`、`HateScoreLog`、`SensitiveKeyword`、`HateScoreEngine` | `models_hate-score.js` |
| [10] | 用戶檢舉、封鎖與黑名單管理 | `Report`、`BlockRecord`、`ReportAndBlockController` | `models_report-block.js` |

**圖例**：`+` public、`-` private、`#` protected；底線為 static；`<|--` 繼承、`*--` 組合、`o--` 聚合、`-->` 關聯、`..>` 相依、`..|>` 實作；關係兩端數字為 cardinality。
所有 `<<control>>` 類別都透過 `DataStore` 讀寫 JSON（localStorage），為避免線條過多，分圖中省略這條相依。

---

## 0. 整合總圖（類別與關係）

```mermaid
classDiagram
    direction LR

    class Account { <<abstract>> }
    class User
    class Admin
    class AccountRepository
    class DataStore
    class UserProfile
    class Photo
    class PasswordResetRequest
    class Notification
    class IdentityVerification
    class HateScore
    class HateScoreLog
    class SensitiveKeyword
    class Report
    class BlockRecord
    class AuthController { <<control>> }
    class ProfileController { <<control>> }
    class NotificationCenter { <<control>> }
    class RealNameAuditController { <<control>> }
    class HateScoreEngine { <<control>> }
    class ReportAndBlockController { <<control>> }
    class MailService { <<interface>> }
    class ImageProcessor { <<utility>> }

    Account <|-- User
    Account <|-- Admin
    AccountRepository "1" o-- "0..*" Account : 管理
    AccountRepository ..> DataStore : 讀寫

    User "1" *-- "1" UserProfile : 擁有
    UserProfile "1" *-- "0..6" Photo : 展示照片
    Account "1" --> "0..*" PasswordResetRequest : 申請重設
    User "1" --> "0..*" Notification : 接收
    User "1" --> "0..*" IdentityVerification : 提交
    Admin "0..1" --> "0..*" IdentityVerification : 審核
    User "1" *-- "1" HateScore : 擁有
    HateScore "1" *-- "0..*" HateScoreLog : 變更紀錄
    User "1" --> "0..*" Report : 檢舉人
    Report "0..*" --> "1" User : 被檢舉人
    Admin "0..1" --> "0..*" Report : 處理
    User "1" --> "0..*" BlockRecord : 封鎖者
    BlockRecord "0..*" --> "1" User : 被封鎖者

    AuthController ..> PasswordResetRequest : 建立
    AuthController --> MailService : 寄送驗證碼
    AuthController --> AccountRepository : 更新密碼
    ProfileController ..> UserProfile : 讀寫
    NotificationCenter "1" o-- "0..*" Notification : 管理
    RealNameAuditController ..> IdentityVerification : 讀寫
    RealNameAuditController --> AccountRepository : 更新認證狀態
    RealNameAuditController --> NotificationCenter : 通知審核結果
    HateScoreEngine "1" o-- "1..*" SensitiveKeyword : 詞庫
    HateScoreEngine ..> HateScore : 計算累加
    HateScoreEngine --> NotificationCenter : 通知風險等級
    ReportAndBlockController ..> Report : 建立
    ReportAndBlockController ..> BlockRecord : 新增／移除
    ReportAndBlockController --> HateScoreEngine : 檢舉成立加分
    ReportAndBlockController --> NotificationCenter : 通知處理結果
    ProfileController ..> ImageProcessor : 圖片壓縮
    RealNameAuditController ..> ImageProcessor : 證件壓縮
    ReportAndBlockController ..> ImageProcessor : 截圖轉檔
```

---

## 1. 共用：帳號、資料層、圖片處理

`User` 初始資料取自 `mock-data.js`；`Admin` 帳號定義在 `models_account.js`。重設後的密碼、實名認證結果由 `AccountRepository` 另存在 `DataStore`，不改動初始資料。

```mermaid
classDiagram
    class Account {
        <<abstract>>
        +String id
        +String name
        +String email
        #String password
        +checkPassword(String password) bool
        +changePassword(String newPassword) void
        +isAdmin() bool
        +validatePassword(String password)$ String
    }
    class User {
        -String gender
        -int age
        -String area
        -bool verified
        -bool online
        -List~Photo~ photos
        +isVerified() bool
        +grantVerifiedBadge() void
    }
    class Admin {
        -String role
        +isAdmin() bool
    }
    class AccountRepository {
        -DataStore store
        +users() List~User~
        +admins() List~Admin~
        +findById(String id) Account
        +findByEmail(String email) Account
        +resolveUser(String idOrName) User
        +toAuthList() List
        +validatePassword(String password) String
        +savePassword(String accountId, String newPassword) bool
        +setVerified(String userId, bool verified) bool
    }
    class DataStore {
        -Storage storage
        +Object seed
        +read(String table, Object fallback) Object
        +write(String table, Object value) bool
        +update(String table, Object fallback, Function updater) bool
        +reset() void
        +newId(String prefix)$ String
    }
    class ImageProcessor {
        <<utility>>
        +validateFile(File file, int maxMB)$ String
        +readAsDataURL(File file)$ Promise~String~
        +resizeToBase64(String dataUrl, int maxEdge, float quality)$ Promise~String~
        +fromFile(File file, Object options)$ Promise~String~
    }

    Account <|-- User
    Account <|-- Admin
    AccountRepository "1" o-- "0..*" Account : 管理
    AccountRepository ..> DataStore : 讀寫
```

---

## 2. [02] 忘記密碼

驗收準則：6 位數驗證碼 10 分鐘過期；錯誤 5 次需重新申請；重設成功後可用新密碼登入。

```mermaid
classDiagram
    class AccountRepository {
        +findByEmail(String email) Account
        +validatePassword(String password) String
        +savePassword(String accountId, String newPassword) bool
    }
    class PasswordResetRequest {
        -String requestId
        -String accountId
        -String email
        -String verificationCode
        -DateTime createdAt
        -DateTime expiresAt
        -bool used
        -int attempts
        +int EXPIRE_MINUTES$
        +int MAX_ATTEMPTS$
        +isExpired(Date now) bool
        +secondsLeft(Date now) int
        +verify(String code, Date now) String
        +markUsed() void
    }
    class AuthController {
        <<control>>
        +requestReset(String email) Object
        +verifyCode(String email, String code) String
        +resetPassword(String email, String code, String newPassword, String confirm) String
        +findActive(String email) PasswordResetRequest
        +generateCode() String
    }
    class MailService {
        <<interface>>
        +sendResetCode(String email, String code) void
    }
    class MockMailService {
        +sendResetCode(String email, String code) Object
        +latestTo(String email) Object
    }

    AuthController ..> PasswordResetRequest : 建立／驗證
    AuthController --> AccountRepository : 查帳號／更新密碼
    AuthController --> MailService : 寄送驗證碼
    MockMailService ..|> MailService
```

---

## 3. [03] 個人基本設定

規則：興趣標籤最多 5 項、年齡需滿 18 歲、展示照片最多 6 張、圖片上限 5MB 並以 Canvas 壓縮。每位用戶各自一份 Profile。

```mermaid
classDiagram
    class User {
        +String id
    }
    class UserProfile {
        -String nickname
        -String gender
        -String occupation
        -int age
        -String bio
        -List~String~ tags
        -String avatar
        -List~Photo~ photos
        -DateTime updatedAt
        +int MAX_TAGS$
        +int MIN_AGE$
        +int MAX_PHOTOS$
        +hasTag(String tag) bool
        +addTag(String tag) bool
        +removeTag(String tag) void
        +addPhoto(Photo photo) String
        +removePhoto(int index) void
        +validate() List~String~
        +toJSON() Object
        +fromSeedUser(Object user, List tagOptions)$ UserProfile
    }
    class Photo {
        +String src
        +String caption
    }
    class ProfileController {
        <<control>>
        +loadProfile(String userId, List tagOptions) UserProfile
        +saveProfile(String userId, UserProfile profile) Object
        +displayInfo(String userId) Object
    }
    class ImageProcessor {
        <<utility>>
        +fromFile(File file, Object options)$ Promise~String~
    }

    User "1" *-- "1" UserProfile : 擁有
    UserProfile "1" *-- "0..6" Photo : 展示照片
    ProfileController ..> UserProfile : 讀寫
    ProfileController ..> ImageProcessor : 圖片壓縮
```

---

## 4. [04] 通知中心

驗收準則：未讀／已讀、類別圖示、觸發時間、點擊跳轉、全部標示已讀、刪除單筆。其他模組透過 `push()` 發送通知。

```mermaid
classDiagram
    class User {
        +String id
    }
    class Notification {
        -String id
        -NotificationCategory category
        -String title
        -String desc
        -DateTime createdAt
        -bool unread
        -String href
        -String iconType
        +markAsRead() void
        +getTargetPage() String
        +timeAgo(Date now) String
    }
    class NotificationCategory {
        <<enumeration>>
        SYSTEM
        INTERACTIVE
    }
    class NotificationCenter {
        <<control>>
        +push(String userId, Object data) Notification
        +getNotifications(String userId, String filter) List~Notification~
        +markAsRead(String userId, String id) bool
        +markAllAsRead(String userId) int
        +delete(String userId, String id) bool
        +clearAll(String userId) bool
        +getUnreadCount(String userId) int
        +formatTimeAgo(String iso, Date now)$ String
    }

    User "1" --> "0..*" Notification : 接收
    Notification --> NotificationCategory
    NotificationCenter "1" o-- "0..*" Notification : 管理
```

---

## 5. [06] 審核機制（實名制）

驗收準則：狀態分為待審核／通過／失敗（附退回原因）；通過後顯示認證徽章；管理員可在後台變更狀態；證件號碼遮罩顯示。

```mermaid
classDiagram
    class User {
        -bool verified
        +isVerified() bool
    }
    class Admin {
        +isAdmin() bool
    }
    class IdentityVerification {
        -String ticketId
        -String userId
        -String realName
        -String idNumber
        -String frontImage
        -String backImage
        -bool selfieVerified
        -AuditStatus status
        -String rejectReason
        -DateTime submittedAt
        -DateTime reviewedAt
        -String reviewerId
        +validate() List~String~
        +isPending() bool
        +approve(String reviewerId, Date now) void
        +reject(String reviewerId, String reason, Date now) void
        +getMaskedIdNumber() String
        +maskId(String id)$ String
    }
    class AuditStatus {
        <<enumeration>>
        NONE
        PENDING
        APPROVED
        REJECTED
    }
    class RealNameAuditController {
        <<control>>
        +submitApplication(String userId, Object data) Object
        +statusOf(String userId) AuditStatus
        +latestFor(String userId) IdentityVerification
        +listPending() List~IdentityVerification~
        +listReviewed() List~IdentityVerification~
        +review(String ticketId, String adminId, bool approve, String reason) IdentityVerification
        -grantBadge(String userId) void
        -notifyResult(IdentityVerification ticket) void
    }
    class AccountRepository {
        +setVerified(String userId, bool verified) bool
    }
    class NotificationCenter {
        <<control>>
        +push(String userId, Object data) Notification
    }

    User "1" --> "0..*" IdentityVerification : 提交
    Admin "0..1" --> "0..*" IdentityVerification : 審核
    IdentityVerification --> AuditStatus
    RealNameAuditController ..> IdentityVerification : 讀寫
    RealNameAuditController --> AccountRepository : 更新認證狀態
    RealNameAuditController --> NotificationCenter : 通知審核結果
```

---

## 6. [09] 仇恨值（系統）

驗收準則：依檢舉成立與違規行為自動累加、達門檻觸發限制、管理員可檢視歷史紀錄並手動微調。
分數 0～100；< 30 良好、30～69 警告、≥ 70 高風險（暫停聊天發言）；檢舉成立 +10。

```mermaid
classDiagram
    class User {
        +String id
    }
    class HateScore {
        -String userId
        -int score
        -List~HateScoreLog~ logs
        +int MIN$
        +int MAX$
        +add(int points, ViolationSource source, String reason, Date now) HateScoreLog
        +adjust(int delta, String operatorId, String reason, Date now) HateScoreLog
        -applyDelta(int delta, ViolationSource source, String reason, String operatorId, Date now) HateScoreLog
        +getLevel() RiskLevel
        +getHistory() List~HateScoreLog~
        +levelOf(int score)$ RiskLevel
        +clamp(int score)$ int
    }
    class HateScoreLog {
        -String logId
        -int delta
        -int scoreAfter
        -ViolationSource source
        -String reason
        -String operatorId
        -DateTime createdAt
    }
    class RiskLevel {
        <<enumeration>>
        SAFE
        WARNING
        HIGH_RISK
    }
    class ViolationSource {
        <<enumeration>>
        REPORT_UPHELD
        SENSITIVE_WORD
        MANUAL_ADJUST
    }
    class SensitiveKeyword {
        -String word
        -int weight
        +matches(String text) bool
    }
    class HateScoreEngine {
        <<control>>
        -List~SensitiveKeyword~ keywords
        +int REPORT_PENALTY$
        +get(String userId) HateScore
        +analyzeText(String text) Object
        +recordMessage(String userId, String text) Object
        +applyReportPenalty(String userId, String reportId) HateScore
        +adjust(String userId, String adminId, int delta, String reason) HateScore
        +checkThreshold(String userId) RiskLevel
        +isRestricted(String userId) bool
        +listAll(List userIds) List~HateScore~
        -notifyLevelChange(String userId, RiskLevel before, RiskLevel after) void
    }
    class NotificationCenter {
        <<control>>
        +push(String userId, Object data) Notification
    }

    User "1" *-- "1" HateScore : 擁有
    HateScore "1" *-- "0..*" HateScoreLog : 變更紀錄
    HateScore ..> RiskLevel
    HateScoreLog --> ViolationSource
    HateScoreEngine "1" o-- "1..*" SensitiveKeyword : 詞庫
    HateScoreEngine ..> HateScore : 計算累加
    HateScoreEngine --> NotificationCenter : 通知風險等級
```

---

## 7. [10] 用戶檢舉、封鎖與黑名單管理

規則：舉證截圖最多 3 張；管理員判定成立時被檢舉人仇恨值 +10 並通知檢舉人；封鎖為雙向隱藏，可隨時解除。
`ReportCategory` 與 `report-user.html` 的違規類型選項一致。

```mermaid
classDiagram
    class User {
        +String id
    }
    class Admin {
        +isAdmin() bool
    }
    class Report {
        -String reportId
        -String reporterId
        -String targetId
        -String targetName
        -ReportCategory category
        -String reason
        -List~String~ screenshots
        -ReportStatus status
        -DateTime createdAt
        -String handlerId
        -String resolution
        -DateTime resolvedAt
        +int MAX_SCREENSHOTS$
        +addScreenshot(String base64) bool
        +removeScreenshot(String base64) void
        +validate() List~String~
        +isPending() bool
        +resolve(ReportStatus result, String handlerId, String note, Date now) void
        +categoryLabel() String
    }
    class ReportCategory {
        <<enumeration>>
        HARASSMENT
        FRAUD
        FAKE_PROFILE
        INAPPROPRIATE_MEDIA
        OTHER
    }
    class ReportStatus {
        <<enumeration>>
        PENDING
        UPHELD
        DISMISSED
    }
    class BlockRecord {
        -String blockerId
        -String blockedId
        -DateTime createdAt
    }
    class ReportAndBlockController {
        <<control>>
        +submitReport(String reporterId, Object data) Object
        +listReports(String filter) List~Report~
        +reportsBy(String reporterId) List~Report~
        +resolveReport(String reportId, String adminId, bool upheld, String note) Report
        +block(String blockerId, String targetId) bool
        +unblock(String blockerId, String targetId) bool
        +getBlockedList(String userId) List~BlockRecord~
        +isBlocked(String a, String b) bool
        +hiddenIdsFor(String userId) Set~String~
    }
    class HateScoreEngine {
        <<control>>
        +applyReportPenalty(String userId, String reportId) HateScore
    }
    class NotificationCenter {
        <<control>>
        +push(String userId, Object data) Notification
    }

    User "1" --> "0..*" Report : 檢舉人
    Report "0..*" --> "1" User : 被檢舉人
    Admin "0..1" --> "0..*" Report : 處理
    Report --> ReportCategory
    Report --> ReportStatus
    User "1" --> "0..*" BlockRecord : 封鎖者
    BlockRecord "0..*" --> "1" User : 被封鎖者
    ReportAndBlockController ..> Report : 建立
    ReportAndBlockController ..> BlockRecord : 新增／移除
    ReportAndBlockController --> HateScoreEngine : 檢舉成立加分
    ReportAndBlockController --> NotificationCenter : 通知處理結果
```

---

## 8. 設計說明

1. **控制器與實體分離**：`<<control>>` 類別負責流程，實體類別（`Report`、`IdentityVerification`…）負責自身資料與狀態轉換；頁面腳本只處理畫面。
2. **相依性注入**：控制器透過建構子取得 `DataStore`、`AccountRepository`、`NotificationCenter` 等協作物件，測試時可換成假的 storage 與固定時鐘，因此規則都能用 `npm test` 驗證。
3. **抽出共用類別**：原本三支頁面腳本各自實作圖片壓縮，抽成 `ImageProcessor`；所有資料表的讀寫集中在 `DataStore`。
4. **`MailService` 介面**：目前以 `MockMailService` 模擬寄信（驗證碼顯示在頁面上），日後換成真實寄信服務時不必修改 `AuthController`（OCP 原則）。
5. **管理員操作放在控制器**：審核、處理檢舉、調整仇恨值都由控制器方法接收 `adminId` 並檢查 `Account.isAdmin()`，`Admin` 類別本身只代表身分。
6. **與第一版設計的差異**：
   - 新增 `AccountRepository`、`DataStore`（以 JSON／localStorage 作為資料庫）。
   - `AuditStatus` 新增 `NONE`（尚未申請）；`ReportCategory` 改為與檢舉頁選項一致。
   - `Report` 新增 `reporterId`、`handlerId`、`resolution`、`resolvedAt`；`PasswordResetRequest` 新增 `attempts`（錯誤次數上限）。
   - 統一仇恨值門檻為 30／70，分數依用戶分開儲存。

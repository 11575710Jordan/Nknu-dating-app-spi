# 註冊功能 C4 Model（M11575709）

依照第 5 單元講義的 C4 model，由外往內：Context → Container → Component。

## Level 1：System Context

```mermaid
flowchart TB
    User["<b>新使用者</b><br/>[Person]<br/>還沒有帳號、想開始交友的人"]
    System["<b>NKNU 交友 App</b><br/>[Software System]<br/>提供註冊、登入、配對、聊天等功能"]

    User -- "註冊帳號、登入使用<br/>[瀏覽器]" --> System

    classDef person fill:#08427B,color:#fff,stroke:#073B6F
    classDef system fill:#1168BD,color:#fff,stroke:#0B4884
    class User person
    class System system
```

## Level 2：Container

```mermaid
flowchart TB
    User["<b>新使用者</b><br/>[Person]"]

    subgraph App ["NKNU 交友 App [Software System]"]
        direction TB
        Web["<b>前端網頁</b><br/>[Container: HTML / CSS / JavaScript]<br/>在瀏覽器執行，提供登入、註冊、配對等畫面"]
        Mock[("<b>測試資料</b><br/>[Container: mock-data.js]<br/>模擬後端的使用者資料")]
        LS[("<b>瀏覽器儲存</b><br/>[Container: localStorage]<br/>儲存新註冊的帳號")]
    end

    User -- "使用<br/>[瀏覽器]" --> Web
    Web -- "讀取測試帳號" --> Mock
    Web -- "讀寫帳號資料<br/>[JSON]" --> LS

    classDef person fill:#08427B,color:#fff,stroke:#073B6F
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295
    class User person
    class Web,Mock,LS container
    style App fill:#fff,stroke:#888,stroke-dasharray:6 4
```

## Level 3：Component

```mermaid
flowchart TB
    subgraph Web ["前端網頁 [Container]"]
        direction TB
        Login["<b>登入頁</b><br/>[Component: login.html / login.js]<br/>輸入帳號密碼登入"]
        Reg["<b>註冊頁</b><br/>[Component: register.html / register.js]<br/>顯示註冊表單與錯誤訊息"]
        Logic["<b>註冊邏輯</b><br/>[Component: register-logic.js]<br/>檢查欄位、建立帳號"]
    end

    Mock[("<b>測試資料</b><br/>[Container: mock-data.js]")]
    LS[("<b>瀏覽器儲存</b><br/>[Container: localStorage]")]

    Login -- "點「立即免費註冊」" --> Reg
    Reg -- "呼叫 validate()、create()" --> Logic
    Reg -- "註冊成功後回到" --> Login
    Reg -- "讀取測試帳號，比對 Email" --> Mock
    Logic -- "讀寫 nknu-registered-users<br/>[JSON]" --> LS

    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295
    class Login,Reg,Logic component
    class Mock,LS container
    style Web fill:#fff,stroke:#888,stroke-dasharray:6 4
```

## Component Diagram（UML 2.0）

圓圈是元件提供的介面，半圓是元件需要的介面。

![註冊元件圖](註冊-元件圖.svg)

## Deployment Diagram

```mermaid
flowchart LR
    subgraph GH ["«device» GitHub 伺服器"]
        Repo["«artifact»<br/>Nknu-dating-app-spi<br/>（HTML / CSS / JS 檔案）"]
    end
    subgraph PC ["«device» 使用者電腦 / 手機"]
        subgraph B ["«execution environment» 瀏覽器"]
            Page["«artifact»<br/>register.html<br/>register.js / register-logic.js<br/>mock-data.js"]
            LS[("localStorage")]
        end
    end
    Repo -- "HTTPS 下載檔案" --> Page
    Page -- "存帳號" --> LS
```

# IOTA DApp Integration Guide

這份文件說明了在 `simple-wallet-connect` 專案中，如何透過 `@iota/dapp-kit` 與區塊鏈進行互動，以及 **Provider** 與 **Wallet** 之間的核心關係。

## 核心概念 (Core Concepts)

在區塊鏈開發中，我們通常需要兩個主要的組件來與鏈上數據互動：

### 1. Provider (提供者) - `IotaClientProvider`

> **負責 "讀取" (Read) 與 "連線" (Connection)**

- **角色**：它是應用程式與區塊鏈網路（如 IOTA Testnet 或 Mainnet）之間的橋樑。
- **功能**：
  - 讀取鏈上數據（例如：查詢餘額、讀取物件狀態）。
  - 發送已經簽名好的交易到網路上。
  - 它不需要用戶的私鑰，任何人都可以透過 Provider 讀取公開數據。
- **程式碼對應**：
  在 `src/components/Providers.jsx` 中：
  ```jsx
  <IotaClientProvider networks={networks} defaultNetwork="testnet">
  ```
  這行程式碼確保了整個 App 都知道要連線到哪個節點（Node）。

### 2. Wallet (錢包) - `WalletProvider`

> **負責 "簽名" (Sign) 與 "授權" (Authorization)**

- **角色**：代表使用者的身份。它管理使用者的帳戶（Account）和私鑰（Private Key）。
- **功能**：
  - **簽名 (Signing)**：當 App 想要執行一個改變鏈上狀態的動作（例如：轉帳、投票）時，必須由 Wallet 進行加密簽名，證明這是用戶本人的意願。
  - **授權**：用戶透過錢包介面（如瀏覽器擴充功能）點擊 "Connect" 或 "Approve" 來授權 App 存取其地址或執行交易。
- **程式碼對應**：
  在 `src/components/Providers.jsx` 中：
  ```jsx
  <WalletProvider autoConnect={true}>
  ```
  這行程式碼讓 App 能夠偵測瀏覽器中安裝的錢包（如 IOTA Wallet, Sui Wallet 等），並處理連線狀態。

---

## 運作流程 (The Flow)

當用戶在您的 App 中進行操作時，這兩者是如何協作的？

1.  **連線 (Connect)**：

    - 用戶點擊 `ConnectButton`。
    - `WalletProvider` 彈出視窗，請求用戶授權。
    - 授權成功後，App 獲得用戶的 `account.address`。

2.  **讀取數據 (Read Data)**：

    - App 透過 `IotaClientProvider` 向區塊鏈詢問：「這個地址的餘額是多少？」
    - 區塊鏈回傳數據，顯示在 UI 上。

3.  **執行交易 (Execute Transaction)**：
    - 用戶點擊按鈕（例如 "Vote"）。
    - App 建立一個交易物件 (Transaction Block)。
    - App 請求 `WalletProvider` (錢包) 對該交易進行 **簽名 (Sign)**。
    - 用戶在錢包彈窗中確認。
    - 簽名完成後，App 透過 `IotaClientProvider` 將 **已簽名的交易 (Signed Transaction)** 發送到區塊鏈網路上執行。

## 專案結構 (Project Structure)

- **`src/components/Providers.jsx`**:

  - 設定全域的 Context。
  - 包裹順序：`QueryClientProvider` (狀態管理) -> `IotaClientProvider` (網路連線) -> `WalletProvider` (錢包連線)。
  - 這樣確保內層組件既能連上網路，也能存取錢包狀態。

- **`src/components/WalletConnect.jsx`**:
  - UI 組件，負責顯示連線按鈕和用戶資訊。
  - 使用 hooks 如 `useCurrentAccount()` 來獲取當前連線的錢包狀態。

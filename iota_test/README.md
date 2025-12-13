# IOTA 加密投票測試

此目錄包含 Move 合約與 JS 測試腳本，用於模擬加密投票流程。

## 前置需求

- 已安裝 IOTA CLI 並設定至 PATH。
- Localnet 正在運行（通常使用 `iota start`）。
- 已安裝 Node.js。

## 設定

1. **安裝依賴**：
    ```bash
    npm install
    ```

2. **設定設定檔**：
    你需要建立一個 `test_config.json` 檔案。你可以選擇：
    
    a. **執行設定腳本**（推薦用於本地測試）：
       這將自動發布套件 (Package)、建立金鑰、領取測試幣 (Faucet)，並將所有資訊儲存至 `test_config.json`。
       注意：此腳本**只會**發布套件，不會建立投票事件。
       ```bash
       node setup_env.js
       ```
    
    b. **手動建立 `test_config.json`**：
       複製 `test_config.json`（這是一個模板）並填入數值：
       - `NODE_URL`: 你的 IOTA 節點 URL。
       - `FAUCET_URL`: Faucet URL。
       - `PACKAGE_ID`: 已發布的 `aivoting` 套件 ID。
       - `ADMIN_SecretKey`: 選務管理者 (EA) 的私鑰 (Hex/Bech32)。
       - `VOTER_SecretKey`: 投票者 (Voter) 的私鑰。
       - `EA_PrivateKey_PEM`: 選務管理者 (EA) 的 RSA 私鑰 (PEM 格式)。

## 執行測試步驟

1. **（我做好了不用做）初始化環境與發布合約**
   執行設定腳本，這會發布合約到 Testnet 並產生測試用的 `test_config.json`：
   ```bash
   node setup_env.js
   ```

2. **（我做好了不用做）重要：儲值測試幣 (Funding)**
   
   先執行以下腳本，會印出兩個地址，會出錯是正常，因為那兩個地址沒有錢，你就手動充錢給他
   ```bash
   node vote_test.js
   ```

   

   請使用 [IOTA Testnet Faucet](https://faucet.testnet.iota.cafe/) 或你的錢包，轉帳少量 IOTA (例如 1 IOTA) 到這兩個地址，以支付 Gas Fee。
   *(註：若 console 沒印出地址，你可以直接執行下一步，程式會在餘額不足時報錯並顯示地址)*

3. **執行投票測試**
   確認帳號有餘額後，執行主測試腳本：
   ```bash
   node vote_test.js
   ```

   此腳本將自動執行以下流程：
   1.  **EA (選務管理者) 建立投票事件**：呼叫 `create_vote_event` 並新增候選人。
   2.  **註冊與盲簽 (模擬)**：EA 對 Voter 的地址進行簽名認證。
   3.  **加密投票**：Voter 使用 X25519 (TweetNaCl) 將選票加密。
   4.  **上鏈**：Voter 發送加密選票至區塊鏈。
   5.  **驗證與解密**：腳本從鏈上抓取資料，使用 EA 私鑰解密並驗證內容是否正確。

## vote_test.js 詳細流程解析

為了方便開發與除錯，`vote_test.js` 將所有角色與步驟整合在一個腳本中，順序如下：

### Phase 1: 建立投票 (EA)
- **角色**：EA (Admin)
- **動作**：
  1.  呼叫 `create_vote_event` 建立一個共享物件 (Shared Object) `VoteEvent`。
  2.  **設定投票資訊**：呼叫 `add_vote_info` 設定標題與描述 (例如 "Annual Tech Vote")。
  3.  呼叫 `add_candidate` 新增候選人 (例如 Alice, Bob)。
- **目的**：初始化鏈上投票用物件。

### Phase 2: 註冊 (Registration)
- **角色**：EA & Voter
- **動作**：
  -  模擬「盲簽 (Blind Signature)」流程。
  -  在此測試中，簡化為 EA 使用 Ed25519 私鑰直接對 Voter 地址進行簽名。
  -  此簽名 (S) 將作為投票時的憑證 (Eligibility Proof)。

### Phase 3: 投票 (Voting)
- **角色**：Voter
- **動作**：
  1.  **準備明文**：建立 JSON 物件 `{ candidate_id, nonce }`。
      - `nonce` 使用 `crypto.randomUUID()` 產生，確保內容唯一性。
  2.  **加密 (Encryption)**：
      - 使用 **X25519** 非對稱加密 (TweetNaCl Box)。
      - Voter 產生一組臨時金鑰 (Ephemeral Keypair)。
      - 加密公式：`Ciphertext = Box(Plaintext, Nonce, EA_PublicKey, Ephemeral_PrivateKey)`。
      - 打包選票：`[Ephemeral_PublicKey (32 bytes)] + [Nonce (24 bytes)] + [Ciphertext]`。
  3.  **上鏈**：
      - 呼叫 Move 合約的 `vote` 函數。
      - 參數包含 `VoteEvent ID`、打包後的 `Encrypted_Vote` 以及 EA 的簽名 `Sign`。
      - 交易由 Voter 簽署並發送 (Gas 費由 Voter 支付)。

### Phase 4: 驗證 (off-chain)
- **角色**：EA (驗證端)
- **動作**：
  1.  使用 SDK (`getObject`) 抓取鏈上最新的 `VoteEvent` 物件內容。
  2.  讀取 `votes` 欄位中的所有加密選票。
  3.  針對每一張票：
      - 解析出 `Ephemeral_PublicKey`, `Nonce`, `Ciphertext`。
      - 使用 EA 的私鑰進行解密。
      - 比對解密後的 JSON 是否包含正確資訊。
  4.  若解密成功且內容相符，則驗證通過。

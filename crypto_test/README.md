# AIV-Voting Cryptographic Test

這是一個獨立的測試模組，用於驗證 AIV-Voting 系統中的核心密碼學流程。
不依賴區塊鏈，純粹測試密碼學演算法的正確性與安全性。

## 📦 安裝依賴

請確保你已安裝 Node.js (建議 v18+)。

```bash
cd crypto_test
npm install
```

## 🚀 執行測試

```bash
node crypto_flow.js
```

---


## 🧪 測試場景說明 (Demo Scenarios)

### 1. 盲簽名流程 (Blind Signature) - 取得資格憑證
首先，Voter 從 Organizer 取得對自己地址的盲簽名 $S$。
- **流程**：Blind -> Sign -> Unblind -> Verify。
- **結果**：Voter 獲得 $S$，這是 Organizer 對其地址的有效簽名，證明其有投票資格。

### 2. 加密選票信封 (Encrypted Envelope) - 提交選票
我們不加密地址與簽名 (為了讓區塊鏈驗證資格)，只加密投票核心內容。

- ** Payload $V$ 結構**:
  ```json
  {
    "addr": "0x600a...0335", // 明文，供合約驗證擁有者
    "S": "簽名內容...",      // 明文，供合約驗證資格
    "c": "加密Blob..."       // 密文，保護候選人選擇
  }
  ```
- **加密核心 $c$**：只加密 `{"candidate_id":1}`。
- **打包 $c$**：`[EphemeralPK || Nonce || Ciphertext]` (Base64)。
- **驗證**：產出完整 $V$ (含完整公私鑰 log)，並驗證 Organizer 解密 $c$ 後等於 `candidate_id:1`。

### 3. 執行結果範例 (Sample Output)

執行 `node crypto_flow.js` 後，您將會看到：
- **Keys Ready**: 顯示生成的主辦方 X25519 金鑰對與 RSA 金鑰對 (Base64/JWK)。
- **Step 1 (Blind Sign)**: 顯示盲化地址 `addr'`、盲簽名 `S'` 與最終簽名 `S`。
- **Step 2 (Encrypted Envelope)**: 
    - 顯示完整的 Payload `V` (包含 `candidate_id`, `addr`, `S`)。
    - 顯示三次加密的 `Packed Blob`，確認即便內容相同，加密結果也截然不同。
    - 顯示解密結果 `✅ Match`，證明加密與打包流程無誤。


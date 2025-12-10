# 後端狀態報告

**日期:** 2025-12-09

## 1. 整體完成度

**目前完成度:** ~25%

後端目前僅作為一個**基礎身分驗證伺服器 (Basic Authentication Server)** 運作。基礎設施（伺服器、資料庫、認證）已完成，但針對「投票」應用的核心業務邏輯**完全缺失**。

---

## 2. 已完成功能

### A. 基礎設施 (Infrastructure)

- **伺服器**: Express.js 伺服器已配置並運行中 (`index.js`)。
- **資料庫**: MongoDB 連線已透過 Mongoose 實作完成 (`config/db.js`)。
- **環境設定**: 已設置 `.env` 環境變數配置。
- **中介軟體 (Middleware)**: 已啟用 CORS 與 JSON 解析功能。

### B. 身分與使用者管理 (Authentication & User Management)

- **使用者模型 (`model/User.js`)**:
  - 已實作欄位：`username` (使用者名稱), `password` (密碼), `role` (角色)。
  - 角色邏輯：區分 `voter` (投票者) 與 `organizer` (組織者)。
- **認證路由 (`routes/auth.js`)**:
  - `POST /register`: 使用者註冊，包含密碼加密 (使用 bcryptjs)。
  - `POST /login`: 使用者登入，包含 JWT Token 生成。
  - **安全性**: 密碼經過雜湊處理，Token 經過簽章。

---

## 3. 缺失功能 (投票應用關鍵部分)

以下元件對應應用程式至關重要，但**尚未實作**：

### A. 資料模型 (Missing Models)

- **選舉模型 (Election Model)**: 用於儲存選舉詳情（標題、描述、開始/結束時間、主辦方）。
- **候選人模型 (Candidate Model)**: 用於儲存與特定選舉關聯的候選人資訊。
- **投票模型 (Vote Model)**: 用於追蹤使用者投出的票（防止重複投票）。

### B. API 路由 (Missing Routes)

- **選舉管理**: 建立、讀取、更新、刪除選舉的 API（僅限 Organizer）。
- **投票流程**: 進行投票動作的 API（僅限 Voter）。
- **結果統計**: 計算並取得選舉結果的 API。

---

## 4. 下一步建議

1.  **建立模型**: 在 `backend/model/` 中實作 `Election.js` 與 `Candidate.js`。
2.  **開發路由**: 建立 `routes/elections.js` 以處理選舉相關的 API 請求。
3.  **實作投票邏輯**: 確保嚴格的檢查機制，限制使用者在有效時間內對每場選舉只能投一票。

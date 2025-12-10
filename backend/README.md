# AIV-Voting Backend

此專案是 AIV-Voting 系統的後端 API 服務，使用 Node.js、Express 與 MongoDB 建置。
目前主要提供**使用者認證**功能。

## 🛠 安裝與啟動

### 1. 安裝依賴

在 `backend` 目錄下執行：

```bash
npm install
```

### 2. 環境變數設定 (.env)

確保目錄下有 `.env` 檔案，內容應包含：

```env
MONGO_URI=mongodb://root:example@localhost:27017/aiv-voting?authSource=admin
JWT_SECRET=your_jwt_secret
PORT=5001
```

### 3. 資料庫設定 (使用 Docker)

本專案預設使用 Docker 快速啟動 MongoDB。請執行以下指令來啟動相容於上述設定的資料庫：

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  mongo
```

此指令會：

- 啟動一個 MongoDB 容器
- 設定帳號為 `root`，密碼為 `example`
- 開放 port `27017`
- 這些設定完全對應 `.env` 中的 `MONGO_URI`。

### 3. 啟動伺服器

- **開發模式** (使用 nodemon，存檔自動重啟)：
  ```bash
  npm run dev
  ```
- **正式模式**：
  ```bash
  npm start
  ```
  伺服器預設運行在：`http://localhost:5001`

---

## 🐳 Docker 部署與啟動

如果你想使用 Docker 來運行整個後端服務（包含 MongoDB），請執行以下步驟。

### 常用指令說明

啟動服務：

```bash
docker-compose up -d --build
```

參數解釋：

- **`up` (啟動)**：建立並啟動 `docker-compose.yml` 定義的所有服務（backend 和 mongo）。
- **`-d` (Detached mode / 背景執行)**：讓容器在背景執行，不會佔用終端機視窗。
- **`--build` (強制重新建置)**：強制 Docker 重新編譯映像檔，確保新的套件安裝或程式碼修改生效。

停止服務：

```bash
docker-compose down
```

創建測試帳號

```bash
docker-compose exec backend node seed.js
```

### 開發模式 (Hot Reload)

目前配置已啟用 Hot Reload，當你修改本地程式碼時，容器內的伺服器會自動重啟。

---

## 🗄 資料庫操作

本專案使用 **MongoDB** 作為資料庫，並透過 **Mongoose** 進行操作。

### 資料庫連線

連線設定檔位於 `config/db.js`。系統啟動時會在 `index.js` 自動呼叫 `connectDB()` 建立連線。

###測試資料庫連線
若要單獨測試資料庫設定是否正確，可執行：

```bash
node test-db.js
```

- 若成功：會顯示 `✅ Database Authentication Successful!`
- 若失敗：會顯示錯誤訊息請檢查 `MONGO_URI`。

---

## 🔐 API 說明 (目前可用)

目前後端僅開放 **Authentication (身分驗證)** 路由。

### Base URL

`http://localhost:5000/api/auth`

### 1. 註冊使用者 (Register)

- **URL**: `/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **Response**:
  - `201`: 註冊成功，回傳 JWT Token 與使用者資訊。
  - `400`: 使用者名稱已存在。

### 2. 登入 (Login)

- **URL**: `/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **Response**:
  - `200`: 登入成功，回傳 JWT Token。
  - `400`: 帳號或密碼錯誤。

---

## 📂 專案結構

- **`model/`**: 資料庫模型定義 (Schema)。
  - `User.js`: 定義使用者結構 (username, password, role)。
- **`routes/`**: API 路由定義。
  - `auth.js`: 處理登入與註冊請求。
- **`config/`**: 設定檔。
  - `db.js`: MongoDB 連線邏輯。

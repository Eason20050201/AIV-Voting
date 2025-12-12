# AIV-Voting

AIVVoting - an anonymous and individually verifiable voting system based on blockchain and blind signatures.

## 🚀 Deployment Guide / 部署指南

This project consists of a **Node.js Backend** (hosted locally via Docker + Cloudflare Tunnel) and a **React Frontend** (hosted on GitHub Pages).

### Prerequisites / 事前準備

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) installed for frontend build.

---

### 1️⃣ Backend Deployment (Local + Cloudflare Tunnel)

We use Docker Compose to run the Backend, MongoDB, and Cloudflare Tunnel together.

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Start the services:**

    ```bash
    docker-compose up -d
    ```

3.  **Get the Public URL:**
    Since we are using a Quick Tunnel, the URL changes every time you restart. View the logs to find the assigned URL.
    ```bash
    docker-compose logs cloudflared
    ```
    Look for a line like:
    > `https://xxxx-xxxx-xxxx.trycloudflare.com`

---

### 2️⃣ Frontend Deployment (GitHub Pages)

1.  **Update the API URL:**
    Open `frontend/.env.production` and paste the URL you got from the storage step above.

    ```env
    VITE_API_BASE_URL=https://your-tunnel-url.trycloudflare.com/api/auth
    ```

    _(Note: Keep the `/api/auth` suffix)_

2.  **Deploy to GitHub Pages:**
    Navigate to the frontend directory and run the deploy script.

    ```bash
    cd frontend
    npm run deploy
    ```

3.  **Visit your site:**
    Your app should now be live at:
    > https://Eason20050201.github.io/AIV-Voting

---

### 🛠️ Useful Commands

- **Stop Backend:** `docker-compose down` (in `backend/` folder)
- **Restart Backend:** `docker-compose restart`
- **View Tunnel Logs:** `docker-compose logs -f cloudflared`
- **Reset Database:** `docker-compose exec backend node seed.js` (Resets DB & creates default users)

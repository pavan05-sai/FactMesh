# FactMesh — Production Deployment Guide (Vercel & Render)

This guide walks you through deploying **FactMesh** to production using **Vercel** for the React frontend, **Render** for the Express & Socket.IO backend, and **MongoDB Atlas** for managed database storage.

---

## 1. Database Setup: MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free account.
2. Click **Create a Deployment** → Choose **M0 Free Cluster**.
3. Under **Database Access**: Create a database user (e.g. `factmesh_user`) and password.
4. Under **Network Access**: Add `0.0.0.0/0` (allow access from anywhere) so Render cloud containers can connect.
5. Click **Connect** → **Drivers** → Copy your connection string:
   ```
   mongodb+srv://factmesh_user:<password>@cluster0.mongodb.net/factmesh?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment: Render

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `factmesh-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add the following **Environment Variables**:

| Variable | Value / Description |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `OPENAI_API_KEY` | Your OpenAI API key (`sk-...`) |
| `TAVILY_API_KEY` | Your Tavily API key (`tvly-...`) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret string |
| `ALLOWED_ORIGINS` | Your Vercel domain (e.g. `https://factmesh.vercel.app`) |

7. Click **Create Web Service**.
8. Note your Render service URL once deployed (e.g. `https://factmesh-backend.onrender.com`).

---

## 3. Frontend Deployment: Vercel

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
5. Expand **Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://factmesh-backend.onrender.com` (Your Render URL) |
| `VITE_SOCKET_URL` | `https://factmesh-backend.onrender.com` (Your Render URL) |

6. Click **Deploy**.
7. Once deployment finishes, Vercel will provide your live application URL (e.g. `https://factmesh.vercel.app`).

---

## 4. Final Verification

1. Open your live Vercel URL in your browser.
2. Sign in or register a user account.
3. Enter a research topic (e.g. *"Discoveries of the James Webb Space Telescope"*).
4. Verify that all 6 agents execute in sequence with real-time Socket.IO status updates.
5. Check claim verification matrix, report exports (PDF, Markdown, JSON), and dashboard history.

---

## Troubleshooting & Maintenance

- **CORS Errors**: Ensure `ALLOWED_ORIGINS` in Render matches your exact Vercel URL (including `https://` without trailing slash).
- **Socket.IO Disconnects**: Render free tier services spin down after 15 minutes of inactivity. The first request after sleep may take ~30 seconds to wake up the backend.
- **Logs**: View live server logs directly in the Render dashboard console under the **Logs** tab.

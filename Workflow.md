# Grill-Me AI Architect App

A full-stack AI application featuring an interactive system architecture interviewer powered by Gemini 3.8-flash (via Google ADK), hosted with a FastAPI backend and a Next.js frontend with Tailwind CSS and syntax-highlighted Markdown rendering.

---

## 🏗️ Architecture Overview

* **Backend:** FastAPI, Python 3.10+, Google ADK (`google-adk`), Uvicorn.
* **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, `react-markdown`, `react-syntax-highlighter`.
* **Deployment:**
  * **Frontend:** Hosted on [Vercel](https://vercel.com)
  * **Backend:** Hosted on [Render](https://render.com) (or similar Python cloud platform)

---

## 🛠️ Project Structure

```text
interviewer_app/
├── backend/                  # FastAPI Application
│   ├── grill_agent/
│   │   └── agent.py          # Google ADK Agent Definition
│   ├── main.py               # FastAPI entrypoint & ADK server
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Local backend env variables
│
└── frontend/                 # Next.js Application
    ├── app/
    │   └── page.tsx          # Main Chat UI Component
    ├── components/
    │   └── MarkdownMessage.tsx # Markdown & syntax highlighting renderer
    ├── lib/
    │   └── api.ts            # API interaction helpers
    └── package.json
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
* Python 3.10 or higher
* Node.js (v18 or higher)
* Git installed and configured

---

### 2. Backend Setup (FastAPI)

1. Open terminal in the project root/backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi[standard] uvicorn google-adk python-dotenv
   ```
4. Create a `.env` file inside the backend directory:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```
5. Run the local backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will be running at `http://localhost:8000`.*

---

### 3. Frontend Setup (Next.js)

1. Open a **new terminal window** and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   npm install react-markdown remark-gfm react-syntax-highlighter
   npm install --save-dev @types/react-syntax-highlighter
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

---

## 🌐 Production Deployment Guide

### Step 1: Deploy Backend to Render

1. Create a public or private GitHub repository for your backend code.
2. Push your backend code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare backend for deployment"
   git push -u origin main
   ```
3. Log in to [Render](https://render.com) and click **New +** → **Web Service**.
4. Connect your backend GitHub repository.
5. Configure the web service:
   * **Runtime:** Python 3
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under **Environment Variables**, add:
   * Key: `GOOGLE_API_KEY` | Value: *(Your Gemini API key)*
7. Click **Create Web Service** and copy your live backend URL (e.g., `https://your-backend.onrender.com`).

---

### Step 2: Connect Frontend to Production Backend

1. Update `frontend/lib/api.ts` to use your live backend URL:
   ```typescript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://your-backend.onrender.com";
   ```

---

### Step 3: Deploy Frontend to Vercel

1. Push your frontend code to its GitHub repository:
   ```bash
   cd frontend
   git add .
   git commit -m "Update API endpoint for production"
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
3. Import your frontend repository.
4. Set the **Framework Preset** to Next.js (Root directory: `./`).
5. (Optional) Under **Environment Variables**, add:
   * Key: `NEXT_PUBLIC_API_URL` | Value: `https://your-backend.onrender.com`
6. Click **Deploy**. Vercel will build and assign you a live production URL!

---

## 🔄 Daily Workflow: Pushing Updates to GitHub

Whenever you modify your local files, follow these steps to automatically sync changes to your live site:

### Option A: Using PyCharm (GUI)
1. Press `Ctrl + K` (or `Cmd + K` on Mac) to open the **Commit** tab.
2. Select the modified files and type a commit message.
3. Click the dropdown arrow next to **Commit** and select **Commit and Push**.

### Option B: Using Terminal
```bash
git add .
git commit -m "Describe your updates here"
git push
```
*Vercel and Render will automatically detect the new commit on GitHub and re-deploy your app within minutes.*
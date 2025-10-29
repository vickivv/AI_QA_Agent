# 🧪 AI TestGen Frontend

This is the **frontend** of the AI QA Agent project — a web-based IDE built with **React + TypeScript + Vite**.  
It allows you to edit Python source files, highlight code, and generate test cases using AI agent.

---

## ⚙️ Tech Stack
- ⚛️ **React 18** – UI framework
- 🌀 **Vite** – Fast build & dev tool
- 🧩 **TypeScript** – Type-safe development
- 💡 **Monaco Editor** – Code editor (same as VS Code)
- 🧭 **Lucide Icons** – Modern icon set

---

## 🪜 1. Installation Guide

> 💡 If you haven’t installed React or Node.js before — React isn’t installed “globally”; it comes automatically when you use npm to install your project dependencies.

### ✅ Step 1: Install Node.js
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS (Long-Term Support)** version for your system.
3. Install it — this will also include **npm (Node Package Manager)**.

👉 Verify installation:
node -v
npm -v

### ✅ Step 2: Install project dependencies
From the frontend/ directory:

cd frontend
npm install

### ✅ Step 3: Start the Development Server
npm run dev


Once the server starts, open [http://localhost:5173](http://localhost:5173) in your browser to view the app 🎉  
If you have the backend running at `http://127.0.0.1:8000`, the AI TestGen IDE will automatically connect to it through the `/api` proxy.

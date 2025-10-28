# 🧪 AI TestGen — AI QA Agent Project

This project is an **AI-powered test generation platform** that helps developers automatically create unit tests for Python code.
It combines a **FastAPI backend** for code analysis and test generation with a **React + TypeScript + Vite frontend** for an IDE-like user experience.

---

## ⚙️ Tech Stack

| Layer           | Technology                                                  | Description                             |
| --------------- | ----------------------------------------------------------- | --------------------------------------- |
| 🐍 **Backend**  | TBD                   | Handles AI test generation APIs         |
| ⚛️ **Frontend** | [React + TypeScript + Vite](https://vitejs.dev/)            | Interactive code editor and test viewer |

---

## 🏗️ Project Structure

```
ai-qa-agent/
├── backend/                 # FastAPI backend 
│   └── placeholder.md
│
├── frontend/                # React + TypeScript frontend 
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 🐍 Backend Setup (TBD)

---

### ⚛️ Frontend Setup

The frontend uses **React + TypeScript + Vite**.
To start local development:

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

> Note: The Vite dev server is configured to proxy `/api` requests to `http://127.0.0.1:8000` for FastAPI.

---

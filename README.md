# SyncScore AI 🚀

> AI-Powered Team Contribution & Project Intelligence Platform.  
> **"Know who is really contributing — not just who talks the most."**

SyncScore AI is a modern full-stack MERN application designed for collegiate students and engineering team leaders. The platform tracks member workloads, sprint tasks, automated commit activities, and generates real-time telemetry metrics (team health scores, inactive member lists, deadline risks) alongside mock AI-synthesized reports.

---

## 🌟 Key Features

* **🔑 Secure Authentication**: Role-based access control (`student`, `team_leader`, `professor`, `manager`, `admin`) secured with JWT cookies and Bcrypt password hashing.
* **📂 Project Workspaces**: Configure collaborative workspaces, set deadlines, link repositories, and manage team members by email.
* **📋 Task Workflows**: Create, assign, prioritize (`low`, `medium`, `high`, `critical`), and track task statuses (`todo`, `in_progress`, `review`, `completed`).
* **📊 Analytics Engine**: Real-time telemetry computing project completion percentage, workload balance shares (using Recharts), 5-day inactivity alerts, and overall sprint health score out of 100.
* **🤖 AI Report Generation**: Modular prompt utilities parsing sprint statistics to yield textual summaries and suggested next actions.
* **🐙 GitHub Connection**: Mock import system matching commit hashes to linked users and logging their impact weights directly.

---

## 🛠️ Tech Stack

* **Frontend**: React.js, Vite, Tailwind CSS v3, React Router v6, Axios, Recharts, Lucide Icons.
* **Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Bcrypt, Helmet, CORS.

---

## 📂 Folder Architecture

```text
SyncScore/
├── backend/                  # Node.js Serverless API
│   ├── src/
│   │   ├── config/           # DB Connections
│   │   ├── controllers/      # Route Handlers
│   │   ├── middleware/       # JWT & Security filters
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # GitHub & AI summary handlers
│   │   ├── utils/            # Calculation helpers
│   │   └── server.js         # Express App Entrypoint
│   ├── vercel.json           # Serverless Node config
│   └── package.json
├── frontend/                 # React Single Page App (SPA)
│   ├── src/
│   │   ├── api/              # Axios wrappers
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Global Auth state
│   │   ├── pages/            # View routes
│   │   ├── routes/           # Protected layout filters
│   │   ├── utils/            # Formatter functions
│   │   ├── App.jsx           # Root layout
│   │   └── main.jsx
│   ├── vercel.json           # SPA rewrites configuration
│   └── package.json
├── run.bat                   # Parallel launch script for Windows
└── README.md
```

---

## ⚙️ Local Setup Instructions

### 1. Database Configuration
1. Spin up a local MongoDB service or create a free **M0 Tier** cluster on [MongoDB Atlas](https://www.mongodb.com/).
2. Keep your Connection String handy (e.g. `mongodb+srv://...`).

### 2. Configure Environment Files
* In `backend/.env`:
  ```env
  PORT=5000
  MONGO_URI=your_mongodb_connection_string
  NODE_ENV=development
  JWT_SECRET=yoursecretkey
  ```
* In `frontend/.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:5000/api
  ```

### 3. Quick Run (Windows)
Double-click `run.bat` in the root folder. This automatically handles dependency installation and starts both servers:
* Backend: `http://localhost:5000`
* Frontend: `http://localhost:5173`

---

## 🚀 Deployment to Vercel

Both frontend and backend are optimized with `vercel.json` configurations to deploy directly onto Vercel.

### 1. Deploy the Backend API
1. Import the project repository into Vercel.
2. Select **`backend`** as the Root Directory.
3. Configure the Framework Preset to **Other**.
4. Add the following **Environment Variables**:
   * `MONGO_URI`
   * `JWT_SECRET`
   * `NODE_ENV=production`
5. Click **Deploy**. Your backend will be hosted as Vercel Serverless Functions.

### 2. Deploy the Frontend Client
1. Import the same repository as a new project on Vercel.
2. Select **`frontend`** as the Root Directory.
3. Vercel will automatically detect **Vite** as the framework.
4. Add the following **Environment Variable**:
   * `VITE_API_BASE_URL` (Set this to the production URL of your backend API deployed in Step 1, e.g. `https://your-backend.vercel.app/api`).
5. Click **Deploy**. The React Router will build and load successfully with SPA routing fallback redirects.

---



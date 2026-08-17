# Smart_Class_470 — Setup Guide

This folder is a fresh copy of the Classroom Smart Attendance project, with a **new, empty git history**. All the code is physically here and already works — what's missing is *commit history*. That's on purpose: only the shared core scaffold has been committed so far. Each member commits their own module's files themselves, so GitHub correctly shows who contributed what.

## 0. Prerequisites

- Node.js (LTS) + npm
- MongoDB — either a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Git + a GitHub account

## 1. One-time: push the scaffold to GitHub

(Whoever is setting this up does this once.)

```
cd D:\Smart_Class_470
git status                     # confirm the scaffold commit is already made
```

Create a new **empty** repository on GitHub (no README/license — this folder already has history), then:

```
git remote add origin https://github.com/<your-username>/<new-repo-name>.git
git branch -M main
git push -u origin main
```

Add your 3 teammates as collaborators: repo → **Settings → Collaborators → Add people**.

## 2. Everyone: local setup

```
git clone https://github.com/<your-username>/<new-repo-name>.git
cd <new-repo-name>
```

**Backend:**
```
cd backend
npm install
copy .env.example .env      # (Mac/Linux: cp .env.example .env)
```
Edit `.env` and fill in real values:
```
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<any random string>
PORT=5000
```

**Frontend:**
```
cd ../frontend
npm install
```

**Run both at once** (from the project root):
```
npm install
npm run dev
```
This starts the backend on `http://localhost:5000` and the frontend on `http://localhost:3000`.

## 3. Everyone: upload your part

Each member's exact file list is documented in the original project's `member-share/Member-N/README.md`. Use it as your checklist.

```
git checkout -b member-N-<your-module-name>
git add backend/routes/<your files> backend/controllers/<your files> backend/models/<your files>
git add frontend/src/components/<your files>
git commit -m "Add <your module> — <your name>"
git push -u origin member-N-<your-module-name>
```

Then open a Pull Request into `main` on GitHub. Once all 4 are merged, the repo is complete and every member's contribution is visible in the commit history and the GitHub contributors graph.

## What's already committed (the shared scaffold)

- Backend: `server.js`, `config/db.js`, `middleware/authMiddleware.js`, `models/User.js`, `routes/auth.js`, `controllers/authController.js`
- Frontend: `App.js`, `index.js`, `index.css`, `App.css`, `public/`, `components/Home.js`, `components/StudentLogin.js`, `components/TeacherLogin.js`, `components/Signup.js`, `components/Classroom/ClassroomPage.js`
- Config: both `package.json` files, `.gitignore`, `backend/.env.example`

Everything else (all 4 modules' routes/controllers/models/components, plus `TeacherDashboard.js`, `StudentDashboard.js`, `CreateClassroom.js`) is sitting in your working directory right now, untracked — ready for the right member to `git add` and commit.

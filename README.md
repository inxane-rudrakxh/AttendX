# AttendX – AI-Powered Smart Attendance System

<div align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110-green?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/DeepFace-AI-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/SQLite-DB-orange?style=for-the-badge&logo=sqlite" />
</div>

A production-ready, full-stack attendance management system with face recognition, role-based dashboards, analytics, and ML-powered attendance prediction.

---

## 📁 Project Structure

```
AttendX/
├── backend/
│   ├── main.py                      # FastAPI app entry
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── database.py
│       ├── models/                  # SQLAlchemy models
│       │   ├── user.py, student.py, attendance.py, intruder.py
│       ├── routes/                  # API route handlers
│       │   ├── auth.py, users.py, students.py
│       │   ├── attendance.py, analytics.py, intruder.py
│       ├── services/
│       │   ├── auth_service.py      # JWT + bcrypt
│       │   └── face_recognition_service.py  # DeepFace + OpenCV
│       ├── ml/
│       │   ├── predict.py           # Risk prediction
│       │   ├── train_model.py       # scikit-learn training
│       │   └── sample_data.py       # Synthetic data generator
│       └── utils/
│           ├── dependencies.py      # JWT DI
│           └── seed.py              # DB seeder
└── frontend/
    └── src/
        ├── App.jsx, main.jsx
        ├── context/AuthContext.jsx
        ├── utils/api.js
        ├── components/              # Sidebar, StatCard, Loader
        └── pages/                   # All page components
```

---

## 🚀 Local Setup & Run

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **pip** and **npm**

---

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the backend server
uvicorn main:app --reload --port 8000
```

> ⚠️ **First-time startup** automatically:
> - Creates the SQLite database (`attendx.db`)
> - Seeds default users (admin, teacher, 5 students)

> ⚠️ **DeepFace** will download model weights (~550MB) on first face recognition call.

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Demo Login Credentials

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@attendx.com        | admin123     |
| Teacher | teacher@attendx.com      | teacher123   |
| Student | alice@attendx.com        | student123   |
| Student | bob@attendx.com          | student123   |

---

## 📊 Generate Sample Attendance Data

After starting the backend, run in a second terminal:

```bash
cd backend
python -m app.ml.sample_data
```

This creates 60 days of synthetic attendance records for all students.

---

## 🤖 Train ML Prediction Model

```bash
cd backend
python -m app.ml.train_model
```

This trains a RandomForest model on attendance history and enables the `/analytics/predict/{student_id}` endpoint to return ML-based risk scores.

---

## 👁️ Face Recognition Setup

1. Log in as **Teacher** or **Admin**
2. Go to **Attendance** page → **Register Student Face**
3. Select a student from the dropdown
4. Click **Open Camera** → position student in frame → **Capture & Register**
5. Now use **Auto-Scan** or **Capture Once** to mark attendance via face

> 💡 The system uses **OpenCV** histogram comparison for face recognition to maintain high compatibility across environments.
---
## 📡 API Endpoints

| Method | Endpoint                      | Description                    |
|--------|-------------------------------|--------------------------------|
| POST   | /auth/login                   | Get JWT token                  |
| POST   | /auth/register                | Register new user              |
| GET    | /students/                    | List all students              |
| POST   | /attendance/mark-face         | Mark via face recognition      |
| POST   | /attendance/mark-manual       | Manual attendance mark         |
| GET    | /attendance/export-csv        | Download CSV report            |
| GET    | /analytics/summary            | Dashboard summary              |
| GET    | /analytics/trends?days=30     | Daily attendance trends        |
| GET    | /analytics/predict/{id}       | ML risk prediction             |
| GET    | /intruder/logs                | List intruder detections       |

Interactive docs: **http://localhost:8000/docs**

---

## 🔐 Roles & Permissions

| Feature                     | Admin | Teacher | Student |
|-----------------------------|-------|---------|---------|
| View all students           | ✅    | ✅      | ❌      |
| Take attendance (camera)    | ✅    | ✅      | ❌      |
| Mark manual attendance      | ✅    | ✅      | ❌      |
| View analytics              | ✅    | ✅      | ❌      |
| View own attendance         | ✅    | ✅      | ✅      |
| Register face               | ✅    | ✅      | ❌      |
| View intruder logs          | ✅    | ✅      | ❌      |
| Manage users                | ✅    | ❌      | ❌      |

---

## ⚙️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Chart.js |
| Backend   | Python, FastAPI, Uvicorn          |
| Auth      | JWT (python-jose), bcrypt         |
| Database  | SQLite + SQLAlchemy ORM           |
| AI/ML     | DeepFace, OpenCV, scikit-learn    |
| State     | React Context API, Axios          |

---

## 🎨 UI Features

- 🌑 Dark glassmorphism theme with gradient accents  
- 📊 Interactive Chart.js line/bar/donut charts  
- 📷 Live webcam face recognition with auto-scan loop  
- 🔔 Toast notifications (react-hot-toast)  
- 📱 Responsive layout  
- ✨ Smooth fade-in animations

---

> Built for Innovex Hackathon · AttendX © 2026

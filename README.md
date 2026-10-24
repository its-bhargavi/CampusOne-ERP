# CampusOne ERP — MERN Stack with Role-Based Modules & AI Assistant

A full-stack college ERP prototype built with **React, Node.js, Express, MongoDB, Mongoose, JWT, and bcryptjs**, plus an optional LLM API for the AI assistant. The student, faculty, and admin dashboards have different modules and permissions.

> Educational demo with sample data. Not production-ready. Do not use the seeded credentials or sample events in a real deployment.

## Role-specific modules

### Student
- View personal attendance and 75% target status.
- Browse student perks, campus events, and announcements.
- Submit course/campus feedback.
- Use the common AI assistant, with student-authorized context.

### Faculty
- View Machine Learning lecture schedules and timings.
- Mark each demo student present or absent for the next class; the aggregate attendance count is updated.
- Review student feedback and mark it reviewed.
- Publish announcements for students, faculty, or everyone.
- Use the common AI assistant with faculty-authorized context.

### Admin
- No attendance module or AI assistant in the admin navigation.
- Manage and delete student perks and campus events.
- Publish and delete announcements with audience targeting.
- Create and delete lecture schedules.
- Review student feedback.
- View the available role/workspace overview.
- Use the common AI assistant with admin-authorized context.

**The door-monitor module has been removed. Faculty demo data focuses on one subject: Machine Learning, with three sample student names and editable present/absent status. Student announcements, events, perks, lectures, and feedback contain illustrative showcase content.** Lecture schedules are for displaying class timings; this prototype does not automatically notify students or integrate with a college timetable system.

## Tech stack
- Frontend: React 18, JavaScript, HTML, CSS, Vite, Lucide React
- Backend: Node.js, Express 4
- Database: MongoDB, Mongoose
- Authentication: JWT (`jsonwebtoken`), bcryptjs
- Configuration/middleware: dotenv, cors
- Optional AI: OpenAI-compatible Chat Completions API
- Tools: npm, nodemon, concurrently, Git/GitHub

## Prerequisites
- Node.js 20+ and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Run on Windows

### 1. Configure the backend
From the project root in PowerShell:
```powershell
Copy-Item server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sih_erp
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
AI_ENABLED=false
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```
Use a long random JWT secret. Never commit `.env`.

### 2. Install dependencies
From the project root:
```powershell
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Seed the demo database
Make sure MongoDB is running:
```powershell
npm run seed
```
**Warning:** the seed script clears and recreates demo collections. Only run it when you want to reset sample data.

Demo accounts:
| Role | Username | Password |
|---|---|---|
| Student | `student` | `student123` |
| Student | `riya` | `student123` |
| Student | `kabir` | `student123` |
| Faculty | `faculty` | `faculty123` |
| Admin | `admin` | `admin123` |

The signup screen lets showcase users create an account and choose a demo role. This is intentionally open for a student project demonstration; never allow public self-registration as `ADMIN` in a real deployment. Use seeded accounts for the pre-populated demo data.

All three demo users use sample data. Passwords are stored as bcrypt hashes.

### 4. Start both apps
```powershell
npm run dev
```
Open **http://localhost:5173**. Vite proxies `/api` requests to Express on port 5000.

Health check: http://localhost:5000/api/health

<img width="960" height="600" alt="image" src="https://github.com/user-attachments/assets/f2287546-81d6-43e5-838d-9e53fccea85a" />

## API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Sign in and receive JWT |
| POST | `/api/auth/signup` | Public | Create a showcase account (role selection is demo-only) |
| GET | `/api/auth/me` | Signed in | Current user |
| GET | `/api/dashboard` | Signed in | Role-specific ERP data |
| GET | `/api/attendance` | Signed in | Authorized attendance |
| POST | `/api/attendance` | Faculty/Admin | Update attendance |
| POST | `/api/perks` | Admin | Add student perk |
| DELETE | `/api/perks/:id` | Admin | Delete student perk |
| POST | `/api/events` | Admin | Add campus event |
| DELETE | `/api/events/:id` | Admin | Delete campus event |
| POST | `/api/announcements` | Faculty/Admin | Publish targeted announcement |
| DELETE | `/api/announcements/:id` | Admin | Delete announcement |
| POST | `/api/lectures` | Faculty/Admin | Add lecture timing |
| DELETE | `/api/lectures/:id` | Admin | Delete lecture schedule |
| POST | `/api/feedback` | Student | Submit feedback |
| PATCH | `/api/feedback/:id` | Faculty/Admin | Mark feedback reviewed |
| POST | `/api/chat` | Signed in | Ask role-aware assistant |

## How the AI assistant works
1. React submits a question to Express at `POST /api/chat`.
2. Express verifies the JWT and identifies the user's role.
3. The backend retrieves only records intended for that role.
4. The local assistant answers common questions about attendance, lecture schedules, announcements, feedback, events, and perks.
5. If `AI_ENABLED=true` and a provider key is configured, the server sends a limited role-authorized context and the question to an OpenAI-compatible LLM API.
6. If the API is unavailable, the assistant uses the local fallback.

## Important limitations
- Demo accounts and seeded content are illustrative.
- Admin's “User & role overview” is a summary, not a full user-management interface.
- No real college identity provider, attendance device, or timetable service is connected.
- Add CSRF/rate-limit controls, audit logs, stricter row-level access tests, robust monitoring, and deployment secrets management before production use.
- AI can be inaccurate; do not rely on it for consequential academic decisions.


## Author
Bhargavi Verma

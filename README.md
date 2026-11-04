# 🏥 MediPulse — Patient Appointment Management System
### Full-Stack Clinical Scheduling Engine & Multi-Tier Healthcare Operations Platform
**Web Technologies and Mobile Programming (WTMP) Course Project • SR University**

[![CI Pipeline](https://github.com/ShivaGanesh1080-ops/patient-appointment-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/ShivaGanesh1080-ops/patient-appointment-management-system/actions)
[![Live Production Demo](https://img.shields.io/badge/Production-medipulse--sru.vercel.app-059669?style=flat&logo=vercel)](https://medipulse-sru.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-000000?logo=express)](https://expressjs.com/)
[![SQLite 3](https://img.shields.io/badge/SQLite-v3%20WAL-003B57?logo=sqlite)](https://sqlite.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?logo=docker)](https://www.docker.com/)

---

## 🌐 Live Direct Role & Portal URLs

MediPulse integrates three distinct operational workspaces into a single glassmorphic dashboard with instant URL hash routing:

| User Persona | Direct Live URL | Primary Purpose |
| :--- | :--- | :--- |
| **👤 Patient / Public Portal** | [`https://medipulse-sru.vercel.app/#tab-doctors`](https://medipulse-sru.vercel.app/#tab-doctors) | Browse 12+ verified specialists across 6 departments, real-time 30-min slot picker, atomic reservation, and printable OPD consultation slips. |
| **📅 Patient Booking Form** | [`https://medipulse-sru.vercel.app/#tab-booking`](https://medipulse-sru.vercel.app/#tab-booking) | Direct slot reservation with 1-click **⚡ Demo Patient** autofill and inline 10-digit phone verification. |
| **📋 Patient Passes & History** | [`https://medipulse-sru.vercel.app/#tab-history`](https://medipulse-sru.vercel.app/#tab-history) | Self-service lookup by mobile number or booking reference (`APT-2026-XXXX`) with 1-click cancellation and slot recovery. |
| **👨‍⚕️ Doctor Clinical Workspace** | [`https://medipulse-sru.vercel.app/#tab-portal`](https://medipulse-sru.vercel.app/#tab-portal) | Physician consultation desk: real-time patient queue for today, triage notes, one-click `Mark Completed` / `Cancel`, and fee tracking. |
| **⚙️ Hospital Admin Console** | [`https://medipulse-sru.vercel.app/#tab-admin`](https://medipulse-sru.vercel.app/#tab-admin) | Operations desk: register new doctors (`POST /api/doctors`), set consultation fees, configure clinic schedules, and offboard specialists. |
| **🎓 Architecture & Viva Guide** | [`https://medipulse-sru.vercel.app/#tab-viva`](https://medipulse-sru.vercel.app/#tab-viva) | Interactive REST API tester, 60-second viva defense cheat sheet, and visual client-to-database execution trace. |

---

## 🏗️ Multi-Tier System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                PRESENTATION TIER (Browser Client)                       |
|   HTML5 Semantic Structure | Tailwind CSS | Plus Jakarta Sans | FontAwesome 6 | ES6+    |
|   - Dual-Mode Portal Switcher: [ Patient Portal  |  Doctor Workspace  |  Admin Console ]|
|   - Real-Time Slot Picker & 1-Click "⚡ Demo Patient" Autofill                           |
|   - Shimmer / Skeleton Loaders & Google Calendar + .ics File Export                     |
+-----------------------------------------------------------------------------------------+
                                             |
                                  REST API Over HTTPS (JSON)
                                  Native Fetch API (async/await)
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                APPLICATION TIER (Node.js & Express)                     |
|   - Express.js Engine (Port 5000 / Vercel Serverless Function)                          |
|   - Security Layer: Helmet (Custom CSP) • Tiered Rate Limiting (General + Anti-Bot)     |
|   - Diagnostics Probe: GET /api/health (DB latency ping, memory RSS/heap, uptime)       |
|   - Concurrency Engine: Compound slot locking returning HTTP 409 Conflict               |
|   - Graceful Draining: SIGTERM / SIGINT shutdown with SQLite WAL checkpoint flushing    |
+-----------------------------------------------------------------------------------------+
                                             |
                                    Parameterized SQL Queries
                                   (WAL Mode & Foreign Keys ON)
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                DATA PERSISTENCE TIER (SQLite 3)                         |
|   - departments: id, name, icon, description                                            |
|   - doctors: id, department_id, name, qualification, fee, rating, clinic_address, days  |
|   - appointments: id, booking_reference, doctor_id, patient details, date, time, status |
+-----------------------------------------------------------------------------------------+
```

---

## 🛡️ Defensive Security & Engineering Resilience

1. **Helmet HTTP Security Headers:** Enforces Content Security Policy (CSP), `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security` to block XSS and clickjacking.
2. **Tiered Rate Limiting (`express-rate-limit`):**
   - General API: 300 requests / 15 minutes.
   - Anti-Bot Booking & Cancellation: 30 requests / 15 minutes per IP.
3. **Double-Booking Concurrency Guard:** Prevents race conditions at the persistence layer:
   ```sql
   SELECT id FROM appointments 
   WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'CANCELLED';
   ```
   If an appointment exists for that 30-minute block, the backend immediately aborts and returns **HTTP 409 Conflict**.
4. **Active Diagnostic Health Probe (`GET /api/health`):** Measures live database round-trip ping in milliseconds, process uptime, and memory heap allocation.

---

## 📡 RESTful API Specification

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Deep diagnostic system probe (DB ping latency, RAM, uptime) | `200` |
| `GET` | `/api/departments` | List all 6 medical departments with active specialist counts | `200` |
| `GET` | `/api/doctors` | List doctors with multi-param search, department filter, and sorting | `200` |
| `GET` | `/api/doctors/:id` | Get physician profile, clinical bio, and consultation history stats | `200`, `404` |
| `POST` | `/api/doctors` | **Hospital Admin:** Onboard a new specialist with clinic hours and fee | `201`, `400` |
| `DELETE` | `/api/doctors/:id` | **Hospital Admin:** Offboard a specialist from the directory | `200`, `404` |
| `GET` | `/api/slots` | Compute dynamic 30-min available slots for doctor and date | `200`, `400` |
| `POST` | `/api/appointments` | Book appointment with atomic concurrency guard | `201`, `400`, `409` |
| `GET` | `/api/appointments` | Query appointments by patient phone, reference token, or doctor | `200` |
| `PATCH` | `/api/appointments/:ref/cancel` | Cancel an appointment and immediately restore slot availability | `200`, `400`, `404` |
| `PATCH` | `/api/appointments/:ref/status` | **Doctor Portal:** Update consultation status (`COMPLETED` / `CANCELLED`) | `200`, `400`, `404` |
| `GET` | `/api/stats` | Aggregated metrics: confirmed visits, unique patients, department volume | `200` |

---

## ⚡ Quick Start: Local Development

### Prerequisites
- Node.js v20+ or v22+
- NPM v10+

```bash
# 1. Clone the repository
git clone https://github.com/ShivaGanesh1080-ops/patient-appointment-management-system.git
cd patient-appointment-management-system

# 2. Install dependencies
npm install

# 3. Start local development server
npm start
# Server listens at http://localhost:5000

# 4. Run automated 10-phase verification suite
node test_system.js
```

---

## 🐳 Docker Deployment

The application includes a multi-stage Dockerfile and Docker Compose configuration for 1-command containerized execution:

```bash
# Build and run the entire stack with persistent SQLite volume
docker compose up -d

# Check container health status
docker compose ps

# View real-time container logs
docker compose logs -f

# Stop container
docker compose down
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + K`** or **`/`** | Focus doctor search bar from anywhere |
| **`Esc`** | Close open modals (appointment slip, doctor bio, cancellation) |

---

## 🎓 Academic Viva Defense Reference

When demonstrating this project to university examiners:
1. **Show the 3 Roles in the Top Bar:** Toggle between **Patient Portal**, **Doctor Workspace**, and **Admin Console**.
2. **Demonstrate 1-Click Testing:** On the booking form, click **⚡ Demo Patient** to instantly prefill valid inputs.
3. **Demonstrate Concurrency Control:** In Tab 5 (*Architecture & Viva*), show the examiner how the system handles simultaneous requests and returns **HTTP 409 Conflict**.
4. **Demonstrate the Health Probe:** Open `/api/health` to prove active database latency measurement, memory monitoring, and rate limiting.

---

### Project Attribution
- **Institution:** SR University, Warangal, Telangana - 506371
- **Course:** Web Technologies and Mobile Programming (WTMP)
- **Faculty Guide:** Mr. Bura Vijay Kumar (Assistant Professor, School of CS&AI)
- **Head of Department:** Dr. M. Sheshikala (Professor & Head, School of CS&AI)
- **Team Leader:** Shiva Ganesh Akku (2503A51110)

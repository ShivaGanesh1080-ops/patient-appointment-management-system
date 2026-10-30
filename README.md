# MediPulse — Patient Appointment Management System
**WTMP (Web Technology & Mobile Programming) Major Academic Project**

> **Author:** Shiva Ganesh Akku  
> **Roll Number:** 2503A51110  
> **Course:** Web Technology & Mobile Programming (WTMP), 2nd Year CSE  
> **Institution:** SR University  

---

## 📌 Executive Summary

**MediPulse** is a full-stack clinical appointment booking and schedule management platform designed to eliminate waiting queues, prevent booking conflicts, and streamline doctor-patient interactions.

Built from scratch strictly conforming to the WTMP curriculum guidelines, it demonstrates proficiency across:
- **HTML5:** Semantic element architecture (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<dialog>`), strict form inputs, and accessibility tags.
- **CSS3 & Tailwind CSS:** Mobile-first responsive layouts, Flexbox, CSS Grid, custom glassmorphism, and print media queries for physical appointment slips.
- **Modern JavaScript (ES6+):** Object-oriented and functional modular code, asynchronous data fetching via Native Fetch API, client-side input validation, and real-time DOM reconciliation.
- **Node.js & Express.js:** Scalable RESTful API architecture with modular routers, custom middleware (CORS, Morgan request logger, input validation, global error handler).
- **Relational Database (SQLite):** Production-grade SQL relational tables with foreign key constraints, indexes, transaction isolation, and database-level double-booking concurrency prevention.

---

## 🏗️ System Architecture

```
                          ┌─────────────────────────────────────┐
                          │         CLIENT BROWSER (UI)         │
                          │   HTML5 • CSS3 • Tailwind • ES6+   │
                          └──────────────────┬──────────────────┘
                                             │ HTTP/1.1 (JSON)
                                             │ Fetch API (async/await)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │       NODE.JS & EXPRESS SERVER      │
                          │        (Port 5000 / REST API)       │
                          ├──────────────────┬──────────────────┤
                          │    Middleware    │ CORS, Morgan,    │
                          │     Pipeline     │ Validator, Errors│
                          ├──────────────────┼──────────────────┤
                          │                  │ /api/doctors     │
                          │   REST Routers   │ /api/slots       │
                          │                  │ /api/appointments│
                          │                  │ /api/stats       │
                          └──────────────────┬──────────────────┘
                                             │ SQL Prepared Statements
                                             │ WAL Mode & Foreign Keys
                                             ▼
                          ┌─────────────────────────────────────┐
                          │          SQLITE DATABASE            │
                          │  departments • doctors • appointments│
                          └─────────────────────────────────────┘
```

---

## 🌟 Key Functional Features

1. **Doctor Directory & Profiles:**
   - Filter by medical specialty (Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, General Medicine).
   - Real-time search across doctor names, qualifications, and clinic locations.
   - Comprehensive profiles showcasing qualifications, years of experience, ratings, consultation fees, working days, and bio.

2. **Dynamic Slot Calculator & Calendar:**
   - Evaluates a doctor's weekly working schedule.
   - Generates 30-minute intervals between clinic start and end times.
   - Categorizes slots into **Morning**, **Afternoon**, and **Evening** sessions.
   - Real-time availability computation: slots are marked as **Available**, **Booked**, or **Past** based on the current system time and active reservations.

3. **Atomic Appointment Booking & Concurrency Protection:**
   - Strict validation of patient contact, age, gender, and clinical symptoms.
   - **Double-booking Prevention:** Checks whether a slot is already taken. If two patients attempt to book the identical slot simultaneously, the second request is cleanly rejected with HTTP 409 Conflict.
   - Generates a unique booking reference token (e.g., `APT-2026-8492`).

4. **Appointment History & Real-Time Tracking:**
   - Search by 10-digit mobile number or unique booking token.
   - Filter by status: `Upcoming (Confirmed)`, `Completed`, and `Cancelled`.
   - Review past medical reasons and cancellation notes.

5. **Patient Cancellation Management:**
   - Patients or clinic administrators can cancel an upcoming appointment.
   - Enforces a mandatory cancellation reason for medical audit logging.
   - Immediately releases the time slot back into the pool for other patients in real-time.

6. **Printable Appointment Slip (Thermal / PDF Ready):**
   - Clean printable pass with hospital header, QR code verification token, patient metadata, doctor room/clinic address, and consultation fee.

7. **Doctor & Clinic Desk Operations (Doctor Portal):**
   - Active queue management for physicians.
   - Mark consultations as **Completed**, updating revenue metrics and patient status.

8. **Live REST API Explorer & Viva Defense Suite:**
   - Built-in interactive API tester right in the browser.
   - Allows live testing of REST endpoints directly before the faculty examiner.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended; tested on v24)
- npm (v9 or higher)

### Installation & Execution

1. **Navigate to the project directory:**
   ```powershell
   cd "C:\Users\DELL\.gemini\antigravity\scratch\patient-appointment-management-system"
   ```

2. **Install dependencies (if not already installed):**
   ```powershell
   npm install
   ```

3. **Start the application:**
   ```powershell
   npm start
   ```
   *(Or double-click `start.bat` on Windows)*

4. **Open your browser:**
   ```
   http://localhost:5000
   ```

5. **Run automated verification tests:**
   ```powershell
   node test_system.js
   ```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | 200 |
| `GET` | `/api/departments` | List all medical departments + doctor counts | 200 |
| `GET` | `/api/doctors` | List doctors with filter (`department`, `search`, `sortBy`) | 200 |
| `GET` | `/api/doctors/:id` | Detailed doctor profile + schedule statistics | 200, 404 |
| `GET` | `/api/slots` | Available slots query (`doctorId`, `date`) | 200, 400, 404 |
| `POST` | `/api/appointments` | Book new appointment (with concurrency lock) | 201, 400, 409 |
| `GET` | `/api/appointments` | Filter appointments (`phone`, `ref`, `doctorId`, `status`) | 200 |
| `GET` | `/api/appointments/:idOrRef` | Single appointment lookup | 200, 404 |
| `PATCH` | `/api/appointments/:idOrRef/cancel` | Cancel an appointment with mandatory reason | 200, 400, 404 |
| `PATCH` | `/api/appointments/:idOrRef/status` | Update status (`CONFIRMED`, `COMPLETED`) | 200, 400, 404 |
| `GET` | `/api/stats` | Clinical analytics (total visits, revenue, unique patients) | 200 |

---

## 📂 Project Directory Structure

```
patient-appointment-management-system/
├── package.json                   # Dependencies, metadata & npm scripts
├── server.js                      # Express server entry point & middleware mounting
├── start.bat                      # One-click Windows launcher
├── test_system.js                 # 10-phase automated functional test suite
├── README.md                      # Project documentation & overview
├── VIVA_EXPLANATION_GUIDE.md      # Comprehensive Viva defense & Q&A guide
├── data/
│   └── appointments.db            # SQLite relational database (WAL mode)
├── src/
│   ├── db/
│   │   ├── database.js            # SQLite connection, schema DDL & async helpers
│   │   └── seed.js                # Realistic seed data (6 doctors, 6 depts, sample visits)
│   ├── routes/
│   │   ├── doctorRoutes.js        # Doctor directory & department endpoints
│   │   ├── slotRoutes.js          # Dynamic slot scheduling logic
│   │   ├── appointmentRoutes.js   # Booking, cancellation, and retrieval
│   │   └── statsRoutes.js         # Dashboard analytics & revenue calculations
│   └── middleware/
│       ├── validator.js           # Request payload sanitization & validation
│       └── errorHandler.js        # Centralized HTTP error handler & 404 router
└── public/
    ├── index.html                 # Semantic HTML5 single-page application
    ├── css/
    │   └── style.css              # Custom styling, animations, print media queries
    └── js/
        ├── api.js                 # Unified REST client module (Fetch API)
        ├── app.js                 # UI tab routing, search/filter, modals, and toasts
        ├── booking.js             # Slot selection, form handling & ticket modal
        ├── history.js             # Appointment history, cancellation dialog & filters
        └── doctor-portal.js       # Doctor queue management & consultation completion
```

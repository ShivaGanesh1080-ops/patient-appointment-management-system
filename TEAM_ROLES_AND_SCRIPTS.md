# MediPulse — Team Roles, Work Allocations & Presentation Scripts
## WTMP Major Project (5-Member Team Distribution)
**Project Title:** Patient Appointment Management System  
**Institution:** SR University — Department of Computer Science & Engineering (CSE Core)  
**Repository:** https://github.com/ShivaGanesh1080-ops/patient-appointment-management-system  
**Live Demo:** Local `http://localhost:5000` / Vercel Production `https://medipulse-sru.vercel.app`  

---

## 👥 Official Team Structure Overview

| Roll Number | Member Name | Role & Designation | Core Domain & Modules Owned | Key Files |
|---|---|---|---|---|
| **2503A51107** | **NEERUDU GIFTY TANIKSHA** | **Team Leader & Project Coordinator** | Project Scoping, Presentation Lead, Healthcare Requirements & Workflow Orchestration | Overall System & Deliverables |
| **2503A51108** | **CHANDUPATLA NAVEEN REDDY** | **Frontend UI/UX & Responsive Specialist** | Semantic HTML5, CSS3 Glassmorphism, Tailwind Styling, Mobile Viewports, Token Pass Print Sheet | `public/index.html`, `public/css/style.css` |
| **2503A51109** | **KARRE SHIVA SAKETH** | **Client State & Quality Assurance Lead** | Dynamic Time Slot Grid, Search/Filter Debouncing, Verification Suite & Automated Testing | `public/js/booking.js`, `public/js/history.js`, `test_system.js` |
| **2503A51110** | **AKKU SHIVA GANESH** | **Systems Architect & Backend Lead** | System Architecture, ACID Concurrency Guard, Multi-Tenant Database, Serverless Adaptation | `server.js`, `src/db/database.js`, `src/routes/*` |
| **2503A51111** | **VELDANDI SAI CHARAN** | **Database Architect & REST API Integration** | Relational SQLite Schema, SQL Prepared Statements, Input Validation Middleware, Telemetry | `src/middleware/validator.js`, `src/db/seed.js`, `public/js/api.js` |

---

## 🎭 Detailed Member Profiles, Assigned Work & Viva Scripts

---

### 👩‍💼 Member 1: NEERUDU GIFTY TANIKSHA (2503A51107) — Team Leader
- **Role:** Team Leader & Project Coordinator
- **Assigned Work:**
  - Led project planning, sprint milestones, and alignment with WTMP course guidelines.
  - Defined the outpatient healthcare clinical problem statement: eradicating physical queue friction and appointment double-booking.
  - Coordinated integration across frontend views, backend REST endpoints, and database models.
  - Formulated presentation strategy, slide decks, and project defense documentation.

#### 🎙️ Presentation Script for Taniksha (30–45 seconds):
> *"Good morning Sir. As the Team Leader of **MediPulse**, I directed the design and implementation of our Patient Appointment Management System for the WTMP course project. The primary clinical problem we targeted is the persistent bottleneck in hospital outpatient departments, where manual booking causes chaotic waiting rooms and physician schedule double-bookings.*
>
> *I coordinated our team across full-stack layers: establishing modern semantic HTML5 and CSS3 user interfaces, asynchronous RESTful Express services, and a transactional SQLite database. Together, we built an end-to-end platform featuring verified specialists across hospital branches, sub-50ms live slot generation, atomic race-condition prevention, and instant digital token passes."*

#### 🎯 Likely Viva Questions for Member 1:
- **Q: What is the primary software problem MediPulse solves?**  
  *Answer:* MediPulse replaces paper-based clinic queues with an atomic, digital scheduling workflow that guarantees zero double-booking, ensures transparent fee schedules, and provides instant digital tokens for patients.
- **Q: How did the team divide the modular full-stack architecture?**  
  *Answer:* We divided the system into 5 distinct modules: Project Leadership & Clinical Workflow, Frontend UI/UX, Client-Side Async Logic, Backend Systems Architecture, and Relational Database Engineering.

---

### 🎨 Member 2: CHANDUPATLA NAVEEN REDDY (2503A51108) — Frontend UI/UX Specialist
- **Role:** Frontend UI/UX & Responsive Design Specialist
- **Assigned Work:**
  - Designed the semantic HTML5 structure using `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, and `<dialog>` tags.
  - Formulated the modern Royal Indigo & Violet healthcare theme with Tailwind CSS utilities and custom CSS glassmorphism (`backdrop-filter: blur(20px)`).
  - Implemented mobile-first layouts so the portal functions smoothly across smartphones, tablets, and desktop displays.
  - Created the physical print stylesheet (`@media print`) for patient token slips and QR digital passes.

#### 🎙️ Presentation Script for Naveen (30–45 seconds):
> *"Sir, I engineered the UI/UX architecture and responsive design using HTML5, CSS3, and Tailwind CSS. In strict adherence to WTMP guidelines, I avoided generic div clutter and utilized semantic elements for accessibility and performance.*
>
> *For visual hierarchy and patient usability, I designed a Royal Indigo glassmorphic interface with interactive specialty filter pills, doctor profile cards, and live status badges. I also created a custom `@media print` stylesheet: clicking 'Print Pass' hides all navigation and background elements, outputting a clean hospital consultation token with patient metadata, doctor clinic hours, and QR verification layout."*

#### 🎯 Likely Viva Questions for Member 2:
- **Q: What is the advantage of using `@media print`?**  
  *Answer:* It applies CSS rules solely when printing or saving to PDF. We hide navigation bars, search filters, and buttons using `display: none !important`, while resizing the consultation pass to fit standard A4 paper cleanly.
- **Q: How does CSS glassmorphism work?**  
  *Answer:* Glassmorphism combines semi-transparent background colors (`rgba(255, 255, 255, 0.84)`) with CSS backdrop filters (`backdrop-filter: blur(20px)`), creating a frosted-glass appearance that gives visual depth without sacrificing contrast.

---

### ⚡ Member 3: KARRE SHIVA SAKETH (2503A51109) — Client State & QA Lead
- **Role:** Client-Side Controller & Quality Assurance Lead
- **Assigned Work:**
  - Built the dynamic time-slot rendering engine in `public/js/booking.js`, categorizing slots into Morning, Afternoon, and Evening sessions.
  - Implemented dynamic date bounds (disallowing past dates and restricting booking to 30 days ahead).
  - Engineered search debouncing (`Ctrl+K`) and multi-parameter filtering (by clinic branch, specialty, and sorting order).
  - Co-authored and executed the automated 12-phase verification test suite (`test_system.js`).

#### 🎙️ Presentation Script for Saketh (30–45 seconds):
> *"Sir, my responsibility was client-side asynchronous logic and system quality assurance. Using modern ES6+ JavaScript, I engineered the dynamic slot scheduling controller: when a patient chooses a doctor and date, our code queries the backend, inspects the doctor's weekly roster, and dynamically renders 30-minute slot buttons.*
>
> *Available slots are rendered with interactive selection feedback, while already-booked or past slots are locked. I also built debounced search filtering to prevent excess API calls, and executed our automated 12-phase test suite (`test_system.js`) verifying 100% test coverage across concurrency guards, date validations, and cancellation lifecycles."*

#### 🎯 Likely Viva Questions for Member 3:
- **Q: What is input debouncing in the search field?**  
  *Answer:* Debouncing postpones the execution of the search function until the user stops typing for 250 milliseconds. This eliminates dozens of redundant HTTP queries during rapid keystrokes.
- **Q: How does the client verify that slots are in the future?**  
  *Answer:* The slot engine compares the slot's timestamp (`YYYY-MM-DD HH:MM`) against the current system time using JavaScript's `Date` object, automatically marking passed slots as unavailable.

---

### 🏗️ Member 4: AKKU SHIVA GANESH (2503A51110) — Systems Architect & Backend Lead
- **Role:** Systems Architect & Full-Stack Backend Lead
- **Assigned Work:**
  - Designed the 3-tier client-server architecture separating UI, REST services, and SQL persistence.
  - Implemented the server initialization, security middleware (`helmet`, `express-rate-limit`, `cors`), and static routing in `server.js`.
  - Engineered the doctor double-booking concurrency guard using SQLite transactions and HTTP 409 Conflict status responses.
  - Implemented Server-Sent Events (SSE) live streaming at `GET /api/appointments/stream` for real-time doctor queue updates.
  - Built the serverless compatibility layer for Vercel deployment with dynamic database provisioning.

#### 🎙️ Presentation Script for Shiva Ganesh (30–45 seconds):
> *"Sir, as Systems Architect and Backend Lead, I designed the distributed server architecture and high-reliability primitives of **MediPulse**. The core challenge in healthcare booking is race conditions: two patients selecting the exact same slot at the same second.*
>
> *I resolved this by implementing an atomic concurrency guard in our booking controller: incoming booking requests run within a transaction check. If a collision occurs, the database rejects the duplicate and our API returns an HTTP 409 Conflict with a clear error payload. I also implemented Server-Sent Events (SSE) for real-time OPD queue dispatch without polling, and configured automated database fallback for serverless hosting on Vercel."*

#### 🎯 Likely Viva Questions for Member 4:
- **Q: Why return HTTP 409 instead of HTTP 400 for duplicate bookings?**  
  *Answer:* HTTP 400 denotes a malformed payload. HTTP 409 specifically signals a State Conflict with the current resource state — the slot was open when the user viewed it, but was booked before submission.
- **Q: How do Server-Sent Events (SSE) differ from WebSockets?**  
  *Answer:* SSE is a lightweight, unidirectional HTTP streaming protocol (`text/event-stream`) where the server pushes updates to the client. Unlike WebSockets, SSE works over standard HTTP/HTTPS, auto-reconnects natively, and requires no custom binary protocols.

---

### 💾 Member 5: VELDANDI SAI CHARAN (2503A51111) — Database & API Integration
- **Role:** Database Architect & REST API Integration Specialist
- **Assigned Work:**
  - Designed the relational schema in SQLite across normalized tables (`clinics`, `departments`, `doctors`, `appointments`).
  - Enforced relational integrity with foreign keys, composite indexes on `(doctor_id, appointment_date, appointment_time)`, and unique booking references.
  - Configured SQLite Write-Ahead Logging (WAL mode) for high-performance concurrent reads and writes.
  - Built centralized request validation middleware in `src/middleware/validator.js` and abstracted the client API module in `public/js/api.js`.

#### 🎙️ Presentation Script for Sai Charan (30–45 seconds):
> *"Sir, I was responsible for the database architecture and REST API integration. I designed our normalized SQLite relational schema linking healthcare clinics, specialty departments, credentialed doctors, and patient bookings.*
>
> *To guarantee sub-millisecond query performance, I created composite indexes on `(doctor_id, appointment_date, appointment_time, status)`. All database operations use parameterized prepared statements (`?`), making SQL injection structurally impossible. I also implemented our Express request validation middleware enforcing 10-digit phone number regex, valid age boundaries, and mandatory cancellation notes."*

#### 🎯 Likely Viva Questions for Member 5:
- **Q: How do SQL Prepared Statements prevent SQL Injection?**  
  *Answer:* Prepared statements separate query structure from user data. The query is pre-compiled by the SQLite engine, and parameters (`?`) are inserted strictly as data values, neutralizing malicious SQL syntax.
- **Q: What is WAL mode in SQLite?**  
  *Answer:* Write-Ahead Logging writes mutations to a separate `-wal` file before committing them to the database. This allows concurrent readers to access data while a write operation is active, preventing database locks.

---

## 🏆 Collective Team Viva Strategy (The 4-Minute Presentation Plan)

1. **Minute 1 — Introduction & Clinical Vision (Member 1: NEERUDU GIFTY TANIKSHA - Team Leader):**  
   State project title, core healthcare problem, team roster, and full-stack high-level vision.
2. **Minute 2 — UI/UX & Responsive Interaction (Member 2: CHANDUPATLA NAVEEN REDDY):**  
   Show doctor directory, mobile-first responsiveness, and generate printable thermal token pass with QR code.
3. **Minute 3 — Slot Engine & Concurrency Defense (Member 3: KARRE SHIVA SAKETH & Member 4: AKKU SHIVA GANESH):**  
   Demonstrate dynamic 30-minute slot computation, submit an appointment, and show the HTTP 409 Conflict guard blocking duplicate slot submissions.
4. **Minute 4 — Database, API Validation & Automated Tests (Member 5: VELDANDI SAI CHARAN):**  
   Show the normalized SQLite schema, input validation middleware, and run `node test_system.js` in terminal to display the 12/12 passing test suite.

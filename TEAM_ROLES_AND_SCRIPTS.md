# MediPulse — Team Roles, Work Allocations & Viva Scripts
## WTMP Major Project (5-Member Team Distribution)
**Project Title:** Patient Appointment Management System  
**Repository:** https://github.com/ShivaGanesh1080-ops/patient-appointment-management-system  
**Live Demo:** Local `http://localhost:5000` / Vercel Serverless  

---

## 👥 Team Structure Overview

| Member | Designated Role | Core Domain & Modules Owned | Key Files |
|---|---|---|---|
| **Member 1 (Shiva Ganesh Akku - Team Lead)** | **System Architect & Full-Stack Integrator** | System Architecture, Project Setup, Concurrency Guard, Vercel Serverless Adaptation, Integration | `server.js`, `vercel.json`, `test_system.js` |
| **Member 2** | **Frontend UI/UX & Responsive Design Specialist** | Semantic HTML5, CSS3 Glassmorphism, Tailwind Styling, Mobile Viewports, Print Slip Stylesheet | `public/index.html`, `public/css/style.css` |
| **Member 3** | **Client-Side State & Async Controller** | Asynchronous JavaScript (ES6+), Native Fetch API, Dynamic Slot Rendering, Search/Filter, Form Handling | `public/js/app.js`, `public/js/api.js`, `public/js/booking.js` |
| **Member 4** | **Backend REST API & Middleware Specialist** | Express.js Routers, Route Controllers, Custom Validation Middleware, Centralized Error Handling | `src/routes/*`, `src/middleware/*` |
| **Member 5** | **Database Architect & QA/Testing Lead** | Relational Database Schema, SQL Prepared Statements, WAL Mode, Automated Verification Suite | `src/db/database.js`, `src/db/seed.js`, `test_system.js` |

---

## 🎭 Detailed Member Profiles, Assigned Work & Viva Scripts

---

### 👨‍💼 Member 1: Shiva Ganesh Akku (Team Leader & System Architect)
- **Role:** Team Leader & Full-Stack System Architect
- **Assigned Work:**
  - Designed the 3-tier client-server architecture separating UI, REST services, and SQL storage.
  - Implemented the server initialization, static asset binding, and CORS configuration in `server.js`.
  - Solved the doctor double-booking concurrency conflict using transaction guards and HTTP 409 status responses.
  - Engineered the serverless compatibility layer for Vercel deployment (redirecting SQLite WAL storage to `/tmp` in serverless instances).
  - Authored the automated 10-phase verification test suite (`test_system.js`).

#### 🎙️ Presentation Script for Shiva (30–45 seconds):
> *"Good morning Sir. As the team lead and system architect, I designed the overall architecture of **MediPulse**, our Patient Appointment Management System. The objective was to eliminate hospital queue bottlenecks and double-booking errors through an end-to-end full-stack web application adhering to the WTMP syllabus.*
>
> *I integrated Node.js and Express to build a modular REST API communicating with a relational SQLite database. To ensure real-world production safety, I implemented our concurrency control engine: if two patients attempt to book the exact same slot simultaneously, our system detects the collision and returns an HTTP 409 Conflict status. I also adapted our server to execute seamlessly on both local environments and cloud serverless platforms like Vercel with automated cold-start database provisioning."*

#### 🎯 Likely Viva Questions for Member 1:
- **Q: How does Express handle non-blocking asynchronous requests?**  
  *Answer:* Node.js uses a single-threaded Event Loop backed by `libuv`'s thread pool. Asynchronous I/O operations (like database queries and file access) are offloaded to `libuv`. Once completed, their callbacks/promises enter the Event Loop queue without blocking incoming HTTP requests.
- **Q: Why return HTTP 409 instead of HTTP 400 for duplicate bookings?**  
  *Answer:* HTTP 400 means Bad Request (syntax or malformed payload). HTTP 409 specifically denotes a State Conflict with the current state of the resource (i.e. the slot was available when the patient opened the page, but was already committed before submission).

---

### 🎨 Member 2: Frontend UI/UX & Responsive Design Specialist
- **Role:** Frontend UI/UX & Styling Specialist
- **Assigned Work:**
  - Built the semantic HTML5 layout using `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, and `<dialog>` tags.
  - Formulated modern UI aesthetics using Tailwind CSS utilities combined with custom CSS3 glassmorphism (`backdrop-filter: blur(12px)`).
  - Implemented responsive mobile-first layouts so the portal functions smoothly on smartphones, tablets, and desktop displays.
  - Created the physical print stylesheet (`@media print`) for patient appointment confirmation slips and QR digital passes.

#### 🎙️ Presentation Script for Member 2 (30–45 seconds):
> *"Sir, I was responsible for the UI/UX architecture and responsive design using HTML5, CSS3, and Tailwind CSS. In line with the WTMP syllabus, I ensured strict semantic HTML markup rather than generic div containers, enhancing accessibility and SEO.*
>
> *For visual aesthetics and usability, I designed responsive doctor profile cards, interactive department filter pills, and custom status badges. I implemented a print media stylesheet (`@media print`) specifically for the patient token slip: when a patient clicks 'Print Slip', all navigation bars and background artifacts are hidden, producing a clean, thermal-ready hospital consultation token with verified patient metadata and QR code layout."*

#### 🎯 Likely Viva Questions for Member 2:
- **Q: What is the benefit of CSS custom properties (variables) and glassmorphism?**  
  *Answer:* CSS variables (`:root`) establish centralized theme tokens for colors and spacing, making changes consistent across the app. Glassmorphism utilizes `backdrop-filter: blur()` and semi-transparent alpha channels (`rgba(255,255,255,0.92)`) to create depth and modern hierarchy without sacrificing contrast.
- **Q: How does `@media print` work?**  
  *Answer:* `@media print` is a CSS media query that activates only when a print action (`window.print()`) is invoked. We set `visibility: hidden` for screen-only elements and `visibility: visible` on the `#printable-slip` element, overriding layout dimensions for A4 or thermal paper.

---

### ⚡ Member 3: Client-Side State & Async Controller
- **Role:** Client Logic & Asynchronous Controller
- **Assigned Work:**
  - Developed `public/js/api.js` using the Native Fetch API with `async/await` and robust HTTP response extraction.
  - Implemented dynamic date bounds (disallowing past dates and restricting booking to 30 days ahead).
  - Built the dynamic time-slot rendering engine in `public/js/booking.js`, categorizing slots into Morning, Afternoon, and Evening sessions.
  - Managed client-side state for real-time doctor searching, department filtering, and instant toast notifications.

#### 🎙️ Presentation Script for Member 3 (30–45 seconds):
> *"Sir, my work focused on the client-side JavaScript architecture and asynchronous state management. Using modern ES6+, I built our centralized API client module (`api.js`) which abstracts all HTTP communication with the backend using `async/await` and Native Fetch.*
>
> *I engineered the dynamic slot scheduling controller: when a user selects a doctor and date, our code queries the backend, inspects the doctor's weekly calendar, and dynamically renders 30-minute slot buttons. Available slots appear in green/blue, while booked or expired slots are disabled with visual indicators. I also implemented client-side form validation and debounced search filters for responsive, stutter-free querying."*

#### 🎯 Likely Viva Questions for Member 3:
- **Q: Why use `async/await` instead of nested callback functions?**  
  *Answer:* Callbacks for multiple sequential asynchronous steps lead to deeply nested, unreadable code known as 'Callback Hell'. `async/await` operates on top of ES6 Promises, allowing asynchronous code to be written sequentially with standard `try/catch` error handling.
- **Q: What is debouncing in the doctor search input?**  
  *Answer:* Debouncing delays the execution of the search function until a specified time (e.g. 250ms) has passed since the user stopped typing. This prevents firing dozens of redundant API calls on every single keystroke.

---

### 🛡️ Member 4: Backend REST API & Middleware Specialist
- **Role:** Backend API & Middleware Engineer
- **Assigned Work:**
  - Structured modular Express routers in `src/routes/` (`doctorRoutes.js`, `slotRoutes.js`, `appointmentRoutes.js`, `statsRoutes.js`).
  - Implemented custom request validation middleware (`src/middleware/validator.js`) enforcing 10-digit phone regex, age boundaries, and mandatory cancellation notes.
  - Developed RESTful endpoints adhering to standard HTTP methods (`GET`, `POST`, `PATCH`).
  - Configured centralized error handling and 404 route interception in `src/middleware/errorHandler.js`.

#### 🎙️ Presentation Script for Member 4 (30–45 seconds):
> *"Sir, I developed the backend REST API services and Express middleware pipeline. I structured the application into modular routers separating doctor directories, time-slot generation, appointment processing, and clinical statistics.*
>
> *I built our custom validator middleware, which intercepts incoming requests before they reach the controllers, validating phone number formats, future dates, and required clinical fields. For appointment modifications, I adhered to REST principles by using `PATCH /api/appointments/:id/cancel` for partial state updates rather than `PUT`, and ensured every response includes appropriate HTTP status codes (200, 201, 400, 404, 409)."*

#### 🎯 Likely Viva Questions for Member 4:
- **Q: What is the role of `next()` in Express middleware?**  
  *Answer:* `next()` is a callback passed to middleware functions that passes execution control to the next middleware or route handler in the pipeline. If `next()` is called with an argument (`next(err)`), Express skips remaining normal handlers and jumps straight to the registered error-handling middleware.
- **Q: Why did you choose `PATCH` over `PUT` for cancellations?**  
  *Answer:* `PUT` replaces the entire target resource with a complete new representation. `PATCH` is designed for partial updates. When cancelling, we only alter `status`, `cancellation_reason`, and `cancelled_at` while preserving the existing patient details.

---

### 💾 Member 5: Database Architect & QA/Testing Lead
- **Role:** Database Architect & Quality Assurance Lead
- **Assigned Work:**
  - Designed the relational schema in SQLite with 3 normalized tables (`departments`, `doctors`, `appointments`).
  - Enforced relational integrity with foreign keys, composite indexes on `(doctor_id, appointment_date, appointment_time)`, and unique booking references.
  - Configured SQLite Write-Ahead Logging (WAL mode) for concurrent reads and writes.
  - Authored database seeders (`seed.js`) and co-developed the 10-phase automated test suite (`test_system.js`).

#### 🎙️ Presentation Script for Member 5 (30–45 seconds):
> *"Sir, I was responsible for the database architecture and automated system verification. I designed our normalized relational database schema in SQLite with foreign key constraints connecting departments, doctors, and patient appointments.*
>
> *To guarantee sub-millisecond query performance, I created composite indexes on `(doctor_id, appointment_date, appointment_time, status)`. All SQL operations use parameterized prepared statements (`?`), eliminating SQL injection risks. Furthermore, I executed our automated 10-phase test script (`test_system.js`) verifying health checks, working-day validations, slot computations, race condition guards, and cancellation lifecycle with 100% test pass rates."*

#### 🎯 Likely Viva Questions for Member 5:
- **Q: How do SQL Prepared Statements prevent SQL Injection?**  
  *Answer:* Prepared statements separate the SQL query command from user-provided data. The SQL parser pre-compiles the query structure first. Placeholders (`?`) ensure that user inputs are treated strictly as data literals, rendering SQL syntax manipulation impossible.
- **Q: What is WAL mode in SQLite?**  
  *Answer:* Write-Ahead Logging (WAL) writes changes to a separate log file before committing them to the main database. This allows concurrent read operations while a write transaction is occurring, significantly boosting performance in web applications.

---

## 🏆 Collective Team Viva Strategy (The 4-Minute Presentation Plan)

1. **Minute 1 — Introduction & Architecture (Member 1 - Shiva Ganesh Akku):**  
   State project title, core problem statement, full-stack tech stack, and high-level 3-tier architecture.
2. **Minute 2 — UI/UX & Responsive Interaction (Member 2 & Member 3):**  
   Show doctor cards, search/filter, and click a doctor to show dynamic slot calculation and form validation.
3. **Minute 3 — Live Booking, Double-Booking Guard & Print Slip (Member 1 & Member 4):**  
   Submit a live appointment booking, explain the HTTP 201 response, trigger the printable pass, and demonstrate how attempting to re-book the same slot triggers HTTP 409 Conflict.
4. **Minute 4 — History, Cancellation, & Database/Test Proof (Member 4 & Member 5):**  
   Cancel an appointment, show the slot immediately becoming available again, and run `node test_system.js` in the terminal to display the 10/10 test pass log!

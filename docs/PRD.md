# Product Requirements Document
## Pawan Sir Commerce & English Classes — Coaching Management Prototype

**Version:** 1.0
**Date:** September 2026
**Purpose:** Functional prototype to demonstrate to the client before full development begins.

---

## 1. Overview

A web-based coaching management system for a single coaching center, covering student records, batch scheduling, attendance, fee tracking, ID cards, and birthday notifications. Three portals: **Admin**, **Tutor**, and **Student**.

This is a prototype, but core CRUD functionality is fully working and backed by a real database — not a static mockup.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (React) |
| Hosting | Vercel (free tier) |
| Database | Existing PostgreSQL instance (connection string supplied via `DATABASE_URL` env var) |
| ORM | Drizzle ORM |
| Authentication | Real auth, email/password only (no OAuth, no forgot-password flow in this version) |
| File storage | Not required (no photo uploads in this version) |
| Multi-tenancy | None — single coaching center only |
| UI / Visual design | Out of scope for this PRD — client is handling design direction separately |

---

## 3. User Roles & Access

| Role | Created by | Can do |
|---|---|---|
| **Admin** | Pre-provisioned / seeded manually | Full access: manage students, tutors, batches, attendance, fees, ID cards, birthday notices |
| **Tutor** | Created by Admin (no self-registration) | View/manage their own batches, mark attendance for their batches, view their students |
| **Student** | Created by Admin (no self-registration) | View own profile, own batch(es), own attendance history, own fee/payment status, own ID card preview |

- No public sign-up. Admin creates every Tutor and Student account (sets initial email + password).
- No "forgot password" flow in this version.
- Session-based auth; each role sees a different dashboard/nav after login.

---

## 4. Feature Modules (In Scope — Fully Functional)

### 4.1 Student Management
- Create, edit, deactivate student profiles: name, contact info, guardian/parent contact, date of birth, enrolled batch(es).
- Admin-only create/edit/delete. Students can view (not edit) their own profile.
- List/search/filter students (by batch, by status).

### 4.2 Batch Management
- Create/edit/delete batches: name, subject, assigned tutor(s), **day-of-week + time schedule** (e.g. Mon/Wed/Fri 4:00–6:00 PM), student roster.
- Admin manages all batches. Tutors can view batches assigned to them.
- Enroll/remove students from a batch.

### 4.3 Attendance Management
- Both **Admin and Tutors** can mark attendance, per batch, per session date.
- Individual (per student) and batch-level view.
- Monthly attendance report/summary per student and per batch.
- No parent notifications in this version (explicitly out of scope — see Section 6).

### 4.4 Fee Management
- **No online payment gateway.** Admin manually records/marks a payment as Paid or Pending.
- Fee amount is **custom per individual student** (not a fixed batch rate).
- Payment **frequency is custom per student**, set by Admin (e.g. monthly, one-time, custom schedule) rather than a fixed system-wide rule.
- When a payment is marked Paid, generate a **simple on-screen receipt/invoice view** (not downloadable/printable in this version — just a viewable record).
- Fee/payment history and pending-dues view per student.

### 4.5 ID Card Generation
- On-screen preview of a student or tutor ID card (name, role/batch, ID number, coaching center name).
- **No photo upload** — uses a placeholder avatar.
- **Preview only** — not downloadable or printable in this version.

### 4.6 Birthday Wishes
- System detects a student/tutor's birthday and shows an **in-app notification/greeting** only.
- No real email/SMS/WhatsApp sending in this version.

---

## 5. Explicitly Out of Scope for This Prototype

To avoid ambiguity during build, the following are **not** included:

- Salary Management, Staff Management, Examination Management (dropped from the product entirely per client direction)
- WhatsApp Integration
- Parent Communication module / parent portal / parent notifications of any kind (including absence alerts)
- Online/real payment processing (e.g. Razorpay, Stripe)
- Photo uploads for students/tutors
- Downloadable/printable ID cards
- Downloadable/printable receipts
- Forgot-password / password reset flow
- Self-registration for Tutors or Students
- Multi-tenancy (support for more than one coaching center)
- Mobile or desktop apps (web-only for this version)
- Pre-seeded demo data (database starts empty; Admin populates live)

---

## 6. Data Model (high-level entities)

- **users** — id, email, password_hash, role (admin | tutor | student), created_at
- **students** — id, user_id (FK), name, dob, contact_phone, guardian_name, guardian_contact, status (active/inactive)
- **tutors** — id, user_id (FK), name, contact_phone
- **batches** — id, name, subject, tutor_id (FK), schedule_days (e.g. array: Mon/Wed/Fri), start_time, end_time
- **batch_enrollments** — id, batch_id (FK), student_id (FK)
- **attendance** — id, batch_id (FK), student_id (FK), date, status (present/absent), marked_by (user_id)
- **fees** — id, student_id (FK), amount, frequency, due_date, status (paid/pending), paid_on (nullable)
- **receipts** — id, fee_id (FK), generated_at, amount, student snapshot info (for on-screen view)

*(Exact schema/migrations will be finalized in Drizzle during implementation.)*

---

## 7. Portal / Page Structure

**Admin**
- Dashboard (overview counts: students, batches, pending fees)
- Students (list, add/edit, profile detail)
- Tutors (list, add/edit)
- Batches (list, add/edit, schedule, roster)
- Attendance (mark by batch/date, reports)
- Fees (list, mark paid/pending, receipt view)
- ID Cards (search + preview)
- Birthday notices (today's/upcoming birthdays)

**Tutor**
- Dashboard (their batches today)
- My Batches (schedule, roster)
- Attendance (mark for their batches)
- My Students (read-only profile view)

**Student**
- Dashboard
- My Profile
- My Batch(es) & Schedule
- My Attendance History
- My Fees & Payment Status / Receipts
- My ID Card (preview)

---

## 8. Deployment

- Hosted on **Vercel free tier**.
- Database: existing PostgreSQL instance — connection string to be supplied as `DATABASE_URL` environment variable in Vercel project settings.
- Drizzle migrations run against this database.

---

## 9. Confirmed Decisions Log

All decisions below were explicitly confirmed by the client rather than assumed:

- Tech stack: Next.js
- DB: existing Postgres, via Drizzle ORM
- Auth: real, email/password only, no password reset
- Portals: Admin + Tutor + Student
- Functional modules: Student, Batch, Attendance, Fee, ID Card, Birthday Wishes (Parent Communication excluded)
- Fully functional CRUD (not a static demo)
- No online payment gateway; manual paid/pending marking
- Fee amount and frequency: custom per student
- Receipt: on-screen only, generated on payment
- ID card: preview only, placeholder avatar, no upload
- Birthday wishes: in-app only
- Accounts: Admin-created only, no self-registration
- Attendance marking: Admin and Tutor
- Absence notifications: dropped entirely
- Single coaching center (no multi-tenancy)
- Demo data: none pre-seeded, starts empty
- Batch scheduling: includes day/time
- Visual design: client-owned, not specified here
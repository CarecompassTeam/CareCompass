# CareCompass — System Analysis (v1.0)

> The single source of truth for the whole team. If a screen, an API, a use
> case, or a security rule is not in this document, it is not in the project.
> Everyone — frontend, backend, AI, DevOps, security — builds on top of this.

**Document owner:** Ammar Tarek (Team Leader, Backend & Security)
**Status:** Approved by team review (Sprint 0 sign-off)
**Last updated:** Sprint 0 — Academic year 2026/2027
**Related docs:** `docs/security-requirements.md`, `docs/analysis-review.md`,
`docs/auth-security-test-report.md`, `docs/decisions.md`

---

## 0. How to read this document

| You are… | Read first |
|---|---|
| New to the team | §1 (Product), §3 (Scope), §4 (Actors), §9 (Use cases) |
| Frontend (Abdelrahman, Dina) | §6 (FR), §9 (Use cases), §10 (User scenarios), §8 (Architecture — frontend side) |
| Backend (Yousab, Ammar) | §6 (FR), §7 (NFR), §8 (Architecture — middleware chain), §11 (Security) |
| AI (Liza, Dina) | §5.4 (AI scope), §8.3 (AI service), §9.5–9.7 (assistant use cases) |
| DevOps (Mohamed) | §8 (Architecture), §7.4 (Performance), §12 (Constraints) |
| Security (Ammar) | §11 (Security), §12 (Risks), §13 (Open questions) |

Every requirement has a **stable ID** (`FR-xx`, `NFR-xx`, `UC-xx`, `SR-xx`).
User stories, tests, and PRs reference these IDs — never renumber them.

---

## 1. Product in one paragraph

CareCompass is a healthcare web platform with three roles — **Doctor,
Patient, Admin**. Users sign in, see only the data their role allows, upload
medical documents, and talk to an **AI assistant that answers only from
documents they are allowed to see**, showing the source for every answer.
The assistant explains and summarizes; it **never diagnoses, prescribes, or
decides**. Every sensitive action is written to an audit log. All data is
synthetic.

The frontend never talks to the AI service or the LLM directly. It talks only
to the Node.js backend. The backend applies auth + RBAC + object-level
authorization + audit logging, **then** calls the internal AI service.
Permission filtering happens **before** retrieval — never after.

---

## 2. Problem & goals

### 2.1 The problem (3 points)
1. Patients receive lab reports full of numbers and terms that nobody explains
   to them.
2. Doctors have only a few minutes per visit and cannot read every file in a
   patient's history.
3. Medical data is sensitive, so each person must see only what they are
   allowed to see — and every AI answer must be traceable to a real document.

### 2.2 Goals
- A patient can understand their own records in plain words.
- A doctor can walk into a visit already knowing the three things that
  matter, with sources.
- No user ever sees another user's data. No AI answer is ever unsourced.
- The security of the system can be shown **with evidence**, not just claimed.

### 2.3 Non-goals (explicitly out of scope — see §3.3)
Diagnosis, treatment advice, dosing, drug-interaction checking, visit audio
recording, medical image interpretation, OCR, booking, real patient data.

---

## 3. Scope

### 3.1 In scope — MVP (Must)
| Area | Items |
|---|---|
| Auth | Login, logout, session refresh, role-based routing |
| Doctor | Patient list, patient profile (visits, documents, AI summary) |
| Patient | Own profile, own records & documents, document upload, medical history entry |
| Assistant | Chat with citations + source viewer (doctor & patient); pre-visit summary |
| Admin | User management, audit log viewer |
| States | Loading, empty, error, permission-denied on every screen |
| Safety | Medical disclaimer on every AI output; refusal of diagnosis/treatment |
| Security | Frontend security basics (§11), audit log, RBAC + object-level authz |

### 3.2 In scope — Should / Could
| Priority | Item |
|---|---|
| Should | Plain-language explanation of lab results for the patient |
| Should | Arabic / English toggle with RTL layout |
| Should | Audit log filters |
| Should | Conversation history list |
| Should | Mobile app (3 screens: login, my documents, assistant) |
| Could | Lab values over time (table + chart per test) |
| Could | Appointments, prescriptions UI |
| Could | Notifications, analytics dashboards, dark mode, OCR upload |

### 3.3 Out of scope (protects us from over-promising)
- Disease prediction or **any diagnosis** UI
- Treatment recommendation, dosing, or drug-interaction checking
- Direct calls to any LLM provider from the browser
- Real patient data (synthetic data only)
- Visit audio recording and speech recognition
- Interpreting medical images
- OCR of scanned documents
- External medical knowledge library
- Booking or any action performed by the AI

---

## 4. Actors & roles

| Actor | Who | Goal | Sees |
|---|---|---|---|
| **Visitor** | Unauthenticated | Learn about the platform, sign in | Public landing page only |
| **Patient** | A signed-in patient | Understand own records; manage own history | Only own documents, own history, own conversations |
| **Doctor** | A signed-in, **verified** doctor | Review assigned patients; get cited summaries; ask sourced questions | Only documents of **assigned** patients |
| **Admin** | A signed-in admin | Manage users; review verification; view audit log | User accounts + audit log. **No access to clinical data** |
| **AI provider** (external system) | The LLM API | Generate text from a prompt | Only what the backend sends it — never patient identifiers it shouldn't |
| **Database** (external system) | MongoDB + Redis | Store records, documents, tokens, audit | N/A |

**Role rules:**
- After login, redirect by role (Doctor → patients, Patient → home, Admin → users).
- Route guards hide screens the role should not see — but **the backend is
  the real enforcement**. Frontend hiding is UX only, never security.
- An unverified doctor cannot see patients or use doctor features until the
  admin approves their identity documents (see UC-12).

---

## 5. Functional requirements (FR-xx)

> Format: `ID — statement (Actor: …; Priority: Must/Should/Could; Sprint: …)`

### 5.1 Auth & session
- **FR-01** A visitor signs in with email + password. (Actor: Visitor; Must; S1)
- **FR-02** On success the backend issues an access token (in memory) + refresh token (httpOnly cookie). (Must; S1)
- **FR-03** On 401 the frontend refreshes once, retries, else logs out with "session expired". (Must; S2)
- **FR-04** Logout clears in-memory state and the query cache. (Must; S1)
- **FR-05** A doctor signs up, uploads identity documents, and waits for admin verification. (Must; S3)
- **FR-06** Login is rate-limited; errors are generic (never reveal if an email exists). (Must; S1)

### 5.2 Records & documents
- **FR-07** A doctor sees only their assigned patients in a list with search + pagination. (Actor: Doctor; Must; S2)
- **FR-08** A doctor opens a patient profile with tabs: Visits, Documents, Summary. (Must; S2)
- **FR-09** A doctor adds/edits a visit note. (Must; S2)
- **FR-10** A patient sees only their own records, visits, and documents. (Must; S2)
- **FR-11** A patient uploads a PDF or plain-text document with client-side type/size checks; backend validates again. (Must; S2)
- **FR-12** Document status chip: Uploading → Processing → Ready → Failed (with reason + retry). (Must; S3)
- **FR-13** A patient enters and edits their own medical history (personal details, chronic conditions, medications, allergies, surgeries, family history, lifestyle, notes). Entries are labelled patient-reported. (Must; S2)
- **FR-14** Every view and change of a patient's history is recorded in the audit log. (Must; S2)

### 5.3 AI assistant
- **FR-15** A user asks a question; the assistant answers **only** from documents the user may access, with a citation chip per statement (document + page). (Must; S2)
- **FR-16** Clicking a citation chip opens a source panel with the exact excerpt. (Must; S2)
- **FR-17** If the documents do not contain the answer, the assistant replies "I could not find enough information in the available documents" and never guesses. (Must; S2)
- **FR-18** Requests to diagnose, recommend treatment/doses, judge interactions, or stop/change a medicine are refused with a redirect to the doctor. (Must; S4)
- **FR-19** Urgent symptoms (chest pain, trouble breathing, stroke signs, heavy bleeding) get a fixed "seek urgent care" message. (Must; S4)
- **FR-20** Uploaded document text is treated as data, never as instructions (prompt-injection defense). (Must; S4)
- **FR-21** Answers are rendered as plain text or sanitized markdown — no raw HTML, images, or external links. (Must; S2)
- **FR-22** Conversation history is saved per user and visible only to that user. (Should; S3)
- **FR-23** A fixed disclaimer is always visible: "Information assistant. Not a diagnosis. The doctor decides." (Must; S2)

### 5.4 Doctor pre-visit summary
- **FR-24** A doctor requests a one-page summary for an assigned patient; it is built only from that patient's documents and visits. (Must; S3)
- **FR-25** The summary covers: reason for last visit, known conditions, current/past medications, allergies, recent lab results, open points. (Must; S3)
- **FR-26** Every line in the summary has a source; lines without a source are not shown. If documents disagree, both are shown with dates. (Must; S3)
- **FR-27** The summary shows when it was generated, is labelled AI-generated, and can be regenerated. (Must; S3)
- **FR-28** A doctor can edit and approve a summary before it is saved to the patient's record; approved and unapproved summaries look different. (Should; S3)

### 5.5 Admin
- **FR-29** An admin creates, edits, and disables users; changes roles. (Must; S3)
- **FR-30** Destructive actions need a confirmation dialog; an admin cannot disable themselves. (Must; S3)
- **FR-31** An admin reviews doctor identity documents and approves or rejects. (Must; S3)
- **FR-32** An admin views the audit log filtered by user, action, date range. (Must; S4)

### 5.6 Medical Feed (doctor-facing, extra)
- **FR-33** A verified doctor sees a read-only Medical Feed of curated content (research, clinical trials, drug-interaction alerts, explainers) from trusted sources only. (Should)
- **FR-34** Each feed post shows its source; drug alerts are visually distinct; no posting or commenting. (Should)

---

## 6. Use cases (UC-xx)

> Each use case: actor, precondition, main flow, alternate/exception flows.
> These are what the team writes user stories and tests against.

### UC-01 — Patient asks a sourced question (Core)
- **Actor:** Patient
- **Precondition:** Signed in; has at least one uploaded document.
- **Main flow:**
  1. Patient opens the Assistant and types a question.
  2. Frontend sends `POST /api/assistant/ask` with the question.
  3. Backend resolves the patient (always themselves), retrieves passages from **their own** documents only.
  4. Backend calls the AI service with the passages + safety system prompt.
  5. Assistant returns an answer with citation chips.
  6. Patient clicks a chip → source panel shows the exact excerpt.
- **Alternate — not in documents:** assistant replies "I could not find enough information…".
- **Alternate — urgent symptom:** backend returns the fixed urgent-care message without calling the LLM.
- **Alternate — diagnosis/treatment request:** assistant refuses and redirects to the doctor.

### UC-02 — Doctor asks a sourced question about an assigned patient
- **Actor:** Doctor (verified)
- **Precondition:** Signed in; has at least one assigned patient.
- **Main flow:**
  1. Doctor opens Patients → selects a patient → Assistant.
  2. Doctor types a question scoped to that patient.
  3. Backend checks the doctor–patient assignment. If no assignment → 403 + audit "denied".
  4. Backend retrieves passages only from that patient's documents.
  5. Assistant answers with citations.
- **Exception — unassigned patient:** 403 Access denied; the doctor cannot retrieve that patient's content by any means.

### UC-03 — Doctor generates a pre-visit summary (Core)
- **Actor:** Doctor
- **Precondition:** Assigned patient with documents on file.
- **Main flow:**
  1. Doctor opens the patient → Pre-visit Summary → "Generate summary".
  2. Backend retrieves all allowed passages, calls the AI service with the summary prompt.
  3. Summary returns with sections + per-line citations.
  4. Summary is saved as an unapproved draft (AI-generated label).
  5. Doctor reviews sources, optionally edits, and approves to record.
- **Alternate — no documents:** summary sections show "Not mentioned in the available documents."

### UC-04 — Patient uploads a document
- **Actor:** Patient
- **Precondition:** Signed in.
- **Main flow:**
  1. Patient drops a PDF/text file; client checks type + size.
  2. `POST /api/documents` with the file.
  3. Backend validates again (MIME, size), stores, sets status "Processing".
  4. Ingestion pipeline extracts text → chunks → embeddings → ready.
  5. Patient sees the status chip move to "Ready".
- **Alternate — wrong type / too large / duplicate / rejected:** clear error message + retry.

### UC-05 — Patient enters their medical history
- **Actor:** Patient
- **Precondition:** Signed in.
- **Main flow:**
  1. Patient opens My History.
  2. Fills personal details, conditions, meds, allergies, surgeries, family, lifestyle, notes.
  3. Saves; backend validates required fields.
  4. Entries are labelled "patient-reported"; the assigned doctor sees them on the profile.
- **Audit:** every view and change is logged.
- **Exception — invalid input:** inline errors + "fix the highlighted fields".

### UC-06 — Doctor views a patient's medical history
- **Actor:** Doctor (assigned)
- **Precondition:** Doctor is assigned to the patient.
- **Main flow:** Doctor opens patient → sees the patient-reported history with last-updated timestamps.
- **Exception — unassigned doctor:** 403 + audit "denied".

### UC-07 — Doctor signs up and gets verified
- **Actor:** Doctor (visitor → pending → verified)
- **Main flow:**
  1. Doctor signs up (account = "Pending").
  2. Uploads medical license, national ID, syndicate membership.
  3. Admin reviews → approves → account = "Verified", badge appears, patient list unlocks.
- **Exception — rejected:** doctor receives a reason, can re-upload; no partial access.

### UC-08 — Patient rates a doctor (extra feature)
- **Actor:** Patient (with a confirmed visit)
- **Main flow:**
  1. After a visit, patient rates 1–5 stars + optional comment.
  2. Average is shown on the doctor's profile.
  3. If average falls below threshold (3.5), the doctor is deactivated.
- **Rules:** only verified patients with a real visit can rate; comments are optional; ratings weighted by recency.

### UC-09 — Admin manages users
- **Actor:** Admin
- **Main flow:** Admin searches users, changes role, enables/disables. Destructive actions need confirmation. Admin cannot disable themselves.

### UC-10 — Admin reviews the audit log
- **Actor:** Admin
- **Main flow:** Admin filters by user, action, date range. Read-only. Times in local time with ISO on hover. **No clinical document text in the log.**

### UC-11 — Session expires mid-chat
- **Actor:** Any signed-in user
- **Main flow:** On 401, refresh once, retry; else redirect to login with "session expired".

### UC-12 — Hostile uploaded document (prompt injection)
- **Actor:** (attacker who uploads a document containing AI instructions)
- **Expected:** The assistant's system prompt treats all document text as **data**, never as instructions. The hostile text does not change the assistant's behavior or output. Verified by a security test with a planted instruction document.

### UC-13 — Cross-patient leakage attempt
- **Actor:** Patient A trying to read Patient B's content
- **Expected:** Backend ignores any supplied patientId and always scopes to the signed-in patient. Direct URL access, rephrasing, translating, or indirect questions all fail. Verified with planted canary strings.

### UC-14 — Doctor browses the Medical Feed
- **Actor:** Doctor (verified)
- **Main flow:** Doctor opens the Feed (doctor-only nav). Browses research, trials, drug alerts, explainers from trusted sources. Saves posts. Read-only — no posting or commenting.

---

## 7. User scenarios (per role)

> Narrative walk-throughs so each role can see themselves using the system.

### 7.1 Patient — Mariam, 54
Mariam picks up a lab report and doesn't understand the numbers. She signs in
to CareCompass, opens **My History**, fills in her conditions and medications,
and saves. She opens the **Assistant** and asks "What does my HbA1c result
mean?" The assistant replies in plain words with a citation chip linking to
her own lab report. She clicks the chip and sees the exact line. She asks
"Should I increase my metformin dose?" — the assistant says it could not find
enough information and tells her to discuss it with her doctor. She types "I
have chest pain" — the assistant tells her to seek urgent care immediately.

### 7.2 Doctor — Dr. Hana, Cardiology
Before a visit, Dr. Hana signs in, opens **Patients**, selects Mariam, and
clicks **Pre-visit Summary → Generate**. In a few seconds she sees a one-page
summary: reason for last visit, the BP trend across three visits, the
Amlodipine prescription, the HbA1c 6.4% result, and an open point (HbA1c to
repeat). Every line has a source she can click. She approves the summary to
the record. In the **Assistant** she asks "Summarize this patient's blood
pressure trend" and gets a cited answer. In her free time she opens the
**Feed** and reads a drug-interaction alert about warfarin + amiodarone,
sourced from FDA MedWatch.

### 7.3 Admin
The admin signs in, opens **User Management**, and sees a new doctor signup
pending verification. They open the submitted license, national ID, and
syndicate card, and approve the doctor. They open the **Audit Log** and
filter by "denied" — they see a doctor tried to view an unassigned patient's
history and were blocked. The admin has **no access** to any clinical
document text.

---

## 8. System architecture

### 8.1 High-level

```
┌────────────┐     REST      ┌──────────────┐   internal    ┌─────────────┐
│  Frontend  │ ────────────▶ │   Backend    │ ────────────▶ │  AI service │
│  (React)   │ ◀──────────── │  (Node.js)   │ ◀──────────── │ (RAG + LLM) │
└────────────┘               └──────┬───────┘               └──────┬──────┘
                                    │                              │
                                    │ enforces:                    │ retrieval:
                                    │  auth, RBAC,                 │  only over doc IDs
                                    │  object-level authz,         │  the backend allows
                                    │  audit log                   │
                                    ▼                              ▼
                             ┌──────────────┐            ┌──────────────┐
                             │   MongoDB    │            │ vector store │
                             │ (records,    │            │ (pgvector /  │
                             │  documents,  │            │  embedded)   │
                             │  audit)      │            └──────────────┘
                             └──────┬───────┘
                                    │
                             ┌──────────────┐
                             │    Redis     │
                             │ OTP, revoked │
                             │ tokens, rate │
                             │ limits       │
                             └──────────────┘
```

**Iron rule:** the frontend never calls the AI service or the LLM. The backend
is the only gateway. Permission filtering happens **before** retrieval.

### 8.2 Backend middleware chain (HTTP request flow)

From `backlogic.txt` — every HTTP request passes through this exact chain:

```
HTTP request
  → middleware:        helmet → cors → morgan → rate limiter → json
  → validation:        (Zod: body + query + params + files)
  → authentication:    (JWT verify + Redis revoke check)
  → controller:        modules/*/x.controller.js   (thin, no logic)
  → service:           modules/*/x.service.js        (all business logic)
  → repository:        common/db.repository.js       (all Mongo queries)
  → Mongoose model  ←→  MongoDB
  ← common/security + common/utils (hash / encrypt / token / email / otp)
  ← Redis (OTP · revoked tokens · rate limits)
```

**Notes for the team:**
- Controllers stay **thin** — no business logic. All logic lives in services.
- All database access goes through the repository layer — services never
  call Mongoose directly. This keeps queries auditable in one place.
- Rate limit is **before** the route; the error handler is **last**.
- Behind a proxy (Nginx/Vite) all clients may appear as one IP → in production
  set `app.set("trust proxy", 1)`.
- The in-memory limiter resets on restart — fine for the demo; note it as a
  limit in the security report.

### 8.3 AI service (RAG pipeline)
1. **Ingestion:** PDF/text extraction → chunking → embeddings → vector store.
2. **Retrieval (permission-filtered):** the backend sends only the document IDs
   the user may see; the AI service searches **only** inside that set.
3. **Generation:** the LLM receives the numbered passages + a strict safety
   system prompt. It answers only from the passages, cites `[Pn]`, refuses to
   diagnose/treat, and treats document text as data.
4. **Output:** the backend parses `[Pn]` markers back into real citation
   objects (docId, docTitle, page, excerpt) before returning to the frontend.

### 8.4 Frontend architecture
- **Stack:** the project's Next.js app (App Router, TypeScript, Tailwind, shadcn/ui).
- **State:** Zustand for client state, TanStack Query for server state.
- **Tokens:** access token in memory only; refresh token as httpOnly cookie.
  **Never** in localStorage, URLs, or logs.
- **Routing:** the live demo keeps everything on `/` with state-driven
  workspaces (landing / doctor / patient). The production app uses nested
  routes with role guards (`/doctor/*`, `/patient/*`, `/admin/*`).
- **AI answers:** rendered as sanitized markdown (`react-markdown`), never
  `dangerouslySetInnerHTML`.

---

## 9. Data model (high-level entities)

| Entity | Purpose | Key fields |
|---|---|---|
| `User` / `DemoAccount` | Auth + role | email, password (hashed), role |
| `Doctor` | Doctor profile | email, name, specialty, verified, rating, ratings |
| `Patient` | Patient profile | email, name, age, gender |
| `MedicalHistory` | Patient-reported history | patientId, sections (JSON), updatedAt |
| `Document` | Uploaded medical doc | patientId, title, type, content, pages (JSON), uploadedBy |
| `DoctorPatientAssignment` | Access-control join | doctorId, patientId (unique pair) |
| `Summary` | AI pre-visit summary | patientId, doctorId, content, sources (JSON), approved |
| `AuditLog` | Every sensitive action | actor, actorRole, action, resource, result, detail, createdAt |
| `Conversation` (Should) | Assistant history | userId, messages |

**Object-level authorization:** a role check is **not enough**. The backend
must verify, for every request, that the specific patient/doctor owns or is
assigned to the resource being accessed (prevents IDOR).

---

## 10. Non-functional requirements (NFR-xx)

### 10.1 Security (NFR-S)
- **NFR-S1** Tokens in memory only; refresh token httpOnly cookie; no tokens or patient data in localStorage/URLs/logs.
- **NFR-S2** RBAC + object-level authorization on every protected route.
- **NFR-S3** All user input escaped and validated; never build URLs/HTML from raw input.
- **NFR-S4** Error messages never reveal internals (stack traces, SQL, file paths).
- **NFR-S5** External links open with `rel="noopener noreferrer"`.
- **NFR-S6** No third-party scripts/CDNs not needed; pin dependency versions; `npm audit` in CI.
- **NFR-S7** CSP + security headers at the reverse proxy; avoid inline scripts.

### 10.2 Privacy
- **NFR-P1** Synthetic data only, treated exactly like real patient data.
- **NFR-P2** Audit log stores no full document text — only doc IDs + result status.
- **NFR-P3** A document deletion or user disable takes effect immediately: content can no longer be retrieved.

### 10.3 Accessibility (target WCAG AA)
- **NFR-A1** Keyboard navigation for all actions; visible focus.
- **NFR-A2** Color contrast ≥ 4.5:1; status chips also have text (no info by color alone).
- **NFR-A3** ARIA live region for new assistant messages; labels for icons.

### 10.4 Performance
- **NFR-PF1** Route-level code splitting; initial page usable on a normal connection.
- **NFR-PF2** Lighthouse (performance, a11y, best practices) ≥ 85 on main screens (target to measure, not a promise).
- **NFR-PF3** Per-user rate limits + daily token budget + max question length + request timeouts on the assistant.

### 10.5 i18n
- **NFR-I1** English first; Arabic added with `i18next` using CSS logical properties for RTL.
- **NFR-I2** All strings through the translation function from day one.
- **NFR-I3** User content may mix Arabic/English → use `dir="auto"`.

---

## 11. Security requirements summary

> Full detail lives in `docs/security-requirements.md` (Ammar's T07). This is
> the cross-team summary.

### 11.1 Assets
User accounts, tokens, roles, medical records, documents, audit log, secrets
(env vars, JWT secret, LLM API key).

### 11.2 Threats (STRIDE — top items)
| Threat | Example | Control |
|---|---|---|
| **Spoofing** | Forged token | JWT verify + Redis revoke check on every request |
| **Tampering** | `role:admin` in signup body | Zod validation rejects unknown fields |
| **Repudiation** | "I didn't view that" | Audit log on every sensitive action |
| **Information disclosure** | IDOR — patient reads another's record | Object-level authorization, not just role |
| **Denial of service** | Login flood | Throttling (429), **not** permanent lockout (which itself is a DoS) |
| **Elevation of privilege** | Becoming admin | Role from server-side `/me`, never client-editable |

### 11.3 Abuse cases (samples)
- Attacker tries to become admin by adding `role: admin` in signup → 400.
- Patient A rephrases/translates to read Patient B's content → still scoped to own docs.
- Hostile document contains "Ignore previous instructions…" → treated as data, ignored.
- Expired token used → 401; tampered token (`alg: none`) → 401.

### 11.4 Auth security tests (T19)
| Test | Expected |
|---|---|
| 8–10 failed logins | 429 + generic message; works again after window |
| Existing vs non-existing email, wrong password | Same status + message + similar timing |
| Malformed JSON / missing route | 400 / 404 generic, no stack |
| Expired token | 401; access-token lifetime ≤ 15 min |
| Tampered token (role change, `alg none`, wrong secret) | 401 in all cases |
| Mass assignment / injection (`{"$gt":""}`, `role:admin`) | 400 |
| Protected route without token / wrong role | 401 / 403 |

---

## 12. Assumptions, constraints, risks, open questions

### 12.1 Assumptions
- 2nd semester starts ~Feb 6, 2027.
- Ramadan ~Feb 8 – Mar 9 and Eid ~Mar 9–11 (estimates — verify).
- All data is synthetic and treated like real patient data.

### 12.2 Constraints
- Team of 6 students; weekly sprints; exam freeze periods.
- No real patient data; no model training.
- Backend = Node.js; DB = MongoDB (with vector store for RAG).
- The assistant never diagnoses; the doctor always decides.

### 12.3 Risks
- LLM provider cost/rate limits → daily token budget + mock mode for dev/demos.
- Exams reduce capacity → merge or park all PRs before each exam period.
- Security findings late in the project → run security in parallel from S1.

### 12.4 Open questions (to settle in Sprint 0)
1. Component library or custom Tailwind components?
2. Is streaming of assistant answers available, or only complete responses?
3. Are refresh tokens delivered as httpOnly cookies?
4. Maximum upload size and exact allowed file types?
5. Is Arabic/English in the MVP or deferred to Sprint 4?
6. Where do vectors live — alongside MongoDB or a separate store?
7. Rate-limit numbers (threshold, window) and throttling vs lockout.
8. "Email already registered" message on signup (reveals emails) — decide and record.
9. How is the first admin created?

---

## 13. Team ownership map

| Member | Primary track | Owns |
|---|---|---|
| **Ammar Tarek** (Leader) | Backend + Security | Auth, RBAC, audit logs, OpenAPI contract, threat model, pentest, security report, final report |
| **Abdelrahman Hany** | Frontend (web) | Web screens, doctor/admin dashboards, patient screens, web user manual |
| **Mohamed Sameh** | Mobile + DevOps | Repo/CI, Docker, staging, HTTPS, mobile app, infrastructure security review |
| **Yousab Mounir** | Backend core | Records, document upload, lab flow, API docs, security fixes |
| **Dina Mohamed** | Frontend (Assistant) + AI | Assistant UI, prompts, answer quality, evaluation report, slides |
| **Liza Hatem** | AI | AI service, ingestion, retrieval + permission filter, guardrails, LLM cost control |

**Security champions:** Liza (AI), Abdelrahman (frontend), Mohamed (infra) —
each knows the security checklist for their area.

---

## 14. Sprint mapping (from the sprint plan)

| Sprint | Dates | Goal | Key deliverables |
|---|---|---|---|
| S0 | Oct 7–22 | Foundation & decisions | Scope, repo, contracts, DB design, LLM choice, system analysis (this doc) |
| S1 | Oct 24–Nov 5 | Auth & skeleton | Login, RBAC, audit, base screens, RAG ingestion v1 |
| S2 | Nov 14–26 | Records & first RAG answer | Medical records, upload, permission-filtered retrieval, first cited answer |
| S3 | Nov 28–Dec 10 | Complete core before freeze | Admin, lab flow, summaries, eval set v1, first security round → **v0.1 + code freeze Dec 10** |
| S4 | Jan 26–Feb 4 | Catch-up & feature complete | Remaining MVP, guardrails, staging, audit viewer → **v0.2** |
| S5 | Feb 6–18 | Mobile & integration | Mobile app on same API, UX polish, retrieval tuning, eval report v1 |
| S6 | Feb 20–Mar 4 | Testing & stabilization | Automated tests, edge cases, perf, attack scenarios → **v0.3** |
| S7 | Mar 6–18 | Security & AI evaluation | Pentest own system, prompt-injection tests, fixes, re-run eval → **security report v1** |
| S8 | Mar 20–Apr 1 | Fix & document | Close findings, feature freeze Mar 27, final docs |
| S9 | Apr 3–15 | Delivery | Bug bash, final report, slides, rehearsals, submission |

**Key milestones:** v0.1 + code freeze Dec 10 · v0.2 feature-complete Feb 4 ·
feature freeze Mar 27 · delivery Apr 15.

---

## 15. Definition of done

A screen / feature is done only when:
- [ ] It matches the agreed design and works on the real API (or the contract mock, marked as such).
- [ ] Loading, empty, error, and forbidden states exist.
- [ ] It is keyboard-usable and passes basic accessibility checks.
- [ ] Strings go through i18n (if enabled) and the disclaimer appears where required.
- [ ] Every protected action is re-checked by the backend (RBAC + object-level authz).
- [ ] Every sensitive action is written to the audit log.
- [ ] Lint and type checks pass; tests exist for the critical logic.
- [ ] The PR is reviewed by another person and has a screenshot.

---

## 16. Glossary

| Term | Meaning |
|---|---|
| **RAG** | Retrieval-Augmented Generation — answer from retrieved documents, not model memory |
| **RBAC** | Role-Based Access Control |
| **Object-level authz** | Checking the specific resource belongs to this user (prevents IDOR) |
| **IDOR** | Insecure Direct Object Reference — accessing `/patients/<other-id>` |
| **Citation chip** | A UI chip under an AI statement showing the source document + page |
| **Source panel** | The side panel that opens when a chip is clicked, showing the exact excerpt |
| **Patient-reported** | Data entered by the patient, not verified by a doctor |
| **Verified doctor** | A doctor whose license/ID/syndicate card an admin has approved |
| **Assignment** | The doctor–patient link that grants the doctor access to that patient's records |
| **Canary string** | A planted unique string in a document, used to test cross-patient leakage |
| **Prompt injection** | A document containing instructions trying to change the assistant's behavior |
| **Throttling** | Temporary rate limit (429) — preferred over permanent lockout (which is itself a DoS) |
| **Mock mode** | A backend mode returning contract-shaped responses when the LLM is unavailable |
| **MoSCoW** | Must / Should / Could / Won't prioritization |

---

*This document is the team's shared ground. If anything is unclear, wrong, or
missing, raise it in the next review and update this file — do not build on
assumptions that contradict it.*

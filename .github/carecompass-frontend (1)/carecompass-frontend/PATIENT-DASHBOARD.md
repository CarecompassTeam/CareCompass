# Patient Dashboard

A full patient dashboard was added to the CareCompass React/Vite frontend,
mirroring the patient workspace from the original Next.js workspace. It is
reached by signing in as the patient demo account
(`patient@carecompass.app` / `demo1234`) in the Sign-in dialog.

## What was added

### New components — `src/components/patient/`

| File | Purpose |
| --- | --- |
| `PatientWorkspace.jsx` + `.css` | Dashboard shell: sticky topbar (logo, Patient badge, search, notifications, patient chip, sign out) + off-canvas sidebar with the five nav items + main content area. Mirrors `DoctorWorkspace`. |
| `MedicalHistoryForm.jsx` + `.css` | "My History" — structured editor for personal details, chronic conditions, medications, allergies, surgeries, family history, lifestyle and notes. Loads/saves through `/api/patient/history` (persisted to `localStorage`); patient-reported + privacy chips; sticky save bar. |
| `FindDoctor.jsx` + `.css` | "Find a Doctor" — directory of 8 verified doctors with search + specialty/rating/availability filters, doctor profile pages, and a full in-clinic booking flow (pick date → pick time → confirm → success). Availability is generated deterministically (skips Fridays). |
| `MyVisits.jsx` + `.css` | "My Visits" — three tabs (Upcoming / Past Visits / Cancelled) with appointment cards, a cancel confirmation dialog, an upcoming-appointment detail view, and a past-visit detail view (diagnosis, clinical notes, treatment, prescriptions, related documents, follow-up). Cancelling moves an appointment to the Cancelled tab. |
| `MyRecords.jsx` + `.css` | "My Records" — personal health archive with search + category filters, 11 sample records, record detail with document preview (processing / failed / image / paper), download, and a full upload dialog (drag & drop, progress, success). |

The Assistant view reuses the existing `src/components/doctor/AssistantWorkspace.jsx`
with `role="patient"`.

### Modified files

- `src/App.jsx` — added `patientSession` state; `handlePatientSignIn` now sets
  the session and the app renders `<PatientWorkspace>` when a patient is signed
  in (mirroring the existing doctor flow).
- `src/services/api.js` — added `GET`/`PUT /api/patient/history` mock handlers
  (the signed-in patient is Mariam R.; edits persist to `localStorage`).
- `public/assets/doc-1.jpg … doc-8.jpg` — doctor portraits, copied from the
  workspace so the Find a Doctor / My Visits avatars render.

## How to run

```bash
cd carecompass-frontend
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open the printed URL, click **Sign in**, choose the **Patient** demo account
(or enter `patient@carecompass.app` / `demo1234`), and the patient dashboard
loads on the **My History** view.

## Verified

- `bun run build` passes (2187 modules, no errors).
- All five views render with their seeded data and no console errors.
- No horizontal overflow at desktop (1280px) or mobile (375px).
- Find a Doctor booking flow works end-to-end (date → time → confirm → success).
- Cancelling an upcoming appointment moves it to the Cancelled tab.
- Medical history saves persist across reloads (via `localStorage`).

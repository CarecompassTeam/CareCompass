# Doctor Dashboard — Migration Map (workspace → your Vite frontend)

تمام — كل ملفات الـ doctor dashboard اتحولت من الـ workspace (TypeScript + Tailwind + shadcn)
إلى **JSX + CSS عادي** (مفيش Tailwind، مفيش shadcn، مفيش TypeScript).
الشكل والوظايف زي الـ workspace بالظبط، وكل البيانات وهمية (mock) لحد ما تربط الباك اند.

## 1) ملفات جديدة — اعمل نفس المسارات وانسخ كل ملف في مكانه

### Utilities & services
| الملف في المشروع | الوظيفة |
|---|---|
| `src/utils/cn.js` | بديل `cn()` (دمج الكلاسات) |
| `src/services/api.js` | **الـ Mock API** — نفس واجهة `api(path, options)` بتاعة الـ workspace. رجّعها بـ `fetch` لما الباك اند يبقى جاهز |
| `src/services/visit-store.js` | مخزن سجلات الزيارات المشترك (Visit Records + My Patients يبان فيهم نفس السجلات) |
| `src/services/medical-history.js` | هيلبرز السجل الطبي (`EMPTY_HISTORY`, `parseHistory`, `BLOOD_TYPES`) |
| `src/hooks/use-toast.js` | `toast({ title, description })` — نفس API الـ workspace |

### UI primitives (بديل shadcn/ui — بنفس الشكل)
| الملف | الوظيفة |
|---|---|
| `src/components/ui/Button.jsx` + `Button.css` | Button بـ variants (default/outline/destructive/secondary/ghost/link) و sizes |
| `src/components/ui/Dialog.jsx` + `Dialog.css` | Dialog (overlay + X + Esc + قفل scroll) |
| `src/components/ui/AlertDialog.jsx` + `AlertDialog.css` | AlertDialog تأكيد (Complete Visit) |
| `src/components/ui/Select.jsx` + `Select.css` | Select راديكسي-لايك (SelectTrigger/Content/Item/Value) |
| `src/components/ui/Toaster.jsx` + `Toaster.css` | التوستات (bottom-right / top على الموبايل) |

### Doctor dashboard components (كل ملف JSX + ملف CSS بنفس الاسم)
| الملف | الشاشة |
|---|---|
| `src/components/dashboard/constants.js` | الـ DISCLAIMER والثوابت المشتركة |
| `src/components/dashboard/Logo.jsx` + `Logo.css` | لوجو CareCompass (يستخدم `public/assets/carecompass-logo.png`) |
| `src/components/dashboard/DoctorWorkspace.jsx` + `DoctorWorkspace.css` | **الشيل الرئيسي**: الهيدر + السايدبار + التبويبات الستة |
| `src/components/dashboard/MedicalFeed.jsx` + `MedicalFeed.css` | تبويب Feed |
| `src/components/dashboard/DoctorPatients.jsx` + `DoctorPatients.css` | تبويب Patients (كتالوج المرضى + البروفايل + المستندات + AI Summary) |
| `src/components/dashboard/MySchedule.jsx` + `MySchedule.css` | تبويب My Schedule (Day/Week/Month + Availability) — بـ export اسمه `makeAppointments` |
| `src/components/dashboard/DoctorVisits.jsx` + `DoctorVisits.css` | تبويب Visit Records (المسودات + المكتملة + فورم السجل) |
| `src/components/dashboard/AssistantWorkspace.jsx` + `AssistantWorkspace.css` | تبويب Assistant (الأسئلة + الـ citations) |
| `src/components/dashboard/PreVisitSummaryWorkspace.jsx` + `PreVisitSummaryWorkspace.css` | تبويب Pre-visit Summary (توليد + اعتماد) |

## 2) ملف معدّل

- `src/App.jsx` — اتصلح فيه السلك جزء الدخول: `doctorSession` state + استيراد
  `DoctorWorkspace` + `<Toaster />`. لما الدكتور يعمل Sign in بيدخل على الداشبورد مباشرة.

## 3) نقطة ربط الباك اند لاحقاً

- كل نداءات الشبكة بتعدي من ملف واحد: `src/services/api.js`
  (Endpoints موجودة زي الـ workspace: `/api/doctor/patients`,
  `/api/doctor/patients/:id/history`, `/api/assistant/ask`, `/api/assistant/summary`).
- اعتمد على الـ shapes الموجودة في نفس الملف ( MOCK_PATIENTS / MOCK_HISTORIES ).
- سجلات الزيارات حالياً in-memory في `src/services/visit-store.js` — لما تربط API
  غيّر الـ seed والمحولات بس.

## 4) لا شيء تاني مطلوب

- مفيش تعديل على `src/styles/global.css` ولا أي مكتبة جديدة —
  التبعيات المطلوبة هي نفسها: `react`, `react-dom`, `lucide-react`.

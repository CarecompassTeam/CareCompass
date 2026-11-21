/* =====================================
   CareCompass — Medical history helpers
   Plain-JS port of the workspace lib/medical-history.ts.
   The same shapes are used by the doctor view and the mock API,
   so validation and display stay consistent.
===================================== */

export const EMPTY_HISTORY = {
  personal: {
    age: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    bloodType: "",
  },
  chronicConditions: [],
  medications: [],
  allergies: [],
  surgeries: [],
  familyHistory: [],
  lifestyle: {
    smoking: "",
    exercisePerWeek: "",
    alcohol: "",
    notes: "",
  },
  notes: "",
};

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function parseHistory(raw) {
  try {
    const parsed = JSON.parse(raw);
    // Shallow-merge with defaults so missing keys never crash the UI.
    return {
      ...EMPTY_HISTORY,
      ...parsed,
      personal: { ...EMPTY_HISTORY.personal, ...(parsed.personal || {}) },
      lifestyle: { ...EMPTY_HISTORY.lifestyle, ...(parsed.lifestyle || {}) },
    };
  } catch {
    return EMPTY_HISTORY;
  }
}
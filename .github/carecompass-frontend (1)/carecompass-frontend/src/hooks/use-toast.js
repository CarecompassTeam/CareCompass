/* =====================================
   use-toast — compatibility re-export
=====================================
   The doctor-dashboard components import `{ toast }` from
   "@/hooks/use-toast" in the original workspace. This file keeps
   that import path alive in the plain-CSS project.

   The implementation itself lives in components/ui/Toaster.jsx;
   remember to mount <Toaster /> once (already done in App.jsx).
===================================== */

export { toast, dismissToast } from "../components/ui/Toaster";
export { Toaster } from "../components/ui/Toaster";

export function useToast() {
  // Kept for API parity — the dashboard uses the imperative `toast()`.
  return { toast, dismiss: dismissToast };
}

export default useToast;

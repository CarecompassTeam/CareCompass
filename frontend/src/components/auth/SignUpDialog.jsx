import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Award, CheckCircle2, Eye, EyeOff, FileText,
  HeartPulse, Lock, Mail, ShieldCheck, Stethoscope, UploadCloud, User, X,
} from "lucide-react";
import "./SignUpDialog.css";

const DISCLAIMER = "Information assistant. Not a diagnosis. The doctor decides.";

export function SignUpDialog({ open, onOpenChange, onBackToSignIn }) {
  const [audience, setAudience] = useState("choose");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [files, setFiles] = useState({ license: null, nationalId: null, syndicate: null });
  const [patient, setPatient] = useState({ fullName: "", email: "", password: "" });
  const [doctor, setDoctor] = useState({ fullName: "", email: "", password: ""});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => event.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setAudience("choose"); setStep(1); setSubmitted(false);
      setFiles({ license: null, nationalId: null, syndicate: null });
    }
  }, [open]);

  if (!open) return null;

  const copy = audience === "doctor"
    ? { headline: <>No doctor sees a patient until a <span className="signup-underline">human checks the license</span>.</>, blurb: "Create your account, upload your documents, and an admin reviews them by hand. Only then do you appear in patient search.", note: "Your documents are shown here for the prototype. Verification and upload logic can be connected later." }
    : audience === "patient"
      ? { headline: <>Your records, <span className="signup-underline">finally in plain words</span>.</>, blurb: "Create a free patient account — no documents to upload, no waiting. Keep your records in one place and book verified doctors.", note: "Patients skip verification entirely — the account is ready after sign up." }
      : { headline: <>One account for <span className="signup-underline">every step of your care</span>.</>, blurb: "Patients get a private record vault and a cited assistant. Doctors apply once and a human admin verifies every document.", note: "Both paths start here — pick the account type that fits you." };

  const handleFile = (key, file) => setFiles((old) => ({ ...old, [key]: file }));
  const updatePatient = (key, value) => setPatient((old) => ({ ...old, [key]: value }));
  const updateDoctor = (key, value) => setDoctor((old) => ({ ...old, [key]: value }));

  return (
    <div className="signup-overlay" onMouseDown={(e) => e.target === e.currentTarget && onOpenChange(false)}>
      <section className="signup-dialog" role="dialog" aria-modal="true" aria-labelledby="signup-title">
        <button className="signup-close" type="button" onClick={() => onOpenChange(false)} aria-label="Close sign up"><X size={19} /></button>
        <div className="signup-layout">
          <aside className="signup-brand-panel">
            <div className="signup-brand-glow" />
            <div className="signup-brand-top">
              <div className="signup-logo"><img src="/assets/carecompass-logo-light.png" alt="" /><span>Care<span>Compass</span></span></div>
              <h2>{copy.headline}</h2>
              <p className="signup-brand-description">{copy.blurb}</p>
            </div>
            <div className="signup-brand-bottom">
              <div className="signup-security-note"><ShieldCheck size={17} /><p>{copy.note}</p></div>
              <p className="signup-disclaimer"><Lock size={12} /><strong>{DISCLAIMER}</strong></p>
            </div>
          </aside>

          <main className="signup-form-panel">
            <div className="signup-mobile-logo">Care<span>Compass</span></div>
            {submitted ? (
              <div className="signup-success">
                <span className="signup-success-icon"><CheckCircle2 size={28} /></span>
                <p className="signup-eyebrow">Prototype preview</p>
                <h1 id="signup-title">You're all set!</h1>
                <p>Your sign-up information has been collected in this interface. No account or documents were sent to a server.</p>
                <button className="signup-primary" onClick={() => onOpenChange(false)}>Done <ArrowRight size={16} /></button>
              </div>
            ) : audience === "choose" ? (
              <>
                <p className="signup-eyebrow">Get early access</p>
                <h1 id="signup-title">Choose your account type</h1>
                <p className="signup-subtitle">Patients start instantly — doctors go through human verification.</p>
                <div className="signup-audience-list">
                  <button className="signup-audience-card" onClick={() => setAudience("patient")}>
                    <span className="signup-audience-icon patient"><HeartPulse size={21} /></span>
                    <span className="signup-audience-copy"><strong>I'm a patient</strong><small>No verification</small><em>Create a free account with your name, email and a password. Upload records, ask the cited assistant and book verified doctors.</em></span>
                    <ArrowRight size={17} />
                  </button>
                  <button className="signup-audience-card" onClick={() => { setAudience("doctor"); setStep(1); }}>
                    <span className="signup-audience-icon doctor"><Stethoscope size={21} /></span>
                    <span className="signup-audience-copy"><strong>I'm a doctor</strong><small>Human-verified</small><em>Apply for early access with your license, national ID and syndicate card. A human admin reviews every document.</em></span>
                    <ArrowRight size={17} />
                  </button>
                </div>
                <p className="signup-bottom-link">Already have an account? <button onClick={onBackToSignIn}>Sign in</button></p>
              </>
            ) : audience === "patient" ? (
              <>
                <button className="signup-back" onClick={() => setAudience("choose")}><ArrowLeft size={15} /> Account type</button>
                <p className="signup-eyebrow">Get early access · Patient account</p>
                <h1 id="signup-title">Create your patient account</h1>
                <p className="signup-subtitle">Just your name, email and a password — patients skip document verification entirely.</p>
                <form className="signup-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                  <label>Full name<div className="signup-input-wrap"><User size={16} /><input required minLength={3} placeholder="Mariam Hassan" value={patient.fullName} onChange={(e) => updatePatient("fullName", e.target.value)} /></div></label>
                  <label>Email<div className="signup-input-wrap"><Mail size={16} /><input required type="email" placeholder="you@example.com" value={patient.email} onChange={(e) => updatePatient("email", e.target.value)} /></div></label>
                  <label>Password<div className="signup-input-wrap"><Lock size={16} /><input required minLength={8} type={showPassword ? "text" : "password"} placeholder="A strong password" value={patient.password} onChange={(e) => updatePatient("password", e.target.value)} /><button type="button" className="signup-eye" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                  <button className="signup-primary" type="submit">Create account <ArrowRight size={16} /></button>
                </form>
                <p className="signup-bottom-link">Are you a doctor? <button onClick={() => { setAudience("doctor"); setStep(1); }}>Apply for early access</button></p>
                <p className="signup-bottom-link">Already have an account? <button onClick={onBackToSignIn}>Sign in</button></p>
              </>
            ) : (
              <>
                <button className="signup-back" onClick={() => { setAudience("choose"); setStep(1); }}><ArrowLeft size={15} /> Account type</button>
                <p className="signup-eyebrow">Get early access · Doctor application</p>
                <h1 id="signup-title">{step === 1 ? "Create your doctor account" : "Upload verification documents"}</h1>
                <p className="signup-subtitle">{step === 1 ? "Start with your account details and professional information." : "Add the documents required for manual verification."}</p>
                <div className="signup-steps"><span className={step === 1 ? "active" : "done"}>1 <small>Account</small></span><i /><span className={step === 2 ? "active" : ""}>2 <small>Documents</small></span></div>
                {step === 1 ? <form className="signup-form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                  <label>Full name<div className="signup-input-wrap"><User size={16} /><input required minLength={3} placeholder="Dr. Hana Kamal" value={doctor.fullName} onChange={(e) => updateDoctor("fullName", e.target.value)} /></div></label>
                  <label>Email<div className="signup-input-wrap"><Mail size={16} /><input required type="email" placeholder="doctor@example.com" value={doctor.email} onChange={(e) => updateDoctor("email", e.target.value)} /></div></label>
                  <label>Password<div className="signup-input-wrap"><Lock size={16} /><input required minLength={8} type={showPassword ? "text" : "password"} placeholder="A strong password" value={doctor.password} onChange={(e) => updateDoctor("password", e.target.value)} /><button type="button" className="signup-eye" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                  <button className="signup-primary" type="submit">Continue to documents <ArrowRight size={16} /></button>
                </form> : <>
                  <div className="signup-upload-list">
                    {[["license", "Medical license", "Upload your valid medical practice license"], ["nationalId", "National ID", "Upload a clear copy of your national ID"], ["syndicate", "Syndicate card", "Upload your medical syndicate card"]].map(([key, title, hint]) => <label className="signup-upload" key={key}><span className="signup-upload-icon"><UploadCloud size={19} /></span><span><strong>{title}</strong><small>{files[key]?.name || hint}</small></span><input type="file" accept="image/*,.pdf" onChange={(e) => handleFile(key, e.target.files?.[0] || null)} /></label>)}
                  </div>
                  <p className="signup-upload-note"><ShieldCheck size={15} /> Files are only selected locally in this prototype; no upload takes place.</p>
                  <div className="signup-form-actions"><button className="signup-secondary" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button><button className="signup-primary" onClick={() => setSubmitted(true)}>Submit application <ArrowRight size={16} /></button></div>
                </>}
                <p className="signup-bottom-link">Already have an account? <button onClick={onBackToSignIn}>Sign in</button></p>
              </>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

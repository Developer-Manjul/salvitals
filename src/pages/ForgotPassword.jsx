import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault(); setLoading(true);
    // Backend-ready: replace with POST /api/auth/forgot-password.
    setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };

  return (
    <div className="auth-simple-page">
      <div className="auth-simple-card">
        <button className="auth-back" onClick={() => window.location.href = "/signin"}>← Back to sign in</button>
        <div className="auth-simple-brand"><span className="auth-mark"><span>∿</span></span><div><b>Vitals</b><small>CLINIC GROWTH CRM</small></div></div>
        {!sent ? <>
          <h1>Forgot your password?</h1>
          <p>Enter your work email and we'll send you a secure password reset link.</p>
          <form className="auth-form" onSubmit={submit}>
            <label>Work email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@clinic.com" autoComplete="email" required /></label>
            <button className="auth-submit" disabled={loading}>{loading ? "Sending…" : "Send reset link →"}</button>
          </form>
        </> : <>
          <div className="auth-success-icon">✓</div>
          <h1>Check your inbox</h1>
          <p>If an account exists for <b>{email}</b>, a password reset link has been sent.</p>
          <button className="auth-submit" onClick={() => window.location.href = "/signin"}>Back to sign in</button>
        </>}
        <div className="auth-security"><span>◈ ISO 27001</span><span>♙ DPDP compliant</span><span>▣ Data in India</span></div>
      </div>
    </div>
  );
}

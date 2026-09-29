import { useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const apiUrl = `${getApiBaseUrl()}/api/auth/forgot-password`;

    console.log("FORGOT PASSWORD API:", apiUrl);
    console.log("FORGOT PASSWORD EMAIL:", email);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      console.log(
        "FORGOT PASSWORD STATUS:",
        response.status
      );

      const data = await response.json();

      console.log(
        "FORGOT PASSWORD RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to send password reset link"
        );
      }

      setSent(true);
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to send password reset link"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-simple-page">
      <div className="auth-simple-card">

        <button
          className="auth-back"
          onClick={() =>
            (window.location.href = "/signin")
          }
        >
          ← Back to sign in
        </button>

        <div className="auth-simple-brand">
          <img
            src="/logo.png"
            alt="SaleVitals"
            className="auth-simple-logo"
          />
        </div>

        {!sent ? (
          <>
            <h1>Forgot your password?</h1>

            <p>
              Enter your work email and we'll send you
              a secure password reset link.
            </p>

            <form
              className="auth-form"
              onSubmit={submit}
            >
              <label>
                Work email

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  required
                />
              </label>

              {error && (
                <div
                  style={{
                    marginTop: "10px",
                    color: "#dc2626",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                className="auth-submit"
                disabled={loading}
                type="submit"
              >
                {loading
                  ? "Sending…"
                  : "Send reset link →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-success-icon">
              ✓
            </div>

            <h1>Check your inbox</h1>

            <p>
              If an account exists for{" "}
              <b>{email}</b>, a password reset
              link has been sent.
            </p>

            <button
              className="auth-submit"
              onClick={() =>
                (window.location.href = "/signin")
              }
            >
              Back to sign in
            </button>
          </>
        )}

        <div className="auth-security">
          <span>◈ ISO 27001</span>
          <span>♙ DPDP compliant</span>
          <span>▣ Data in India</span>
        </div>

      </div>
    </div>
  );
}
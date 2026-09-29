import { useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(
    window.location.search
  );

  const token = params.get("token") || "";

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!token) {
      setError("Password reset link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset password."
        );
      }

      setSuccess(true);
    } catch (error) {
      setError(
        error.message ||
          "Unable to reset password."
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
          type="button"
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

        {!success ? (
          <>
            <h1>Reset your password</h1>

            <p>
              Create a new secure password for your
              SaleVitals account.
            </p>

            <form
              className="auth-form"
              onSubmit={submit}
            >
              <label>
                New password

                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirm password

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Resetting…"
                  : "Reset Password →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-success-icon">
              ✓
            </div>

            <h1>Password reset</h1>

            <p>
              Your password has been reset
              successfully. You can now sign in
              with your new password.
            </p>

            <button
              className="auth-submit"
              type="button"
              onClick={() =>
                (window.location.href =
                  "/signin")
              }
            >
              Sign in →
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
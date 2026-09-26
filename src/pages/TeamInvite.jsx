import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function TeamInvite() {
  const [invitation, setInvitation] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = new URLSearchParams(
    window.location.search
  ).get("token");

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }

      try {
        const api = getApiBaseUrl();

        const response = await fetch(
          `${api}/api/auth/team-invite?token=${encodeURIComponent(
            token
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message ||
              "This invitation link is invalid or expired."
          );
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        console.error(
          "Team invitation verification error:",
          err
        );

        setError(
          "Unable to verify invitation. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const api = getApiBaseUrl();

      const response = await fetch(
        `${api}/api/auth/team-invite/accept`,
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

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to create your account."
        );
        return;
      }

      setSuccess(
        data.message ||
          "Account created successfully."
      );

      setTimeout(() => {
        window.location.href =
          "/signin?message=team-invite-accepted";
      }, 1800);
    } catch (err) {
      console.error(
        "Team invitation acceptance error:",
        err
      );

      setError(
        "Unable to connect to server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner}></div>

          <h2 style={styles.loadingTitle}>
            Verifying invitation
          </h2>

          <p style={styles.loadingText}>
            Please wait while we verify your invitation.
          </p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>

          <h1 style={styles.errorTitle}>
            Invitation unavailable
          </h1>

          <p style={styles.errorText}>
            {error}
          </p>

          <a
            href="/signin"
            style={styles.signinButton}
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.backgroundShapeOne}></div>
      <div style={styles.backgroundShapeTwo}></div>
      <div style={styles.backgroundShapeThree}></div>

      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.logoWrap}>
            <img
              src="/logo.png"
              alt="SaleVitals"
              style={styles.logo}
            />
          </div>

          <h1 style={styles.title}>
            Accept Invitation
          </h1>

          <p style={styles.subtitle}>
            You have been invited to join the
            SaleVitals team.
          </p>

          {invitation && (
            <div style={styles.invitationBox}>
              <div style={styles.infoRow}>
                <div style={styles.infoIcon}>
                  ●
                </div>

                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>
                    Name
                  </div>

                  <div style={styles.infoValue}>
                    {invitation.name}
                  </div>
                </div>
              </div>

              <div style={styles.divider}></div>

              <div style={styles.infoRow}>
                <div style={styles.infoIcon}>
                  ✉
                </div>

                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>
                    Email
                  </div>

                  <div
                    style={{
                      ...styles.infoValue,
                      wordBreak: "break-word",
                    }}
                  >
                    {invitation.email}
                  </div>
                </div>
              </div>

              <div style={styles.divider}></div>

              <div style={styles.infoRow}>
                <div style={styles.infoIcon}>
                  ◆
                </div>

                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>
                    Role
                  </div>

                  <div style={styles.roleBadge}>
                    {invitation.role}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <div style={styles.passwordGrid}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Create Password
                </label>

                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    🔒
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter password"
                    autoComplete="new-password"
                    disabled={submitting}
                    style={styles.input}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    style={styles.eyeButton}
                    tabIndex="-1"
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Confirm Password
                </label>

                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    🔒
                  </span>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    disabled={submitting}
                    style={styles.input}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    style={styles.eyeButton}
                    tabIndex="-1"
                  >
                    {showConfirmPassword
                      ? "◉"
                      : "◌"}
                  </button>
                </div>
              </div>
            </div>

            <p style={styles.passwordHint}>
              Password must be at least 8 characters.
            </p>

            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            {success && (
              <div style={styles.successBox}>
                <strong>{success}</strong>

                <span>
                  Redirecting to sign in...
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.primaryButton,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {submitting
                ? "Creating Account..."
                : "Accept Invitation"}

              {!submitting && (
                <span style={styles.arrow}>
                  →
                </span>
              )}
            </button>
            </form>
                  
        </div>

        <p style={styles.bottomText}>
          © {new Date().getFullYear()} SaleVitals.
          All rights reserved.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "30px 20px",
    background:
      "linear-gradient(135deg, #f7fbfb 0%, #eef7f7 48%, #f8fbfc 100%)",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  backgroundShapeOne: {
    position: "absolute",
    width: "430px",
    height: "430px",
    left: "-250px",
    top: "-170px",
    borderRadius: "50%",
    background:
      "rgba(0, 101, 106, 0.055)",
    pointerEvents: "none",
  },

  backgroundShapeTwo: {
    position: "absolute",
    width: "560px",
    height: "560px",
    right: "-350px",
    top: "180px",
    borderRadius: "50%",
    border:
      "95px solid rgba(0, 101, 106, 0.045)",
    pointerEvents: "none",
  },

  backgroundShapeThree: {
    position: "absolute",
    width: "350px",
    height: "350px",
    left: "-260px",
    bottom: "-190px",
    borderRadius: "50%",
    border:
      "70px solid rgba(34, 178, 107, 0.045)",
    pointerEvents: "none",
  },

  wrapper: {
    width: "100%",
    maxWidth: "610px",
    position: "relative",
    zIndex: 2,
  },

  card: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "30px 40px 28px",
    border:
      "1px solid rgba(0, 101, 106, 0.08)",
    boxShadow:
      "0 22px 60px rgba(17, 75, 78, 0.11)",
  },

  logoWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "10px",
  },

  logo: {
    display: "block",
    width: "135px",
    height: "auto",
    maxHeight: "120px",
    objectFit: "contain",
  },

  title: {
    margin: "0",
    textAlign: "center",
    color: "#172B4D",
    fontSize: "31px",
    lineHeight: "1.2",
    fontWeight: "800",
    letterSpacing: "-0.6px",
  },

  subtitle: {
    margin:
      "8px auto 20px",
    textAlign: "center",
    color: "#667085",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  invitationBox: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 18px",
    marginBottom: "21px",
    background:
      "linear-gradient(135deg, #f8fbfb 0%, #f4fafa 100%)",
    border:
      "1px solid #dcebec",
    borderRadius: "14px",
  },

  infoRow: {
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  divider: {
    height: "1px",
    width: "100%",
    background: "#e2ebeb",
  },

  infoIcon: {
    width: "31px",
    height: "31px",
    minWidth: "31px",
    borderRadius: "50%",
    background: "#e5f5f5",
    color: "#00656A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "800",
  },

  infoContent: {
    minWidth: 0,
    flex: 1,
  },

  infoLabel: {
    marginBottom: "2px",
    color: "#718096",
    fontSize: "11px",
    lineHeight: "1.2",
    fontWeight: "500",
  },

  infoValue: {
    color: "#172B4D",
    fontSize: "14px",
    lineHeight: "1.3",
    fontWeight: "700",
  },

  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: "6px",
    background: "#dff4f4",
    color: "#00656A",
    fontSize: "11px",
    lineHeight: "1",
    fontWeight: "700",
  },

  form: {
    width: "100%",
  },

  passwordGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    width: "100%",
  },

  field: {
    width: "100%",
    marginBottom: "13px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#172B4D",
    fontSize: "13px",
    lineHeight: "1.3",
    fontWeight: "700",
  },

  inputWrap: {
    width: "100%",
    height: "49px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    border:
      "1px solid #d2dbe3",
    borderRadius: "9px",
    background: "#ffffff",
  },

  inputIcon: {
    width: "36px",
    minWidth: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    opacity: 0.6,
  },

  input: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    padding: "0 3px",
    boxSizing: "border-box",
    background: "transparent",
    color: "#172B4D",
    fontSize: "13px",
  },

  eyeButton: {
    width: "37px",
    minWidth: "37px",
    height: "100%",
    border: "none",
    background: "transparent",
    color: "#708197",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  passwordHint: {
    margin:
      "0 0 15px",
    color: "#718096",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  errorBox: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: "14px",
    borderRadius: "8px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  successBox: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: "14px",
    borderRadius: "8px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "12px",
    lineHeight: "1.5",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  primaryButton: {
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #00656A 0%, #00777B 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow:
      "0 7px 18px rgba(0, 101, 106, 0.17)",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  arrow: {
    marginLeft: "8px",
    fontSize: "17px",
    lineHeight: "1",
  },

  orDivider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin:
      "17px 0 13px",
  },

  orLine: {
    flex: 1,
    height: "1px",
    background: "#e5e7eb",
  },

  orText: {
    color: "#98A2B3",
    fontSize: "11px",
  },

  footerText: {
    margin: "0",
    textAlign: "center",
    color: "#718096",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  signinLink: {
    color: "#00656A",
    fontWeight: "700",
    textDecoration: "none",
  },

  bottomText: {
    margin:
      "14px 0 0",
    textAlign: "center",
    color: "#98A2B3",
    fontSize: "10px",
    lineHeight: "1.5",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "450px",
    boxSizing: "border-box",
    padding: "45px 30px",
    background: "#ffffff",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 22px 60px rgba(17, 75, 78, 0.11)",
  },

  loadingSpinner: {
    width: "38px",
    height: "38px",
    margin: "0 auto 18px",
    borderRadius: "50%",
    border:
      "4px solid #dff1f1",
    borderTopColor: "#00656A",
  },

  loadingTitle: {
    margin: "0 0 7px",
    color: "#172B4D",
    fontSize: "22px",
  },

  loadingText: {
    margin: "0",
    color: "#718096",
    fontSize: "13px",
  },

  errorCard: {
    width: "100%",
    maxWidth: "470px",
    boxSizing: "border-box",
    padding: "40px 35px",
    background: "#ffffff",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 22px 60px rgba(17, 75, 78, 0.11)",
  },

  errorIcon: {
    width: "54px",
    height: "54px",
    margin: "0 auto 17px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: "24px",
    fontWeight: "800",
  },

  errorTitle: {
    margin: "0 0 9px",
    color: "#172B4D",
    fontSize: "26px",
    fontWeight: "800",
  },

  errorText: {
    margin: "0",
    color: "#667085",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  signinButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "48px",
    marginTop: "21px",
    borderRadius: "9px",
    background: "#00656A",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "700",
  },
};

if (typeof document !== "undefined") {
  const styleId = "team-invite-responsive-styles";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;

    style.innerHTML = `
      @media (max-width: 650px) {
        .team-invite-page {
          padding: 20px 14px !important;
        }
      }

      @media (max-width: 620px) {
        .team-invite-password-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
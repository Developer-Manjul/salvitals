import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function CheckEmail() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const email =
    params.get("email") || "";

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const resendEmail = async () => {
    if (!email) {
      setError(
        "Email address is missing."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/resend-verification`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to resend email."
        );
        return;
      }

      setMessage(
        data.message ||
          "Verification email sent."
      );
    } catch (error) {
      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          padding: "40px",
        }}
      >
        <h1>Check your email</h1>

        <p>
          We sent a verification link to
        </p>

        <strong>{email}</strong>

        <p>
          Please open your email and click
          the verification link to continue
          your account setup.
        </p>

        {message && (
          <p
            style={{
              color: "#16a34a",
            }}
          >
            {message}
          </p>
        )}

        {error && (
          <p
            style={{
              color: "#dc2626",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={resendEmail}
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Resend verification email"}
        </button>
      </div>
    </div>
  );
}
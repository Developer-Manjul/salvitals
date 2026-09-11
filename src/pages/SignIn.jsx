import { useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [notice] = useState(() => {
    const message = new URLSearchParams(
      window.location.search
    ).get("message");

    return message === "email-verified"
      ? "Your email was verified successfully. Please sign in to continue."
      : "";
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const api = getApiBaseUrl();

      const response = await fetch(
        `${api}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid email or password."
        );

        setLoading(false);
        return;
      }

      const token = data.token;
      const userData = data.user || {};

      if (!token) {
        setError(
          "Login failed. Authentication token not received."
        );

        setLoading(false);
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("vitalsToken");
      localStorage.removeItem("vitalsUser");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("vitalsToken");
      sessionStorage.removeItem("vitalsUser");

      const storage = remember
        ? localStorage
        : sessionStorage;

      storage.setItem("token", token);
      storage.setItem("vitalsToken", token);
      storage.setItem(
        "salevitals_token",
        token
      );

      storage.setItem(
        "user",
        JSON.stringify(userData)
      );

      storage.setItem(
        "vitalsUser",
        JSON.stringify(userData)
      );

      storage.setItem(
        "salevitals_user",
        JSON.stringify(userData)
      );

      const redirectAfterLogin =
        localStorage.getItem(
          "redirectAfterLogin"
        ) ||
        sessionStorage.getItem(
          "redirectAfterLogin"
        );

      let paymentCompleted = false;

      try {
        const paymentResponse =
          await fetch(
            `${api}/api/payment/status`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        const paymentData =
          await paymentResponse.json();

        console.log(
          "================================="
        );

        console.log(
          "LOGIN PAYMENT CHECK"
        );

        console.log(
          "EMAIL:",
          userData.email
        );

        console.log(
          "PAYMENT RESPONSE STATUS:",
          paymentResponse.status
        );

        console.log(
          "PAYMENT DATA:",
          paymentData
        );

        console.log(
          "================================="
        );

        const orderStatus =
          paymentData?.order
            ?.paymentStatus ||
          paymentData?.latestOrder
            ?.paymentStatus ||
          paymentData?.payment
            ?.paymentStatus ||
          paymentData?.order?.status ||
          paymentData?.latestOrder
            ?.status ||
          paymentData?.payment?.status;

        paymentCompleted =
          paymentResponse.ok &&
          (
            paymentData?.payment_completed ===
              true ||
            paymentData?.paymentCompleted ===
              true ||
            paymentData?.paid === true ||
            paymentData?.isPaid === true ||
            paymentData?.payment_status ===
              "paid" ||
            paymentData?.paymentStatus ===
              "paid" ||
            paymentData?.status === "paid" ||
            orderStatus === "paid"
          );

        console.log(
          "PAYMENT COMPLETED:",
          paymentCompleted
        );

      } catch (paymentError) {
        console.error(
          "Payment status check error:",
          paymentError
        );

        paymentCompleted = false;
      }

      if (paymentCompleted) {
        localStorage.removeItem(
          "redirectAfterLogin"
        );

        sessionStorage.removeItem(
          "redirectAfterLogin"
        );

        localStorage.removeItem(
          "redirectAfterSetup"
        );

        sessionStorage.removeItem(
          "redirectAfterSetup"
        );

        localStorage.removeItem(
          "redirectAfterRegister"
        );

        sessionStorage.removeItem(
          "redirectAfterRegister"
        );

        setLoading(false);

        window.location.href =
          "/dashboard";

        return;
      }

      const accountSetupCompleted =
        userData.accountSetupCompleted ===
          true ||
        userData.profileCompleted === true ||
        userData.setupCompleted === true;

      if (!accountSetupCompleted) {
        if (redirectAfterLogin) {
          storage.setItem(
            "redirectAfterSetup",
            redirectAfterLogin
          );
        }

        localStorage.removeItem(
          "redirectAfterLogin"
        );

        sessionStorage.removeItem(
          "redirectAfterLogin"
        );

        setLoading(false);

        window.location.href =
          "/create-account?setup=1";

        return;
      }

      localStorage.removeItem(
        "redirectAfterLogin"
      );

      sessionStorage.removeItem(
        "redirectAfterLogin"
      );

      setLoading(false);

      window.location.href =
        redirectAfterLogin || "/cart";

      return;

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );

      setLoading(false);
    }
  };

  const goToCreateAccount = () => {
    const redirectAfterLogin =
      localStorage.getItem(
        "redirectAfterLogin"
      ) ||
      sessionStorage.getItem(
        "redirectAfterLogin"
      );

    if (redirectAfterLogin) {
      localStorage.setItem(
        "redirectAfterRegister",
        redirectAfterLogin
      );
    }

    window.location.href =
      "/create-account";
  };

  const goToForgotPassword = () => {
    window.location.href =
      "/forgot-password";
  };

  return (
    <div className="auth-page auth-signin-page">

      <div className="auth-brand-mobile">

        <span className="auth-mark">
          <span>∿</span>
        </span>

        <div>
          <b>Vitals</b>

          <small>
            CLINIC GROWTH CRM
          </small>
        </div>

      </div>

      <div className="auth-left auth-left-signin">

        <div className="auth-left-inner">

          <div className="auth-brand">

            <span className="auth-mark">
              <span>∿</span>
            </span>

            <div>
              <b>Vitals</b>

              <small>
                CLINIC GROWTH CRM
              </small>
            </div>

          </div>

          <div className="auth-eyebrow">
            BUILT FOR INDIAN CLINICS
          </div>

          <h2>
            Every enquiry answered.
            <br />
            Every patient followed up.
          </h2>

          <p>
            One workspace for enquiries,
            WhatsApp, consultations,
            follow-ups and GST billing —
            built for clinics, not for
            hospitals' back offices.
          </p>

          <div className="auth-stats">

            <div className="auth-stat">

              <strong>
                4,200+
              </strong>

              <span>
                clinics &amp; practices
              </span>

            </div>

            <div className="auth-stat">

              <strong>
                38%
              </strong>

              <span>
                avg. enquiry-to-consult
              </span>

            </div>

            <div className="auth-stat">

              <strong>
                &lt; 5 min
              </strong>

              <span>
                first response time
              </span>

            </div>

          </div>

          <div className="auth-testimonial">

            <div className="auth-testimonial-head">

              <div className="auth-avatar">
                RM
              </div>

              <div>

                <strong>
                  Dr. Rahul Mehta
                </strong>

                <small>
                  Mehta Ortho &amp; Physio,
                  Pune
                </small>

              </div>

            </div>

            <p>
              “We were losing enquiries in
              WhatsApp. Now every message
              becomes a lead with an owner
              and a follow-up date.
              Consultations are up a third.”
            </p>

          </div>

        </div>

      </div>

      <div className="auth-right">

        <div className="auth-card">

          <div className="auth-top">

            <h1>
              Welcome back
            </h1>

            <p>
              Manage your business.
              Grow your practice.
            </p>

          </div>

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            <label className="auth-field">

              <span>
                Work email
              </span>

              <div className="auth-input-wrap">

                <span className="auth-input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(
                      e.target.value
                    );

                    setError("");
                  }}
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  required
                />

              </div>

            </label>

            <label className="auth-field">

              <div className="auth-label-row">

                <span>
                  Password
                </span>

                <button
                  type="button"
                  className="auth-forgot"
                  onClick={
                    goToForgotPassword
                  }
                >
                  Forgot password?
                </button>

              </div>

              <div className="auth-input-wrap">

                <span className="auth-input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(
                      e.target.value
                    );

                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="auth-eye"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "◉"
                    : "◌"}
                </button>

              </div>

            </label>

            <label className="auth-remember">

              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(
                    e.target.checked
                  )
                }
              />

              <span>
                Keep me signed in on this
                device
              </span>

            </label>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {notice && (
              <div className="auth-notice auth-success-notice">
                <span className="auth-notice-icon">
                  ✓
                </span>

                <div className="auth-notice-content">
                  <strong>
                    Email verified successfully
                  </strong>

                  <span>
                    {notice}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in →"}
            </button>

          </form>

          <div className="auth-divider">

            <span></span>

            <b>
              OR
            </b>

            <span></span>

          </div>

          <button
            type="button"
            className="auth-google"
            onClick={() => {
              alert(
                "Google login will be connected later."
              );
            }}
          >

            <span className="google-icon">
              G
            </span>

            Continue with Google

          </button>

          <div className="auth-switch">

            Don't have an account?{" "}

            <button
              type="button"
              onClick={
                goToCreateAccount
              }
            >
              Create account
            </button>

          </div>

          <div className="auth-security">

            <span>
              ♢ ISO 27001
            </span>

            <span>
              ♙ DPDP compliant
            </span>

            <span>
              ▣ Data in India
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}
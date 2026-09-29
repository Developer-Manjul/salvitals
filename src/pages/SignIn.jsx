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

  const clearLoginRedirects = () => {
    localStorage.removeItem("redirectAfterLogin");
    sessionStorage.removeItem("redirectAfterLogin");

    localStorage.removeItem("redirectAfterSetup");
    sessionStorage.removeItem("redirectAfterSetup");

    localStorage.removeItem("redirectAfterRegister");
    sessionStorage.removeItem("redirectAfterRegister");
  };

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

      const redirectAfterLogin =
        localStorage.getItem(
          "redirectAfterLogin"
        ) ||
        sessionStorage.getItem(
          "redirectAfterLogin"
        );

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("vitalsToken");
      localStorage.removeItem("vitalsUser");
      localStorage.removeItem("salevitals_token");
      localStorage.removeItem("salevitals_user");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("vitalsToken");
      sessionStorage.removeItem("vitalsUser");
      sessionStorage.removeItem("salevitals_token");
      sessionStorage.removeItem("salevitals_user");

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

      let paymentCompleted = false;
      let subscriptionActive = false;

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

        subscriptionActive =
          paymentResponse.ok &&
          paymentData?.subscription?.status ===
          "active";

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
            orderStatus === "paid" ||
            subscriptionActive
          );
      } catch (paymentError) {
        console.error(
          "Payment status check error:",
          paymentError
        );

        paymentCompleted = false;
        subscriptionActive = false;
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

      if (
        paymentCompleted ||
        subscriptionActive
      ) {
        clearLoginRedirects();

        setLoading(false);

        window.location.href =
          "/dashboard";

        return;
      }

      localStorage.removeItem(
        "redirectAfterLogin"
      );

      sessionStorage.removeItem(
        "redirectAfterLogin"
      );

      setLoading(false);

      if (redirectAfterLogin) {
        window.location.href =
          redirectAfterLogin;
        return;
      }

      window.location.href =
        "/dashboard";

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

        <img
          src="/logo-white.png"
          alt="Vitals"
          className="auth-brand-logo"
        />

      </div>

      <div className="auth-left auth-left-signin">

        <div className="auth-left-inner">

          <div className="auth-brand">

            <img
              src="/logo-white.png"
              alt="Vitals"
              className="auth-brand-logo"
            />

          </div>

          <div className="auth-eyebrow">
            CRM FOR GROWING BUSINESSES
          </div>

          <h2>
            Every lead organized
          </h2>

          <p>
            One workspace for leads, conversations,
            follow-ups, sales pipelines, and customer
            relationships so your team can focus on
            growing the business.
          </p>

          <div className="auth-feature-list">

            <div className="auth-feature-item">

              <span className="auth-feature-check">
                ✓
              </span>

              <div>

                <strong>
                  Capture
                </strong>

                <p>
                  Bring leads together from your website,
                  WhatsApp, ads, and more.
                </p>

              </div>

            </div>

            <div className="auth-feature-item">

              <span className="auth-feature-check">
                ✓
              </span>

              <div>

                <strong>
                  Engage
                </strong>

                <p>
                  Keep conversations, activities,
                  and follow-ups connected.
                </p>

              </div>

            </div>

            <div className="auth-feature-item">

              <span className="auth-feature-check">
                ✓
              </span>

              <div>

                <strong>
                  Convert
                </strong>

                <p>
                  Move opportunities through your
                  pipeline and close more business.
                </p>

              </div>

            </div>

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
              Manage your business. Keep growing.
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
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 12C2 12 5.5 5.5 12 5.5C18.5 5.5 22 12 22 12C22 12 18.5 18.5 12 18.5C5.5 18.5 2 12 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 3L21 21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.6 5.7C11.05 5.57 11.52 5.5 12 5.5C18.5 5.5 22 12 22 12C22 12 20.65 14.5 18.2 16.3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.1 7.3C3.55 9.1 2 12 2 12C2 12 5.5 18.5 12 18.5C13.5 18.5 14.85 18.15 16.05 17.6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
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
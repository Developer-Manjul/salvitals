import { useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getStorage = () => {
    const localToken = localStorage.getItem("token");

    if (localToken) {
      return localStorage;
    }

    return sessionStorage;
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
      const response = await fetch(
        `${getApiBaseUrl()}/api/auth/login`,
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

      /*
      ======================================
      CLEAR OLD AUTH DATA
      ======================================
      */

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      /*
      ======================================
      SAVE LOGIN DATA
      ======================================
      */

      const storage = remember
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "token",
        data.token
      );

      storage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      /*
      ======================================
      CHECK REDIRECT FROM CART
      ======================================
      */

      const redirectAfterLogin =
        localStorage.getItem(
          "redirectAfterLogin"
        ) ||
        sessionStorage.getItem(
          "redirectAfterLogin"
        );

      localStorage.removeItem(
        "redirectAfterLogin"
      );

      sessionStorage.removeItem(
        "redirectAfterLogin"
      );

      /*
      ======================================
      IF USER CAME FROM CART
      ALWAYS GO BACK TO CART
      ======================================
      */

      if (redirectAfterLogin) {
        setLoading(false);

        window.location.href =
          redirectAfterLogin;

        return;
      }

      /*
      ======================================
      PAYMENT STATUS CHECK
      ======================================

      IMPORTANT:
      Backend API should return something like:

      {
        payment_completed: true
      }

      OR

      {
        payment_completed: false
      }
      */

      try {
        const paymentResponse = await fetch(
          `${getApiBaseUrl()}/api/payment/status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

        const paymentData =
          await paymentResponse.json();

        setLoading(false);

        /*
        ======================================
        PAYMENT SUCCESS
        ======================================
        */

        if (
          paymentResponse.ok &&
          (
            paymentData.payment_completed ===
              true ||
            paymentData.payment_status ===
              "paid" ||
            paymentData.status ===
              "paid"
          )
        ) {
          window.location.href =
            "/dashboard";

          return;
        }

        /*
        ======================================
        PAYMENT NOT COMPLETED
        ======================================
        */

        window.location.href =
          "/cart";

      } catch (paymentError) {
        console.error(
          "Payment status check error:",
          paymentError
        );

        /*
        If status API fails,
        safer to send user to cart.
        Never allow dashboard.
        */

        setLoading(false);

        window.location.href =
          "/cart";
      }

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

      {/* MOBILE BRAND */}

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


      {/* LEFT SIDE */}

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


      {/* RIGHT SIDE */}

      <div className="auth-right">

        <div className="auth-card">

          <div className="auth-top">

            <h1>
              Welcome back
            </h1>

            <p>
              Manage your clinic.
              Grow your practice.
            </p>

          </div>


          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            {/* EMAIL */}

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


            {/* PASSWORD */}

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


            {/* REMEMBER */}

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


            {/* ERROR */}

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}


            {/* SUBMIT */}

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


          {/* DIVIDER */}

          <div className="auth-divider">

            <span></span>

            <b>
              OR
            </b>

            <span></span>

          </div>


          {/* GOOGLE */}

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


          {/* CREATE ACCOUNT */}

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


          {/* SECURITY */}

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
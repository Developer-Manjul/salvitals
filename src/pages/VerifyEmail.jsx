import { useEffect, useState } from "react";
import "../styles/verify-email.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function VerifyEmail() {

  const [message, setMessage] =
    useState("Verifying your email address...");

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState("loading");


  useEffect(() => {

    const verifyEmail = async () => {

      const params =
        new URLSearchParams(
          window.location.search
        );

      const token =
        params.get("token");


      if (!token) {

        setStatus("error");

        setError(
          "Verification token is missing or invalid."
        );

        return;

      }


      try {

        const response =
          await fetch(
            `${API_URL}/api/auth/verify-email`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                token,
              }),
            }
          );


        const text =
          await response.text();


        let data = {};


        try {

          data =
            text
              ? JSON.parse(text)
              : {};

        } catch {

          data = {};

        }


        if (!response.ok) {

          setStatus("error");

          setError(
            data.message ||
            "Email verification failed. Please try again."
          );

          return;

        }


        if (data.token) {

          localStorage.setItem(
            "salevitals_token",
            data.token
          );

        }


        if (data.user) {

          localStorage.setItem(
            "salevitals_user",
            JSON.stringify(
              data.user
            )
          );

        }


        setStatus("success");

        setMessage(
          "Your email has been verified successfully."
        );


        setTimeout(() => {

          window.location.href =
            "/setup";

        }, 2500);


      } catch (error) {

        setStatus("error");

        setError(
          "Unable to verify your email. " +
          error.message
        );

      }

    };


    verifyEmail();


  }, []);


  return (

    <div className="verify-page">
      <div className="verify-background">
        <div className="verify-blob verify-blob-one"></div>
        <div className="verify-blob verify-blob-two"></div>
      </div>


      <div className="verify-card">
        <div className="verify-logo">
          <img
            src="/logo.png"
            alt="SaleVitals"
          />

        </div>


        <div className="verify-content">
          {status === "loading" && (

            <>

              <div className="verify-icon verify-loading-icon">

                <div className="verify-spinner"></div>

              </div>


              <span className="verify-tag">
                ACCOUNT VERIFICATION
              </span>


              <h1>
                Verifying your email
              </h1>


              <p>
                {message}
              </p>


              <div className="verify-progress">

                <span></span>

              </div>


              <small>
                Please wait while we securely verify your SaleVitals account.
              </small>

            </>

          )}


          {status === "success" && (

            <>

              <div className="verify-icon verify-success-icon">
                ✓
              </div>


              <span className="verify-tag verify-tag-success">
                VERIFICATION COMPLETE
              </span>


              <h1>
                Email verified successfully!
              </h1>


              <p>
                {message}
              </p>


              <div className="verify-success-box">

                <span>
                  ✓
                </span>


                <div>

                  <strong>
                    Your account is ready
                  </strong>


                  <p>
                    Redirecting you to complete your
                    SaleVitals account setup.
                  </p>

                </div>

              </div>


              <div className="verify-redirect">

                <div className="verify-small-spinner"></div>

                Redirecting automatically...

              </div>

            </>

          )}


          {status === "error" && (

            <>

              <div className="verify-icon verify-error-icon">
                !
              </div>


              <span className="verify-tag verify-tag-error">
                VERIFICATION FAILED
              </span>


              <h1>
                Verification failed
              </h1>


              <p>
                {error}
              </p>


              <div className="verify-error-box">

                <strong>
                  Unable to verify your email
                </strong>

                <p>
                  This verification link may have expired,
                  already been used, or is invalid.
                </p>

              </div>


              <button
                className="verify-button"
                onClick={() => {

                  window.location.href =
                    "/";

                }}
              >

                Back to SaleVitals

                <span>
                  →
                </span>

              </button>

            </>

          )}


        </div>


        <div className="verify-footer">

          <span>
            🔒
          </span>

          Your information is securely protected

        </div>


      </div>


    </div>

  );

}
import { useState } from "react";
console.log("CHECK EMAIL COMPONENT LOADED");

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function CheckEmail() {

    console.log("🔥 CHECKEMAIL JSX IS RUNNING 🔥");

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

      const response =
        await fetch(
          `${API_URL}/api/auth/resend-verification`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
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
        "Verification email sent successfully."
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

        background:
          "#f4f7fb",

        fontFamily:
          "Arial, sans-serif",

        padding:
          "20px",
      }}
    >

      <div
        style={{
          maxWidth:
            "500px",

          width:
            "100%",

          textAlign:
            "center",

          background:
            "#ffffff",

          padding:
            "50px 40px",

          borderRadius:
            "24px",

          boxShadow:
            "0 20px 50px rgba(0,0,0,0.10)",
        }}
      >


        {/* EMAIL ICON */}

        <div
          style={{
            fontSize:
              "52px",

            marginBottom:
              "25px",
          }}
        >
          ✉️
        </div>


        <h1
          style={{
            margin:
              "0 0 20px",

            fontSize:
              "36px",

            color:
              "#1f2937",
          }}
        >
          Check your email
        </h1>


        <p
          style={{
            fontSize:
              "18px",

            color:
              "#64748b",

            margin:
              "0 0 10px",
          }}
        >
          We sent a verification link to
        </p>


        <strong
          style={{
            display:
              "block",

            fontSize:
              "19px",

            color:
              "#365985",

            marginBottom:
              "12px",
          }}
        >
          {email}
        </strong>


        <p
          style={{
            fontSize:
              "18px",

            lineHeight:
              "1.7",

            color:
              "#64748b",

            margin:
              "0 0 28px",
          }}
        >
          Please open your email and click
          the verification link to continue.
        </p>


        {/* SUCCESS MESSAGE */}

        {message && (

          <div
            style={{
              background:
                "#dcfce7",

              color:
                "#166534",

              padding:
                "12px 15px",

              borderRadius:
                "8px",

              marginBottom:
                "18px",

              fontSize:
                "15px",
            }}
          >
            {message}
          </div>

        )}


        {/* ERROR MESSAGE */}

        {error && (

          <div
            style={{
              background:
                "#fee2e2",

              color:
                "#dc2626",

              padding:
                "12px 15px",

              borderRadius:
                "8px",

              marginBottom:
                "18px",

              fontSize:
                "15px",
            }}
          >
            {error}
          </div>

        )}


        {/* RESEND BUTTON */}

        <button
          type="button"

          onClick={resendEmail}

          disabled={loading}

          style={{
            width:
              "100%",

            padding:
              "15px 20px",

            background:
              loading
                ? "#94a3b8"
                : "#00656A",

            color:
              "#ffffff",

            border:
              "none",

            borderRadius:
              "10px",

            fontSize:
              "16px",

            fontWeight:
              "700",

            cursor:
              loading
                ? "not-allowed"
                : "pointer",

            marginTop:
              "5px",
          }}
        >

          {loading
            ? "Sending..."
            : "Resend verification email"}

        </button>


        <p
          style={{
            marginTop:
              "20px",

            fontSize:
              "14px",

            color:
              "#94a3b8",
          }}
        >
          Didn't receive the email?
          Click above to resend the verification link.
        </p>


      </div>

    </div>

  );

}
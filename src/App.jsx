import { useEffect, useState } from "react";
import { getApiBaseUrl } from "./config/api";

import AnnouncementBar from "./components/AnnouncementBar";
import Navbar from "./components/Navbar";
import IconSymbols from "./components/IconSymbols";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Problem from "./components/Problem";
import FeatureTabs from "./components/FeatureTabs";
import FeatureGrid from "./components/FeatureGrid";
import Specialities from "./components/Specialities";
import HowItWorks from "./components/HowItWorks";
import Integrations from "./components/Integrations";
// import ProductTour from "./components/ProductTour";
import Results from "./components/Results";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import Comparison from "./components/Comparison";
import Security from "./components/Security";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import FloatingUI from "./components/FloatingUI";

import SignIn from "./pages/SignIn";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataProcessingAddendum from "./pages/DataProcessingAddendum";
import TermsOfService from "./pages/TermsOfService";
import SecurityOverview from "./pages/SecurityOverview";

import { initSite } from "./js/site";

function VerifyEmail() {
  const [message, setMessage] = useState(
    "Verifying your email..."
  );

  useEffect(() => {
    const verifyUserEmail = async () => {
      const token = new URLSearchParams(
        window.location.search
      ).get("token");

      if (!token) {
        setMessage(
          "Verification token is missing."
        );

        return;
      }

      try {
        const api = getApiBaseUrl();

        const response = await fetch(
          `${api}/api/auth/verify-email`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              token,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setMessage(
            data.message ||
            "Verification failed."
          );

          return;
        }

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "vitalsToken",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        localStorage.setItem(
          "vitalsUser",
          JSON.stringify(data.user)
        );

        setMessage(
          "Your email was verified successfully. Please sign in to continue."
        );

        setTimeout(() => {
          window.location.href =
            "/signin?message=email-verified";
        }, 1800);

      } catch (error) {
        console.error(
          "Email verification error:",
          error
        );

        setMessage(
          "Unable to verify email. Please try again."
        );
      }
    };

    verifyUserEmail();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily:
          "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
        }}
      >
        <h1>
          Email verification
        </h1>

        <p>
          {message}
        </p>
      </div>
    </div>
  );
}

function CheckEmail() {

  const params = new URLSearchParams(
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

    setMessage("");

    setError("");


    try {

      const api =
        getApiBaseUrl();


      const response =
        await fetch(
          `${api}/api/auth/resend-verification`,
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
          "Unable to resend verification email."
        );

        return;
      }


      setMessage(
        data.message ||
        "Verification email sent successfully."
      );


    } catch (err) {

      console.error(
        "Resend verification error:",
        err
      );

      setError(
        "Unable to connect to server. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
        background:
          "linear-gradient(135deg, #f4f7fb 0%, #eef2f7 100%)",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          padding: "50px 40px",
          borderRadius: "24px",
          textAlign: "center",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >

        {/* EMAIL ICON */}

        <div
          style={{
            fontSize: "52px",
            marginBottom: "20px",
          }}
        >
          ✉️
        </div>


        {/* TITLE */}

        <h1
          style={{
            margin: "0 0 18px",
            fontSize: "38px",
            color: "#172b4d",
          }}
        >
          Check your email
        </h1>


        {/* TEXT */}

        <p
          style={{
            margin: "0 0 8px",
            color: "#667085",
            fontSize: "18px",
            lineHeight: "1.7",
          }}
        >
          We sent a verification link to
        </p>


        {/* EMAIL */}

        <p
          style={{
            margin: "0 0 8px",
            fontWeight: "700",
            fontSize: "19px",
            color: "#315a9b",
            wordBreak: "break-word",
          }}
        >
          {email}
        </p>


        {/* DESCRIPTION */}

        <p
          style={{
            margin: "0 0 28px",
            color: "#667085",
            fontSize: "17px",
            lineHeight: "1.7",
          }}
        >
          Please open your email and click the
          verification link to continue.
        </p>


        {/* RESEND BUTTON */}

        <button
          type="button"
          onClick={resendEmail}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px 22px",
            border: "none",
            borderRadius: "10px",
            background:
              loading
                ? "#94a3b8"
                : "#00656A",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "700",
            cursor:
              loading
                ? "not-allowed"
                : "pointer",
            transition: "0.2s ease",
          }}
        >

          {loading
            ? "Sending..."
            : "Resend verification email"}

        </button>


        {/* SUCCESS MESSAGE */}

        {message && (

          <div
            style={{
              marginTop: "18px",
              padding: "12px 15px",
              borderRadius: "8px",
              background: "#dcfce7",
              color: "#166534",
              fontSize: "14px",
            }}
          >

            {message}

          </div>

        )}


        {/* ERROR MESSAGE */}

        {error && (

          <div
            style={{
              marginTop: "18px",
              padding: "12px 15px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "14px",
            }}
          >

            {error}

          </div>

        )}


        {/* EXTRA INFO */}

        <p
          style={{
            marginTop: "25px",
            marginBottom: 0,
            fontSize: "14px",
            color: "#98a2b3",
            lineHeight: "1.6",
          }}
        >
          Didn't receive the email? Check your spam folder
          or resend the verification email.
        </p>

      </div>

    </div>

  );

}


function Home() {

  useEffect(() => {
    initSite();
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <IconSymbols />
      <Hero />
      <Stats />
      <Problem />
      <FeatureTabs />
      <FeatureGrid />
      <Specialities />
      <HowItWorks />
      <Integrations />
      {/* <ProductTour /> */}
      <Results />
      <Testimonials />
      <Pricing />
      <Comparison />
      <Security />
      <FAQ />
      <FinalCTA />
      <Footer />
      <FloatingUI />
    </>
  );
}


export default function App() {

  const [path, setPath] = useState(
    window.location.pathname.toLowerCase()
  );


  useEffect(() => {

    const updatePath = () => {

      const currentPath =
        window.location.pathname.toLowerCase();

      console.log("Current path:", currentPath);

      setPath(currentPath);

    };


    window.addEventListener(
      "popstate",
      updatePath
    );


    return () => {

      window.removeEventListener(
        "popstate",
        updatePath
      );

    };

  }, []);


  /* =========================================
     AUTH
  ========================================= */

  if (
    path === "/signin" ||
    path === "/signin.html"
  ) {
    return <SignIn />;
  }


  if (
    path === "/signup" ||
    path === "/create-account" ||
    path === "/signup.html"
  ) {
    return <CreateAccount />;
  }


  if (path === "/verify-email") { return <VerifyEmail />; }

  if (path === "/check-email") {
    return <CheckEmail />;
  }

  if (path === "/verify-email") {
    return <VerifyEmail />;
  }

  if (
    path === "/forgot-password" ||
    path === "/forgot-password.html"
  ) {
    return <ForgotPassword />;
  }


  /* =========================================
     PRIVACY POLICY
  ========================================= */

  if (
    path === "/privacy-policy" ||
    path === "/privacy-policy/"
  ) {
    return <PrivacyPolicy />;
  }

  if (
    path === "/data-processing-addendum" ||
    path === "/data-processing-addendum/" ||
    path === "/dpa"
  ) {
    return <DataProcessingAddendum />;
  }

  if (
    path === "/terms-of-service" ||
    path === "/terms-of-service/" ||
    path === "/terms"
  ) {
    return <TermsOfService />;
  }

  if (
    path === "/security-overview" ||
    path === "/security-overview/" ||
    path === "/security"
  ) {
    return <SecurityOverview />;
  }


  /* =========================================
     CART
  ========================================= */

  if (
    path === "/cart" ||
    path === "/cart/" ||
    path === "/cart.html"
  ) {
    return <Cart />;
  }


  /* =========================================
     DASHBOARD
  ========================================= */

  if (
    path === "/dashboard" ||
    path === "/dashboard/" ||
    path === "/dashboard.html"
  ) {
    return <Dashboard />;
  }


  /* =========================================
     HOME
  ========================================= */

  return <Home />;
}
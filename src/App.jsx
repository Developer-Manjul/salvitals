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
import ProductTour from "./components/ProductTour";
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
  "Email verified successfully. Redirecting to account setup..."
);

setTimeout(() => {
  window.location.href =
    "/create-account?setup=1";
}, 1200);

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
  const email = new URLSearchParams(
    window.location.search
  ).get("email");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        background: "#f7f9fc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#ffffff",
          padding: "50px 40px",
          borderRadius: "20px",
          textAlign: "center",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            fontSize: "52px",
            marginBottom: "20px",
          }}
        >
          ✉️
        </div>

        <h1
          style={{
            marginBottom: "15px",
          }}
        >
          Check your email
        </h1>

        <p
          style={{
            color: "#667085",
            lineHeight: "1.7",
          }}
        >
          We sent a verification link to
        </p>

        <p
          style={{
            fontWeight: "700",
            color: "#315a9b",
            wordBreak: "break-word",
          }}
        >
          {email}
        </p>

        <p
          style={{
            color: "#667085",
            lineHeight: "1.7",
          }}
        >
          Please open your email and click the verification link to continue.
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
      <ProductTour />
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
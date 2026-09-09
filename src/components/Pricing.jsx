import {
  openTrial,
  openDemo,
  toast,
  cycle,
} from "../js/site";

import {
  PLANS,
  detectVisitorCountry,
  formatPlanPrice,
  getCurrency,
} from "../config/pricing";

import {
  useEffect,
  useState,
} from "react";


export default function Pricing() {

  const [currency, setCurrency] =
    useState("USD");


  /*
  =====================================================
  DETECT COUNTRY & CURRENCY
  =====================================================
  */

  useEffect(() => {

    detectVisitorCountry()
      .then((code) => {

        setCurrency(
          getCurrency(code)
        );

      });

  }, []);


  /*
  =====================================================
  CHECK LOGIN TOKEN
  =====================================================
  */

  const getAuthToken = () => {

    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("vitalsToken") ||
      sessionStorage.getItem("vitalsToken")
    );

  };


  /*
  =====================================================
  CHOOSE PLAN
  =====================================================
  */

  const choosePlan = (id) => {

    const plan = PLANS[id];

    if (!plan) {
      return;
    }


    /*
    ===================================================
    GET PLAN PRICE BASED ON CURRENCY
    ===================================================
    */

    const selectedPrice =
      currency === "INR"
        ? plan.inr
        : plan.usd;


    /*
    ===================================================
    CREATE SELECTED PLAN OBJECT
    ===================================================
    */

    const selectedPlan = {

      ...plan,

      price: selectedPrice,

      monthly: selectedPrice,

      currency: currency,

      billing: "monthly",

      quantity: 1,

    };


    /*
    ===================================================
    SAVE SELECTED PLAN
    ===================================================
    */

    localStorage.setItem(
      "selectedPlan",
      JSON.stringify(selectedPlan)
    );


    /*
    ===================================================
    CHECK USER LOGIN
    ===================================================
    */

    const token =
      getAuthToken();


    /*
    ===================================================
    USER NOT LOGGED IN
    GO TO CREATE ACCOUNT
    ===================================================

    IMPORTANT:
    After registration/login,
    CreateAccount.jsx should redirect
    to /cart and selectedPlan will
    still be available.
    */

    if (!token) {

      localStorage.setItem(
        "redirectAfterRegister",
        "/cart"
      );


      localStorage.setItem(
        "redirectAfterLogin",
        "/cart"
      );


      window.history.pushState(
        {},
        "",
        "/create-account"
      );


      window.dispatchEvent(
        new PopStateEvent("popstate")
      );


      return;

    }


    /*
    ===================================================
    USER ALREADY LOGGED IN
    GO DIRECTLY TO CART
    ===================================================
    */

    window.history.pushState(
      {},
      "",
      "/cart"
    );


    window.dispatchEvent(
      new PopStateEvent("popstate")
    );

  };


  return (

    <section
      className="sec"
      id="pricing"
      style={{
        background: "var(--bg)",
        borderBlock:
          "1px solid var(--border)",
      }}
    >

      <div className="wrap">


        {/* =========================================================
            HEADER
        ========================================================== */}

        <div className="sec-head rv">

          <span className="eyebrow">
            Pricing
          </span>


          <h2 className="h2 mt-s">

            Simple pricing.
            Powerful CRM.

          </h2>


          <p className="lead">

            Choose the plan that fits your team.
            Get the tools you need to manage leads,
            customers, sales and conversations in one place.

          </p>

        </div>



        {/* =========================================================
            PRICING GRID
        ========================================================== */}

        <div className="price-grid rv">


          {/* =======================================================
              STARTER
          ======================================================== */}

          <div className="card plan">

            <div className="plan-body">


              <span
                className="ico"
                style={{
                  background: "#F0FDFA",
                  color: "#0D9488",
                }}
              >

                <svg className="i i-20">
                  <use href="#i-users" />
                </svg>

              </span>


              <h3 className="h3 mt-m">
                Starter
              </h3>


              <p
                className="sm muted mt-s"
                style={{
                  minHeight: "64px",
                }}
              >

                For small businesses and teams
                getting started with CRM.

              </p>



              {/* PRICE */}

              <div
                style={{
                  marginTop: "12px",
                  minHeight: "62px",
                }}
              >

                <div>

                  <span className="price">

                    {formatPlanPrice(
                      PLANS.starter,
                      currency
                    )}

                  </span>


                  <span className="sm muted">
                    /month
                  </span>

                </div>

              </div>



              {/* SELECT PLAN */}

              <button
                type="button"
                className="btn btn-block mt-m"
                onClick={() =>
                  choosePlan("starter")
                }
              >

                Get started

              </button>



              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              ></div>



              <div
                className="xxs fw7"
                style={{
                  letterSpacing:
                    ".09em",

                  textTransform:
                    "uppercase",

                  color:
                    "var(--muted-2)",

                  marginBottom:
                    "10px",
                }}
              >

                Includes

              </div>



              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "8px",
                }}
              >

                {[
                  "1,000 content pieces",
                  "1 team member",
                  "Lead & contact management",
                  "Sales pipeline",
                  "Follow-up management",
                  "Website lead capture",
                  "Basic reports",
                  "500 chatbot conversations per month",
                  "500 contact save",
                ].map(
                  (item, index) => (

                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={index}
                    >

                      <svg
                        className="i i-14"
                        style={{
                          color:
                            "#0D9488",

                          marginTop:
                            "3px",
                        }}
                      >

                        <use
                          href="#i-check"
                        />

                      </svg>


                      <span className="xs">
                        {item}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>



          {/* =======================================================
              GROWTH
          ======================================================== */}

          <div className="card plan pop">


            <div className="plan-rib">
              Most popular
            </div>


            <div className="plan-body">


              <span
                className="ico"
                style={{
                  background:
                    "var(--light-blue)",

                  color:
                    "var(--blue)",
                }}
              >

                <svg className="i i-20">
                  <use href="#i-trend" />
                </svg>

              </span>



              <h3 className="h3 mt-m">
                Growth
              </h3>


              <p
                className="sm muted mt-s"
                style={{
                  minHeight:
                    "64px",
                }}
              >

                For growing teams that need
                more capacity and collaboration.

              </p>



              {/* PRICE */}

              <div
                style={{
                  marginTop:
                    "12px",

                  minHeight:
                    "62px",
                }}
              >

                <div>

                  <span className="price">

                    {formatPlanPrice(
                      PLANS.growth,
                      currency
                    )}

                  </span>


                  <span className="sm muted">
                    /month
                  </span>

                </div>

              </div>



              {/* SELECT PLAN */}

              <button
                type="button"
                className="btn btn-block btn-primary mt-m"
                onClick={() =>
                  choosePlan("growth")
                }
              >

                Get started

              </button>



              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              ></div>



              <div
                className="xxs fw7"
                style={{
                  letterSpacing:
                    ".09em",

                  textTransform:
                    "uppercase",

                  color:
                    "var(--muted-2)",

                  marginBottom:
                    "10px",
                }}
              >

                Includes everything in Starter, plus

              </div>



              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "8px",
                }}
              >

                {[
                  "2,500 content pieces",
                  "3 team members",
                  "Marketing automation",
                  "Advanced lead management",
                  "Team collaboration",
                  "Social media & ad lead capture",
                  "Advanced reports",
                  "1500 chatbot conversations per month",
                  "1500 contact save",
                ].map(
                  (item, index) => (

                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={index}
                    >

                      <svg
                        className="i i-14"
                        style={{
                          color:
                            "var(--blue)",

                          marginTop:
                            "3px",
                        }}
                      >

                        <use
                          href="#i-check"
                        />

                      </svg>


                      <span className="xs">
                        {item}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>



          {/* =======================================================
              SCALE
          ======================================================== */}

          <div className="card plan">


            <div className="plan-body">


              <span
                className="ico"
                style={{
                  background:
                    "var(--purple-bg)",

                  color:
                    "var(--purple)",
                }}
              >

                <svg className="i i-20">
                  <use href="#i-layers" />
                </svg>

              </span>



              <h3 className="h3 mt-m">
                Scale
              </h3>


              <p
                className="sm muted mt-s"
                style={{
                  minHeight:
                    "64px",
                }}
              >

                For larger teams managing
                more leads, customers and workflows.

              </p>



              {/* PRICE */}

              <div
                style={{
                  marginTop:
                    "12px",

                  minHeight:
                    "62px",
                }}
              >

                <div>

                  <span className="price">

                    {formatPlanPrice(
                      PLANS.scale,
                      currency
                    )}

                  </span>


                  <span className="sm muted">
                    /month
                  </span>

                </div>

              </div>



              {/* SELECT PLAN */}

              <button
                type="button"
                className="btn btn-block mt-m"
                onClick={() =>
                  choosePlan("scale")
                }
              >

                Get started

              </button>



              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              ></div>



              <div
                className="xxs fw7"
                style={{
                  letterSpacing:
                    ".09em",

                  textTransform:
                    "uppercase",

                  color:
                    "var(--muted-2)",

                  marginBottom:
                    "10px",
                }}
              >

                Includes everything in Growth, plus

              </div>



              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "8px",
                }}
              >

                {[
                  "5,000 content pieces",
                  "5 team members",
                  "Advanced automation",
                  "Custom workflows",
                  "Advanced permissions",
                  "Detailed analytics & reporting",
                  "More powerful integrations",
                  "3000 chatbot conversations per month",
                  "2500 contact save",
                ].map(
                  (item, index) => (

                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={index}
                    >

                      <svg
                        className="i i-14"
                        style={{
                          color:
                            "var(--purple)",

                          marginTop:
                            "3px",
                        }}
                      >

                        <use
                          href="#i-check"
                        />

                      </svg>


                      <span className="xs">
                        {item}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>



          {/* =======================================================
              CUSTOM
          ======================================================== */}

          <div className="card plan">


            <div className="plan-body">


              <span
                className="ico"
                style={{
                  background:
                    "var(--bg-2)",

                  color:
                    "var(--navy)",
                }}
              >

                <svg className="i i-20">
                  <use href="#i-build" />
                </svg>

              </span>



              <h3 className="h3 mt-m">
                Custom
              </h3>


              <p
                className="sm muted mt-s"
                style={{
                  minHeight:
                    "64px",
                }}
              >

                For larger organizations with
                advanced requirements,
                customization and dedicated support.

              </p>



              <div
                style={{
                  marginTop:
                    "12px",

                  minHeight:
                    "62px",

                  display:
                    "flex",

                  alignItems:
                    "center",
                }}
              ></div>



              {/* TALK TO SALES */}

              <button
                type="button"
                className="btn btn-block btn-dark mt-m"
                onClick={() => {

                  openDemo(
                    "Enterprise"
                  );

                }}
              >

                <svg className="i i-16">
                  <use href="#i-phone" />
                </svg>

                Talk to sales

              </button>



              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              ></div>



              <div
                className="xxs fw7"
                style={{
                  letterSpacing:
                    ".09em",

                  textTransform:
                    "uppercase",

                  color:
                    "var(--muted-2)",

                  marginBottom:
                    "10px",
                }}
              >

                Includes everything in Scale, plus

              </div>



              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "8px",
                }}
              >

                {[
                  "Advanced security & access controls",
                  "Custom workflows & configurations",
                  "Dedicated onboarding & support",
                  "Custom integrations",
                  "Priority support",
                ].map(
                  (item, index) => (

                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={index}
                    >

                      <svg
                        className="i i-14"
                        style={{
                          color:
                            "var(--navy)",

                          marginTop:
                            "3px",
                        }}
                      >

                        <use
                          href="#i-check"
                        />

                      </svg>


                      <span className="xs">
                        {item}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>


        </div>



        {/* =========================================================
            ONE-TIME SETUP & INTEGRATION
        ========================================================== */}

        <div
          className="card mt-l rv"
          style={{
            padding:
              "22px 24px",
          }}
        >

          <div
            className="row wrapf"
            style={{
              gap:
                "20px",

              justifyContent:
                "space-between",

              alignItems:
                "center",
            }}
          >

            <div
              className="row"
              style={{
                gap:
                  "12px",

                alignItems:
                  "flex-start",
              }}
            >

              <div>

                <div className="xs muted mt-s">

                  Connect your CRM with your
                  existing business tools,
                  including your website,
                  WhatsApp, social media,
                  advertising platforms and
                  other supported integrations.
                  Terms &amp; Condition Apply.

                </div>

              </div>

            </div>

          </div>

        </div>


      </div>

    </section>

  );

}
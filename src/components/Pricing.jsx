import {
  openDemo,
} from "../js/site";

import {
  PLANS,
  detectVisitorCountry,
  formatPlanPrice,
  getCurrency,
  saveSelectedPlan,
} from "../config/pricing";

import {
  useEffect,
  useState,
} from "react";

import {
  getApiBaseUrl,
} from "../config/api";

export default function Pricing() {
  const [currency, setCurrency] =
    useState("USD");

  const [billing, setBilling] =
    useState(null);

  const [billingLoading, setBillingLoading] =
    useState(true);

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("vitalsToken") ||
      sessionStorage.getItem("vitalsToken")
    );
  };

  useEffect(() => {
    detectVisitorCountry()
      .then((code) => {
        setCurrency(
          getCurrency(code)
        );
      })
      .catch(() => {
        setCurrency("INR");
      });
  }, []);

  useEffect(() => {
    const loadBilling = async () => {
      const token = getAuthToken();

      if (!token) {
        setBillingLoading(false);
        return;
      }

      try {
        const apiBase =
          getApiBaseUrl();

        const response =
          await fetch(
            `${apiBase}/api/billing/plans`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.success
        ) {
          setBilling(data);
        }
      } catch (error) {
        console.error(
          "Billing plans error:",
          error
        );
      } finally {
        setBillingLoading(false);
      }
    };

    loadBilling();
  }, []);

  const choosePlan = (id) => {
    const plan = PLANS[id];

    if (!plan) {
      return;
    }

    if (
      id ===
      billing?.currentPlanId
    ) {
      return;
    }

    const planInfo =
      billing?.plans?.find(
        (item) =>
          item.id === id
      );

    if (
      billing?.currentPlanId &&
      planInfo &&
      planInfo.available === false
    ) {
      return;
    }

    const selectedPrice =
      currency === "INR"
        ? plan.inr
        : plan.usd;

    const selectedPlan = {
      ...plan,
      planId: id,
      planName: plan.name,
      price: selectedPrice,
      monthly: selectedPrice,
      currency,
      billing: "monthly",
      quantity: 1,
    };

    localStorage.setItem(
      "selectedPlan",
      JSON.stringify(
        selectedPlan
      )
    );

    saveSelectedPlan({
      planId: id,
      months: 1,
      currency,
    });

    const token =
      getAuthToken();

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
        new PopStateEvent(
          "popstate"
        )
      );

      return;
    }

    window.history.pushState(
      {},
      "",
      `/cart?plan=${id}`
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate"
      )
    );
  };

  const isCurrentPlan = (id) => {
    return (
      billing?.currentPlanId ===
      id
    );
  };

  const isUpgradeAvailable = (id) => {
    if (
      !billing?.currentPlanId
    ) {
      return true;
    }

    const billingPlan =
      billing?.plans?.find(
        (item) =>
          item.id === id
      );

    if (
      billingPlan &&
      typeof billingPlan.available ===
        "boolean"
    ) {
      return billingPlan.available;
    }

    return false;
  };

  const getButtonLabel = (id) => {
    if (isCurrentPlan(id)) {
      return "Active plan";
    }

    if (
      billing?.currentPlanId &&
      isUpgradeAvailable(id)
    ) {
      return "Upgrade plan";
    }

    return "Get started";
  };

  return (
    <section
      className="sec"
      id="pricing"
      style={{
        background:
          "var(--bg)",
        borderBlock:
          "1px solid var(--border)",
      }}
    >
      <div className="wrap">
        <div className="sec-head rv">
          <span className="eyebrow">
            Pricing
          </span>

          <h2 className="h2 mt-s">
            Simple pricing.
            Powerful CRM.
          </h2>

          <p className="lead">
            Choose the plan that fits
            your team. Get the tools
            you need to manage leads,
            customers, sales and
            conversations in one place.
          </p>
        </div>

        <div className="price-grid rv">
          <div className="card plan">
            <div className="plan-body">
              <span
                className="ico"
                style={{
                  background:
                    "#F0FDFA",
                  color:
                    "#0D9488",
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
                  minHeight:
                    "64px",
                }}
              >
                For small businesses
                and teams getting
                started with CRM.
              </p>

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
                      PLANS.starter,
                      currency
                    )}
                  </span>

                  <span className="sm muted">
                    /month
                  </span>
                </div>
              </div>

              {isCurrentPlan(
                "starter"
              ) && (
                <div
                  style={{
                    marginTop:
                      "10px",
                    padding:
                      "7px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#E9F8F1",
                    color:
                      "#16835C",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    display:
                      "inline-block",
                  }}
                >
                  Active plan
                </div>
              )}

              <button
                type="button"
                className="btn btn-block mt-m"
                disabled={
                  billingLoading ||
                  isCurrentPlan(
                    "starter"
                  ) ||
                  (
                    billing?.currentPlanId &&
                    !isUpgradeAvailable(
                      "starter"
                    )
                  )
                }
                onClick={() =>
                  choosePlan(
                    "starter"
                  )
                }
              >
                {getButtonLabel(
                  "starter"
                )}
              </button>

              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              />

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
                  gap: "8px",
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
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={
                        index
                      }
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
                        <use href="#i-check" />
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
                For growing teams
                that need more
                capacity and
                collaboration.
              </p>

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

              {isCurrentPlan(
                "growth"
              ) && (
                <div
                  style={{
                    marginTop:
                      "10px",
                    padding:
                      "7px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#E9F8F1",
                    color:
                      "#16835C",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    display:
                      "inline-block",
                  }}
                >
                  Active plan
                </div>
              )}

              <button
                type="button"
                className="btn btn-block btn-primary mt-m"
                disabled={
                  billingLoading ||
                  isCurrentPlan(
                    "growth"
                  ) ||
                  (
                    billing?.currentPlanId &&
                    !isUpgradeAvailable(
                      "growth"
                    )
                  )
                }
                onClick={() =>
                  choosePlan(
                    "growth"
                  )
                }
              >
                {getButtonLabel(
                  "growth"
                )}
              </button>

              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              />

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
                Includes everything
                in Starter, plus
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "8px",
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
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={
                        index
                      }
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
                        <use href="#i-check" />
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
                For larger teams
                managing more leads,
                customers and
                workflows.
              </p>

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

              {isCurrentPlan(
                "scale"
              ) && (
                <div
                  style={{
                    marginTop:
                      "10px",
                    padding:
                      "7px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#E9F8F1",
                    color:
                      "#16835C",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    display:
                      "inline-block",
                  }}
                >
                  Active plan
                </div>
              )}

              <button
                type="button"
                className="btn btn-block mt-m"
                disabled={
                  billingLoading ||
                  isCurrentPlan(
                    "scale"
                  ) ||
                  (
                    billing?.currentPlanId &&
                    !isUpgradeAvailable(
                      "scale"
                    )
                  )
                }
                onClick={() =>
                  choosePlan(
                    "scale"
                  )
                }
              >
                {getButtonLabel(
                  "scale"
                )}
              </button>

              <div
                className="divider"
                style={{
                  margin:
                    "18px 0 14px",
                }}
              />

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
                Includes everything
                in Growth, plus
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "8px",
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
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={
                        index
                      }
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
                        <use href="#i-check" />
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
                For larger
                organizations with
                advanced requirements,
                customization and
                dedicated support.
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
              >
                <span className="price">
                  Custom
                </span>
              </div>

              <button
                type="button"
                className="btn btn-block btn-dark mt-m"
                onClick={() =>
                  openDemo(
                    "Enterprise"
                  )
                }
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
              />

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
                Includes everything
                in Scale, plus
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "8px",
                }}
              >
                {[
                  "Advanced security & access controls",
                  "Custom workflows & configurations",
                  "Dedicated onboarding & support",
                  "Custom integrations",
                  "Priority support",
                ].map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="row top"
                      style={{
                        gap:
                          "8px",
                      }}
                      key={
                        index
                      }
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
                        <use href="#i-check" />
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
                  Connect your CRM
                  with your existing
                  business tools,
                  including your
                  website, WhatsApp,
                  social media,
                  advertising platforms
                  and other supported
                  integrations.
                  Terms &amp; Condition
                  Apply.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
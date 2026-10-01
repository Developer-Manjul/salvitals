import { useEffect, useMemo, useState } from "react";
import {
  PLANS,
  SUBSCRIPTION_PERIODS,
  detectVisitorCountry,
  getCurrency,
  getPlanPrice,
} from "../config/pricing";
import "../styles/cart.scss";
import { getApiBaseUrl } from "../config/api";

const ADDONS = {
  contacts: {
    id: "contacts",
    name: "Extra Contacts",
    price: 500,
    quota: 1000,
    unit: "contacts",
  },
  ai_chat: {
    id: "ai_chat",
    name: "AI Chatbot",
    price: 500,
    quota: 3000,
    unit: "conversations",
  },
};

const goTo = (url) => {
  const nextUrl = url.startsWith("/") ? url : `/${url}`;
  window.history.pushState({}, "", nextUrl);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const getToken = () => {
  return (
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

const getCheckoutType = () => {
  const params = new URLSearchParams(window.location.search);
  const addonType = params.get("addon");

  if (addonType && ADDONS[addonType]) {
    return "addon";
  }

  return "subscription";
};

const getInitialPlanId = () => {
  const params = new URLSearchParams(window.location.search);
  const queryPlanId = params.get("plan");

  if (queryPlanId && PLANS[queryPlanId]) {
    return queryPlanId;
  }

  try {
    const savedPlan = JSON.parse(
      localStorage.getItem("selectedPlan") || "null"
    );

    const savedPlanId =
      savedPlan?.planId ||
      savedPlan?.id;

    if (savedPlanId && PLANS[savedPlanId]) {
      return savedPlanId;
    }

    const savedPlanName = String(
      savedPlan?.planName ||
        savedPlan?.name ||
        ""
    ).toLowerCase();

    const matchingPlan = Object.values(PLANS).find(
      (plan) =>
        plan.name.toLowerCase() === savedPlanName
    );

    return matchingPlan?.id || "starter";
  } catch {
    return "starter";
  }
};

const getInitialAddonType = () => {
  const params = new URLSearchParams(window.location.search);
  const queryAddon = params.get("addon");

  if (queryAddon && ADDONS[queryAddon]) {
    return queryAddon;
  }

  try {
    const savedAddon = JSON.parse(
      localStorage.getItem("selectedAddon") || "null"
    );

    if (
      savedAddon?.addonType &&
      ADDONS[savedAddon.addonType]
    ) {
      return savedAddon.addonType;
    }
  } catch {}

  return "contacts";
};

const getInitialAddonQuantity = () => {
  const params = new URLSearchParams(window.location.search);
  const queryQuantity = Number(
    params.get("quantity")
  );

  if (
    Number.isInteger(queryQuantity) &&
    queryQuantity >= 1 &&
    queryQuantity <= 10
  ) {
    return queryQuantity;
  }

  try {
    const savedAddon = JSON.parse(
      localStorage.getItem("selectedAddon") || "null"
    );

    const savedQuantity = Number(
      savedAddon?.quantity || 1
    );

    if (
      Number.isInteger(savedQuantity) &&
      savedQuantity >= 1 &&
      savedQuantity <= 10
    ) {
      return savedQuantity;
    }
  } catch {}

  return 1;
};

const Cart = () => {
  const [checkoutType] = useState(
    getCheckoutType
  );

  const [planId] = useState(
    getInitialPlanId
  );

  const [addonType] = useState(
    getInitialAddonType
  );

  const [selectedMonths, setSelectedMonths] =
    useState(1);

  const [selectedQuantity, setSelectedQuantity] =
    useState(() =>
      checkoutType === "addon"
        ? getInitialAddonQuantity()
        : 1
    );

  const [country, setCountry] =
    useState("");

  const [currency, setCurrency] =
    useState("INR");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [billingLoading, setBillingLoading] =
    useState(true);

  const [billing, setBilling] =
    useState(null);

  const selectedPlan = useMemo(() => {
    return (
      PLANS?.[planId] ||
      PLANS?.starter ||
      {}
    );
  }, [planId]);

  const selectedAddon = useMemo(() => {
    return ADDONS?.[addonType] || ADDONS.contacts;
  }, [addonType]);

  useEffect(() => {
    const loadCountry = async () => {
      try {
        const detectedCountry =
          await detectVisitorCountry();

        const finalCountry =
          detectedCountry || "IN";

        setCountry(finalCountry);
        setCurrency(
          getCurrency(finalCountry)
        );
      } catch {
        setCountry("IN");
        setCurrency("INR");
      }
    };

    loadCountry();
  }, []);

  useEffect(() => {
    const loadBilling = async () => {
      const token = getToken();

      if (!token) {
        setBillingLoading(false);
        return;
      }

      try {
        const apiBase =
          getApiBaseUrl();

        const response = await fetch(
          `${apiBase}/api/billing/current`,
          {
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
      } catch {
      } finally {
        setBillingLoading(false);
      }
    };

    loadBilling();
  }, []);

  const monthlyPrice = useMemo(() => {
    const price =
      getPlanPrice(
        selectedPlan,
        currency
      );

    if (
      price === null ||
      price === undefined
    ) {
      return null;
    }

    return Number(price);
  }, [
    selectedPlan,
    currency,
  ]);

  const isCustomPlan =
    monthlyPrice === null ||
    Number.isNaN(monthlyPrice);

  const periods = useMemo(() => {
    return SUBSCRIPTION_PERIODS;
  }, []);

  const selectedPeriod =
    periods.find(
      (period) =>
        period.months ===
        Number(selectedMonths)
    ) || periods[0];

  const discountPercentage =
    selectedPeriod?.discount || 0;

  const subscriptionPrice =
    isCustomPlan
      ? null
      : monthlyPrice *
        Number(selectedMonths);

  const subscriptionDiscount =
    isCustomPlan
      ? null
      : Math.round(
          subscriptionPrice *
            (discountPercentage / 100)
        );

  const discountedSubscriptionPrice =
    isCustomPlan
      ? null
      : subscriptionPrice -
        subscriptionDiscount;

  const setupCharge =
    isCustomPlan
      ? null
      : billing?.subscription
          ?.setupFeePaid
        ? 0
        : currency === "INR"
          ? 699
          : 180;

  const subscriptionSubtotal =
    isCustomPlan
      ? null
      : discountedSubscriptionPrice +
        setupCharge;

  const subscriptionTax =
    isCustomPlan
      ? null
      : currency === "INR"
        ? Math.round(
            subscriptionSubtotal * 0.18
          )
        : 0;

  const subscriptionTotal =
    isCustomPlan
      ? null
      : subscriptionSubtotal +
        subscriptionTax;

  const addonSubtotal =
    checkoutType === "addon"
      ? selectedAddon.price *
        Number(selectedQuantity)
      : null;

  const addonTax =
    checkoutType === "addon"
      ? currency === "INR"
        ? Math.round(
            addonSubtotal * 0.18
          )
        : 0
      : null;

  const addonTotal =
    checkoutType === "addon"
      ? addonSubtotal + addonTax
      : null;

  const planName =
    selectedPlan?.name ||
    "Starter";

  const addonName =
    selectedAddon?.name ||
    "Extra Contacts";

  const addonQuota =
    selectedAddon?.quota ||
    0;

  const totalAddonQuota =
    addonQuota *
    Number(selectedQuantity);

  const formatPrice = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      Number.isNaN(Number(amount))
    ) {
      return "Custom";
    }

    return new Intl.NumberFormat(
      currency === "INR"
        ? "en-IN"
        : "en-US",
      {
        style: "currency",
        currency:
          currency === "INR"
            ? "INR"
            : "USD",
        maximumFractionDigits: 0,
      }
    ).format(Number(amount));
  };

  const formatSavePrice = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      Number.isNaN(Number(amount))
    ) {
      return "";
    }

    return formatPrice(amount);
  };

  const isCurrentPlan =
    billing?.subscription?.planId ===
    planId;

  const isUpgrade =
    Boolean(
      billing?.subscription?.planId
    ) &&
    !isCurrentPlan;

  const handleSubscriptionPayment =
    async () => {
      try {
        setError("");

        if (isCustomPlan) {
          setError(
            "Please contact our sales team for a custom plan."
          );
          return;
        }

        const token = getToken();

        if (!token) {
          setError(
            "Please sign in before payment"
          );

          setTimeout(() => {
            goTo(
              `/signin?redirect=${encodeURIComponent(
                window.location.pathname +
                  window.location.search
              )}`
            );
          }, 1000);

          return;
        }

        setLoading(true);

        const apiBase =
          getApiBaseUrl();

        const response =
          await fetch(
            `${apiBase}/api/payment/create-order`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                planId,
                currency,
                period:
                  selectedMonths,
                country,
                orderType:
                  "subscription",
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to create payment order"
          );
        }

        const razorpayLoaded =
          await loadRazorpayScript();

        if (!razorpayLoaded) {
          throw new Error(
            "Unable to load Razorpay"
          );
        }

        const order =
          data.order;

        const options = {
          key:
            import.meta.env
              .VITE_RAZORPAY_KEY_ID,

          amount:
            order.amount,

          currency:
            order.currency,

          name:
            "SaleVitals",

          description:
            `${planName} Plan - ${selectedMonths} month${
              selectedMonths > 1
                ? "s"
                : ""
            }`,

          order_id:
            order.id,

          handler:
            async (
              paymentResponse
            ) => {
              try {
                const verifyResponse =
                  await fetch(
                    `${apiBase}/api/payment/verify`,
                    {
                      method:
                        "POST",
                      headers: {
                        "Content-Type":
                          "application/json",
                        Authorization:
                          `Bearer ${token}`,
                      },
                      body:
                        JSON.stringify(
                          {
                            razorpay_order_id:
                              paymentResponse.razorpay_order_id,
                            razorpay_payment_id:
                              paymentResponse.razorpay_payment_id,
                            razorpay_signature:
                              paymentResponse.razorpay_signature,
                          }
                        ),
                    }
                  );

                const verifyData =
                  await verifyResponse.json();

                if (
                  !verifyResponse.ok ||
                  !verifyData.success
                ) {
                  throw new Error(
                    verifyData.message ||
                      "Payment verification failed"
                  );
                }

                localStorage.removeItem(
                  "selectedPlan"
                );

                goTo(
                  "/dashboard"
                );
              } catch (
                verifyError
              ) {
                setError(
                  verifyError.message ||
                    "Payment verification failed"
                );
              }
            },

          theme: {
            color:
              "#236c73",
          },
        };

        const razorpay =
          new window.Razorpay(
            options
          );

        razorpay.on(
          "payment.failed",
          (response) => {
            setError(
              response?.error
                ?.description ||
                "Payment failed"
            );
          }
        );

        razorpay.open();
      } catch (paymentError) {
        setError(
          paymentError.message ||
            "Unable to start payment"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleAddonPayment =
    async () => {
      try {
        setError("");

        const token = getToken();

        if (!token) {
          setError(
            "Please sign in before payment"
          );

          setTimeout(() => {
            goTo(
              `/signin?redirect=${encodeURIComponent(
                window.location.pathname +
                  window.location.search
              )}`
            );
          }, 1000);

          return;
        }

        if (
          !billing?.subscription?.planId ||
          billing?.subscription?.status !==
            "active"
        ) {
          setError(
            "Please activate a CRM plan before purchasing an add-on."
          );
          return;
        }

        setLoading(true);

        const apiBase =
          getApiBaseUrl();

        const response =
          await fetch(
            `${apiBase}/api/payment/create-order`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderType: "addon",
                addonType,
                quantity:
                  Number(selectedQuantity),
                currency,
                country,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to create add-on payment order"
          );
        }

        const razorpayLoaded =
          await loadRazorpayScript();

        if (!razorpayLoaded) {
          throw new Error(
            "Unable to load Razorpay"
          );
        }

        const order =
          data.order;

        const options = {
          key:
            import.meta.env
              .VITE_RAZORPAY_KEY_ID,

          amount:
            order.amount,

          currency:
            order.currency,

          name:
            "SaleVitals",

          description:
            `${addonName} - ${selectedQuantity} pack${
              selectedQuantity > 1
                ? "s"
                : ""
            }`,

          order_id:
            order.id,

          handler:
            async (
              paymentResponse
            ) => {
              try {
                const verifyResponse =
                  await fetch(
                    `${apiBase}/api/payment/verify`,
                    {
                      method:
                        "POST",
                      headers: {
                        "Content-Type":
                          "application/json",
                        Authorization:
                          `Bearer ${token}`,
                      },
                      body:
                        JSON.stringify(
                          {
                            razorpay_order_id:
                              paymentResponse.razorpay_order_id,
                            razorpay_payment_id:
                              paymentResponse.razorpay_payment_id,
                            razorpay_signature:
                              paymentResponse.razorpay_signature,
                          }
                        ),
                    }
                  );

                const verifyData =
                  await verifyResponse.json();

                if (
                  !verifyResponse.ok ||
                  !verifyData.success
                ) {
                  throw new Error(
                    verifyData.message ||
                      "Payment verification failed"
                  );
                }

                localStorage.removeItem(
                  "selectedAddon"
                );

                goTo(
                  "/dashboard"
                );
              } catch (
                verifyError
              ) {
                setError(
                  verifyError.message ||
                    "Payment verification failed"
                );
              }
            },

          theme: {
            color:
              "#236c73",
          },
        };

        const razorpay =
          new window.Razorpay(
            options
          );

        razorpay.on(
          "payment.failed",
          (response) => {
            setError(
              response?.error
                ?.description ||
                "Payment failed"
            );
          }
        );

        razorpay.open();
      } catch (paymentError) {
        setError(
          paymentError.message ||
            "Unable to start add-on payment"
        );
      } finally {
        setLoading(false);
      }
    };

  const handlePayment = () => {
    if (checkoutType === "addon") {
      return handleAddonPayment();
    }

    return handleSubscriptionPayment();
  };

  const loadRazorpayScript = () => {
    return new Promise(
      (resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const existingScript =
          document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
          );

        if (existingScript) {
          existingScript.onload =
            () => resolve(true);

          existingScript.onerror =
            () => resolve(false);

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload =
          () => resolve(true);

        script.onerror =
          () => resolve(false);

        document.body.appendChild(
          script
        );
      }
    );
  };

  if (checkoutType === "addon") {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <div className="cart-header-inner">
            <div
              className="cart-logo"
              onClick={() => goTo("/")}
            >
              <img
                src="/logo.png"
                alt="SaleVitals"
                className="cart-logo-image"
              />
            </div>

            <div className="secure-header">
              <span>♧</span>
              Secure checkout
            </div>
          </div>
        </header>

        <main className="cart-main">
          <div className="cart-top-row">
            <div>
              <div className="cart-eyebrow">
                ADD-ON
              </div>

              <h1>
                Add-on checkout
              </h1>
            </div>

            <button
              type="button"
              className="back-plans-btn"
              onClick={() =>
                goTo("/settings?tab=Plan%20%26%20Billing")
              }
            >
              ← Back to Plan & Billing
            </button>
          </div>

          <div className="cart-layout">
            <section className="cart-plan-card">
              <div className="selected-plan-header">
                <div className="plan-icon">
                  {addonType === "ai_chat"
                    ? "✦"
                    : "▤"}
                </div>

                <div>
                  <h2>
                    {addonName}
                  </h2>

                  <p>
                    Sale Vitals CRM
                  </p>
                </div>
              </div>

              <div className="card-divider" />

              <div className="selected-plan-row">
                <div>
                  <span className="small-label">
                    Selected add-on
                  </span>

                  <h3>
                    {addonName}
                  </h3>
                </div>

                <strong>
                  ₹
                  {selectedAddon.price.toLocaleString(
                    "en-IN"
                  )}
                  /month
                </strong>
              </div>

              <div className="setup-section">
                <div className="setup-check">
                  ✓
                </div>

                <div className="setup-content">
                  <h3>
                    Additional capacity
                  </h3>

                  <p>
                    {addonQuota.toLocaleString(
                      "en-IN"
                    )}{" "}
                    additional{" "}
                    {selectedAddon.unit}{" "}
                    per pack.
                  </p>

                  <span>
                    {totalAddonQuota.toLocaleString(
                      "en-IN"
                    )}{" "}
                    {selectedAddon.unit}{" "}
                    total for {selectedQuantity} pack
                    {selectedQuantity > 1 ? "s" : ""}.
                    Valid for 1 month.
                  </span>
                </div>

                <div className="setup-price">
                  <strong>
                    ₹
                    {selectedAddon.price.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <small>
                    /pack
                  </small>
                </div>
              </div>

              <div className="card-divider" />

              <div className="subscription-title">
                Select quantity
              </div>

              <div
                className="addon-quantity-control"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={() =>
                    setSelectedQuantity((previous) =>
                      Math.max(1, previous - 1)
                    )
                  }
                  disabled={selectedQuantity <= 1}
                >
                  −
                </button>

                <strong
                  style={{
                    minWidth: "30px",
                    textAlign: "center",
                    fontSize: "18px",
                  }}
                >
                  {selectedQuantity}
                </strong>

                <button
                  type="button"
                  className="quantity-btn"
                  onClick={() =>
                    setSelectedQuantity((previous) =>
                      Math.min(10, previous + 1)
                    )
                  }
                  disabled={selectedQuantity >= 10}
                >
                  +
                </button>

                <span
                  style={{
                    marginLeft: "8px",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  {selectedQuantity} pack
                  {selectedQuantity > 1 ? "s" : ""} · valid for 1 month
                </span>
              </div>

              <div className="features-included">
                <span>✓</span>

                Add-on will be activated on
                your existing active plan.
              </div>
            </section>

            <aside className="cart-sidebar">
              <div className="order-summary-card">
                <h2>
                  Order summary
                </h2>

                <div className="summary-plan-row">
                  <strong>
                    {addonName}
                  </strong>

                  <strong>
                    {formatPrice(
                      addonSubtotal
                    )}
                  </strong>
                </div>

                <div className="summary-period">
                  {selectedQuantity} pack
                  {selectedQuantity > 1 ? "s" : ""} · Valid for 1 month
                </div>

                <div className="summary-plan-row">
                  <div>
                    <strong>
                      Capacity
                    </strong>

                    <small>
                      {totalAddonQuota.toLocaleString(
                        "en-IN"
                      )}{" "}
                      {selectedAddon.unit}
                    </small>
                  </div>

                  <strong>
                    {totalAddonQuota.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>

                <div className="summary-divider" />

                <div className="summary-row">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      addonSubtotal
                    )}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>
                    Tax (
                    {currency ===
                    "INR"
                      ? "18%"
                      : "0%"}
                    )
                  </span>

                  <strong>
                    {formatPrice(
                      addonTax
                    )}
                  </strong>
                </div>

                <div className="summary-divider" />

                <div className="total-row">
                  <div>
                    <strong>
                      Total
                    </strong>

                    <small>
                      Includes applicable
                      tax
                    </small>
                  </div>

                  <strong className="total-price">
                    {formatPrice(
                      addonTotal
                    )}
                  </strong>
                </div>

                {error && (
                  <div className="payment-error">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  className="payment-btn"
                  disabled={
                    loading ||
                    billingLoading
                  }
                  onClick={
                    handlePayment
                  }
                >
                  {loading
                    ? "Processing..."
                    : "Continue to payment"}

                  <span>
                    →
                  </span>
                </button>

                <div className="razorpay-text">
                  🔒 Secure payment
                  powered by
                  Razorpay
                </div>
              </div>

              <div className="security-card">
                <div className="security-item">
                  <div className="security-icon">
                    ♧
                  </div>

                  <div>
                    <strong>
                      Secure checkout
                    </strong>

                    <span>
                      Your payment
                      information is
                      protected.
                    </span>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Invoice
                    </strong>

                    <span>
                      Invoice generated
                      after successful
                      payment.
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <div className="cart-header-inner">
          <div
            className="cart-logo"
            onClick={() => goTo("/")}
          >
            <img
              src="/logo.png"
              alt="SaleVitals"
              className="cart-logo-image"
            />
          </div>

          <div className="secure-header">
            <span>♧</span>
            Secure checkout
          </div>
        </div>
      </header>

      <main className="cart-main">
        <div className="cart-top-row">
          <div>
            <div className="cart-eyebrow">
              SUBSCRIPTION
            </div>

            <h1>
              {isUpgrade
                ? "Upgrade your plan"
                : "Your plan"}
            </h1>
          </div>

          <button
            type="button"
            className="back-plans-btn"
            onClick={() =>
              goTo("/pricing")
            }
          >
            ← Back to plans
          </button>
        </div>

        <div className="cart-layout">
          <section className="cart-plan-card">
            <div className="selected-plan-header">
              <div className="plan-icon">
                ▤
              </div>

              <div>
                <h2>
                  {planName}
                </h2>

                <p>
                  Sale Vitals CRM
                </p>
              </div>
            </div>

            <div className="card-divider" />

            <div className="selected-plan-row">
              <div>
                <span className="small-label">
                  Selected plan
                </span>

                <h3>
                  {planName}
                </h3>
              </div>

              <button
                type="button"
                className="change-plan-btn"
                onClick={() =>
                  goTo("/pricing")
                }
              >
                Change plan
                <span>⌄</span>
              </button>
            </div>

            {isCurrentPlan && (
              <div
                style={{
                  marginBottom:
                    "20px",
                  padding:
                    "12px 14px",
                  borderRadius:
                    "10px",
                  background:
                    "#e9f8f1",
                  color:
                    "#16835c",
                  fontSize:
                    "14px",
                  fontWeight:
                    600,
                }}
              >
                This is your current
                active plan.
              </div>
            )}

            <div className="subscription-title">
              Choose subscription
              period
            </div>

            <div className="period-list">
              {periods.map(
                (period) => {
                  let original =
                    null;

                  let save =
                    null;

                  let final =
                    null;

                  if (
                    !isCustomPlan
                  ) {
                    original =
                      monthlyPrice *
                      period.months;

                    save =
                      Math.round(
                        original *
                          (period.discount /
                            100)
                      );

                    final =
                      original -
                      save;
                  }

                  return (
                    <button
                      type="button"
                      key={
                        period.months
                      }
                      className={
                        `period-option ${
                          selectedMonths ===
                          period.months
                            ? "active"
                            : ""
                        }`
                      }
                      onClick={() =>
                        setSelectedMonths(
                          period.months
                        )
                      }
                    >
                      <span className="radio-circle">
                        {selectedMonths ===
                          period.months && (
                          <span className="radio-dot" />
                        )}
                      </span>

                      <span className="period-info">
                        <strong>
                          {
                            period.months
                          }{" "}
                          month
                          {period.months >
                          1
                            ? "s"
                            : ""}
                        </strong>

                        <small>
                          {period.discount >
                          0
                            ? `${period.discount}% discount`
                            : "Standard billing"}
                        </small>
                      </span>

                      <span className="period-price">
                        {period.discount >
                        0 ? (
                          <>
                            <span
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "13px",
                                opacity:
                                  0.6,
                                textDecoration:
                                  "line-through",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              {formatPrice(
                                original
                              )}
                            </span>

                            <strong>
                              {formatPrice(
                                final
                              )}
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "12px",
                                marginTop:
                                  "4px",
                                color:
                                  "#16835c",
                              }}
                            >
                              Save{" "}
                              {formatSavePrice(
                                save
                              )}
                            </small>
                          </>
                        ) : (
                          <strong>
                            {formatPrice(
                              original
                            )}
                          </strong>
                        )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <div className="setup-section">
              <div className="setup-check">
                ✓
              </div>

              <div className="setup-content">
                <h3>
                  One-time Setup &
                  Integration
                </h3>

                <p>
                  Website, CRM and
                  supported business
                  integrations setup.
                  Charged only once.
                </p>

                <span>
                  {billing?.subscription
                    ?.setupFeePaid
                    ? "Setup fee already paid."
                    : "One-time setup fee applies to your first purchase."}
                </span>
              </div>

              <div className="setup-price">
                <strong>
                  {setupCharge ===
                  0
                    ? "Paid"
                    : formatPrice(
                        setupCharge
                      )}
                </strong>

                <small>
                  {setupCharge ===
                  0
                    ? "Already paid"
                    : "One-time"}
                </small>
              </div>
            </div>

            <div className="card-divider" />

            <div className="features-included">
              <span>✓</span>
              All features included
              with your{" "}
              <strong>
                {planName} plan
              </strong>
            </div>
          </section>

          <aside className="cart-sidebar">
            <div className="order-summary-card">
              <h2>
                Order summary
              </h2>

              <div className="summary-plan-row">
                <strong>
                  {planName}
                </strong>

                <div
                  style={{
                    textAlign:
                      "right",
                  }}
                >
                  {discountPercentage >
                    0 && (
                    <small
                      style={{
                        display:
                          "block",
                        textDecoration:
                          "line-through",
                        opacity:
                          0.55,
                        marginBottom:
                          "3px",
                      }}
                    >
                      {formatPrice(
                        subscriptionPrice
                      )}
                    </small>
                  )}

                  <strong>
                    {formatPrice(
                      discountedSubscriptionPrice
                    )}
                  </strong>
                </div>
              </div>

              <div className="summary-period">
                {selectedMonths}{" "}
                month period
                {discountPercentage >
                  0 &&
                  ` • ${discountPercentage}% discount`}
              </div>

              {discountPercentage >
                0 && (
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginTop:
                      "8px",
                    fontSize:
                      "14px",
                  }}
                >
                  <span>
                    You save
                  </span>

                  <strong
                    style={{
                      color:
                        "#16835c",
                    }}
                  >
                    {formatPrice(
                      subscriptionDiscount
                    )}
                  </strong>
                </div>
              )}

              <div className="summary-plan-row setup-summary">
                <div>
                  <strong>
                    One-time Setup &
                    Integration
                  </strong>

                  <small>
                    {setupCharge ===
                    0
                      ? "Already paid"
                      : "Charged once"}
                  </small>
                </div>

                <strong>
                  {setupCharge ===
                  0
                    ? "Paid"
                    : formatPrice(
                        setupCharge
                      )}
                </strong>
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatPrice(
                    subscriptionSubtotal
                  )}
                </strong>
              </div>

              <div className="summary-row">
                <span>
                  Tax (
                  {currency ===
                  "INR"
                    ? "18%"
                    : "0%"}
                  )
                </span>

                <strong>
                  {formatPrice(
                    subscriptionTax
                  )}
                </strong>
              </div>

              <div className="summary-divider" />

              <div className="total-row">
                <div>
                  <strong>
                    Total
                  </strong>

                  <small>
                    Includes applicable
                    tax
                  </small>
                </div>

                <strong className="total-price">
                  {formatPrice(
                    subscriptionTotal
                  )}
                </strong>
              </div>

              {error && (
                <div className="payment-error">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="payment-btn"
                disabled={
                  loading ||
                  isCustomPlan ||
                  billingLoading
                }
                onClick={
                  handlePayment
                }
              >
                {loading
                  ? "Processing..."
                  : isCustomPlan
                    ? "Contact sales"
                    : isUpgrade
                      ? "Upgrade plan"
                      : "Continue to payment"}

                <span>→</span>
              </button>

              <div className="razorpay-text">
                🔒 Secure payment
                powered by
                Razorpay
              </div>
            </div>

            <div className="security-card">
              <div className="security-item">
                <div className="security-icon">
                  ♧
                </div>

                <div>
                  <strong>
                    Secure checkout
                  </strong>

                  <span>
                    Your payment
                    information is
                    protected.
                  </span>
                </div>
              </div>

              <div className="security-item">
                <div className="security-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Invoice
                  </strong>

                  <span>
                    Invoice generated
                    after successful
                    payment.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Cart;
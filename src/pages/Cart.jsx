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
  whatsapp_leads: {
    id: "whatsapp_leads",
    name: "WhatsApp Lead Notifications",
    price: 1000,
    quota: 600,
    unit: "leads",
  },

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

  pharmacy_invoice: {
    id: "pharmacy_invoice",
    name: "Pharmacy Invoice",
    price: 1000,
    quota: 0,
    unit: "invoices",
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
  
  const [selectedAddons, setSelectedAddons] =
    useState([]);

  const [error, setError] =
    useState("");
  
const enableAutoPay = true;
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

  const selectedAddonsSubtotal = selectedAddons.reduce((sum, item) => {
    const addon = ADDONS[item.id];
    return sum + (addon ? addon.price * Number(item.quantity || 1) : 0);
  }, 0);

  const subscriptionSubtotal =
    isCustomPlan
      ? null
      : discountedSubscriptionPrice + setupCharge + selectedAddonsSubtotal;

  const subscriptionTax =
    isCustomPlan
      ? null
      : currency === "INR"
        ? Math.round(subscriptionSubtotal * 0.18)
        : 0;

  const subscriptionTotal =
    isCustomPlan
      ? null
      : subscriptionSubtotal + subscriptionTax;

  const toggleAddon = (addonId, checked) => {
    setSelectedAddons((current) => {
      if (checked) {
        if (current.some((item) => item.id === addonId)) return current;
        return [...current, { id: addonId, quantity: 1 }];
      }
      return current.filter((item) => item.id !== addonId);
    });
  };

  const updateAddonQuantity = (addonId, quantity) => {
    const safeQuantity = Math.min(10, Math.max(1, Number(quantity) || 1));
    setSelectedAddons((current) => current.map((item) =>
      item.id === addonId ? { ...item, quantity: safeQuantity } : item
    ));
  };

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
  const isPharmacyInvoice = addonType === "pharmacy_invoice";

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

  
  const handleAutoPaySubscription = async (token, apiBase) => {
  const response = await fetch(
    `${apiBase}/api/billing/autopay/subscribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId,
        period: selectedMonths,
        selectedAddons,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Unable to create AutoPay subscription"
    );
  }

  if (!data.subscriptionId || !data.keyId) {
    throw new Error("AutoPay subscription details are missing.");
  }

  const razorpayLoaded = await loadRazorpayScript();

  if (!razorpayLoaded) {
    throw new Error("Unable to load Razorpay.");
  }

  const razorpay = new window.Razorpay({
    key: data.keyId,
    subscription_id: data.subscriptionId,
    name: "SaleVitals",
    description: `${data.planName} AutoPay - ${data.periodMonths} month(s)`,
    handler: async (paymentResponse) => {
      try {
        const verifyResponse = await fetch(
          `${apiBase}/api/billing/autopay/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }),
          }
        );

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData.success) {
          throw new Error(
            verifyData.message || "AutoPay authorization verification failed."
          );
        }

        goTo("/dashboard");
      } catch (error) {
        setError(error.message || "AutoPay verification failed.");
      }
    },
    modal: {
      ondismiss: () => {
        setError("AutoPay authorization was cancelled.");
      },
    },
    theme: {
      color: "#236c73",
    },
  });

  razorpay.on("payment.failed", (response) => {
    setError(
      response?.error?.description || "AutoPay authorization failed."
    );
  });

  razorpay.open();
};
  


const handleSubscriptionPayment = async () => {
  try {
    setError("");

    if (isCustomPlan) {
      setError("Please contact our sales team for a custom plan.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please sign in before payment");

      setTimeout(() => {
        goTo(
          `/signin?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`
        );
      }, 1000);

      return;
    }

    setLoading(true);

    const apiBase = getApiBaseUrl();

    // STEP 1: Create first-payment order.
    // Backend calculates plan + one-time setup fee + GST.
const response = await fetch(
  `${apiBase}/api/payment/create-order`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      planId,
      currency,
      period: selectedMonths,
      country,
      orderType: "subscription",
      selectedAddons: selectedAddons.map((item) => ({
        addonType: item.id,
        quantity: Number(item.quantity || 1),
      })),
    }),
  }
);

    const data = await response.json();

    if (!response.ok || !data.success || !data.order?.id) {
      throw new Error(
        data.message || "Unable to create payment order"
      );
    }

    const order = data.order;

    if (!order.dbOrderId) {
      throw new Error("Order reference is missing. Please contact support.");
    }

    const razorpayLoaded = await loadRazorpayScript();

    if (!razorpayLoaded) {
      throw new Error("Unable to load Razorpay.");
    }

    const razorpay = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "SaleVitals",
      description: `${planName} Plan - ${selectedMonths} month${
        selectedMonths > 1 ? "s" : ""
      }`,
      order_id: order.id,

      handler: async (paymentResponse) => {
        try {
          // STEP 2: Verify first payment on backend.
          const verifyResponse = await fetch(
            `${apiBase}/api/payment/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(
              verifyData.message ||
                "Payment verification failed. Please contact support before retrying."
            );
          }

          // STEP 3: Request AutoPay setup against the PAID database order.
          // Backend must schedule recurring billing after plan expiry.
         const autoPayResponse = await fetch(
          `${apiBase}/api/billing/autopay/subscribe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              planId,
              period: selectedMonths,
              orderId: order.dbOrderId,
            }),
          }
        );

        const autoPayData = await autoPayResponse.json();

        if (
          !autoPayResponse.ok ||
          !autoPayData.success
        ) {
          setError(
            "Your payment was successful, but AutoPay setup could not be completed. Please contact support. Do not pay again."
          );
          return;
        }

        localStorage.removeItem("selectedPlan");
        goTo("/dashboard");
        } catch (error) {
          setError(
            error.message ||
              "Payment was processed, but confirmation needs attention. Please contact support before retrying."
          );
        } finally {
          setLoading(false);
        }
      },

      modal: {
        ondismiss: () => {
          setError("Payment checkout was closed.");
          setLoading(false);
        },
      },

      theme: {
        color: "#236c73",
      },
    });

    razorpay.on("payment.failed", (paymentError) => {
      setError(
        paymentError?.error?.description || "Payment failed."
      );
      setLoading(false);
    });

    razorpay.open();
  } catch (paymentError) {
    setError(
      paymentError.message || "Unable to start payment."
    );
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
              {addonType === "ai_chat" ? "✦" : "▤"}
            </div>

            <div>
              <h2>{addonName}</h2>
              <p>Sale Vitals CRM</p>
            </div>
          </div>

          <div className="card-divider" />

          <div className="selected-plan-row">
            <div>
              <span className="small-label">Selected add-on</span>
              <h3>{addonName}</h3>
            </div>

            <strong>
              ₹{selectedAddon.price.toLocaleString("en-IN")}/month
            </strong>
          </div>

          {!isPharmacyInvoice && (
            <div className="setup-section">
              <div className="setup-check">✓</div>

              <div className="setup-content">
                <h3>Additional capacity</h3>

                <p>
                  {addonQuota.toLocaleString("en-IN")} additional{" "}
                  {selectedAddon.unit} per pack.
                </p>

                <span>
                  {totalAddonQuota.toLocaleString("en-IN")}{" "}
                  {selectedAddon.unit} total for {selectedQuantity} pack
                  {selectedQuantity > 1 ? "s" : ""}. Valid for 1 month.
                </span>
              </div>

              <div className="setup-price">
                <strong>
                  ₹{selectedAddon.price.toLocaleString("en-IN")}
                </strong>
                <small>/pack</small>
              </div>
            </div>
          )}

          {!isPharmacyInvoice && (
            <>
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
            </>
          )}

          <div className="features-included">
            <span>✓</span>
            {isPharmacyInvoice
              ? "Unlimited pharmacy invoice access for 1 month."
              : "Add-on will be activated on your existing active plan."}
          </div>
        </section>

  <aside className="cart-sidebar">
    <div className="order-summary-card">
      <h2>Order summary</h2>

      <div className="summary-plan-row">
        <strong>{addonName}</strong>
        <strong>{formatPrice(addonSubtotal)}</strong>
      </div>

      <div className="summary-period">
        {isPharmacyInvoice
          ? "Valid for 1 month"
          : `${selectedQuantity} pack${selectedQuantity > 1 ? "s" : ""} · Valid for 1 month`}
      </div>

      {!isPharmacyInvoice && (
        <div className="summary-plan-row">
          <div>
            <strong>Capacity</strong>
            <small>
              {totalAddonQuota.toLocaleString("en-IN")}{" "}
              {selectedAddon.unit}
            </small>
          </div>

          <strong>
            {totalAddonQuota.toLocaleString("en-IN")}
          </strong>
        </div>
      )}

      <div className="summary-divider" />

      <div className="summary-row">
        <span>Subtotal</span>
        <strong>{formatPrice(addonSubtotal)}</strong>
      </div>

      <div className="summary-row">
        <span>Tax ({currency === "INR" ? "18%" : "0%"})</span>
        <strong>{formatPrice(addonTax)}</strong>
      </div>

      <div className="summary-divider" />

      <div className="total-row">
        <div>
          <strong>Total</strong>
          <small>Includes applicable tax</small>
        </div>

        <strong className="total-price">
          {formatPrice(addonTotal)}
        </strong>
      </div>

      {error && (
        <div className="payment-error">{error}</div>
      )}
      
             
            
      {false && checkoutType !== "addon" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            margin: "18px 0",
            padding: "12px 14px",
            border: "1px solid #dbe3ed",
            borderRadius: "10px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#17313a",
            }}
          >
            Enable AutoPay
          </span>

          <span
            style={{
              position: "relative",
              display: "inline-flex",
              width: "42px",
              height: "24px",
              flexShrink: 0,
            }}
          >
            <input
              type="checkbox"
              checked={enableAutoPay}
              onChange={(e) => setEnableAutoPay(e.target.checked)}
              aria-label="Enable AutoPay"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                margin: 0,
                opacity: 0,
                cursor: "pointer",
                zIndex: 2,
              }}
            />

            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: enableAutoPay ? "#00656A" : "#d5dce2",
                transition: "background 0.2s ease",
              }}
            />

            <span
              style={{
                position: "absolute",
                top: "3px",
                left: enableAutoPay ? "21px" : "3px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s ease",
                pointerEvents: "none",
              }}
            />
          </span>
        </label>
      )}
            

      <button
        type="button"
        className="payment-btn"
        disabled={loading || billingLoading}
        onClick={handlePayment}
      >
        {loading ? "Processing..." : "Continue to payment"}
        <span>→</span>
      </button>

      <div className="razorpay-text">
        🔒 Secure payment powered by Razorpay
      </div>
    </div>

    <div className="security-card">
      <div className="security-item">
        <div className="security-icon">♧</div>
        <div>
          <strong>Secure checkout</strong>
          <span>Your payment information is protected.</span>
        </div>
      </div>

      <div className="security-item">
        <div className="security-icon">✓</div>
        <div>
          <strong>Invoice</strong>
          <span>Invoice generated after successful payment.</span>
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

      <main className="cart-main" style={{ width: "min(1240px, calc(100% - 48px))", maxWidth: "1240px", margin: "0 auto" }}>
        <style>{`
          .cart-subscription-layout { display: grid !important; grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.9fr) !important; align-items: start; gap: 22px !important; }
          .period-grid-compact { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; gap: 10px !important; }
          .compact-period-option { min-height: 116px !important; padding: 12px 10px !important; }
          .compact-period-option .period-info strong { display: block; font-size: 13px; line-height: 1.25; white-space: nowrap; }
          .compact-period-option .period-info small { display: block; font-size: 10px; line-height: 1.3; margin-top: 5px; }
          .compact-period-option .radio-circle { flex: 0 0 15px; }
          .compact-period-option .period-price { font-size: 12px; line-height: 1.25; }
          .compact-period-option .period-price strong { font-size: 13px; white-space: nowrap; }
          @media (max-width: 1050px) {
            .cart-subscription-layout { grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.9fr) !important; gap: 16px !important; }
            .period-grid-compact { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          }
          @media (max-width: 720px) {
            .cart-subscription-layout { grid-template-columns: minmax(0, 1fr) !important; }
            .period-grid-compact { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          }
          @media (max-width: 420px) {
            .cart-main { width: calc(100% - 24px) !important; }
            .compact-period-option { min-height: 108px !important; padding: 10px 8px !important; }
          }
        `}</style>
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

        <div className="cart-layout cart-subscription-layout">
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

              {/* <button
                type="button"
                className="change-plan-btn"
                onClick={() =>
                  goTo("/pricing")
                }
              >
                Change plan
                <span>⌄</span>
              </button> */}
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

            <div
              className="period-list period-grid-compact"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "12px",
                alignItems: "stretch",
              }}
            >
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
                        `period-option compact-period-option ${
                          selectedMonths ===
                          period.months
                            ? "active"
                            : ""
                        }`
                      }
                      style={{
                        minWidth: 0,
                        minHeight: "126px",
                        padding: "14px 12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "space-between",
                        gap: "8px",
                        textAlign: "left",
                        borderRadius: "12px",
                        border: selectedMonths === period.months
                          ? "1.5px solid #087E8B"
                          : "1px solid #D5DFEB",
                        background: selectedMonths === period.months
                          ? "#EFFAFA"
                          : "#FFFFFF",
                        boxSizing: "border-box",
                      }}
                      onClick={() =>
                        setSelectedMonths(
                          period.months
                        )
                      }
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "7px", width: "100%" }}>
                        <span className="radio-circle">
                          {selectedMonths === period.months && (
                            <span className="radio-dot" />
                          )}
                        </span>
                        <span className="period-info" style={{ minWidth: 0, flex: 1 }}>
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
                      </span>

                      <span className="period-price" style={{ width: "100%", textAlign: "left", marginTop: "auto" }}>
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

            <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #E2E8F0" }}>
              <div style={{ marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "20px", color: "#102A43" }}>Add-ons (optional)</h3>
                <p style={{ margin: "5px 0 0", color: "#64748B", fontSize: "13px", lineHeight: 1.5 }}>
                  Turn on the extras you need. Selected add-ons are added to your order summary.
                </p>
              </div>

              <div style={{ display: "grid", gap: "9px" }}>
                {Object.values(ADDONS).map((addon) => {
                  const selected = selectedAddons.find((item) => item.id === addon.id);
                  const addonFeatures = {
                    whatsapp_leads: [
                      "Receive leads from Website, Facebook, Instagram and AI Chat",
                      "Get instant WhatsApp alerts during your configured time window",
                      "600 additional leads per pack",
                    ],
                    contacts: [
                      "Store and manage more patient/customer contacts",
                      "Organise and segment your contacts easily",
                      "1,000 additional contacts per pack",
                    ],
                    ai_chat: [
                      "Add 3,000 AI chatbot conversations per pack",
                      "Automate website engagement and common queries",
                      "Help capture and respond to more leads",
                    ],
                    pharmacy_invoice: [
                      "Create and manage pharmacy invoices inside your CRM",
                      "Keep medicine billing records organised",
                      "Unlimited invoices while active",
                    ],
                  }[addon.id] || [];

                  return (
                    <div key={addon.id} style={{
                      border: selected ? "1px solid #8BCBD0" : "1px solid #E0E7EF",
                      background: selected ? "#F2FBFB" : "#FFFFFF",
                      borderRadius: "11px",
                      padding: "13px 15px",
                      boxShadow: selected ? "0 3px 12px rgba(8,126,139,.08)" : "none",
                      transition: "all .18s ease",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(selected)}
                          aria-label={`Toggle ${addon.name}`}
                          onClick={() => toggleAddon(addon.id, !selected)}
                          style={{
                            width: "42px", height: "24px", padding: "3px",
                            border: 0, borderRadius: "20px", flexShrink: 0,
                            background: selected ? "#087E8B" : "#CBD5E1",
                            cursor: "pointer", display: "flex",
                            justifyContent: selected ? "flex-end" : "flex-start",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 1px 3px #0002" }} />
                        </button>

                        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                          <strong style={{ display: "block", fontSize: "14px", color: "#102A43" }}>{addon.name}</strong>
                          <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "#64748B", lineHeight: 1.45 }}>
                            {addon.id === "whatsapp_leads" && "Get new lead alerts on WhatsApp during your configured time window."}
                            {addon.id === "contacts" && "Increase the number of contacts you can store and manage in your CRM."}
                            {addon.id === "ai_chat" && "Add more AI chatbot conversations for automated website engagement."}
                            {addon.id === "pharmacy_invoice" && "Create and manage pharmacy invoices directly inside your CRM."}
                          </span>
                        </div>

                        <div style={{ textAlign: "right", minWidth: "100px" }}>
                          <strong style={{ display: "block", fontSize: "14px", color: "#102A43" }}>{formatPrice(addon.price)}</strong>
                          <small style={{ color: "#64748B", fontSize: "11px" }}>{addon.id === "contacts" || addon.id === "ai_chat" ? "/ pack" : "/ month"}</small>
                        </div>

                        {selected && addon.id !== "pharmacy_invoice" && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #D5DFEB", borderRadius: "8px", padding: "3px 5px", background: "#FFFFFF" }}>
                            <button type="button" aria-label={`Decrease ${addon.name} quantity`} onClick={() => updateAddonQuantity(addon.id, selected.quantity - 1)} disabled={selected.quantity <= 1} style={{ border: 0, background: "transparent", color: selected.quantity <= 1 ? "#CBD5E1" : "#087E8B", cursor: selected.quantity <= 1 ? "not-allowed" : "pointer", fontSize: "18px", padding: "0 4px" }}>−</button>
                            <span style={{ minWidth: "18px", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>{selected.quantity}</span>
                            <button type="button" aria-label={`Increase ${addon.name} quantity`} onClick={() => updateAddonQuantity(addon.id, selected.quantity + 1)} disabled={selected.quantity >= 10} style={{ border: 0, background: "transparent", color: selected.quantity >= 10 ? "#CBD5E1" : "#087E8B", cursor: selected.quantity >= 10 ? "not-allowed" : "pointer", fontSize: "18px", padding: "0 4px" }}>+</button>
                          </div>
                        )}
                        {selected && (
                          <strong style={{ minWidth: "78px", textAlign: "right", fontSize: "13px", color: "#087E8B" }}>
                            {formatPrice(addon.price * (addon.id === "pharmacy_invoice" ? 1 : selected.quantity))}
                          </strong>
                        )}
                      </div>

                      {selected && (
                        <ul style={{ margin: "10px 0 0 54px", paddingLeft: "15px", display: "grid", gap: "4px", color: "#475569", fontSize: "12px", lineHeight: 1.45 }}>
                          {addonFeatures.map((feature) => <li key={feature}>{feature}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
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

              {selectedAddons.length > 0 && (
                <>
                  <div className="summary-divider" />
                  {selectedAddons.map((item) => {
                    const addon = ADDONS[item.id];
                    if (!addon) return null;
                    return (
                      <div className="summary-row" key={item.id}>
                        <span>{addon.name} × {item.quantity}</span>
                        <strong>{formatPrice(addon.price * item.quantity)}</strong>
                      </div>
                    );
                  })}
                </>
              )}

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

              {false && checkoutType !== "addon" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "18px 0",
                  padding: "12px 14px",
                  border: "1px solid #dbe3ed",
                  borderRadius: "10px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#17313a",
                  }}
                >
                  Enable AutoPay
                </span>

                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: "42px",
                    height: "24px",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enableAutoPay}
                    onChange={(e) => setEnableAutoPay(e.target.checked)}
                    aria-label="Enable AutoPay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "20px",
                      background: enableAutoPay ? "#00656A" : "#d5dce2",
                      transition: "background 0.2s ease",
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: enableAutoPay ? "21px" : "3px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s ease",
                      pointerEvents: "none",
                    }}
                  />
                </span>
              </label>
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
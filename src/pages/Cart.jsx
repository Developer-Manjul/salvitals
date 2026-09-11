import { useEffect, useMemo, useState } from "react";
import {
    PLANS,
    detectVisitorCountry,
    getCurrency,
    getPlanPrice,
} from "../config/pricing";
import "./../styles/cart.scss";
import { getApiBaseUrl } from "../config/api";

const goTo = (url) => {
    const nextUrl = url.startsWith("/") ? url : `/${url}`;
    window.history.pushState({}, "", nextUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
};

const Cart = () => {
    const [planId] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const queryPlanId = params.get("plan");

        if (queryPlanId && PLANS[queryPlanId]) {
            return queryPlanId;
        }

        try {
            const savedPlan = JSON.parse(
                localStorage.getItem("selectedPlan") || "null"
            );
            const savedPlanId = savedPlan?.id || savedPlan?.planId;

            if (savedPlanId && PLANS[savedPlanId]) {
                return savedPlanId;
            }

            const savedPlanName = (
                savedPlan?.name || savedPlan?.planName || ""
            ).toLowerCase();
            const matchingPlan = Object.values(PLANS).find(
                (plan) => plan.name.toLowerCase() === savedPlanName
            );

            return matchingPlan?.id || "starter";
        } catch (error) {
            console.error("Selected plan read error:", error);
            return "starter";
        }
    });

    const [selectedMonths, setSelectedMonths] = useState(1);
    const [country, setCountry] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedPlan = useMemo(() => {
        return PLANS?.[planId] || PLANS?.starter || {};
    }, [planId]);

    useEffect(() => {
        const loadCountry = async () => {
            try {
                const detectedCountry = await detectVisitorCountry();
                const finalCountry = detectedCountry || "IN";

                setCountry(finalCountry);

                const detectedCurrency = getCurrency(finalCountry);

                setCurrency(detectedCurrency || "INR");
            } catch (error) {
                console.error("Country detection error:", error);
                setCountry("IN");
                setCurrency("INR");
            }
        };

        loadCountry();
    }, []);

    const monthlyPrice = useMemo(() => {
        if (!selectedPlan) {
            return null;
        }

        const price = getPlanPrice(selectedPlan, currency);

        if (price === null || price === undefined) {
            return null;
        }

        return Number(price);
    }, [selectedPlan, currency]);

    const isCustomPlan =
        monthlyPrice === null ||
        Number.isNaN(Number(monthlyPrice));

    const setupCharge = useMemo(() => {
        if (isCustomPlan) {
            return null;
        }

        if (selectedPlan?.setupCharge) {
            const setup = selectedPlan.setupCharge;

            if (typeof setup === "object") {
                return Number(
                    currency === "INR"
                        ? setup.inr || setup.INR || 0
                        : setup.usd || setup.USD || 0
                );
            }

            return Number(setup);
        }

        return currency === "INR" ? 699 : 180;
    }, [selectedPlan, currency, isCustomPlan]);

    const getDiscountPercentage = (months) => {
        const discounts = {
            1: 0,
            3: 5,
            6: 7,
            9: 9,
            12: 12,
            24: 15,
        };

        return discounts[months] || 0;
    };

    const discountPercentage = useMemo(() => {
        return getDiscountPercentage(selectedMonths);
    }, [selectedMonths]);

    const subscriptionPrice =
        isCustomPlan
            ? null
            : monthlyPrice * selectedMonths;

    const subscriptionDiscount =
        isCustomPlan
            ? null
            : (subscriptionPrice * discountPercentage) / 100;

    const discountedSubscriptionPrice =
        isCustomPlan
            ? null
            : subscriptionPrice - subscriptionDiscount;

    const subtotal =
        isCustomPlan
            ? null
            : discountedSubscriptionPrice + setupCharge;

    const tax =
        isCustomPlan
            ? null
            : currency === "INR"
                ? subtotal * 0.18
                : subtotal * 0.02;

    const total =
        isCustomPlan
            ? null
            : subtotal + tax;

    const planName =
        selectedPlan?.name ||
        selectedPlan?.title ||
        (
            planId
                ? planId.charAt(0).toUpperCase() +
                planId.slice(1)
                : "Starter"
        );

    const formatPrice = (amount) => {
        if (
            amount === null ||
            amount === undefined ||
            Number.isNaN(Number(amount))
        ) {
            return "Custom";
        }

        return new Intl.NumberFormat(
            currency === "INR" ? "en-IN" : "en-US",
            {
                style: "currency",
                currency: currency === "INR" ? "INR" : "USD",
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

        return new Intl.NumberFormat(
            currency === "INR" ? "en-IN" : "en-US",
            {
                style: "currency",
                currency: currency === "INR" ? "INR" : "USD",
                maximumFractionDigits: 0,
            }
        ).format(Number(amount));
    };

    const periods = [
        {
            months: 1,
            label: "1 month",
            discount: 0,
            note: "Standard billing",
        },
        {
            months: 3,
            label: "3 months",
            discount: 5,
            note: "5% discount",
        },
        {
            months: 6,
            label: "6 months",
            discount: 7,
            note: "7% discount",
        },
        {
            months: 9,
            label: "9 months",
            discount: 9,
            note: "9% discount",
        },
        {
            months: 12,
            label: "12 months",
            discount: 12,
            note: "12% discount",
        },
        {
            months: 24,
            label: "24 months",
            discount: 15,
            note: "15% discount",
        },
    ];

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const existingScript = document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );

            if (existingScript) {
                existingScript.onload = () => resolve(true);
                return;
            }

            const script = document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve(true);

            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        try {
            setError("");

            if (isCustomPlan) {
                setError(
                    "Please contact our sales team for a custom plan."
                );
                return;
            }

            if (!total || Number(total) <= 0) {
                setError("Invalid payment amount");
                return;
            }

            setLoading(true);

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("vitalsToken") ||
                localStorage.getItem("authToken") ||
                sessionStorage.getItem("token");

            if (!token) {
                setError("Please sign in before payment");

                setTimeout(() => {
                    goTo(
                        `/signin?redirect=${encodeURIComponent(
                            window.location.pathname +
                            window.location.search
                        )}`
                    );
                }, 1200);

                return;
            }

            const apiBase = getApiBaseUrl();

            const createOrderUrl =
                `${apiBase}/api/payment/create-order`;

            const response = await fetch(
                createOrderUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        amount: Number(total.toFixed(2)),
                        totalAmount: Number(total.toFixed(2)),
                        planId: planId,
                        planName: planName,
                        currency: currency,
                        period: selectedMonths,
                        periodLabel: `${selectedMonths} month${selectedMonths > 1 ? "s" : ""
                            }`,
                        country: country,
                        planAmount: Number(
                            subscriptionPrice.toFixed(2)
                        ),
                        discountPercentage:
                            discountPercentage,
                        discountAmount: Number(
                            subscriptionDiscount.toFixed(2)
                        ),
                        discountedPlanAmount: Number(
                            discountedSubscriptionPrice.toFixed(2)
                        ),
                        setupFee: Number(
                            setupCharge.toFixed(2)
                        ),
                        tax: Number(
                            tax.toFixed(2)
                        ),
                        subtotal: Number(
                            subtotal.toFixed(2)
                        ),
                    }),
                }
            );

            const data = await response.json();

            console.log(
                "CART TOTAL:",
                Number(total.toFixed(2))
            );

            console.log(
                "RAZORPAY ORDER RESPONSE:",
                data
            );

            if (!response.ok || !data.success) {
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

            const options = {
                key:
                    import.meta.env
                        .VITE_RAZORPAY_KEY_ID,

                amount:
                    data.order.amount,

                currency:
                    data.order.currency,

                name:
                    "SaleVitals",

                description:
                    `${planName} Plan - ${selectedMonths} month${selectedMonths > 1
                        ? "s"
                        : ""
                    }`,

                order_id:
                    data.order.id,

                handler:
                    async (paymentResponse) => {
                        try {
                            const verifyUrl =
                                `${apiBase}/api/payment/verify`;

                            const verifyResponse =
                                await fetch(
                                    verifyUrl,
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                            Authorization:
                                                `Bearer ${token}`,
                                        },
                                        body:
                                            JSON.stringify({
                                                razorpay_order_id:
                                                    paymentResponse
                                                        .razorpay_order_id,
                                                razorpay_payment_id:
                                                    paymentResponse
                                                        .razorpay_payment_id,
                                                razorpay_signature:
                                                    paymentResponse
                                                        .razorpay_signature,
                                            }),
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

                            goTo("/dashboard");
                        } catch (verifyError) {
                            console.error(
                                "Verify payment error:",
                                verifyError
                            );

                            setError(
                                verifyError.message ||
                                "Payment verification failed"
                            );
                        }
                    },

                theme: {
                    color: "#236c73",
                },
            };

            const razorpay =
                new window.Razorpay(options);

            razorpay.open();
        } catch (paymentError) {
            console.error(
                "Payment error:",
                paymentError
            );

            setError(
                paymentError.message ||
                "Unable to start payment"
            );
        } finally {
            setLoading(false);
        }
    };

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

                        <h1>Your plan</h1>
                    </div>

                    <button
                        type="button"
                        className="back-plans-btn"
                        onClick={() => goTo("/pricing")}
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
                                <h2>{planName}</h2>
                                <p>Sale Vitals CRM</p>
                            </div>
                        </div>

                        <div className="card-divider" />

                        <div className="selected-plan-row">
                            <div>
                                <span className="small-label">
                                    Selected plan
                                </span>

                                <h3>{planName}</h3>
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

                        <div className="subscription-title">
                            Choose subscription period
                        </div>

                        <div className="period-list">
                            {periods.map((period) => {
                                let originalPeriodPrice =
                                    null;

                                let discountAmount =
                                    null;

                                let finalPeriodPrice =
                                    null;

                                if (!isCustomPlan) {
                                    originalPeriodPrice =
                                        monthlyPrice *
                                        period.months;

                                    discountAmount =
                                        (
                                            originalPeriodPrice *
                                            period.discount
                                        ) / 100;

                                    finalPeriodPrice =
                                        originalPeriodPrice -
                                        discountAmount;
                                }

                                return (
                                    <button
                                        type="button"
                                        key={
                                            period.months
                                        }
                                        className={
                                            `period-option ${selectedMonths ===
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
                                                {period.label}
                                            </strong>

                                            <small>
                                                {period.note}
                                            </small>
                                        </span>

                                        <span className="period-price">
                                            {period.discount > 0 ? (
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
                                                            originalPeriodPrice
                                                        )}
                                                    </span>

                                                    <strong>
                                                        {formatPrice(
                                                            finalPeriodPrice
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
                                                            discountAmount
                                                        )}
                                                    </small>
                                                </>
                                            ) : (
                                                <strong>
                                                    {formatPrice(
                                                        originalPeriodPrice
                                                    )}
                                                </strong>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="setup-section">
                            <div className="setup-check">
                                ✓
                            </div>

                            <div className="setup-content">
                                <h3>
                                    One-time Setup &amp;
                                    Integration
                                </h3>

                                <p>
                                    Website, CRM and supported
                                    business integrations setup.
                                    Charged only once.
                                </p>

                                <span>
                                    Your plan is billed for{" "}
                                    <strong>
                                        {selectedMonths} month
                                        {selectedMonths > 1
                                            ? "s"
                                            : ""}
                                    </strong>{" "}
                                    upfront.
                                </span>
                            </div>

                            <div className="setup-price">
                                <strong>
                                    {formatPrice(
                                        setupCharge
                                    )}
                                </strong>

                                <small>
                                    One-time
                                </small>
                            </div>
                        </div>

                        <div className="card-divider" />

                        <div className="features-included">
                            <span>✓</span>

                            All features included with your{" "}

                            <strong>
                                {planName} plan
                            </strong>
                        </div>
                    </section>

                    <aside className="cart-sidebar">
                        <div className="order-summary-card">
                            <h2>Order summary</h2>

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
                                    {discountPercentage > 0 && (
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
                                {selectedMonths} month period
                                {discountPercentage > 0 &&
                                    ` • ${discountPercentage}% discount`}
                            </div>

                            {discountPercentage > 0 && (
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
                                        One-time Setup &amp;
                                        Integration
                                    </strong>

                                    <small>
                                        Charged once
                                    </small>
                                </div>

                                <strong>
                                    {formatPrice(
                                        setupCharge
                                    )}
                                </strong>
                            </div>

                            <div className="summary-divider" />

                            <div className="summary-row">
                                <span>Subtotal</span>

                                <strong>
                                    {formatPrice(
                                        subtotal
                                    )}
                                </strong>
                            </div>

                                <div className="summary-row">
                                    <span>
                                        Tax ({currency === "INR" ? "18%" : "2%"})
                                    </span>

                                    <strong>
                                        {formatPrice(
                                            tax
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
                                        Includes applicable tax
                                    </small>
                                </div>

                                <strong className="total-price">
                                    {formatPrice(
                                        total
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
                                    isCustomPlan
                                }
                                onClick={
                                    handlePayment
                                }
                            >
                                {loading
                                    ? "Processing..."
                                    : isCustomPlan
                                        ? "Contact sales"
                                        : "Continue to payment"}

                                <span>→</span>
                            </button>

                            <div className="razorpay-text">
                                🔒 Secure payment powered by
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
                                        Your payment information
                                        is protected.
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
                                        Invoice generated after
                                        successful payment.
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
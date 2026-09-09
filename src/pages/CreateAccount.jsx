import { useEffect, useState } from "react";
import { PLANS, detectVisitorCountry, formatPlanPrice, getCurrency } from "../config/pricing";
import { getApiBaseUrl } from "../config/api";

const API_URL = getApiBaseUrl();
const COUNTRIES = [{ code: "+91", name: "India", min: 10, max: 10 }, { code: "+1", name: "United States / Canada", min: 10, max: 10 }, { code: "+44", name: "United Kingdom", min: 10, max: 10 }, { code: "+971", name: "UAE", min: 9, max: 9 }, { code: "+61", name: "Australia", min: 9, max: 9 }];
console.log("Final API URL:", API_URL);
console.log(
  "Register endpoint:",
  `${API_URL}/api/auth/register`
);
export default function CreateAccount() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accountCreated, setAccountCreated] = useState(false);

  const [step, setStep] = useState(1);

  const [selectedDoctors, setSelectedDoctors] = useState("1");
  const [customDoctors, setCustomDoctors] = useState("");
  const [showCustomDoctors, setShowCustomDoctors] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [currency, setCurrency] = useState("USD");

  const [logoPreview, setLogoPreview] = useState("");

  const [form, setForm] = useState({
    clinicName: "",
    name: "",
    email: "",
    phone: "",
    speciality: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [clinicDetails, setClinicDetails] = useState({
    displayName: "",
    address: "",
    gstin: "",
    zipCode: "",
    website: "",
  });

  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem("selectedPlan") || "null"); if (stored?.id) setSelectedPlan(PLANS[stored.id]?.name || stored.name || ""); } catch (_) { }
    detectVisitorCountry().then((code) => setCurrency(getCurrency(code)));
  }, []);

  useEffect(() => {

    const params = new URLSearchParams(
      window.location.search
    );

    // ==========================================
    // PAYMENT SUCCESS
    // ==========================================

    if (params.get("payment") === "success") {

      setAccountCreated(true);
      setStep(3);

      return;
    }


    // ==========================================
    // EMAIL VERIFIED → CONTINUE SETUP
    // ==========================================

    if (params.get("setup") === "1") {

      const savedData =
        localStorage.getItem(
          "vitalsSignupData"
        );

      if (savedData) {

        try {

          const parsed =
            JSON.parse(savedData);

          if (parsed.form) {

            setForm(parsed.form);

          }

          if (
            parsed.selectedDoctors
          ) {

            setSelectedDoctors(
              parsed.selectedDoctors
            );

          }

          if (
            parsed.customDoctors
          ) {

            setCustomDoctors(
              parsed.customDoctors
            );

          }

        } catch (error) {

          console.error(
            "Unable to restore signup data:",
            error
          );

        }

      }


      // Create Account form skip
      // Direct onboarding Step 1
      setAccountCreated(true);

      setStep(1);


      // Future reload ke liye clean
      localStorage.removeItem(
        "vitalsContinueSetup"
      );

    }

  }, []);


  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateClinic = (key, value) => {
    setClinicDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };


  const selectDoctors = (value) => {
    if (value === "more") {
      setSelectedDoctors("custom");
      setShowCustomDoctors(true);
      return;
    }

    setSelectedDoctors(value);
    setShowCustomDoctors(false);
    setCustomDoctors("");
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.clinicName.trim()) {
      setError("Business Name is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Person Name is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid work email.");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    const selectedCountry = COUNTRIES.find((item) => item.code === countryCode) || COUNTRIES[0];
    if (phoneDigits.length < selectedCountry.min || phoneDigits.length > selectedCountry.max) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!form.speciality) {
      setError("Please select speciality.");
      return;
    }

    if (
      selectedDoctors === "custom" &&
      (!customDoctors || Number(customDoctors) < 1)
    ) {
      setError("Please enter the number of doctors.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.terms) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: form.name,

            email: form.email
              .trim()
              .toLowerCase(),

            password: form.password,

            clinicName: form.clinicName,

            phone: phoneDigits,

            phoneCountryCode: countryCode,

            speciality: form.speciality,

            numberOfDoctors:
              selectedDoctors === "custom"
                ? customDoctors
                : selectedDoctors,
          }),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText
          );
        } catch (parseError) {
          throw new Error(
            "Server returned an invalid response: " +
            responseText
          );
        }
      }

      if (!response.ok) {
        setError(
          data.message ||
          `Unable to create account. Server returned ${response.status}`
        );

        return;
      }

      if (!data.success) {
        setError(
          data.message ||
          "Unable to create account"
        );

        return;
      }

      console.log(
        "Account created:",
        data
      );

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

      if (data.emailVerificationRequired) {

        // Verification ke baad onboarding continue karne ke liye
        localStorage.setItem(
          "vitalsSignupData",
          JSON.stringify({
            form,
            selectedDoctors,
            customDoctors,
            countryCode,
          })
        );

        localStorage.setItem(
          "vitalsContinueSetup",
          "true"
        );

        window.location.href =
          `/check-email?email=${encodeURIComponent(
            form.email
          )}`;

        return;
      }

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );

      setError(
        error.message ||
        "Unable to connect to server."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLINIC DETAILS CONTINUE
  // ==========================================

  const continueClinicDetails = () => {
    if (!clinicDetails.address.trim()) {
      alert("Please enter your clinic address.");
      return;
    }

    const completeData = {
      account: form,

      clinic: {
        ...clinicDetails,

        displayName:
          clinicDetails.displayName || form.name,
      },

      logo: logoPreview,

      doctors:
        selectedDoctors === "custom"
          ? customDoctors
          : selectedDoctors,
    };

    localStorage.setItem(
      "vitalsClinicSetup",
      JSON.stringify(completeData)
    );

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // PROCEED TO CART
  // ==========================================

  const proceedToCart = () => {
    if (!selectedPlan) {
      alert("Please select a plan first.");
      return;
    }

    const selectedPlanId = Object.keys(PLANS).find(
      (planId) => PLANS[planId].name === selectedPlan
    );

    if (!selectedPlanId) {
      alert("Please select a valid plan.");
      return;
    }

    const planData = {
      selectedPlan,
      account: form,
      clinic: clinicDetails,

      doctors:
        selectedDoctors === "custom"
          ? customDoctors
          : selectedDoctors,
    };

    localStorage.setItem(
      "vitalsSelectedPlan",
      JSON.stringify(planData)
    );

    window.location.href = `/cart?plan=${selectedPlanId}`;
  };

  // =====================================================
  // CREATE ACCOUNT SCREEN
  // =====================================================

  if (!accountCreated) {
    return (
      <>
        <style>{styles}</style>

        <div className="auth-page">

          {/* LEFT SIDE */}

          <div className="auth-left">

            <div className="auth-orb"></div>

            <div className="auth-left-inner">

              <div className="auth-eyebrow">
                YOUR BUSINESS. ONE CONNECTED CRM.
              </div>

              <h2>
                Every lead.
                Every conversation.
                One place.
              </h2>

              <p>
                Capture leads, manage customer relationships,
                automate follow-ups and grow your business
                from one connected workspace.
              </p>

              <div className="auth-benefits">

                <div className="benefit-item">
                  <span>✓</span>

                  <div>
                    <b>Capture every opportunity</b>

                    <small>
                      Bring leads in from every channel
                    </small>
                  </div>
                </div>

                <div className="benefit-item">
                  <span>✓</span>

                  <div>
                    <b>Keep your team aligned</b>

                    <small>
                      Every conversation, task and activity
                      in context
                    </small>
                  </div>
                </div>

                <div className="benefit-item">
                  <span>✓</span>

                  <div>
                    <b>Move customers forward</b>

                    <small>
                      Automate follow-ups and track every
                      opportunity
                    </small>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="auth-right">

            <div className="auth-card">

              <div className="auth-top">
                <h1>Create your account</h1>
              </div>

              <form
                onSubmit={submit}
                className="auth-form"
              >

                {/* BUSINESS + PERSON */}

                <div className="auth-grid">

                  <label>
                    Business Name <em>*</em>

                    <input
                      value={form.clinicName}
                      onChange={(e) =>
                        update(
                          "clinicName",
                          e.target.value
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    Display Name <em>*</em>

                    <input
                      value={form.name}
                      onChange={(e) =>
                        update(
                          "name",
                          e.target.value
                        )
                      }
                      required
                    />
                  </label>

                </div>

                {/* EMAIL + PHONE */}

                <div className="auth-grid">

                  <label>
                    Work email <em>*</em>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        update(
                          "email",
                          e.target.value
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    Phone number <em>*</em>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ maxWidth: "145px" }}>
                        {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.code} {country.name}</option>)}
                      </select>
                      <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} required />
                    </div>
                  </label>

                </div>

                {/* SPECIALITY */}

                <label>
                  Speciality <em>*</em>

                  <select
                    value={form.speciality}
                    onChange={(e) =>
                      update(
                        "speciality",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select speciality
                    </option>

                    <option value="Education">
                      Education
                    </option>

                    <option value="E-commerce">
                      E-commerce
                    </option>

                    <option value="Finance & Insurance">
                      Finance & Insurance
                    </option>

                    <option value="Healthcare">
                      Healthcare
                    </option>

                    <option value="Automobile">
                      Automobile
                    </option>

                    <option value="Real Estate">
                      Real Estate
                    </option>

                    <option value="IT Services & Internet">
                      IT Services & Internet
                    </option>

                    <option value="Events & Webinar">
                      Events & Webinar
                    </option>

                    <option value="Other">
                      Others
                    </option>

                  </select>
                </label>

                {/* NUMBER OF DOCTORS */}

                <div className="doctor-section">

                  <div className="doctor-label">
                    Number of doctors <em>*</em>
                  </div>

                  <div className="doctor-options">

                    <button
                      type="button"
                      className={
                        selectedDoctors === "1"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        selectDoctors("1")
                      }
                    >
                      1
                    </button>

                    <button
                      type="button"
                      className={
                        selectedDoctors === "3"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        selectDoctors("3")
                      }
                    >
                      3
                    </button>

                    <button
                      type="button"
                      className={
                        selectedDoctors === "5"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        selectDoctors("5")
                      }
                    >
                      5
                    </button>

                    <button
                      type="button"
                      className={
                        selectedDoctors === "custom"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        selectDoctors("more")
                      }
                    >
                      More
                    </button>

                  </div>

                  {showCustomDoctors && (

                    <input
                      className="custom-doctor-input"
                      type="number"
                      min="1"
                      placeholder="Enter number of doctors"
                      value={customDoctors}
                      onChange={(e) =>
                        setCustomDoctors(
                          e.target.value
                        )
                      }
                    />

                  )}

                </div>

                {/* PASSWORD */}

                <div className="auth-grid">

                  <label>
                    Password <em>*</em>

                    <div className="auth-password">

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={form.password}
                        onChange={(e) =>
                          update(
                            "password",
                            e.target.value
                          )
                        }
                        placeholder="At least 8 characters"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev
                          )
                        }
                      >
                        {showPassword
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>
                  </label>

                  <label>
                    Confirm password <em>*</em>

                    <div className="auth-password">

                      <input
                        type={
                          showConfirm
                            ? "text"
                            : "password"
                        }
                        value={form.confirmPassword}
                        onChange={(e) =>
                          update(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        placeholder="Repeat password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirm(
                            (prev) => !prev
                          )
                        }
                      >
                        {showConfirm
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>
                  </label>

                </div>

                {/* TERMS */}

                <label className="auth-terms">

                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(e) =>
                      update(
                        "terms",
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    I agree to the{" "}

                    <button type="button">
                      Terms
                    </button>

                    {" "}and{" "}

                    <button type="button">
                      Privacy Policy
                    </button>

                    .
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
                  className="auth-submit"
                  disabled={loading}
                  type="submit"
                >
                  {loading
                    ? "Creating account..."
                    : "Create account →"}
                </button>

              </form>

              <div className="auth-switch">

                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() =>
                    window.location.href =
                    "/signin"
                  }
                >
                  Sign in
                </button>

              </div>

              <div className="auth-security">

                <span>◈ ISO 27001</span>

                <span>♙ DPDP compliant</span>

                <span>▣ Data in India</span>

              </div>

            </div>

          </div>

        </div>
      </>
    );
  }

  // =====================================================
  // SETUP WIZARD
  // =====================================================

  return (
    <>
      <style>{styles}</style>

      <div className="setup-page">

        {/* HEADER */}

        <div className="setup-header">

          <div>
            <h1>
              Let's set up your clinic CRM
            </h1>

            <p>
              Step {step} of 3 · Complete your setup
            </p>
          </div>

        </div>

        {/* PROGRESS */}

        <div className="setup-progress">

          <div
            className={`progress-step ${step >= 1 ? "active" : ""
              }`}
          >
            <span>1</span>
            Business Details
          </div>

          <div className="progress-line"></div>

          <div
            className={`progress-step ${step >= 2 ? "active" : ""
              }`}
          >
            <span>2</span>
            Choose plan
          </div>

          <div className="progress-line"></div>

          <div
            className={`progress-step ${step >= 3 ? "active" : ""
              }`}
          >
            <span>3</span>
            You're ready
          </div>

        </div>

        {/* ========================= */}
        {/* CLINIC DETAILS */}
        {/* ========================= */}

        {step === 1 && (

          <div className="setup-content">

            <div className="setup-card">

              <div className="setup-card-title">

                <div className="setup-icon">
                  ▦
                </div>

                <div>
                  <h2>
                    Business Details
                  </h2>

                  <p>
                    Add your business address, tax and
                    branding details.
                  </p>
                </div>

              </div>

              <div className="setup-grid">

                <label>
                  Clinic name

                  <input
                    value={form.clinicName}
                    readOnly
                  />
                </label>

                <label>
                  Display name on invoices

                  <input
                    value={
                      clinicDetails.displayName ||
                      form.name
                    }
                    onChange={(e) =>
                      updateClinic(
                        "displayName",
                        e.target.value
                      )
                    }
                  />
                </label>

              </div>

              <label>
                Address <em>*</em>

                <textarea
                  placeholder="Enter complete clinic address"
                  value={clinicDetails.address}
                  onChange={(e) =>
                    updateClinic(
                      "address",
                      e.target.value
                    )
                  }
                />
              </label>

              <div className="setup-grid">

                <label>
                  Tax number / GSTIN

                  <input
                    placeholder="Enter GSTIN or tax number"
                    value={clinicDetails.gstin}
                    onChange={(e) =>
                      updateClinic(
                        "gstin",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  ZIP Code

                  <input
                    placeholder="Enter ZIP code"
                    value={clinicDetails.zipCode}
                    onChange={(e) =>
                      updateClinic(
                        "zipCode",
                        e.target.value
                      )
                    }
                  />
                </label>

              </div>

              <label>
                Website link

                <input
                  placeholder="https://yourclinic.com"
                  value={clinicDetails.website}
                  onChange={(e) =>
                    updateClinic(
                      "website",
                      e.target.value
                    )
                  }
                />
              </label>

              {/* LOGO */}

              <div className="logo-upload-section">

                <label>
                  Clinic logo
                </label>

                <div className="logo-upload-box">

                  {logoPreview ? (

                    <img
                      src={logoPreview}
                      alt="Clinic logo"
                    />

                  ) : (

                    <div className="logo-placeholder">
                      ↑
                    </div>

                  )}

                  <div className="logo-text">

                    <b>
                      Upload clinic logo
                    </b>

                    <span>
                      PNG, JPG or WEBP supported
                    </span>

                  </div>

                  <label className="upload-btn">

                    Choose file

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                    />

                  </label>

                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="setup-actions">

              <button
                className="back-btn"
                onClick={() => { if (window.history.length > 1) window.history.back(); else { window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); } }}
              >
                ← Back
              </button>

              <button
                className="continue-btn"
                onClick={continueClinicDetails}
              >
                Continue →
              </button>

            </div>

          </div>

        )}

        {/* ========================= */}
        {/* CHOOSE PLAN */}
        {/* ========================= */}

        {step === 2 && (

          <div className="plan-page">

            <div className="plan-heading">

              <h2>
                Choose your plan
              </h2>

              <p>
                Pick the plan that works best for your clinic.
              </p>

            </div>

            <div className="plans-grid">

              <PlanCard
                title="Starter"
                price={formatPlanPrice(PLANS.starter, currency)}
                description="For small clinics and teams getting started with CRM."
                selected={
                  selectedPlan === "Starter"
                }
                onClick={() => { setSelectedPlan("Starter"); localStorage.setItem("selectedPlan", JSON.stringify({ ...PLANS.starter, currency, price: currency === "INR" ? PLANS.starter.inr : PLANS.starter.usd, monthly: currency === "INR" ? PLANS.starter.inr : PLANS.starter.usd })); }}
                features={[
                  "1,000 content pieces",
                  "1 team member",
                  "Lead & contact management",
                  "Sales pipeline",
                  "Follow-up management",
                  "Website lead capture",
                  "Basic reports",
                  "500 chatbot conversations per month",
                ]}
              />

              <PlanCard
                title="Growth"
                price={formatPlanPrice(PLANS.growth, currency)}
                popular
                description="For growing teams that need more capacity and collaboration."
                selected={
                  selectedPlan === "Growth"
                }
                onClick={() => { setSelectedPlan("Growth"); localStorage.setItem("selectedPlan", JSON.stringify({ ...PLANS.growth, currency, price: currency === "INR" ? PLANS.growth.inr : PLANS.growth.usd, monthly: currency === "INR" ? PLANS.growth.inr : PLANS.growth.usd })); }}
                features={[
                  "2,500 content pieces",
                  "3 team members",
                  "Marketing automation",
                  "Advanced lead management",
                  "Team collaboration",
                  "Social media & lead capture",
                  "Advanced reports",
                  "1,000 chatbot conversations per month",
                ]}
              />

              <PlanCard
                title="Scale"
                price={formatPlanPrice(PLANS.scale, currency)}
                description="For larger teams managing more leads, customers and workflows."
                selected={
                  selectedPlan === "Scale"
                }
                onClick={() => { setSelectedPlan("Scale"); localStorage.setItem("selectedPlan", JSON.stringify({ ...PLANS.scale, currency, price: currency === "INR" ? PLANS.scale.inr : PLANS.scale.usd, monthly: currency === "INR" ? PLANS.scale.inr : PLANS.scale.usd })); }}
                features={[
                  "5,000 content pieces",
                  "5 team members",
                  "Advanced automation",
                  "Custom workflows",
                  "Advanced permissions",
                  "Detailed analytics & reporting",
                  "More powerful integrations",
                  "2,000 chatbot conversations per month",
                ]}
              />

              <PlanCard
                title="Custom"
                price="Custom"
                description="For larger organizations with advanced requirements."
                selected={
                  selectedPlan === "Custom"
                }
                onClick={() =>
                  setSelectedPlan("Custom")
                }
                features={[
                  "Advanced security & access controls",
                  "Custom workflows & configurations",
                  "Dedicated onboarding & support",
                  "Custom integrations",
                  "Priority support",
                ]}
              />

            </div>

            <div className="plan-actions">

              <button
                className="back-btn"
                onClick={() =>
                  setStep(1)
                }
              >
                ← Back
              </button>

              <button
                className="continue-btn"
                onClick={proceedToCart}
              >
                Continue to payment →
              </button>

            </div>

          </div>

        )}

        {/* ========================= */}
        {/* READY */}
        {/* ========================= */}

        {step === 3 && (

          <div className="ready-page">

            <div className="ready-card">

              <div className="ready-small">

                <div className="ready-small-icon">
                  ✓
                </div>

                <div>
                  <b>
                    You're all set
                  </b>

                  <span>
                    Your setup has been completed
                  </span>
                </div>

              </div>

              <div className="ready-main-icon">
                ✓
              </div>

              <h2>
                Your CRM will be live soon
              </h2>

              <p>
                Thank you for completing your setup.
                Our team will review your details and
                connect with you soon to activate your
                Vitals CRM.
              </p>

              <div className="ready-info-grid">

                <div>
                  <span className="ready-info-icon">
                    ✓
                  </span>

                  <div>
                    <b>
                      Setup received
                    </b>

                    <small>
                      Your clinic details have been saved
                    </small>
                  </div>
                </div>

                <div>
                  <span className="ready-info-icon">
                    ☎
                  </span>

                  <div>
                    <b>
                      Our team will connect
                    </b>

                    <small>
                      We'll contact you shortly
                    </small>
                  </div>
                </div>

                <div>
                  <span className="ready-info-icon">
                    ⚙
                  </span>

                  <div>
                    <b>
                      CRM activation
                    </b>

                    <small>
                      Your workspace will be activated soon
                    </small>
                  </div>
                </div>

              </div>

              <button
                className="continue-btn ready-button"
                onClick={() =>
                  window.location.href =
                  "/signin"
                }
              >
                Go to sign in →
              </button>

            </div>

          </div>

        )}

      </div>
    </>
  );
}


// =====================================================
// PLAN CARD
// =====================================================

function PlanCard({
  title,
  price,
  description,
  features,
  selected,
  onClick,
  popular,
}) {
  return (
    <div
      className={`plan-card ${selected ? "selected" : ""
        }`}
      onClick={onClick}
    >

      {popular && (
        <div className="popular-badge">
          MOST POPULAR
        </div>
      )}

      <div className="plan-icon">
        {title === "Starter" && "♧"}
        {title === "Growth" && "↗"}
        {title === "Scale" && "◈"}
        {title === "Custom" && "▦"}
      </div>

      <h3>{title}</h3>

      <p>
        {description}
      </p>

      <div className="plan-price">

        {price === "Custom" ? (
          <b>
            Let's talk
          </b>
        ) : (
          <>
            <b>{price}</b>
            <span>/month</span>
          </>
        )}

      </div>

      <button
        type="button"
        className="plan-select-btn"
      >
        {title === "Custom"
          ? "Talk to sales"
          : selected
            ? "Selected ✓"
            : "Select plan"}
      </button>

      <div className="plan-divider"></div>

      <div className="plan-includes">
        INCLUDES
      </div>

      <ul>

        {features.map((feature) => (

          <li key={feature}>
            <span>✓</span>
            {feature}
          </li>

        ))}

      </ul>

    </div>
  );
}


// =====================================================
// CSS
// =====================================================

const styles = `

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #1f2d42;
}

button,
input,
select,
textarea {
  font: inherit;
}


/* ===================================== */
/* AUTH PAGE */
/* ===================================== */

.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 50% 50%;
  background: #ffffff;
}

.auth-left {
  position: relative;
  min-height: 100vh;
  overflow: hidden;

  background:
    radial-gradient(
      circle at 85% 25%,
      rgba(80, 125, 230, 0.2),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #1f3f8c,
      #18357a 55%,
      #05769d
    );
}

.auth-left::before {
  content: "";
  position: absolute;
  inset: 0;

  background-image:
    radial-gradient(
      rgba(255,255,255,.13) 1px,
      transparent 1px
    );

  background-size: 22px 22px;
}

.auth-orb {
  position: absolute;

  width: 520px;
  height: 520px;

  top: 60px;
  right: -180px;

  border-radius: 50%;

  border:
    1px solid
    rgba(255,255,255,.08);
}

.auth-left-inner {
  position: relative;
  z-index: 2;

  height: 100%;

  padding:
    0 58px;

  display: flex;
  flex-direction: column;
  justify-content: center;

  color: #ffffff;
}

.auth-eyebrow {
  font-size: 12px;
  letter-spacing: 1.8px;
  font-weight: 700;

  color:
    rgba(255,255,255,.72);

  margin-bottom: 26px;
}

.auth-left h2 {
  font-size: 35px;
  line-height: 1.02;

  margin: 0;

  letter-spacing: -2px;

  font-weight: 700;
}

.auth-left p {
  max-width: 580px;

  margin:
    22px 0 28px;

  color:
    rgba(255,255,255,.75);

  font-size: 16px;

  line-height: 1.65;
}

.auth-benefits {
  display: flex;
  flex-direction: column;

  gap: 16px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;

  gap: 12px;
}

.benefit-item > span {
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  color: #86efac;

  background:
    rgba(255,255,255,.09);
}

.benefit-item b {
  display: block;

  font-size: 14px;

  margin-bottom: 3px;
}

.benefit-item small {
  display: block;

  color:
    rgba(255,255,255,.68);

  font-size: 12px;
}


/* ===================================== */
/* RIGHT SIDE */
/* ===================================== */

.auth-right {
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  padding:
    40px 60px;

  background:
    linear-gradient(
      180deg,
      #ffffff,
      #f8fafc
    );
}

.auth-card {
  width: 100%;
  max-width: 670px;
}

.auth-top {
  margin-bottom: 28px;
}

.auth-top h1 {
  margin: 0;

  text-align: center;

  font-size: 30px;

  color: #1e2d43;

  letter-spacing: -1px;
}

.auth-form {
  display: flex;
  flex-direction: column;

  gap: 18px;
}

.auth-form label,
.setup-card label {
  display: block;
  flex-direction: column;

  gap: 8px;

  font-size: 13px;

  color: #3d4b5f;

  font-weight: 600;

  letter-spacing: .2px;
}

/* RED STAR SAME LINE */

.auth-form label em,
.setup-card label em,
.doctor-label em {
  display: inline;

  font-style: normal;

  color: #dc2626;

  margin-left: 4px;
}

.auth-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 14px;
}

.auth-form input,
.auth-form select,
.setup-card input,
.setup-card select,
.setup-card textarea {
  width: 100%;

  border:
    1px solid #d3dbe6;

  background: #ffffff;

  border-radius: 12px;

  min-height: 46px;

  padding:
    0 14px;

  color: #26364a;

  outline: none;

  transition: .2s;
}

.auth-form textarea,
.setup-card textarea {
  min-height: 92px;

  padding-top: 13px;

  resize: vertical;
}

.auth-form input:focus,
.auth-form select:focus,
.setup-card input:focus,
.setup-card textarea:focus {
  border-color: #3567bb;

  box-shadow:
    0 0 0 3px
    rgba(53,103,187,.10);
}

.auth-password {
  position: relative;
}

.auth-password input {
  padding-right: 60px;
}

.auth-password button {
  position: absolute;

  top: 50%;
  right: 12px;

  transform:
    translateY(-50%);

  border: 0;

  background: transparent;

  color: #315ca7;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;
}


/* ===================================== */
/* DOCTORS */
/* ===================================== */

.doctor-section {
  display: flex;
  flex-direction: column;

  gap: 12px;
}

.doctor-label {
  font-size: 13px;

  font-weight: 600;

  color: #3d4b5f;
}

.doctor-options {
  display: flex;
  flex-wrap: wrap;

  gap: 10px;
}

.doctor-options button {
  min-width: 58px;
  height: 40px;

  border-radius: 22px;

  border:
    1px solid #d3dbe6;

  background: #ffffff;

  color: #526174;

  font-weight: 600;

  cursor: pointer;

  transition: .2s;
  font-size:13px;
}

.doctor-options button.active {
  border-color: #3567bb;

  color: #315ca7;

  background: #edf4ff;

  box-shadow:
    0 3px 10px
    rgba(49,92,167,.12);
}

.custom-doctor-input {
  max-width: 260px;
}


/* ===================================== */
/* TERMS */
/* ===================================== */

.auth-terms {
  display: flex !important;
  flex-direction: row !important;

  align-items: center;

  gap: 9px !important;

  font-size: 13px !important;

  color: #526174 !important;
}

.auth-terms input {
  width: 19px;
  height: 19px;

  min-height: auto;

  accent-color: #315ca7;
}

.auth-terms button {
  padding: 0;

  border: 0;

  background: transparent;

  color: #315ca7;

  font-weight: 700;

  cursor: pointer;
}


/* ===================================== */
/* ERROR */
/* ===================================== */

.auth-error {
  padding: 12px 14px;

  border-radius: 10px;

  color: #b42318;

  background: #fff1f0;

  border:
    1px solid #fecaca;

  font-size: 13px;
}


/* ===================================== */
/* SUBMIT */
/* ===================================== */

.auth-submit,
.continue-btn {
  border: 0;

  min-height: 52px;

  border-radius: 11px;

  color: #ffffff;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;

  background:
    linear-gradient(
      135deg,
      #4477cf,
      #2d5cad
    );

  box-shadow:
    0 8px 20px
    rgba(45,92,173,.20);

  transition: .2s;
}

.auth-submit:hover,
.continue-btn:hover {
  transform:
    translateY(-1px);

  box-shadow:
    0 12px 25px
    rgba(45,92,173,.24);
}

.auth-submit:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;

  margin-top: 26px;

  font-size: 14px;

  color: #66768a;
}

.auth-switch button {
  border: 0;

  background: transparent;

  color: #315ca7;

  font-weight: 700;

  cursor: pointer;
}

.auth-security {
  margin-top: 28px;

  display: flex;
  justify-content: center;
  flex-wrap: wrap;

  gap: 20px;

  color: #8290a3;

  font-size: 12px;
}


/* ===================================== */
/* SETUP */
/* ===================================== */

.setup-page {
  min-height: 100vh;

  padding:
    38px 30px 50px;

  background:
    linear-gradient(
      180deg,
      #f8fbff,
      #eef4fb
    );
}

.setup-header {
  width: 100%;
  max-width: 1100px;

  margin:
    0 auto 28px;
}

.setup-header h1 {
  margin: 0;

  color: #203047;

  font-size: 30px;
}

.setup-header p {
  margin: 8px 0 0;

  color: #69788c;

  font-size: 14px;
}


/* ===================================== */
/* PROGRESS */
/* ===================================== */

.setup-progress {
  width: 100%;
  max-width: 1100px;

  margin:
    0 auto 30px;

  display: flex;
  align-items: center;
}

.progress-step {
  display: flex;
  align-items: center;

  gap: 9px;

  color: #7a899c;

  font-size: 14px;

  white-space: nowrap;
}

.progress-step span {
  width: 30px;
  height: 30px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #edf2f7;

  border:
    1px solid #d8e0ea;
}

.progress-step.active {
  color: #21324a;

  font-weight: 700;
}

.progress-step.active span {
  color: #ffffff;

  background: #3767b6;

  border-color: #3767b6;

  box-shadow:
    0 4px 12px
    rgba(55,103,182,.24);
}

.progress-line {
  height: 1px;

  flex: 1;

  margin: 0 14px;

  background: #d8e0ea;
}


/* ===================================== */
/* SETUP CONTENT */
/* ===================================== */

.setup-content {
  width: 100%;
  max-width: 1100px;

  margin: auto;
}

.setup-card {
  max-width: 850px;

  padding: 26px;

  border-radius: 20px;

  background: #ffffff;

  border:
    1px solid #d9e2ec;

  box-shadow:
    0 15px 35px
    rgba(38,60,90,.08);
}

.setup-card-title {
  display: flex;

  align-items: center;

  gap: 13px;

  margin-bottom: 25px;
}

.setup-icon {
  width: 42px;
  height: 42px;

  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #3567bb;

  background: #edf4ff;

  font-size: 21px;
}

.setup-card-title h2 {
  margin: 0;

  font-size: 20px;
}

.setup-card-title p {
  margin: 4px 0 0;

  font-size: 13px;

  color: #718096;
}

.setup-card {
  display: flex;
  flex-direction: column;

  gap: 18px;
}

.setup-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 16px;
}


/* ===================================== */
/* LOGO */
/* ===================================== */

.logo-upload-section {
  display: flex;
  flex-direction: column;

  gap: 9px;
}

.logo-upload-section > label {
  display: block !important;
}

.logo-upload-box {
  min-height: 100px;

  border-radius: 14px;

  border:
    1px dashed #b8c6d7;

  display: flex;
  align-items: center;

  gap: 16px;

  padding: 16px;

  background: #fbfdff;
}

.logo-upload-box img {
  width: 62px;
  height: 62px;

  border-radius: 12px;

  object-fit: cover;
}

.logo-placeholder {
  width: 50px;
  height: 50px;

  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #3567bb;

  background: #edf4ff;

  font-size: 22px;
}

.logo-text {
  display: flex;
  flex-direction: column;

  gap: 4px;

  flex: 1;
}

.logo-text b {
  font-size: 14px;
}

.logo-text span {
  font-size: 12px;

  color: #7b899b;
}

.upload-btn {
  display: inline-flex !important;

  width: auto !important;

  cursor: pointer;

  padding:
    10px 15px;

  border-radius: 9px;

  border:
    1px solid #d3dce7;

  color: #345b9d !important;

  background: #ffffff;

  font-size: 13px !important;
}

.upload-btn input {
  display: none;
}


/* ===================================== */
/* ACTIONS */
/* ===================================== */

.setup-actions,
.plan-actions {
  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-top: 20px;
}

.back-btn {
  border:
    1px solid #d2dce7;

  background: #ffffff;

  color: #65758a;

  min-height: 46px;

  padding:
    0 20px;

  border-radius: 10px;

  cursor: pointer;

  font-weight: 600;
}

.continue-btn {
  min-width: 150px;

  padding:
    0 24px;
}


/* ===================================== */
/* PLANS */
/* ===================================== */

.plan-page {
  width: 100%;
  max-width: 1180px;

  margin: auto;
}

.plan-heading {
  text-align: center;

  margin-bottom: 30px;
}

.plan-heading h2 {
  margin: 0;

  font-size: 30px;
}

.plan-heading p {
  color: #718096;

  margin-top: 9px;
}

.plans-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 16px;
}

.plan-card {
  position: relative;

  min-height: 520px;

  padding: 26px 20px;

  border-radius: 18px;

  border:
    1px solid #d8e0ea;

  background: #ffffff;

  cursor: pointer;

  transition: .25s;
}

.plan-card:hover {
  transform:
    translateY(-4px);

  box-shadow:
    0 16px 35px
    rgba(40,60,90,.10);
}

.plan-card.selected {
  border:
    2px solid #3767b6;

  box-shadow:
    0 12px 30px
    rgba(55,103,182,.14);
}

.popular-badge {
  position: absolute;

  top: 0;
  left: 0;
  right: 0;

  padding: 8px;

  text-align: center;

  color: #ffffff;

  background:
    linear-gradient(
      90deg,
      #416fca,
      #2f5597
    );

  border-radius:
    17px 17px 0 0;

  font-size: 11px;

  letter-spacing: 1px;

  font-weight: 800;
}

.plan-card:has(.popular-badge) {
  padding-top: 52px;
}

.plan-icon {
  width: 44px;
  height: 44px;

  border-radius: 13px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #3567bb;

  background: #edf4ff;

  font-size: 20px;
}

.plan-card h3 {
  font-size: 23px;

  margin:
    18px 0 8px;
}

.plan-card p {
  min-height: 65px;

  color: #68778b;

  font-size: 14px;

  line-height: 1.6;
}

.plan-price {
  margin:
    18px 0 20px;

  display: flex;
  align-items: baseline;

  gap: 3px;
}

.plan-price b {
  font-size: 30px;
}

.plan-price span {
  color: #68778b;

  font-size: 13px;
}

.plan-select-btn {
  width: 100%;

  height: 46px;

  border-radius: 11px;

  border:
    1px solid #d2dce7;

  background: #ffffff;

  color: #334155;

  font-weight: 700;

  cursor: pointer;
}

.plan-card.selected .plan-select-btn {
  color: #ffffff;

  border-color: #3767b6;

  background:
    linear-gradient(
      135deg,
      #4477cf,
      #2d5cad
    );
}

.plan-divider {
  height: 1px;

  background: #e5ebf1;

  margin: 20px 0;
}

.plan-includes {
  font-size: 11px;

  letter-spacing: 1px;

  font-weight: 800;

  color: #8190a3;
}

.plan-card ul {
  list-style: none;

  padding: 0;

  margin: 15px 0 0;

  display: flex;
  flex-direction: column;

  gap: 12px;
}

.plan-card li {
  display: flex;

  gap: 9px;

  font-size: 13px;

  color: #4c5a6d;

  line-height: 1.45;
}

.plan-card li span {
  color: #2f8c75;

  font-weight: 800;
}


/* ===================================== */
/* READY */
/* ===================================== */

.ready-page {
  max-width: 900px;

  margin: auto;
}

.ready-card {
  padding: 30px;

  text-align: center;

  border-radius: 22px;

  background: #ffffff;

  border:
    1px solid #d8e1eb;

  box-shadow:
    0 18px 40px
    rgba(40,60,90,.09);
}

.ready-small {
  display: flex;

  align-items: center;

  gap: 11px;

  text-align: left;
}

.ready-small-icon {
  width: 38px;
  height: 38px;

  border-radius: 11px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #3567bb;

  background: #edf4ff;
}

.ready-small b,
.ready-small span {
  display: block;
}

.ready-small span {
  font-size: 12px;

  color: #7b899b;

  margin-top: 3px;
}

.ready-main-icon {
  width: 84px;
  height: 84px;

  margin:
    30px auto 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 25px;

  color: #ffffff;

  font-size: 40px;

  background:
    linear-gradient(
      135deg,
      #35b692,
      #14836e
    );

  box-shadow:
    0 15px 30px
    rgba(30,160,130,.20);
}

.ready-card h2 {
  font-size: 30px;

  margin: 0;
}

.ready-card > p {
  max-width: 580px;

  margin:
    12px auto 28px;

  color: #64748b;

  line-height: 1.65;
}

.ready-info-grid {
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 14px;

  text-align: left;

  margin-bottom: 28px;
}

.ready-info-grid > div {
  padding: 18px;

  border-radius: 14px;

  border:
    1px solid #dce4ed;

  display: flex;

  gap: 11px;
}

.ready-info-icon {
  width: 34px;
  height: 34px;

  flex: none;

  border-radius: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #3567bb;

  background: #edf4ff;
}

.ready-info-grid b,
.ready-info-grid small {
  display: block;
}

.ready-info-grid b {
  font-size: 13px;

  margin-bottom: 5px;
}

.ready-info-grid small {
  color: #718096;

  font-size: 11px;

  line-height: 1.45;
}

.ready-button {
  width: 220px;
}


/* ===================================== */
/* RESPONSIVE */
/* ===================================== */

@media (max-width: 1100px) {

  .plans-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .plan-card {
    min-height: auto;
  }

}

@media (max-width: 850px) {

  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-left {
    min-height: auto;

    padding: 70px 0;
  }

  .auth-left-inner {
    padding:
      0 30px;
  }

  .auth-left h2 {
    font-size: 42px;
  }

  .auth-right {
    padding:
      50px 25px;
  }

  .setup-progress {
    overflow-x: auto;

    padding-bottom: 10px;
  }

  .progress-line {
    min-width: 40px;
  }

  .ready-info-grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 600px) {

  .auth-grid,
  .setup-grid,
  .plans-grid {
    grid-template-columns: 1fr;
  }

  .auth-top h1 {
    font-size: 31px;
  }

  .auth-left h2 {
    font-size: 38px;
  }

  .auth-right {
    padding:
      40px 18px;
  }

  .setup-page {
    padding:
      25px 15px 40px;
  }

  .setup-card {
    padding: 18px;
  }

  .logo-upload-box {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .setup-actions,
  .plan-actions {
    gap: 12px;
  }

  .setup-actions button,
  .plan-actions button {
    flex: 1;
  }

  .ready-card {
    padding: 20px;
  }

}
`;
import { getApiBaseUrl } from "./api";

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    inr: 1489,
    usd: 63,
    description:
      "For small businesses and teams getting started with CRM.",
  },

  growth: {
    id: "growth",
    name: "Growth",
    inr: 2289,
    usd: 93,
    description:
      "For growing teams that need more capacity and collaboration.",
  },

  scale: {
    id: "scale",
    name: "Scale",
    inr: 3189,
    usd: 113,
    description:
      "For larger teams managing more leads, customers and workflows.",
  },

  enterprise: {
    id: "enterprise",
    name: "Custom",
    inr: null,
    usd: null,
    description:
      "For larger organizations with advanced requirements.",
  },
};

export const SUBSCRIPTION_PERIODS = [
  {
    id: "1",
    months: 1,
    discount: 0,
  },
  {
    id: "3",
    months: 3,
    discount: 5,
  },
  {
    id: "6",
    months: 6,
    discount: 7,
  },
  {
    id: "9",
    months: 9,
    discount: 9,
  },
  {
    id: "12",
    months: 12,
    discount: 12,
  },
];

export const getCurrency = (countryCode) => {
  return String(countryCode || "").toUpperCase() === "IN"
    ? "INR"
    : "USD";
};

export const getPlanPrice = (plan, currency) => {
  if (!plan) {
    return null;
  }

  return String(currency || "").toUpperCase() === "INR"
    ? plan.inr
    : plan.usd;
};

export const formatPlanPrice = (plan, currency) => {
  const value = getPlanPrice(plan, currency);

  if (value == null) {
    return "Custom";
  }

  const normalizedCurrency =
    String(currency || "").toUpperCase() === "INR"
      ? "INR"
      : "USD";

  return new Intl.NumberFormat(
    normalizedCurrency === "INR" ? "en-IN" : "en-US",
    {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }
  ).format(value);
};

export const saveSelectedPlan = ({
  planId,
  months = 1,
  currency = "INR",
}) => {
  const plan = PLANS[planId];

  if (!plan) {
    return false;
  }

  const selectedMonths = Number(months);

  const period = SUBSCRIPTION_PERIODS.find(
    (item) => item.months === selectedMonths
  );

  if (!period) {
    return false;
  }

  const selectedPlan = {
    planId: plan.id,
    planName: plan.name,
    months: selectedMonths,
    discount: period.discount,
    currency: String(currency || "INR").toUpperCase(),
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(
    "selectedPlan",
    JSON.stringify(selectedPlan)
  );

  return true;
};

export const getSelectedPlan = () => {
  const defaultPlan = {
    planId: "starter",
    planName: "Starter",
    months: 1,
    discount: 0,
    currency: "INR",
  };

  try {
    const savedPlan = localStorage.getItem("selectedPlan");

    if (!savedPlan) {
      return defaultPlan;
    }

    const selectedPlan = JSON.parse(savedPlan);

    if (
      !selectedPlan ||
      !selectedPlan.planId ||
      !PLANS[selectedPlan.planId]
    ) {
      return defaultPlan;
    }

    const months = Number(selectedPlan.months || 1);

    const period = SUBSCRIPTION_PERIODS.find(
      (item) => item.months === months
    );

    return {
      ...selectedPlan,
      months,
      discount: period
        ? period.discount
        : Number(selectedPlan.discount || 0),
      currency: String(
        selectedPlan.currency || "INR"
      ).toUpperCase(),
    };
  } catch {
    return defaultPlan;
  }
};

export const clearSelectedPlan = () => {
  localStorage.removeItem("selectedPlan");
};

export const calculatePlanAmount = ({
  planId,
  months = 1,
  currency = "INR",
}) => {
  const plan = PLANS[planId];

  if (!plan) {
    return {
      originalAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      discount: 0,
    };
  }

  const monthlyPrice = getPlanPrice(
    plan,
    currency
  );

  if (monthlyPrice == null) {
    return {
      originalAmount: null,
      discountAmount: null,
      finalAmount: null,
      discount: 0,
    };
  }

  const period = SUBSCRIPTION_PERIODS.find(
    (item) => item.months === Number(months)
  );

  const discount = period
    ? period.discount
    : 0;

  const originalAmount =
    monthlyPrice * Number(months);

  const discountAmount = Math.round(
    originalAmount * (discount / 100)
  );

  const finalAmount =
    originalAmount - discountAmount;

  return {
    originalAmount,
    discountAmount,
    finalAmount,
    discount,
  };
};

export const formatAmount = (
  amount,
  currency = "INR"
) => {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "Custom";
  }

  const normalizedCurrency =
    String(currency || "INR").toUpperCase() === "INR"
      ? "INR"
      : "USD";

  return new Intl.NumberFormat(
    normalizedCurrency === "INR"
      ? "en-IN"
      : "en-US",
    {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
};

export const detectVisitorCountry = async () => {
  try {
    const api = getApiBaseUrl();

    const res = await fetch(
      `${api}/api/location`,
      {
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();

      if (data.countryCode) {
        return String(
          data.countryCode
        )
          .toUpperCase()
          .trim();
      }
    }
  } catch {}

  try {
    const ipRes = await fetch(
      "https://ipapi.co/json/",
      {
        cache: "no-store",
      }
    );

    if (ipRes.ok) {
      const ipData = await ipRes.json();

      if (ipData.country_code) {
        return String(
          ipData.country_code
        )
          .toUpperCase()
          .trim();
      }
    }
  } catch {}

  try {
    const timeZone =
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone;

    if (
      timeZone === "Asia/Kolkata" ||
      timeZone === "Asia/Calcutta"
    ) {
      return "IN";
    }
  } catch {}

  return "US";
};
import {
  getApiBaseUrl
} from "./api";


/* =========================================
   PLANS
========================================= */

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    inr: 1489,
    usd: 63,
    description:
      "For small businesses and teams getting started with CRM."
  },

  growth: {
    id: "growth",
    name: "Growth",
    inr: 2289,
    usd: 93,
    description:
      "For growing teams that need more capacity and collaboration."
  },

  scale: {
    id: "scale",
    name: "Scale",
    inr: 3189,
    usd: 113,
    description:
      "For larger teams managing more leads, customers and workflows."
  },

  enterprise: {
    id: "enterprise",
    name: "Custom",
    inr: null,
    usd: null,
    description:
      "For larger organizations with advanced requirements."
  }
};


/* =========================================
   SUBSCRIPTION PERIODS
========================================= */

export const SUBSCRIPTION_PERIODS = [
  {
    id: "1",
    months: 1,
    discount: 0
  },

  {
    id: "3",
    months: 3,
    discount: 5
  },

  {
    id: "6",
    months: 6,
    discount: 7
  },

  {
    id: "9",
    months: 9,
    discount: 9
  },

  {
    id: "12",
    months: 12,
    discount: 12
  }
];


/* =========================================
   CURRENCY
========================================= */

export const getCurrency = (countryCode) =>
  countryCode === "IN"
    ? "INR"
    : "USD";


/* =========================================
   PLAN PRICE
========================================= */

export const getPlanPrice = (
  plan,
  currency
) => {

  if (!plan) {
    return null;
  }

  return currency === "INR"
    ? plan.inr
    : plan.usd;

};


/* =========================================
   FORMAT PRICE
========================================= */

export const formatPlanPrice = (
  plan,
  currency
) => {

  const value =
    getPlanPrice(
      plan,
      currency
    );

  if (value == null) {
    return "Custom";
  }

  return new Intl.NumberFormat(
    currency === "INR"
      ? "en-IN"
      : "en-US",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }
  ).format(value);

};


/* =========================================
   SAVE SELECTED PLAN

   Example:

   saveSelectedPlan({
     planId: "growth",
     months: 6,
     currency: "INR"
   });
========================================= */

export const saveSelectedPlan = ({
  planId,
  months = 1,
  currency = "INR"
}) => {

  const plan =
    PLANS[planId];

  if (!plan) {
    console.error(
      "Invalid plan:",
      planId
    );

    return false;
  }

  const period =
    SUBSCRIPTION_PERIODS.find(
      (item) =>
        item.months === Number(months)
    );

  const selectedPlan = {

    planId:
      plan.id,

    planName:
      plan.name,

    months:
      Number(months),

    discount:
      period
        ? period.discount
        : 0,

    currency,

    savedAt:
      new Date().toISOString()

  };


  localStorage.setItem(
    "selectedPlan",
    JSON.stringify(
      selectedPlan
    )
  );


  console.log(
    "Selected plan saved:",
    selectedPlan
  );


  return true;

};


/* =========================================
   GET SELECTED PLAN

   Cart automatically uses this.
========================================= */

export const getSelectedPlan = () => {

  try {

    const savedPlan =
      localStorage.getItem(
        "selectedPlan"
      );


    if (!savedPlan) {

      return {

        planId:
          "starter",

        planName:
          "Starter",

        months:
          1,

        discount:
          0,

        currency:
          "INR"

      };

    }


    const selectedPlan =
      JSON.parse(
        savedPlan
      );


    /*
    Validate plan
    */

    if (
      !selectedPlan.planId ||
      !PLANS[
        selectedPlan.planId
      ]
    ) {

      throw new Error(
        "Invalid saved plan"
      );

    }


    return selectedPlan;

  } catch (error) {

    console.error(
      "Selected plan read error:",
      error
    );


    return {

      planId:
        "starter",

      planName:
        "Starter",

      months:
        1,

      discount:
        0,

      currency:
        "INR"

    };

  }

};


/* =========================================
   CLEAR SELECTED PLAN
========================================= */

export const clearSelectedPlan = () => {

  localStorage.removeItem(
    "selectedPlan"
  );

};


/* =========================================
   CALCULATE PLAN AMOUNT
========================================= */

export const calculatePlanAmount = ({
  planId,
  months = 1,
  currency = "INR"
}) => {

  const plan =
    PLANS[planId];


  if (!plan) {

    return {
      originalAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      discount: 0
    };

  }


  const monthlyPrice =
    getPlanPrice(
      plan,
      currency
    );


  if (
    monthlyPrice == null
  ) {

    return {
      originalAmount: null,
      discountAmount: null,
      finalAmount: null,
      discount: 0
    };

  }


  const period =
    SUBSCRIPTION_PERIODS.find(
      (item) =>
        item.months === Number(months)
    );


  const discount =
    period
      ? period.discount
      : 0;


  const originalAmount =
    monthlyPrice *
    Number(months);


  const discountAmount =
    Math.round(
      originalAmount *
      (discount / 100)
    );


  const finalAmount =
    originalAmount -
    discountAmount;


  return {

    originalAmount,

    discountAmount,

    finalAmount,

    discount

  };

};


/* =========================================
   FORMAT AMOUNT
========================================= */

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


  return new Intl.NumberFormat(
    currency === "INR"
      ? "en-IN"
      : "en-US",
    {

      style:
        "currency",

      currency,

      maximumFractionDigits:
        0

    }
  ).format(
    amount
  );

};


/* =========================================
   DETECT VISITOR COUNTRY
========================================= */

export const detectVisitorCountry =
  async () => {

    try {

      const api =
        getApiBaseUrl();


      const res =
        await fetch(
          `${api}/api/location`
        );


      const data =
        await res.json();


      console.log(
        "Location API response:",
        data
      );


      if (
        data.countryCode
      ) {

        return data.countryCode
          .toUpperCase()
          .trim();

      }


      if (
        window.location.hostname ===
          "localhost" ||

        window.location.hostname ===
          "127.0.0.1"
      ) {

        return "IN";

      }


      const timeZone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;


      console.log(
        "Detected timezone:",
        timeZone
      );


      if (

        timeZone ===
          "Asia/Kolkata" ||

        timeZone ===
          "Asia/Calcutta"

      ) {

        return "IN";

      }


      return "US";

    } catch (
      error
    ) {

      console.log(
        "Country detection error:",
        error
      );


      const timeZone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;


      console.log(
        "Detected timezone fallback:",
        timeZone
      );


      if (

        window.location.hostname ===
          "localhost" ||

        window.location.hostname ===
          "127.0.0.1" ||

        timeZone ===
          "Asia/Kolkata" ||

        timeZone ===
          "Asia/Calcutta"

      ) {

        return "IN";

      }


      return "US";

    }

  };
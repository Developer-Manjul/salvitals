export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    inr: 10,
    usd: 63,
    description: 'For small businesses and teams getting started with CRM.'
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    inr: 1859,
    usd: 93,
    description: 'For growing teams that need more capacity and collaboration.'
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    inr: 2659,
    usd: 113,
    description: 'For larger teams managing more leads, customers and workflows.'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Custom',
    inr: null,
    usd: null,
    description: 'For larger organizations with advanced requirements.'
  }
};
export const getCurrency = (countryCode) => countryCode === 'IN' ? 'INR' : 'USD';
export const getPlanPrice = (plan, currency) => currency === 'INR' ? plan.inr : plan.usd;
export const formatPlanPrice = (plan, currency) => {
  const value = getPlanPrice(plan, currency);
  if (value == null) return 'Custom';
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
};
import {
  getApiBaseUrl
} from './api';

export const detectVisitorCountry = async () => {

  try {

    const api = getApiBaseUrl();

    const res = await fetch(
      `${api}/api/location`
    );

    const data = await res.json();

    console.log(
      "Location API response:",
      data
    );

    if (data.countryCode) {

      return data.countryCode
        .toUpperCase()
        .trim();

    }


    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {

      return "IN";

    }


    const timeZone =
      Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone;


    if (timeZone === "Asia/Kolkata") {

      return "IN";

    }


    return "US";

  } catch (error) {

    console.log(
      "Country detection error:",
      error
    );


    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {

      return "IN";

    }


    const timeZone =
      Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone;


    if (timeZone === "Asia/Kolkata") {

      return "IN";

    }


    return "US";

  }

};
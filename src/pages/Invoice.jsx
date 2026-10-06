import { useEffect, useMemo, useRef, useState } from "react";

import { getApiBaseUrl } from "../config/api";

import "../styles/Invoice.scss";



const API_BASE = getApiBaseUrl();

const COUNTRY_CURRENCY_MAP = {
  IN: { currency: "INR", locale: "en-IN" },
  US: { currency: "USD", locale: "en-US" },
  CA: { currency: "CAD", locale: "en-CA" },
  GB: { currency: "GBP", locale: "en-GB" },
  AU: { currency: "AUD", locale: "en-AU" },
  NZ: { currency: "NZD", locale: "en-NZ" },
  AE: { currency: "AED", locale: "en-AE" },
  SA: { currency: "SAR", locale: "en-SA" },
  SG: { currency: "SGD", locale: "en-SG" },
  MY: { currency: "MYR", locale: "en-MY" },
  DE: { currency: "EUR", locale: "de-DE" },
  FR: { currency: "EUR", locale: "fr-FR" },
  IT: { currency: "EUR", locale: "it-IT" },
  ES: { currency: "EUR", locale: "es-ES" },
  NL: { currency: "EUR", locale: "nl-NL" },
  IE: { currency: "EUR", locale: "en-IE" },
  JP: { currency: "JPY", locale: "ja-JP" },
  CN: { currency: "CNY", locale: "zh-CN" },
  HK: { currency: "HKD", locale: "en-HK" },
  ZA: { currency: "ZAR", locale: "en-ZA" },
  CH: { currency: "CHF", locale: "de-CH" },
};

const COUNTRY_CODE_ALIASES = {
  INDIA: "IN",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
  USA: "US",
  CANADA: "CA",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  AUSTRALIA: "AU",
  "NEW ZEALAND": "NZ",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
  SINGAPORE: "SG",
  MALAYSIA: "MY",
  GERMANY: "DE",
  FRANCE: "FR",
  ITALY: "IT",
  SPAIN: "ES",
  NETHERLANDS: "NL",
  IRELAND: "IE",
  JAPAN: "JP",
  CHINA: "CN",
  "HONG KONG": "HK",
  "SOUTH AFRICA": "ZA",
  SWITZERLAND: "CH",
};

const normalizeCountryCode = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    value =
      value.code ||
      value.countryCode ||
      value.isoCode ||
      value.iso2 ||
      value.name ||
      "";
  }

  const normalized = String(value).trim().toUpperCase();

  if (COUNTRY_CURRENCY_MAP[normalized]) return normalized;

  return COUNTRY_CODE_ALIASES[normalized] || "";
};

const normalizeCurrencyCode = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    value =
      value.code ||
      value.currencyCode ||
      value.isoCode ||
      value.name ||
      "";
  }

  const normalized = String(value).trim().toUpperCase();

  return /^[A-Z]{3}$/.test(normalized) ? normalized : "";
};



const getToken = () => {

  return (

    sessionStorage.getItem("token") ||

    sessionStorage.getItem("vitalsToken") ||

    sessionStorage.getItem("salevitals_token") ||

    localStorage.getItem("token") ||

    localStorage.getItem("vitalsToken") ||

    localStorage.getItem("salevitals_token") ||

    ""

  );

};



const api = async (url, options = {}) => {

  const token = getToken();



  const response = await fetch(`${API_BASE}${url}`, {

    ...options,

    headers: {

      "Content-Type": "application/json",

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...(options.headers || {}),

    },

  });



  const data = await response.json().catch(() => ({}));



  if (!response.ok) {

    throw new Error(data.message || "Something went wrong");

  }



  return data;

};



const today = () => {

  const date = new Date();

  return date.toISOString().split("T")[0];

};



const createInvoiceNumber = (businessName = "SaleVitals", existingInvoices = []) => {

  const year = new Date().getFullYear();

  const code = String(businessName || "SaleVitals")

    .replace(/[^a-zA-Z]/g, "")

    .slice(0, 2)

    .toUpperCase()

    .padEnd(2, "X");



  const prefix = `INV/${year}/${code}`;

  let maxSequence = 0;



  existingInvoices.forEach((item) => {

    const number = String(item?.invoiceNumber || "");

    const match = number.match(

      new RegExp(`^INV/${year}/${code}(\\\d{3,})$`, "i")

    );



    if (match) {

      maxSequence = Math.max(maxSequence, Number(match[1]) || 0);

    }

  });



  return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;

};



const emptyItem = () => ({

  id: Date.now() + Math.random(),

  serviceId: "",

  serviceName: "",

  cost: "",

  gst: 18,

});



const calculateItem = (item) => {

  const cost = Number(item.cost) || 0;

  const gst = Number(item.gst) || 0;

  const gstAmount = cost - cost / (1 + gst / 100);

  const baseAmount = cost - gstAmount;



  return {

    total: cost,

    gstAmount,

    baseAmount,

  };

};



const getProfileValue = (profile, keys) => {

  for (const key of keys) {

    const value = profile?.[key];

    if (value !== null && value !== undefined && String(value).trim()) {

      return String(value).trim();

    }

  }

  return "";

};



export default function Invoice() {

  const [view, setView] = useState("list");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [editingInvoiceId, setEditingInvoiceId] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [invoices, setInvoices] = useState([]);

  const [services, setServices] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [profile, setProfile] = useState(null);

  const [billingProfile, setBillingProfile] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [showPreview, setShowPreview] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");

  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const [serviceSearchOpen, setServiceSearchOpen] = useState("");

  const [addingCustomer, setAddingCustomer] = useState(false);

  const pdfExportRef = useRef(null);



  const [invoice, setInvoice] = useState({

    invoiceNumber: createInvoiceNumber("SaleVitals", []),

    invoiceDate: today(),

    countryCode: "",

    currencyCode: "",

    currencySymbol: "",

    taxType: "GST",

    customerId: "",

    patientId: "",

    customerName: "",

    customerEmail: "",

    customerPhone: "",

    customerAddress: "",

    paymentMode: "",

    notes: "",

    items: [emptyItem()],

  });



  useEffect(() => {

    loadProfile();

    loadInvoices();

    loadServices();

    loadCustomers();

  }, []);



  useEffect(() => {

    const handleKeyDown = (event) => {

      if (event.key === "Escape") {

        setShowPreview(false);

      }

    };



    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);

  }, []);





  const loadProfile = async () => {

    try {

      const data = await api("/api/auth/profile");

      if (data.success) {

        setProfile(data.user);

        if (data.workspaceOwnerProfile) {

          setBillingProfile(data.workspaceOwnerProfile);

        }

      }

    } catch (error) {

      console.error("Profile load error:", error);

    }

  };



 const loadInvoices = async () => {
  try {
    setLoading(true);

    const data = await api("/api/invoices");

    let invoiceList = Array.isArray(data.invoices)
      ? data.invoices
      : [];

    // Get workspace owner's billing profile directly.
    // Never take billing profile from an old invoice.
    let ownerProfile = billingProfile || profile || null;

    try {
      const profileData = await api("/api/auth/profile");

      if (profileData?.success) {
        if (profileData.workspaceOwnerProfile) {
          ownerProfile = profileData.workspaceOwnerProfile;
          setBillingProfile(profileData.workspaceOwnerProfile);
        } else if (profileData.user) {
          ownerProfile = profileData.user;

          if (!profileData.user.workspaceOwner) {
            setBillingProfile(profileData.user);
          }
        }

        if (profileData.user) {
          setProfile(profileData.user);
        }
      }
    } catch (profileError) {
      console.error("Invoice owner profile load error:", profileError);
    }

    const ownerCountry = normalizeCountryCode(
      ownerProfile?.countryCode ||
      ownerProfile?.country_code ||
      ownerProfile?.country ||
      ownerProfile?.billingCountry ||
      ownerProfile?.billingCountryCode
    );

    const ownerCurrency = normalizeCurrencyCode(
      ownerProfile?.currencyCode ||
      ownerProfile?.currency_code ||
      ownerProfile?.currency ||
      ownerProfile?.billingCurrency ||
      ownerProfile?.billingCurrencyCode
    );

    const finalCountry =
      ownerCountry ||
      (ownerCurrency === "INR" ? "IN" : "");

    const finalCurrency =
      finalCountry === "IN"
        ? "INR"
        : ownerCurrency ||
          COUNTRY_CURRENCY_MAP[finalCountry]?.currency ||
          "USD";

    // Normalize every invoice for the current workspace.
    invoiceList = invoiceList.map((item) => {
      const itemCountry = normalizeCountryCode(
        item.countryCode ||
        item.billedBy?.countryCode
      );

      const itemTaxLabel = String(
        item.taxLabel ||
        item.billedBy?.taxLabel ||
        ""
      ).toUpperCase();

      const isIndia =
        finalCountry === "IN" ||
        itemCountry === "IN" ||
        itemTaxLabel === "GST";

      return {
        ...item,

        countryCode: isIndia
          ? "IN"
          : itemCountry || finalCountry,

        currencyCode: isIndia
          ? "INR"
          : item.currencyCode ||
            finalCurrency,

        currencySymbol: isIndia
          ? "₹"
          : item.currencySymbol || "",

        taxLabel: isIndia
          ? "GST"
          : item.taxLabel || "Tax",

        billedBy: {
          ...(item.billedBy || {}),
          ...(ownerProfile || {}),
          countryCode: isIndia
            ? "IN"
            : item.billedBy?.countryCode || finalCountry,
          currencyCode: isIndia
            ? "INR"
            : item.billedBy?.currencyCode || finalCurrency,
          currencySymbol: isIndia
            ? "₹"
            : item.billedBy?.currencySymbol || "",
          taxLabel: isIndia
            ? "GST"
            : item.billedBy?.taxLabel || "Tax",
        },
      };
    });

    setInvoices(invoiceList);
  } catch (error) {
    console.error("Invoice load error:", error);
    setInvoices([]);
  } finally {
    setLoading(false);
  }
};



  const loadServices = async () => {

    try {

      const data = await api("/api/services");

      setServices(

        Array.isArray(data.services)

          ? data.services

          : Array.isArray(data.data)

            ? data.data

            : []

      );

    } catch (error) {

      console.error("Services load error:", error);

      setServices([]);

    }

  };



  const loadCustomers = async () => {

    try {

      const data = await api("/api/contacts");

      setCustomers(

        Array.isArray(data.contacts)

          ? data.contacts

          : Array.isArray(data.customers)

            ? data.customers

            : Array.isArray(data.data)

              ? data.data

              : []

      );

    } catch (error) {

      console.error("Customer load error:", error);

      setCustomers([]);

    }

  };



  const filteredInvoices = useMemo(() => {

    const value = search.trim().toLowerCase();



    if (!value) {

      return invoices;

    }



    return invoices.filter(

      (item) =>

        String(item.invoiceNumber || "").toLowerCase().includes(value) ||

        String(item.customerName || "").toLowerCase().includes(value) ||

        String(item.serviceName || "").toLowerCase().includes(value)

    );

  }, [invoices, search]);



  const totals = useMemo(() => {

    let subtotal = 0;

    let gstAmount = 0;

    let grandTotal = 0;



    invoice.items.forEach((item) => {

      const result = calculateItem(item);

      subtotal += result.baseAmount;

      gstAmount += result.gstAmount;

      grandTotal += result.total;

    });



    return { subtotal, gstAmount, grandTotal };

  }, [invoice.items]);



  const getBillingCountryCode = () => {
    const billing = getBillingProfile() || {};

    return normalizeCountryCode(
      billing.countryCode ||
      billing.country_code ||
      billing.country ||
      billing.billingCountry ||
      billing.location?.countryCode ||
      billing.location?.country ||
      (!profile?.workspaceOwner && (profile?.countryCode || profile?.country))
    );
  };

  const getBillingCurrencyCode = () => {
    const billing = getBillingProfile() || {};

    return normalizeCurrencyCode(
      billing.currencyCode ||
      billing.currency_code ||
      billing.currency ||
      billing.billingCurrency ||
      (!profile?.workspaceOwner && (profile?.currencyCode || profile?.currency))
    );
  };

  const getInvoiceCountryCode = () =>
    normalizeCountryCode(invoice.countryCode) ||
    getBillingCountryCode() ||
    (getBillingCurrencyCode() === "INR" ? "IN" : "") ||
    (!getBillingCurrencyCode() ? "IN" : "");

  const getInvoiceCurrencyCode = () => {
    const countryCode = getInvoiceCountryCode();

    // India invoices always use INR/₹.
    if (countryCode === "IN") {
      return "INR";
    }

    const savedCurrency = normalizeCurrencyCode(invoice.currencyCode);

    if (savedCurrency) return savedCurrency;

    const profileCurrency = getBillingCurrencyCode();

    if (profileCurrency) return profileCurrency;

    return COUNTRY_CURRENCY_MAP[countryCode]?.currency || "INR";
  };

  const getInvoiceLocale = () => {
    const countryCode = getInvoiceCountryCode();
    const currencyCode = getInvoiceCurrencyCode();

    return (
      COUNTRY_CURRENCY_MAP[countryCode]?.locale ||
      (currencyCode === "INR" ? "en-IN" : "en-US")
    );
  };

  const getInvoiceCurrencySymbol = () => {
    if (invoice.currencySymbol) return invoice.currencySymbol;

    try {
      const parts = new Intl.NumberFormat(getInvoiceLocale(), {
        style: "currency",
        currency: getInvoiceCurrencyCode(),
        maximumFractionDigits: 2,
      }).formatToParts(0);

      return (
        parts.find((part) => part.type === "currency")?.value ||
        getInvoiceCurrencyCode()
      );
    } catch {
      return getInvoiceCurrencyCode();
    }
  };

  const isIndiaInvoice = () => getInvoiceCountryCode() === "IN";

  const getTaxLabel = () => (isIndiaInvoice() ? "GST" : "Tax");

  const formatCurrency = (value, currencyCodeOverride = "") => {
    const currencyCode =
      normalizeCurrencyCode(currencyCodeOverride) || getInvoiceCurrencyCode();

    const countryCode = getInvoiceCountryCode();

    const locale =
      COUNTRY_CURRENCY_MAP[countryCode]?.locale ||
      (currencyCode === "INR" ? "en-IN" : "en-US");

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
      }).format(Number(value) || 0);
    } catch {
      return `${currencyCode} ${(Number(value) || 0).toFixed(2)}`;
    }
  };

  const formatDate = (value) => {

    if (!value) return "-";



    const date = new Date(value);



    if (Number.isNaN(date.getTime())) {

      return value;

    }



    return date.toLocaleDateString("en-IN", {

      day: "2-digit",

      month: "short",

      year: "numeric",

    });

  };



  const getBillingProfile = () => {

    const isTeamMember = Boolean(profile?.workspaceOwner);

    if (billingProfile) return billingProfile;

    if (!isTeamMember) return profile || {};

    return {};

  };



  const getBusinessName = () =>

    getProfileValue(getBillingProfile(), ["displayName", "clinicName", "businessName", "name"]) ||

    "SaleVitals";



  const getBusinessOwner = () =>

    getProfileValue(getBillingProfile(), ["name", "ownerName", "doctorName"]);



  const getBusinessAddress = () =>

    getProfileValue(getBillingProfile(), ["address", "clinicAddress", "businessAddress"]);



  const getBusinessPhone = () =>

    getProfileValue(getBillingProfile(), ["phone", "mobile", "contactNumber"]);



  const getBusinessEmail = () =>

    getProfileValue(getBillingProfile(), ["email", "businessEmail"]);



  const getBusinessGstin = () =>

    getProfileValue(getBillingProfile(), ["gstin", "gstNumber", "gstNo"]);



  const getBusinessPan = () =>

    getProfileValue(getBillingProfile(), ["pan", "panNumber", "pan_number"]);



  const getBusinessLogo = () =>

    getProfileValue(getBillingProfile(), ["clinicLogo", "logo", "businessLogo", "profileImage"]);



  const openCreateInvoice = () => {

    setError("");

    setSuccess("");

    setShowPreview(false);

    setSelectedCustomer(null);

    setCustomerQuery("");

    setCustomerSearchOpen(false);

    setServiceSearchOpen("");

    setEditingInvoiceId("");



    setInvoice({

      invoiceNumber: createInvoiceNumber(getBusinessName(), invoices),

      invoiceDate: today(),
      countryCode: getBillingCountryCode(),

      currencyCode:
        getBillingCurrencyCode() ||
        COUNTRY_CURRENCY_MAP[getBillingCountryCode()]?.currency ||
        "USD",

      currencySymbol: "",

      taxType: getBillingCountryCode() === "IN" ? "GST" : "Tax",

      customerId: "",

      patientId: "",

      customerName: "",

      customerEmail: "",

      customerPhone: "",

      customerAddress: "",

      paymentMode: "",

      notes: "",

      items: [emptyItem()],

    });



    setView("create");

  };



  const handleCustomerChange = (customerId) => {

    const customer = customers.find(

      (item) =>

        String(item._id || item.id) === String(customerId)

    );



    setSelectedCustomer(customer || null);



    setInvoice((prev) => ({

      ...prev,

      customerId: customerId || "",

      patientId:

        invoices.find((invoiceItem) => String(invoiceItem.customerId) === String(customerId))?.patientId || "",

      customerName:

        customer?.name ||

        customer?.fullName ||

        customer?.patientName ||

        "",

      customerEmail: customer?.email || "",

      customerPhone: customer?.phone || "",

      customerAddress: customer?.address || "",

    }));

  };



  const handleCustomerInput = (value) => {

    setCustomerQuery(value);

    setCustomerSearchOpen(true);

    setSelectedCustomer(null);

    setInvoice((prev) => ({

      ...prev,

      customerId: "",

      patientId: "",

      customerName: value,

    }));

  };



  const selectCustomer = (customer) => {

    const customerId = customer?._id || customer?.id || "";

    const customerName =

      customer?.name ||

      customer?.fullName ||

      customer?.patientName ||

      "";



    setSelectedCustomer(customer || null);

    setCustomerQuery(customerName);

    setCustomerSearchOpen(false);



    setInvoice((prev) => ({

      ...prev,

      customerId,

      patientId:

        invoices.find((invoiceItem) => String(invoiceItem.customerId) === String(customerId))?.patientId || "",

      customerName,

      customerEmail: customer?.email || "",

      customerPhone: customer?.phone || "",

      customerAddress: customer?.address || "",

    }));

  };



  const addNewCustomer = async () => {

    const name = customerQuery.trim();



    if (!name) {

      return;

    }



    const existing = customers.find((customer) => {

      const customerName =

        customer?.name ||

        customer?.fullName ||

        customer?.patientName ||

        "";



      return customerName.trim().toLowerCase() === name.toLowerCase();

    });



    if (existing) {

      selectCustomer(existing);

      return;

    }



    try {

      setAddingCustomer(true);

      setError("");



      const data = await api("/api/contacts", {

        method: "POST",

        body: JSON.stringify({

          name,

          email: "",

          phone: "",

          source: "Manual",

          service: "",

          doctor: getBusinessOwner(),

          owner: getBusinessOwner(),

        }),

      });



      const contact =

        data.contact || {

          _id: `local-${Date.now()}`,

          name,

          email: "",

          phone: "",

          source: "Manual",

          service: "",

          doctor: getBusinessOwner(),

          owner: getBusinessOwner(),

        };



      setCustomers((prev) => [

        contact,

        ...prev.filter(

          (item) =>

            String(item?._id || item?.id) !==

            String(contact?._id || contact?.id)

        ),

      ]);



      selectCustomer(contact);

    } catch (error) {

      setError(error.message || "Unable to add customer.");

    } finally {

      setAddingCustomer(false);

    }

  };



  const updateCustomerField = (field, value) => {

    setInvoice((prev) => ({ ...prev, [field]: value }));

    setSelectedCustomer(null);

    if (field === "customerName") {

      setCustomerQuery(value);

      setCustomerSearchOpen(true);

    }

  };



  const updateItem = (itemId, field, value) => {

    setInvoice((prev) => ({

      ...prev,

      items: prev.items.map((item) =>

        item.id === itemId ? { ...item, [field]: value } : item

      ),

    }));

  };



  const selectService = (itemId, serviceId) => {

    const service = services.find(

      (item) => String(item._id || item.id) === String(serviceId)

    );



    if (!service) {

      updateItem(itemId, "serviceId", "");

      return;

    }



    const serviceName =

      service.name || service.title || service.serviceName || "";



    const serviceCost =

      service.cost ?? service.price ?? service.amount ?? "";



    setInvoice((prev) => ({

      ...prev,

      items: prev.items.map((item) =>

        item.id === itemId

          ? {

            ...item,

            serviceId: service._id || service.id || "",

            serviceName,

            cost: serviceCost,

            gst: Number(service.gst) || 18,

          }

          : item

      ),

    }));

  };



  const handleServiceInput = (itemId, value) => {

    updateItem(itemId, "serviceName", value);

    updateItem(itemId, "serviceId", "");

    setServiceSearchOpen(itemId);

  };



  const selectExistingService = (itemId, service) => {

    selectService(itemId, service?._id || service?.id || "");

    setServiceSearchOpen("");

  };



  const addCustomService = (itemId) => {

    setServiceSearchOpen("");

  };



  const addItem = () => {

    setInvoice((prev) => ({

      ...prev,

      items: [...prev.items, emptyItem()],

    }));

  };



  const removeItem = (itemId) => {

    setInvoice((prev) => {

      if (prev.items.length === 1) {

        return prev;

      }



      return {

        ...prev,

        items: prev.items.filter((item) => item.id !== itemId),

      };

    });

  };



  const buildPayload = () => ({

    invoiceNumber: invoice.invoiceNumber,

    invoiceDate: invoice.invoiceDate,

    countryCode: getInvoiceCountryCode(),

    currencyCode: getInvoiceCurrencyCode(),

    currencySymbol: getInvoiceCurrencySymbol(),

    taxType: getTaxLabel(),


    customerId: invoice.customerId,

    patientId: invoice.patientId,

    customerName: invoice.customerName,

    customerEmail: invoice.customerEmail,

    customerPhone: invoice.customerPhone,

    customerAddress: invoice.customerAddress,

    paymentMode: invoice.paymentMode,

    notes: invoice.notes,

    billedBy: getBillingProfile(),

    items: invoice.items.map((item) => {

      const result = calculateItem(item);



      return {

        serviceId: item.serviceId,

        serviceName: item.serviceName,

        quantity: 1,

        cost: Number(item.cost),

        gst: Number(item.gst),

        taxRate: Number(item.gst),

        baseAmount: result.baseAmount,

        gstAmount: result.gstAmount,

        taxAmount: result.gstAmount,

        total: result.total,

      };

    }),

    subtotal: totals.subtotal,

    gstAmount: totals.gstAmount,

    taxAmount: totals.gstAmount,

    total: totals.grandTotal,

    status: "Draft",

  });



  const buildWhatsAppMessage = (invoiceData = invoice) => {

    const businessName = getBusinessName();

    const customerName = invoiceData.customerName || "Customer";

    const invoiceNumber = invoiceData.invoiceNumber || "";

    const invoiceDate = formatDate(invoiceData.invoiceDate);

    const total = invoiceData.total ?? totals.grandTotal;

    const messageCurrency = invoiceData.currencyCode || getInvoiceCurrencyCode();



    return `Hello ${customerName}, 👋\n\nThank you for choosing ${businessName}.\n\nYour invoice ${invoiceNumber} is ready. Please find the invoice PDF attached with this message.\n\nInvoice Date: ${invoiceDate}\nInvoice Amount: ${formatCurrency(total, messageCurrency)}\n\nIf you have any questions regarding the invoice, please reply to this WhatsApp message.\n\nRegards,\n${businessName}`;

  };



  const sendInvoiceToWhatsApp = async (invoiceRecord) => {

    const invoiceId = invoiceRecord?._id || invoiceRecord?.id;



    if (!invoiceId) {

      throw new Error("Invoice ID is missing.");

    }



    if (!invoiceRecord?.customerPhone && !invoice.customerPhone) {

      throw new Error("Customer WhatsApp number is missing.");

    }



    const message = buildWhatsAppMessage({

      ...invoice,

      ...(invoiceRecord || {}),

      total: invoiceRecord?.total ?? totals.grandTotal,

    });



    return api(`/api/invoices/${invoiceId}/send-whatsapp`, {

      method: "POST",

      body: JSON.stringify({

        message,

      }),

    });

  };



  const downloadInvoicePDF = async (invoiceRecord, returnToList = false) => {

    const invoiceId = invoiceRecord?._id || invoiceRecord?.id;



    if (!invoiceId) {

      throw new Error("Invoice ID is missing.");

    }



    try {

      setSaving(true);

      setError("");



      const token = getToken();

      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/download`, {

        method: "GET",

        headers: {

          Accept: "application/pdf",

          ...(token ? { Authorization: `Bearer ${token}` } : {}),

        },

      });



      if (!response.ok) {

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {

          const data = await response.json().catch(() => ({}));

          throw new Error(data.message || "Unable to download invoice PDF.");

        }

        throw new Error("Unable to download invoice PDF.");

      }



      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      const filename = `${String(invoiceRecord.invoiceNumber || "invoice").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;



      link.href = url;

      link.download = filename;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);



      setSuccess("Invoice PDF downloaded.");



      if (returnToList) {

        setShowPreview(false);

        setView("list");

      }

    } catch (error) {

      setError(error.message || "Unable to download invoice PDF.");

      throw error;

    } finally {

      setSaving(false);

    }

  };



  const saveInvoice = async (downloadAfterSave = false) => {

    setError("");

    setSuccess("");



    if (!invoice.customerName.trim()) {

      setError("Please select or enter a customer.");

      return;

    }



    if (!invoice.items.length) {

      setError("Please add at least one service.");

      return;

    }



    const invalidItem = invoice.items.some(

      (item) => !item.serviceName.trim() || Number(item.cost) <= 0

    );



    if (invalidItem) {

      setError("Please complete all service details.");

      return;

    }



    try {

      setSaving(true);



      const data = await api(

        editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : "/api/invoices",

        {

          method: editingInvoiceId ? "PUT" : "POST",

          body: JSON.stringify(buildPayload()),

        }

      );



      if (data.invoice) {

        setEditingInvoiceId(String(data.invoice._id || data.invoice.id || ""));

        setInvoice((prev) => ({ ...prev, patientId: data.invoice.patientId || "" }));

        setInvoices((prev) => editingInvoiceId

          ? prev.map((item) => String(item._id || item.id) === String(editingInvoiceId) ? data.invoice : item)

          : [data.invoice, ...prev]);

      }



      if (downloadAfterSave) {

        await downloadInvoicePDF(data.invoice, true);

        return;

      }



      setSuccess("Invoice saved successfully.");



      setView("list");

      setShowPreview(false);

      await loadInvoices();

    } catch (error) {

      console.error("Save invoice error:", error);

      setError(error.message || "Unable to save invoice.");

    } finally {

      setSaving(false);

    }

  };



  const sendExistingInvoiceToWhatsApp = async (item) => {

    setError("");

    setSuccess("");



    try {

      setSaving(true);

      await sendInvoiceToWhatsApp(item);

      setSuccess("Invoice sent to the customer's WhatsApp as a PDF.");

      await loadInvoices();

    } catch (error) {

      console.error("Existing invoice WhatsApp error:", error);

      setError(error.message || "Unable to send invoice on WhatsApp.");

    } finally {

      setSaving(false);

    }

  };



  const deleteInvoice = async (invoiceId) => {

    if (!window.confirm("Are you sure you want to delete this invoice?")) {

      return;

    }



    try {

      await api(`/api/invoices/${invoiceId}`, {

        method: "DELETE",

      });



      setInvoices((prev) =>

        prev.filter(

          (item) => String(item._id || item.id) !== String(invoiceId)

        )

      );

    } catch (error) {

      console.error("Delete invoice error:", error);

      setError(error.message || "Unable to delete invoice.");

    }

  };



  const editInvoice = (item) => {

    setError("");

    setSuccess("");

    setShowPreview(false);



    setInvoice({

      invoiceNumber: item.invoiceNumber || createInvoiceNumber(getBusinessName(), invoices),

      invoiceDate: item.invoiceDate || today(),
      countryCode: item.countryCode || getBillingCountryCode(),

      currencyCode:
        item.currencyCode ||
        getBillingCurrencyCode() ||
        COUNTRY_CURRENCY_MAP[item.countryCode || getBillingCountryCode()]?.currency ||
        "USD",

      currencySymbol: item.currencySymbol || "",

      taxType:
        item.taxType ||
        (normalizeCountryCode(item.countryCode || getBillingCountryCode()) === "IN" ? "GST" : "Tax"),


      customerId: item.customerId || "",

      patientId: item.patientId || "",

      customerName: item.customerName || "",

      customerEmail: item.customerEmail || "",

      customerPhone: item.customerPhone || "",

      customerAddress: item.customerAddress || "",

      paymentMode: item.paymentMode || "",

      notes: item.notes || "",

      items:

        Array.isArray(item.items) && item.items.length

          ? item.items.map((service) => ({

            id: service._id || Date.now() + Math.random(),

            serviceId: service.serviceId || "",

            serviceName: service.serviceName || service.name || "",

            cost: service.cost || "",

            gst: service.gst || 18,

          }))

          : [emptyItem()],

    });



    setCustomerQuery(item.customerName || "");

    setEditingInvoiceId(String(item._id || item.id || ""));

    setCustomerSearchOpen(false);

    setServiceSearchOpen("");

    setView("create");

  };



  const openPreview = () => {

    setError("");

    setShowPreview(true);

  };



 const printInvoice = async () => {
  const invoiceElement = pdfExportRef.current;

  if (!invoiceElement) {
    setShowPreview(true);

    setTimeout(() => {
      printInvoice();
    }, 500);

    return;
  }

  try {
    const iframe = document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    document.body.appendChild(iframe);

    const printDocument =
      iframe.contentDocument || iframe.contentWindow.document;

    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((node) => {
        if (node.tagName.toLowerCase() === "link") {
          return `<link rel="stylesheet" href="${node.href}">`;
        }

        return node.outerHTML;
      })
      .join("\n");

    const invoiceHtml = invoiceElement.outerHTML;

    printDocument.open();

    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">

          <title>
            ${invoice.invoiceNumber || "Invoice"}
          </title>

          ${styles}

          <style>
            @page {
              size: A4;
              margin: 0;
            }

            html,
            body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .invoice-document {
              display: block !important;
              width: 210mm !important;
              min-height: 297mm !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 14mm !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              visibility: visible !important;
            }

            .invoice-document * {
              visibility: visible !important;
            }

            .invoice-preview-overlay,
            .invoice-preview-modal,
            .invoice-preview-head,
            .invoice-preview-footer,
            .invoice-preview-actions {
              display: none !important;
            }

            table {
              border-collapse: collapse !important;
            }

            img {
              max-width: 100% !important;
            }

            *,
            *::before,
            *::after {
              box-sizing: border-box;
            }
          </style>
        </head>

        <body>
          ${invoiceHtml}
        </body>
      </html>
    `);

    printDocument.close();

    const waitForImages = async () => {
      const images = Array.from(printDocument.images);

      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            image.onload = resolve;
            image.onerror = resolve;
          });
        })
      );
    };

    const waitForFonts = async () => {
      if (printDocument.fonts?.ready) {
        try {
          await printDocument.fonts.ready;
        } catch {
          // ignore font loading error
        }
      }
    };

    await waitForImages();
    await waitForFonts();

    // Give browser time to render the invoice
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    iframe.contentWindow.focus();

    iframe.contentWindow.print();

    // Remove iframe after print dialog is opened
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // iframe already removed
      }
    }, 3000);
  } catch (error) {
    console.error("Print invoice error:", error);
    setError("Unable to print invoice.");
  }
};



  const renderInvoiceDocument = () => {

    const logo = getBusinessLogo();

    const businessName = getBusinessName();

    const businessOwner = getBusinessOwner();

    const businessAddress = getBusinessAddress();

    const businessPhone = getBusinessPhone();

    const businessEmail = getBusinessEmail();

    const businessGstin = getBusinessGstin();

    const businessPan = getBusinessPan();

    const gstRates = [...new Set(invoice.items.map((item) => Number(item.gst) || 0))];

    const taxRates = [...new Set(invoice.items.map((item) => Number(item.gst) || 0))];
    const taxLabel = getTaxLabel();
    const taxHeading =
      taxRates.length === 1
        ? `${taxLabel} (${taxRates[0]}%)`
        : taxLabel;



    return (

      <div className="invoice-document" ref={pdfExportRef}>

        <div className="invoice-document-header">

          <div className="invoice-company">

            <div className="invoice-company-logo">

              {logo ? (

                <img src={logo} alt={businessName} />

              ) : (

                <span>{businessName.charAt(0).toUpperCase()}</span>

              )}

            </div>



            <div className="invoice-company-info">

              <h2>{businessName}</h2>

              {businessOwner && <p className="invoice-owner">{businessOwner}</p>}

              {businessAddress && <p>{businessAddress}</p>}

              {businessPhone && <p>{businessPhone}</p>}

              {businessEmail && <p>{businessEmail}</p>}

              {isIndiaInvoice() && businessGstin && <p>GSTIN: {businessGstin}</p>}

              {businessPan && <p>PAN: {businessPan}</p>}

            </div>

          </div>





        </div>



        <div className="invoice-document-line" />



        <div className="invoice-document-parties">

          <div>

            <span>BILLED TO</span>

            <strong>{invoice.customerName || "—"}</strong>

            {invoice.paymentMode && <p><strong>Payment Mode: {invoice.paymentMode}</strong></p>}

            {invoice.customerPhone && <p>{invoice.customerPhone}</p>}

            {invoice.customerEmail && <p>{invoice.customerEmail}</p>}

            {invoice.customerAddress && <p>{invoice.customerAddress}</p>}

          </div>



          <div>

            <span>INVOICE DETAILS</span>

            <strong>{invoice.invoiceNumber}</strong>

            {invoice.patientId && <p>Patient ID: {invoice.patientId}</p>}

            <p>Invoice date: {formatDate(invoice.invoiceDate)}</p>

          </div>

        </div>



        <div className="invoice-document-table-wrap">

          <table className="invoice-document-table">

            <thead>

              <tr>

                <th>#</th>

                <th>DESCRIPTION OF SERVICE</th>

                <th>RATE</th>

                <th>{taxHeading}</th>

                <th>AMOUNT</th>

              </tr>

            </thead>

            <tbody>

              {invoice.items.map((item, index) => {

                const result = calculateItem(item);



                return (

                  <tr key={item.id}>

                    <td>{index + 1}</td>

                    <td>{item.serviceName || "Service"}</td>

                    <td>{formatCurrency(item.cost)}</td>

                    <td>{formatCurrency(result.gstAmount)}</td>

                    <td>{formatCurrency(result.total)}</td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>



        <div className="invoice-document-bottom">

          <div className="invoice-document-notes">

            {invoice.notes && (

              <>

                <span>NOTES</span>

                <p>{invoice.notes}</p>

              </>

            )}

          </div>



          <div className="invoice-document-total-box">

            <div>

              <span>Subtotal</span>

              <strong>{formatCurrency(totals.subtotal)}</strong>

            </div>

            {totals.gstAmount > 0 && (

              <div>

                <span>{getTaxLabel()}</span>

                <strong>{formatCurrency(totals.gstAmount)}</strong>

              </div>

            )}

            <div className="grand">

              <span>Grand Total</span>

              <strong>{formatCurrency(totals.grandTotal)}</strong>

            </div>

          </div>

        </div>



        <div className="invoice-document-footer">

          <strong>Thank you for your business.</strong>

          <span className="invoice-powered-brand">Powered by <b>SaleVitals</b></span>

        </div>

      </div>

    );

  };



  const renderList = () => (

    <div className="invoice-page">

      <div className="invoice-page-header">

        <div>

          <h1>Invoices</h1>

          <p>Create and manage your customer invoices.</p>

        </div>



        <button

          type="button"

          className="invoice-primary-btn"

          onClick={openCreateInvoice}

        >

          + Create Invoice

        </button>

      </div>



      {error && <div className="invoice-alert error">{error}</div>}

      {success && <div className="invoice-alert success">{success}</div>}



      <div className="invoice-list-card">

        <div className="invoice-list-toolbar">

          <div className="invoice-search">

            <span>⌕</span>

            <input

              type="text"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Search invoice number or customer..."

            />

          </div>



          <div className="invoice-count">

            {filteredInvoices.length} invoices

          </div>

        </div>



        <div className="invoice-table-wrap">

          <table className="invoice-table">

            <thead>

              <tr>

                <th>INVOICE NUMBER</th>

                <th>PATIENT ID</th>

                <th>CUSTOMER</th>

                <th>DATE</th>

                <th>SERVICE</th>

                <th>COST</th>

                <th>PAYMENT MODE</th>

                <th>STATUS</th>

                <th>ACTION</th>

              </tr>

            </thead>



            <tbody>

              {loading ? (

                <tr>

                  <td colSpan="9" className="invoice-empty">Loading invoices...</td>

                </tr>

              ) : filteredInvoices.length === 0 ? (

                <tr>

                  <td colSpan="9" className="invoice-empty">

                    <div className="invoice-empty-icon">₹</div>

                    <strong>No invoices found</strong>

                    <span>Create your first invoice to get started.</span>

                  </td>

                </tr>

              ) : (

                filteredInvoices.map((item) => (

                  <tr key={item._id || item.id}>

                    <td><strong>{item.invoiceNumber}</strong></td>

                    <td><strong>{item.patientId || "-"}</strong></td>

                    <td>

                      <div className="invoice-customer">

                        <div className="invoice-avatar">

                          {(item.customerName || "C").charAt(0).toUpperCase()}

                        </div>

                        <div>

                          <strong>{item.customerName || "-"}</strong>

                          {item.customerPhone && <small>{item.customerPhone}</small>}

                        </div>

                      </div>

                    </td>

                    <td>{formatDate(item.invoiceDate || item.date)}</td>

                    <td>

                      {item.serviceName || item.items?.[0]?.serviceName || "Multiple services"}

                    </td>

                    <td>
<strong>
  {formatCurrency(
    item.total || item.grandTotal || 0,
    String(
      item.taxLabel ||
      item.billedBy?.taxLabel ||
      ""
    ).toUpperCase() === "GST"
      ? "INR"
      : item.currencyCode
  )}
</strong>
                    </td>

                    <td>

                      <span className="invoice-payment-mode">{item.paymentMode || "-"}</span>

                    </td>

                    <td>

                      <span

                        className={`invoice-status ${String(item.status || "Draft")

                          .toLowerCase()

                          .replace(/\s+/g, "-")}`}

                      >

                        {item.status || "Draft"}

                      </span>

                    </td>

                    <td>

                      <div className="invoice-actions">

                        <button type="button" onClick={() => editInvoice(item)}>Edit</button>

                        <button

                          type="button"

                          onClick={() => {

                            downloadInvoicePDF(item, true).catch(() => undefined)

                          }}

                        >

                          Download

                        </button>

                        <button

                          type="button"

                          onClick={() => {

                            setInvoice({

                              invoiceNumber: item.invoiceNumber || createInvoiceNumber(getBusinessName(), invoices),

                              invoiceDate: item.invoiceDate || today(),
                              countryCode: item.countryCode || getBillingCountryCode(),

                              currencyCode:
                                item.currencyCode ||
                                getBillingCurrencyCode() ||
                                COUNTRY_CURRENCY_MAP[item.countryCode || getBillingCountryCode()]?.currency ||
                                "USD",

                              currencySymbol: item.currencySymbol || "",

                              taxType:
                                item.taxType ||
                                (normalizeCountryCode(item.countryCode || getBillingCountryCode()) === "IN" ? "GST" : "Tax"),


                              customerId: item.customerId || "",

                              patientId: item.patientId || "",

                              customerName: item.customerName || "",

                              customerEmail: item.customerEmail || "",

                              customerPhone: item.customerPhone || "",

                              customerAddress: item.customerAddress || "",

                              paymentMode: item.paymentMode || "",

                              notes: item.notes || "",

                              items:

                                Array.isArray(item.items) && item.items.length

                                  ? item.items.map((service) => ({

                                    id: service._id || Date.now() + Math.random(),

                                    serviceId: service.serviceId || "",

                                    serviceName: service.serviceName || service.name || "",

                                    cost: service.cost || "",

                                    gst: service.gst || 18,

                                  }))

                                  : [emptyItem()],

                            });

                            setEditingInvoiceId(String(item._id || item.id || ""));

                            setView("create");

                            setShowPreview(true);

                          }}

                        >

                          Preview

                        </button>

                        <button

                          type="button"

                          onClick={() => sendExistingInvoiceToWhatsApp(item)}

                          disabled={saving}

                        >

                          WhatsApp

                        </button>

                        <button

                          type="button"

                          className="delete"

                          onClick={() => deleteInvoice(item._id || item.id)}

                        >

                          Delete

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );



  const renderCreate = () => (

    <div className="invoice-page">

      <div className="invoice-page-header">

        <div>

          <button

            type="button"

            className="invoice-back-btn"

            onClick={() => setView("list")}

          >

            ← Back to invoices

          </button>

          <h1>{editingInvoiceId ? "Edit Invoice" : "Create Invoice"}</h1>

          <p>Create a {getTaxLabel()} invoice for your customer.</p>

        </div>



        <div className="invoice-header-powered">

          <span className="invoice-powered-dot" />

          <span>Powered by <strong>SaleVitals</strong></span>

        </div>

      </div>



      {error && <div className="invoice-alert error">{error}</div>}

      {success && <div className="invoice-alert success">{success}</div>}



      <div className="invoice-create-layout">

        <div className="invoice-create-main">

          <section className="invoice-card">

            <div className="invoice-card-header">

              <h2>Invoice Details</h2>

              <span className="invoice-draft-badge">Draft</span>

            </div>



            <div className="invoice-form-grid">

              <div className="invoice-field">

                <label>Invoice Number</label>

                <input

                  type="text"

                  value={invoice.invoiceNumber}

                  readOnly

                />

              </div>



              <div className="invoice-field">

                <label>Invoice Date</label>

                <input

                  type="date"

                  value={invoice.invoiceDate}

                  onChange={(e) =>

                    setInvoice((prev) => ({ ...prev, invoiceDate: e.target.value }))

                  }

                />

              </div>

              <div className="invoice-field">

                <label>Patient ID</label>

                <input type="text" value={invoice.patientId || "Assigned when saved"} readOnly />

              </div>

            </div>

          </section>



          <section className="invoice-card">

            <div className="invoice-card-header">

              <h2>Billed By</h2>

            </div>



            <div className="invoice-billed-profile">

              <div className="invoice-business-logo">

                {getBusinessLogo() ? (

                  <img src={getBusinessLogo()} alt={getBusinessName()} />

                ) : (

                  <span>{getBusinessName().charAt(0).toUpperCase()}</span>

                )}

              </div>



              <div>

                <strong>{getBusinessName()}</strong>

                {getBusinessOwner() && <span>{getBusinessOwner()}</span>}

                {getBusinessAddress() && <span>{getBusinessAddress()}</span>}

                {getBusinessPhone() && <span>{getBusinessPhone()}</span>}

                {getBusinessEmail() && <span>{getBusinessEmail()}</span>}

                {isIndiaInvoice() && getBusinessGstin() && <span>GSTIN: {getBusinessGstin()}</span>}

                {getBusinessPan() && <span>PAN: {getBusinessPan()}</span>}

              </div>

            </div>

          </section>



          <section className="invoice-card">

            <div className="invoice-card-header">

              <div>

                <h2>Billed To</h2>

                <p>Select an existing customer or enter customer details.</p>

              </div>

            </div>



            <div className="invoice-form-grid">

              <div className="invoice-field invoice-field-full">

                <label>Customer</label>

                <div

                  className="invoice-search-control"

                  onBlur={() =>

                    setTimeout(() => setCustomerSearchOpen(false), 150)

                  }

                >

                  <input

                    className="invoice-customer-search-input"

                    type="text"

                    value={customerQuery}

                    onFocus={() => setCustomerSearchOpen(true)}

                    onChange={(e) => handleCustomerInput(e.target.value)}

                    placeholder="Search customer by name, phone or email"

                    autoComplete="off"

                  />



                  {customerSearchOpen && (

                    <div className="invoice-search-menu">

                      {(() => {

                        const query = customerQuery.trim().toLowerCase();



                        const matches = customers

                          .filter((customer) => {

                            const name =

                              customer?.name ||

                              customer?.fullName ||

                              customer?.patientName ||

                              "";

                            const phone = customer?.phone || "";

                            const email = customer?.email || "";



                            return (

                              !query ||

                              String(name).toLowerCase().includes(query) ||

                              String(phone).toLowerCase().includes(query) ||

                              String(email).toLowerCase().includes(query)

                            );

                          })

                          .slice(0, 8);



                        return (

                          <>

                            {matches.map((customer) => {

                              const name =

                                customer?.name ||

                                customer?.fullName ||

                                customer?.patientName ||

                                "Unnamed customer";



                              return (

                                <button

                                  type="button"

                                  className="invoice-search-option"

                                  key={customer._id || customer.id}

                                  onMouseDown={(e) => e.preventDefault()}

                                  onClick={() => selectCustomer(customer)}

                                >

                                  <div className="invoice-search-option-content">

                                    <strong>{name}</strong>

                                    <span>

                                      {customer.phone || customer.email || "Customer"}

                                    </span>

                                  </div>

                                </button>

                              );

                            })}



                            {query && !matches.some((customer) => {

                              const name =

                                customer?.name ||

                                customer?.fullName ||

                                customer?.patientName ||

                                "";

                              return name.trim().toLowerCase() === query;

                            }) && (

                                <button

                                  type="button"

                                  className="invoice-search-add"

                                  disabled={addingCustomer}

                                  onMouseDown={(e) => e.preventDefault()}

                                  onClick={addNewCustomer}

                                >

                                  <span className="invoice-search-add-icon">+</span>

                                  <div className="invoice-search-add-content">

                                    <strong>

                                      {addingCustomer

                                        ? "Adding customer..."

                                        : `Add "${customerQuery.trim()}"`}

                                    </strong>

                                    <small>Save as a new customer</small>

                                  </div>

                                </button>

                              )}



                            {!matches.length && !query && (

                              <div className="invoice-search-empty">

                                Search for a customer by name, phone or email.

                              </div>

                            )}

                          </>

                        );

                      })()}

                    </div>

                  )}

                </div>

              </div>



              <div className="invoice-field">

                <label>Payment Mode</label>

                <select

                  value={invoice.paymentMode}

                  onChange={(e) => setInvoice((prev) => ({ ...prev, paymentMode: e.target.value }))}

                >

                  <option value="">Select payment mode</option>

                  <option value="Credit Card">Credit Card</option>

                  <option value="Debit Card">Debit Card</option>

                  <option value="Cash">Cash</option>

                  <option value="UPI">UPI</option>

                  <option value="Bank Transfer">Bank Transfer</option>

                </select>

              </div>



              <div className="invoice-field">

                <label>Phone Number</label>

                <input

                  type="text"

                  value={invoice.customerPhone}

                  onChange={(e) => updateCustomerField("customerPhone", e.target.value)}

                  placeholder="Enter phone number"

                />

              </div>



              <div className="invoice-field">

                <label>Email</label>

                <input

                  type="email"

                  value={invoice.customerEmail}

                  onChange={(e) => updateCustomerField("customerEmail", e.target.value)}

                  placeholder="Enter email"

                />

              </div>



              <div className="invoice-field invoice-field-full">

                <label>Address</label>

                <input

                  type="text"

                  value={invoice.customerAddress}

                  onChange={(e) => updateCustomerField("customerAddress", e.target.value)}

                  placeholder="Enter address"

                />

              </div>

            </div>

          </section>



          <section className="invoice-card">

            <div className="invoice-card-header">

              <div>

                <h2>Services & Items</h2>

                <p>{getTaxLabel()} is included in the entered cost.</p>

              </div>

              <button

                type="button"

                className="invoice-add-item-btn"

                onClick={addItem}

              >

                + Add item

              </button>

            </div>



            <div className="invoice-items invoice-items-no-qty">

              <div className="invoice-item-head">

                <span>SERVICE</span>

                <span>COST</span>

                <span>{getTaxLabel()}</span>

                <span>AMOUNT</span>

                <span />

              </div>



              {invoice.items.map((item) => (

                <div className="invoice-item-row invoice-item-row-no-qty" key={item.id}>

                  <div

                    className="invoice-service-control invoice-search-control"

                    onBlur={() =>

                      setTimeout(() => {

                        if (serviceSearchOpen === item.id) {

                          setServiceSearchOpen("");

                        }

                      }, 150)

                    }

                  >

                    <input

                      className="invoice-service-search-input"

                      type="text"

                      value={item.serviceName}

                      onFocus={() => setServiceSearchOpen(item.id)}

                      onChange={(e) => handleServiceInput(item.id, e.target.value)}

                      placeholder="Search service or enter new service"

                      autoComplete="off"

                    />



                    {serviceSearchOpen === item.id && (

                      <div className="invoice-search-menu invoice-service-menu">

                        {(() => {

                          const query = String(item.serviceName || "")

                            .trim()

                            .toLowerCase();



                          const matches = services

                            .filter((service) => {

                              const name =

                                service?.name ||

                                service?.title ||

                                service?.serviceName ||

                                "";



                              return (

                                !query ||

                                String(name).toLowerCase().includes(query)

                              );

                            })

                            .slice(0, 8);



                          return (

                            <>

                              {matches.map((service) => {

                                const name =

                                  service?.name ||

                                  service?.title ||

                                  service?.serviceName ||

                                  "Service";



                                return (

                                  <button

                                    type="button"

                                    className="invoice-search-option"

                                    key={service._id || service.id}

                                    onMouseDown={(e) => e.preventDefault()}

                                    onClick={() =>

                                      selectExistingService(item.id, service)

                                    }

                                  >

                                    <div className="invoice-search-option-content">

                                      <strong>{name}</strong>

                                      <span>

                                        {formatCurrency(

                                          service?.cost ??

                                          service?.price ??

                                          service?.amount ??

                                          0

                                        )}

                                      </span>

                                    </div>

                                  </button>

                                );

                              })}



                              {query && !matches.some((service) => {

                                const name =

                                  service?.name ||

                                  service?.title ||

                                  service?.serviceName ||

                                  "";

                                return name.trim().toLowerCase() === query;

                              }) && (

                                  <button

                                    type="button"

                                    className="invoice-search-add"

                                    onMouseDown={(e) => e.preventDefault()}

                                    onClick={() => addCustomService(item.id)}

                                  >

                                    <span className="invoice-search-add-icon">+</span>

                                    <div className="invoice-search-add-content">

                                      <strong>

                                        Add "{item.serviceName.trim()}"

                                      </strong>

                                      <small>Use as a custom service</small>

                                    </div>

                                  </button>

                                )}



                              {!matches.length && !query && (

                                <div className="invoice-search-empty">

                                  Search for a service or type a new one.

                                </div>

                              )}

                            </>

                          );

                        })()}

                      </div>

                    )}

                  </div>



                  <input

                    className="invoice-cost-input"

                    type="number"

                    min="0"

                    step="0.01"

                    value={item.cost}

                    onChange={(e) => updateItem(item.id, "cost", e.target.value)}

                    placeholder="0.00"

                  />



                  <div className="invoice-tax-control">
                    {item.customTax ? (
                      <div className="invoice-custom-tax-input">
                        <input
                          className="invoice-gst-input"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.gst ?? ""}
                          autoFocus
                          placeholder="0"
                          aria-label={`Custom ${getTaxLabel()} percentage`}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (
                              value === "" ||
                              (Number(value) >= 0 && Number(value) <= 100)
                            ) {
                              updateItem(item.id, "gst", value);
                            }
                          }}
                        />

                        <span className="invoice-custom-tax-label">
                          % {getTaxLabel()}
                        </span>

                        <button
                          type="button"
                          className="invoice-custom-tax-back"
                          title="Select tax rate"
                          onClick={() => {
                            setInvoice((prev) => ({
                              ...prev,
                              items: prev.items.map((row) =>
                                row.id === item.id
                                  ? {
                                    ...row,
                                    customTax: false,
                                    gst: "0",
                                  }
                                  : row
                              ),
                            }));
                          }}
                        >
                          ▾
                        </button>
                      </div>
                    ) : (
                      <select
                        className="invoice-gst-input"
                        value={
                          [0, 5, 12, 18, 28].includes(Number(item.gst))
                            ? String(item.gst)
                            : "custom"
                        }
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === "custom") {
                            setInvoice((prev) => ({
                              ...prev,
                              items: prev.items.map((row) =>
                                row.id === item.id
                                  ? {
                                    ...row,
                                    customTax: true,
                                    gst: "",
                                  }
                                  : row
                              ),
                            }));

                            return;
                          }

                          setInvoice((prev) => ({
                            ...prev,
                            items: prev.items.map((row) =>
                              row.id === item.id
                                ? {
                                  ...row,
                                  gst: value,
                                  customTax: false,
                                }
                                : row
                            ),
                          }));
                        }}
                      >
                        <option value="0">0% {getTaxLabel()}</option>
                        <option value="5">5% {getTaxLabel()}</option>
                        <option value="12">12% {getTaxLabel()}</option>
                        <option value="18">18% {getTaxLabel()}</option>
                        <option value="28">28% {getTaxLabel()}</option>
                        <option value="custom">Custom %</option>
                      </select>
                    )}
                  </div>

                  <strong className="invoice-item-total">

                    {formatCurrency(calculateItem(item).total)}

                  </strong>



                  <button

                    type="button"

                    className="invoice-remove-item"

                    onClick={() => removeItem(item.id)}

                    disabled={invoice.items.length === 1}

                    title="Remove item"

                  >

                    ×

                  </button>

                </div>

              ))}

            </div>



            <div className="invoice-bottom-area">

              <div className="invoice-notes">

                <label>Notes for customer</label>

                <textarea

                  rows="4"

                  value={invoice.notes}

                  onChange={(e) => setInvoice((prev) => ({ ...prev, notes: e.target.value }))}

                  placeholder="Add a note for your customer..."

                />

              </div>



              <div className="invoice-calculation">

                <div>

                  <span>Subtotal</span>

                  <strong>{formatCurrency(totals.subtotal)}</strong>

                </div>

                {totals.gstAmount > 0 && (

                  <div>

                    <span>{getTaxLabel()}</span>

                    <strong>{formatCurrency(totals.gstAmount)}</strong>

                  </div>

                )}

                <div className="invoice-grand-total">

                  <span>Grand Total</span>

                  <strong>{formatCurrency(totals.grandTotal)}</strong>

                </div>

              </div>

            </div>

          </section>

        </div>



        <aside className="invoice-create-sidebar">

          <div className="invoice-card invoice-actions-card">

            <h2>Actions</h2>



            <button

              type="button"

              className="invoice-send-btn"

              onClick={() => saveInvoice(false)}

              disabled={saving}

            >

              {saving ? "Saving..." : "Save Invoice"}

            </button>



            <button

              type="button"

              className="invoice-outline-action"

              onClick={openPreview}

            >

              ◉ Preview invoice

            </button>



            <button

              type="button"

              className="invoice-outline-action"

              onClick={() => saveInvoice(true)}

              disabled={saving}

            >

              ↓ Download PDF

            </button>



            <button

              type="button"

              className="invoice-outline-action"

              onClick={printInvoice}

            >

              ⎙ Print

            </button>

          </div>



          <div className="invoice-card invoice-summary-card">

            <h2>Invoice Summary</h2>

            <div>

              <span>Invoice Number</span>

              <strong>{invoice.invoiceNumber}</strong>

            </div>

            <div>

              <span>Patient ID</span>

              <strong>{invoice.patientId || "Assigned when saved"}</strong>

            </div>

            <div>

              <span>Invoice Date</span>

              <strong>{formatDate(invoice.invoiceDate)}</strong>

            </div>

            <div>

              <span>Customer</span>

              <strong>{invoice.customerName || "Not selected"}</strong>

            </div>

            <div>

              <span>Payment Mode</span>

              <strong>{invoice.paymentMode || "Not selected"}</strong>

            </div>

            <div>

              <span>Total</span>

              <strong>{formatCurrency(totals.grandTotal)}</strong>

            </div>

          </div>

        </aside>

      </div>



      {showPreview && (

        <div

          className="invoice-preview-overlay"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              setShowPreview(false);

            }

          }}

        >

          <div className="invoice-preview-modal">

            <div className="invoice-preview-head">

              <div>

                <strong>Invoice preview</strong>

                <span>This is exactly what the customer receives</span>

              </div>

              <div className="invoice-preview-head-actions">

                <button

                  type="button"

                  onClick={() =>

                    sendInvoiceToWhatsApp(invoice)

                      .then(() =>

                        setSuccess(

                          "Invoice sent to the customer's WhatsApp as a PDF."

                        )

                      )

                      .catch((error) =>

                        setError(

                          error.message ||

                          "Unable to send invoice on WhatsApp."

                        )

                      )

                  }

                  disabled={saving}

                >

                  WhatsApp

                </button>

                <button

                  type="button"

                  onClick={() => setShowPreview(false)}

                >

                  ×

                </button>

              </div>

            </div>



            <div className="invoice-preview-scroll">

              {renderInvoiceDocument()}

            </div>



            <div className="invoice-preview-footer">

              <button type="button" className="invoice-secondary-btn" onClick={() => setShowPreview(false)}>

                Close

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );



  return view === "create" ? renderCreate() : renderList();

}

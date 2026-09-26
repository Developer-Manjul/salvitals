import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../config/api";
import "../styles/Invoice.scss";

const API_BASE = getApiBaseUrl();

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    localStorage.getItem("salevitals_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    sessionStorage.getItem("salevitals_token") ||
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
      new RegExp(`^INV/${year}/${code}(\\d{3,})$`, "i")
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [serviceSearchOpen, setServiceSearchOpen] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  const [invoice, setInvoice] = useState({
    invoiceNumber: createInvoiceNumber("SaleVitals", []),
    invoiceDate: today(),
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
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
      }
    } catch (error) {
      console.error("Profile load error:", error);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api("/api/invoices");
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
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

  const getBusinessName = () =>
    getProfileValue(profile, ["displayName", "clinicName", "businessName", "name"]) ||
    "SaleVitals";

  const getBusinessOwner = () =>
    getProfileValue(profile, ["name", "ownerName", "doctorName"]);

  const getBusinessAddress = () =>
    getProfileValue(profile, ["address", "clinicAddress", "businessAddress"]);

  const getBusinessPhone = () =>
    getProfileValue(profile, ["phone", "mobile", "contactNumber"]);

  const getBusinessEmail = () =>
    getProfileValue(profile, ["email", "businessEmail"]);

  const getBusinessGstin = () =>
    getProfileValue(profile, ["gstin", "gstNumber", "gstNo"]);

  const getBusinessPan = () =>
    getProfileValue(profile, ["pan", "panNumber", "pan_number"]);

  const getBusinessLogo = () =>
    getProfileValue(profile, ["clinicLogo", "logo", "businessLogo", "profileImage"]);

  const openCreateInvoice = () => {
    setError("");
    setSuccess("");
    setShowPreview(false);
    setSelectedCustomer(null);
    setCustomerQuery("");
    setCustomerSearchOpen(false);
    setServiceSearchOpen("");

    setInvoice({
      invoiceNumber: createInvoiceNumber(getBusinessName(), invoices),
      invoiceDate: today(),
      customerId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
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
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone,
    customerAddress: invoice.customerAddress,
    notes: invoice.notes,
    billedBy: {
      name: profile?.name || "",
      businessName: profile?.clinicName || profile?.businessName || "",
      displayName: profile?.displayName || profile?.clinicName || profile?.businessName || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
      address: profile?.address || "",
      gstin: profile?.gstin || profile?.gstNumber || "",
      pan: profile?.pan || profile?.panNumber || "",
      website: profile?.website || "",
      logo: profile?.clinicLogo || profile?.logo || "",
    },
    items: invoice.items.map((item) => {
      const result = calculateItem(item);

      return {
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: 1,
        cost: Number(item.cost),
        gst: Number(item.gst),
        baseAmount: result.baseAmount,
        gstAmount: result.gstAmount,
        total: result.total,
      };
    }),
    subtotal: totals.subtotal,
    gstAmount: totals.gstAmount,
    total: totals.grandTotal,
    status: "Draft",
  });

  const buildWhatsAppMessage = (invoiceData = invoice) => {
    const businessName = getBusinessName();
    const customerName = invoiceData.customerName || "Customer";
    const invoiceNumber = invoiceData.invoiceNumber || "";
    const invoiceDate = formatDate(invoiceData.invoiceDate);
    const total = invoiceData.total ?? totals.grandTotal;

    return `Hello ${customerName}, 👋\n\nThank you for choosing ${businessName}.\n\nYour invoice ${invoiceNumber} is ready. Please find the invoice PDF attached with this message.\n\nInvoice Date: ${invoiceDate}\nInvoice Amount: ${formatCurrency(total)}\n\nIf you have any questions regarding the invoice, please reply to this WhatsApp message.\n\nRegards,\n${businessName}`;
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

  const saveInvoice = async (sendInvoice = false) => {
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

      const data = await api("/api/invoices", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });

      if (data.invoice) {
        setInvoices((prev) => [data.invoice, ...prev]);
      }

      if (sendInvoice) {
        try {
          await sendInvoiceToWhatsApp(data.invoice || buildPayload());
          setSuccess("Invoice created and sent to the customer's WhatsApp as a PDF.");
        } catch (whatsappError) {
          console.error("WhatsApp invoice send error:", whatsappError);
          setSuccess("Invoice was created, but WhatsApp delivery failed.");
          setError(whatsappError.message || "Unable to send invoice on WhatsApp.");
        }
      } else {
        setSuccess("Invoice saved successfully.");
      }

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
      customerId: item.customerId || "",
      customerName: item.customerName || "",
      customerEmail: item.customerEmail || "",
      customerPhone: item.customerPhone || "",
      customerAddress: item.customerAddress || "",
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
    setCustomerSearchOpen(false);
    setServiceSearchOpen("");
    setView("create");
  };

  const openPreview = () => {
    setError("");
    setShowPreview(true);
  };

  const printInvoice = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 150);
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

    return (
      <div className="invoice-document">
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
              {businessGstin && <p>GSTIN: {businessGstin}</p>}
              {businessPan && <p>PAN: {businessPan}</p>}
            </div>
          </div>


        </div>

        <div className="invoice-document-line" />

        <div className="invoice-document-parties">
          <div>
            <span>BILLED TO</span>
            <strong>{invoice.customerName || "—"}</strong>
            {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
            {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
            {invoice.customerAddress && <p>{invoice.customerAddress}</p>}
          </div>

          <div>
            <span>INVOICE DETAILS</span>
            <strong>{invoice.invoiceNumber}</strong>
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
                <th>GST</th>
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
                    <td>{Number(item.gst) || 0}% · {formatCurrency(result.gstAmount)}</td>
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
                <span>GST</span>
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
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>SERVICE</th>
                <th>COST</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="invoice-empty">Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="invoice-empty">
                    <div className="invoice-empty-icon">₹</div>
                    <strong>No invoices found</strong>
                    <span>Create your first invoice to get started.</span>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((item) => (
                  <tr key={item._id || item.id}>
                    <td><strong>{item.invoiceNumber}</strong></td>
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
                      <strong>{formatCurrency(item.total || item.grandTotal || 0)}</strong>
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
                            setInvoice({
                              invoiceNumber: item.invoiceNumber || createInvoiceNumber(getBusinessName(), invoices),
                              invoiceDate: item.invoiceDate || today(),
                              customerId: item.customerId || "",
                              customerName: item.customerName || "",
                              customerEmail: item.customerEmail || "",
                              customerPhone: item.customerPhone || "",
                              customerAddress: item.customerAddress || "",
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
          <h1>Create Invoice</h1>
          <p>Create a GST invoice for your customer.</p>
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
                {getBusinessGstin() && <span>GSTIN: {getBusinessGstin()}</span>}
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
                <p>GST is included in the entered cost.</p>
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
                <span>GST</span>
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

                  <select
                    className="invoice-gst-input"
                    value={item.gst}
                    onChange={(e) => updateItem(item.id, "gst", e.target.value)}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>

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
                    <span>GST</span>
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
              onClick={() => saveInvoice(true)}
              disabled={saving}
            >
              ➤ Send Invoice
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
              onClick={printInvoice}
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
              <span>Invoice Date</span>
              <strong>{formatDate(invoice.invoiceDate)}</strong>
            </div>
            <div>
              <span>Customer</span>
              <strong>{invoice.customerName || "Not selected"}</strong>
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
              <button
                type="button"
                className="invoice-primary-btn"
                onClick={() => saveInvoice(true)}
                disabled={saving}
              >
                ➤ {saving ? "Sending..." : "Send Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return view === "create" ? renderCreate() : renderList();
}

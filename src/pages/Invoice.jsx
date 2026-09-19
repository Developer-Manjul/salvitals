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

const createInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV/${year}-${month}/${random}`;
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

  const [invoice, setInvoice] = useState({
    invoiceNumber: createInvoiceNumber(),
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

    setInvoice({
      invoiceNumber: createInvoiceNumber(),
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

  const updateCustomerField = (field, value) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
    setSelectedCustomer(null);
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
      invoiceNumber: item.invoiceNumber || createInvoiceNumber(),
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

          <div className="invoice-document-title">
            <span>TAX INVOICE</span>
            <strong>{invoice.invoiceNumber}</strong>
            <p>Invoice date: {formatDate(invoice.invoiceDate)}</p>
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
            {businessGstin && <p>GSTIN: {businessGstin}</p>}
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
            <div>
              <span>GST</span>
              <strong>{formatCurrency(totals.gstAmount)}</strong>
            </div>
            <div className="grand">
              <span>Grand Total</span>
              <strong>{formatCurrency(totals.grandTotal)}</strong>
            </div>
          </div>
        </div>

        <div className="invoice-document-footer">
          <strong>Thank you for your business.</strong>
          <span>This invoice was generated from SaleVitals.</span>
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
                              invoiceNumber: item.invoiceNumber || createInvoiceNumber(),
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

        <div className="invoice-header-actions">
          <button
            type="button"
            className="invoice-secondary-btn"
            onClick={() => saveInvoice(false)}
            disabled={saving}
          >
            Save draft
          </button>
          <button
            type="button"
            className="invoice-primary-btn"
            onClick={() => saveInvoice(true)}
            disabled={saving}
          >
            {saving ? "Sending..." : "Send Invoice"}
          </button>
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
                  onChange={(e) =>
                    setInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                  }
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
                <select
                  value={invoice.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option
                      key={customer._id || customer.id}
                      value={customer._id || customer.id}
                    >
                      {customer.name || customer.fullName || customer.patientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="invoice-field">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={invoice.customerName}
                  onChange={(e) => updateCustomerField("customerName", e.target.value)}
                  placeholder="Enter customer name"
                />
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

              <div className="invoice-field">
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
                  <div className="invoice-service-control">
                    <select
                      value={item.serviceId}
                      onChange={(e) => selectService(item.id, e.target.value)}
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option
                          key={service._id || service.id}
                          value={service._id || service.id}
                        >
                          {service.name || service.title || service.serviceName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.serviceName}
                      onChange={(e) => updateItem(item.id, "serviceName", e.target.value)}
                      placeholder="Or enter custom service"
                    />
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
                <div>
                  <span>GST</span>
                  <strong>{formatCurrency(totals.gstAmount)}</strong>
                </div>
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
                <button type="button" onClick={printInvoice}>⎙ Print</button>
                <button type="button" onClick={printInvoice}>PDF</button>
                <button
                  type="button"
                  onClick={() => sendInvoiceToWhatsApp(invoice).then(() => setSuccess("Invoice sent to the customer's WhatsApp as a PDF.")).catch((error) => setError(error.message || "Unable to send invoice on WhatsApp."))}
                  disabled={saving}
                >
                  WhatsApp
                </button>
                <button type="button" onClick={() => setShowPreview(false)}>×</button>
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

      <style>{`
        .invoice-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, .58);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
        }

        .invoice-preview-modal {
          width: min(1080px, 100%);
          max-height: calc(100vh - 44px);
          background: #f4f7fb;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 28px 80px rgba(0,0,0,.25);
          display: flex;
          flex-direction: column;
        }

        .invoice-preview-head,
        .invoice-preview-footer {
          background: #fff;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .invoice-preview-footer {
          border-bottom: 0;
          border-top: 1px solid #e2e8f0;
          justify-content: flex-end;
        }

        .invoice-preview-head > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .invoice-preview-head strong {
          font-size: 15px;
          color: #172033;
        }

        .invoice-preview-head span {
          font-size: 11px;
          color: #718096;
        }

        .invoice-preview-head-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .invoice-preview-head-actions button {
          border: 1px solid #dbe3ee;
          background: #fff;
          color: #334155;
          border-radius: 7px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .invoice-preview-head-actions button:last-child {
          border: 0;
          font-size: 21px;
          padding: 2px 6px;
        }

        .invoice-preview-scroll {
          overflow: auto;
          padding: 18px;
        }

        .invoice-document {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
          background: #fff;
          color: #172033;
          padding: 34px 38px;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }

        .invoice-document-header {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          align-items: flex-start;
        }

        .invoice-company {
          display: flex;
          gap: 14px;
          min-width: 0;
        }

        .invoice-company-logo {
          width: 58px;
          height: 58px;
          border-radius: 10px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 58px;
          overflow: hidden;
          border: 1px solid #dbe7f5;
        }

        .invoice-company-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .invoice-company-logo span {
          font-size: 25px;
          font-weight: 800;
          color: #2563eb;
        }

        .invoice-company-info h2 {
          margin: 0 0 5px;
          font-size: 19px;
          line-height: 1.2;
        }

        .invoice-company-info p {
          margin: 2px 0;
          color: #667085;
          font-size: 10px;
          line-height: 1.4;
        }

        .invoice-company-info .invoice-owner {
          color: #344054;
          font-weight: 600;
        }

        .invoice-document-title {
          text-align: right;
          min-width: 190px;
        }

        .invoice-document-title span {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: .08em;
          margin-bottom: 5px;
        }

        .invoice-document-title strong {
          display: block;
          font-size: 17px;
          margin-bottom: 7px;
        }

        .invoice-document-title p {
          margin: 0;
          color: #667085;
          font-size: 10px;
        }

        .invoice-document-line {
          height: 2px;
          background: #2563eb;
          margin: 28px 0 18px;
        }

        .invoice-document-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 22px;
        }

        .invoice-document-parties > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .invoice-document-parties span,
        .invoice-document-notes > span {
          color: #8190a5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .08em;
          margin-bottom: 4px;
        }

        .invoice-document-parties strong {
          font-size: 12px;
        }

        .invoice-document-parties p {
          margin: 0;
          color: #667085;
          font-size: 10px;
          line-height: 1.45;
        }

        .invoice-document-table-wrap {
          border: 1px solid #dce4ef;
          border-radius: 8px;
          overflow: hidden;
        }

        .invoice-document-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .invoice-document-table th {
          background: #f6f8fb;
          color: #526173;
          font-size: 9px;
          text-align: left;
          padding: 10px 9px;
          border-bottom: 1px solid #dce4ef;
          letter-spacing: .03em;
        }

        .invoice-document-table td {
          padding: 10px 9px;
          font-size: 10px;
          color: #344054;
          border-bottom: 1px solid #e9eef5;
          vertical-align: top;
          word-break: break-word;
        }

        .invoice-document-table tr:last-child td {
          border-bottom: 0;
        }

        .invoice-document-table th:first-child,
        .invoice-document-table td:first-child {
          width: 34px;
          text-align: center;
        }

        .invoice-document-table th:nth-child(2) {
          width: 42%;
        }

        .invoice-document-table th:nth-child(3),
        .invoice-document-table th:nth-child(4),
        .invoice-document-table th:nth-child(5) {
          width: 17%;
        }

        .invoice-document-bottom {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 40px;
          margin-top: 22px;
          min-height: 100px;
        }

        .invoice-document-notes p {
          margin: 0;
          color: #667085;
          font-size: 10px;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .invoice-document-total-box {
          border-top: 1px solid #dce4ef;
        }

        .invoice-document-total-box > div {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 9px 0;
          color: #667085;
          font-size: 10px;
          border-bottom: 1px solid #eef2f7;
        }

        .invoice-document-total-box strong {
          color: #172033;
        }

        .invoice-document-total-box .grand {
          margin-top: 4px;
          padding: 13px 12px;
          background: #111827;
          color: #fff;
          border-radius: 7px;
          border: 0;
          font-size: 12px;
        }

        .invoice-document-total-box .grand strong {
          color: #fff;
          font-size: 14px;
        }

        .invoice-document-footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #e5eaf1;
          margin-top: 30px;
          padding-top: 14px;
          color: #8490a0;
          font-size: 9px;
        }

        .invoice-document-footer strong {
          color: #475467;
        }

        .invoice-items-no-qty .invoice-item-head,
        .invoice-item-row-no-qty {
          grid-template-columns: minmax(250px, 1fr) 145px 120px 145px 30px !important;
        }

        @media (max-width: 900px) {
          .invoice-create-layout {
            grid-template-columns: 1fr !important;
          }

          .invoice-document {
            padding: 24px;
          }

          .invoice-document-bottom {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .invoice-preview-overlay {
            padding: 0;
          }

          .invoice-preview-modal {
            max-height: 100vh;
            border-radius: 0;
          }

          .invoice-document {
            padding: 18px;
          }

          .invoice-document-header,
          .invoice-document-parties {
            grid-template-columns: 1fr;
            flex-direction: column;
          }

          .invoice-document-title {
            text-align: left;
          }

          .invoice-document-table {
            min-width: 650px;
          }

          .invoice-document-table-wrap {
            overflow-x: auto;
          }

          .invoice-document-footer {
            flex-direction: column;
          }
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .invoice-preview-overlay,
          .invoice-preview-overlay * {
            visibility: visible !important;
          }

          .invoice-preview-overlay {
            position: absolute !important;
            inset: 0 !important;
            display: block !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .invoice-preview-modal {
            width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #fff !important;
          }

          .invoice-preview-head,
          .invoice-preview-footer {
            display: none !important;
          }

          .invoice-preview-scroll {
            overflow: visible !important;
            padding: 0 !important;
          }

          .invoice-document {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 25mm 18mm !important;
            box-shadow: none !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );

  return view === "create" ? renderCreate() : renderList();
}

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../config/api";
import "../styles/Invoice.scss";
import "../styles/pharmacy-invoice.scss";
import {
  Pencil,
  Download,
  Eye,
  MessageCircle,
  Trash2,
} from "lucide-react";

const API_BASE = getApiBaseUrl();

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("vitalsToken") ||
  localStorage.getItem("salevitals_token") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("vitalsToken") ||
  sessionStorage.getItem("salevitals_token") ||
  "";

async function api(url, options = {}) {
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
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const profileValue = (profile, keys) => {
  for (const key of keys) {
    const value = profile?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
};

const newInvoice = () => ({
  _id: "",
  invoiceNumber: "",
  customerId: "",
  customerName: "",
  phone: "",
  email: "",
  address: "",
  invoiceDate: today(),
  notes: "",
  paymentMode: "",
  status: "Unpaid",
  items: [{ medicineId: "", quantity: "1" }],
});

const lineAmounts = (price, quantity) => ({
  total: Math.round((Number(price || 0) * Number(quantity || 0) + Number.EPSILON) * 100) / 100,
});

export default function PharmacyInvoice() {
  const [view, setView] = useState("list");
  const [medicines, setMedicines] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(newInvoice);
  const [showPreview, setShowPreview] = useState(false);
  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerOptions, setShowCustomerOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAll();
    loadProfile();
    loadCustomers();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setShowPreview(false);
        setShowCustomerOptions(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api("/api/auth/profile");
      if (data.success) setProfile(data.user);
    } catch (err) {
      console.error("Pharmacy invoice profile error:", err);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api("/api/contacts");
      setCustomers(
        Array.isArray(data.contacts) ? data.contacts :
        Array.isArray(data.customers) ? data.customers :
        Array.isArray(data.data) ? data.data : []
      );
    } catch (err) {
      console.error("Pharmacy invoice contacts error:", err);
      setCustomers([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [medicineData, invoiceData] = await Promise.all([
        api("/api/pharmacy"),
        api("/api/pharmacy-invoices"),
      ]);
      setMedicines((Array.isArray(medicineData.medicines) ? medicineData.medicines : []).map((item) => ({
        ...item,
        id: String(item._id || item.id),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
      })));
      setInvoices(Array.isArray(invoiceData.invoices) ? invoiceData.invoices : []);
    } catch (err) {
      setError(err.message || "Unable to load pharmacy data.");
    } finally {
      setLoading(false);
    }
  };

  const businessName = profileValue(profile, ["displayName", "clinicName", "businessName", "name"]) || "SaleVitals";
  const businessOwner = profileValue(profile, ["name", "ownerName", "doctorName"]);
  const businessAddress = profileValue(profile, ["address", "clinicAddress", "businessAddress"]);
  const businessPhone = profileValue(profile, ["phone", "mobile", "contactNumber"]);
  const businessEmail = profileValue(profile, ["email", "businessEmail"]);
  const businessLogo = profileValue(profile, ["clinicLogo", "logo", "businessLogo", "profileImage"]);

  const calculatedItems = useMemo(() => form.items.map((line) => {
    const medicine = medicines.find((item) => item.id === String(line.medicineId));
    const amounts = lineAmounts(medicine?.price || 0, line.quantity);
    return { ...line, medicine, ...amounts };
  }), [form.items, medicines]);

  const totals = useMemo(() => ({
    total: Math.round(calculatedItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100,
  }), [calculatedItems]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateItem = (index, field, value) => setForm((prev) => ({
    ...prev,
    items: prev.items.map((item, i) => i === index
      ? { ...item, [field]: value }
      : item),
  }));

  const addItem = () => setForm((prev) => ({
    ...prev,
    items: [...prev.items, { medicineId: "", quantity: "1" }],
  }));

  const removeItem = (index) => setForm((prev) => ({
    ...prev,
    items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
  }));

  const chooseCustomer = (customer) => {
    const id = String(customer._id || customer.id || "");
    const name = customer.name || customer.fullName || customer.patientName || "";
    setForm((prev) => ({
      ...prev,
      customerId: id,
      customerName: name,
      phone: customer.phone || customer.mobile || customer.contactNumber || "",
      email: customer.email || "",
      address: customer.address || customer.fullAddress || "",
    }));
    setCustomerSearch(name);
    setShowCustomerOptions(false);
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return true;
    return `${customer.name || ""} ${customer.fullName || ""} ${customer.patientName || ""} ${customer.phone || customer.mobile || ""} ${customer.email || ""}`.toLowerCase().includes(query);
  }).slice(0, 8);

  const openCreate = () => {
    setError("");
    setSuccess("");
    setShowPreview(false);
    setForm(newInvoice());
    setCustomerSearch("");
    setView("create");
  };

  const editInvoice = (invoice) => {
    setError("");
    setSuccess("");
    setShowPreview(false);
    setForm({
      ...newInvoice(),
      ...invoice,
      _id: invoice._id || invoice.id || "",
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().slice(0, 10) : today(),
      phone: invoice.phone || "",
      email: invoice.email || "",
      address: invoice.address || "",
      items: (invoice.items || []).map((item) => ({
        medicineId: String(item.medicineId?._id || item.medicineId || ""),
        quantity: String(item.quantity || 1),

      })),
    });
    setCustomerSearch(invoice.customerName || "");
    setView("create");
  };

  const saveInvoice = async (event) => {
    event?.preventDefault?.();
    setError("");
    setSuccess("");

    if (!form.customerName.trim()) {
      setError("Please select a customer or enter the customer name.");
      return;
    }
    for (const item of calculatedItems) {
      if (!item.medicine) {
        setError("Please select a medicine for every invoice line.");
        return;
      }
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
        setError("Quantity must be a whole number greater than zero.");
        return;
      }
      const stockAvailable = item.medicine.quantity + (
        form._id ? Number((invoices.find((inv) => String(inv._id) === String(form._id))?.items || [])
          .filter((old) => String(old.medicineId?._id || old.medicineId) === item.medicineId)
          .reduce((sum, old) => sum + Number(old.quantity || 0), 0)) : 0
      );
      if (Number(item.quantity) > stockAvailable) {
        setError(`Insufficient stock for ${item.medicine.name}. Available: ${stockAvailable}.`);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        customerName: form.customerName.trim(),
        phone: form.phone || "",
        email: form.email || "",
        address: form.address || "",
        invoiceDate: form.invoiceDate,
        notes: form.notes || "",
        items: calculatedItems.map((item) => ({
          medicineId: item.medicineId,
          quantity: Number(item.quantity),

        })),
      };
      const isEditing = Boolean(form._id);
      const data = await api(
        isEditing ? `/api/pharmacy-invoices/${encodeURIComponent(form._id)}` : "/api/pharmacy-invoices",
        { method: isEditing ? "PUT" : "POST", body: JSON.stringify(payload) }
      );
      setSuccess(data.message || (isEditing ? "Invoice updated successfully." : "Invoice created successfully."));
      setShowPreview(false);
      setView("list");
      setForm(newInvoice());
      setCustomerSearch("");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to save pharmacy invoice.");
    } finally {
      setSaving(false);
    }
  };

  const deleteInvoice = async (invoice) => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber || ""}? Its stock quantities will be restored.`)) return;
    setError("");
    setSuccess("");
    try {
      await api(`/api/pharmacy-invoices/${encodeURIComponent(invoice._id || invoice.id)}`, { method: "DELETE" });
      setSuccess("Invoice deleted and stock restored.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete invoice.");
    }
  };

  const downloadPDF = async (invoice) => {
    try {
      setError("");
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/pharmacy-invoices/${encodeURIComponent(invoice._id || invoice.id)}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to download PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${String(invoice.invoiceNumber || "pharmacy-invoice").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Unable to download PDF.");
    }
  };

  const sendWhatsApp = async (invoice) => {
    const invoiceId = invoice?._id || invoice?.id;
    const phone = invoice?.phone || form.phone;
    if (!invoiceId) {
      setError("Save the invoice before sending it on WhatsApp.");
      return;
    }
    if (!phone) {
      setError("Customer WhatsApp number is missing.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      const data = await api(`/api/pharmacy-invoices/${encodeURIComponent(invoiceId)}/whatsapp`, {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setSuccess(data.message || "Invoice PDF sent to WhatsApp.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to send invoice on WhatsApp.");
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = () => {
    setShowPreview(true);
    window.setTimeout(() => window.print(), 250);
  };

  const previewDocument = (invoiceData = form, lines = calculatedItems, summary = totals) => (
    <div className="invoice-document pharmacy-invoice-document">
      <div className="invoice-document-header">
        <div className="invoice-company">
          <div className="invoice-company-logo">
            {businessLogo ? <img src={businessLogo} alt={businessName} /> : <span>{businessName.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="invoice-company-info">
            <h2>{businessName}</h2>
            {businessOwner && <p className="invoice-owner">{businessOwner}</p>}
            {businessAddress && <p>{businessAddress}</p>}
            {businessPhone && <p>{businessPhone}</p>}
            {businessEmail && <p>{businessEmail}</p>}
            {invoiceData.paymentMode && <p>Payment mode: {invoiceData.paymentMode}</p>}
          </div>
        </div>
        <div className="invoice-document-title">
          <span>PHARMACY INVOICE</span>
          <strong>{invoiceData.invoiceNumber || "Assigned when saved"}</strong>
          <p>Invoice date: {formatDate(invoiceData.invoiceDate)}</p>
        </div>
      </div>
      <div className="invoice-document-line" />
      <div className="invoice-document-parties">
        <div>
          <span>BILLED TO</span>
          <strong>{invoiceData.customerName || "—"}</strong>
          {invoiceData.phone && <p>{invoiceData.phone}</p>}
          {invoiceData.paymentMode && <p>Payment Mode: {invoiceData.paymentMode}</p>}
          {invoiceData.email && <p>{invoiceData.email}</p>}
          {invoiceData.address && <p>{invoiceData.address}</p>}
        </div>
        <div>
          <span>INVOICE DETAILS</span>
          <strong>{invoiceData.invoiceNumber || "Assigned when saved"}</strong>
          <p>Invoice date: {formatDate(invoiceData.invoiceDate)}</p>
        </div>
      </div>
      <div className="invoice-document-table-wrap">
        <table className="invoice-document-table">
          <thead><tr><th>#</th><th>DESCRIPTION OF MEDICINE</th><th>QTY</th><th>UNIT PRICE</th><th>AMOUNT</th></tr></thead>
          <tbody>
            {lines.map((item, index) => (
              <tr key={`${item.medicineId || item.medicineName || "item"}-${index}`}>
                <td>{index + 1}</td>
                <td>{item.medicine?.name || item.medicineName || "Medicine"}</td>
                <td>{Number(item.quantity) || 0}</td>
                <td>{money(item.medicine?.price ?? item.price ?? 0)}</td>
                <td>{money(item.total ?? item.totalAmount ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="invoice-document-bottom">
        <div className="invoice-document-notes">
          {invoiceData.notes && <><span>NOTES</span><p>{invoiceData.notes}</p></>}
        </div>
        <div className="invoice-document-total-box">
          <div className="grand"><span>Grand Total</span><strong>{money(summary.total ?? summary.grandTotal ?? 0)}</strong></div>
        </div>
      </div>
      <div className="invoice-document-footer">
        <strong>Thank you for your business.</strong>
        <span>Powered by SaleVitals</span>
      </div>
    </div>
  );

  const filteredInvoices = invoices.filter((invoice) =>
    `${invoice.invoiceNumber || ""} ${invoice.customerName || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="invoice-page pharmacy-invoice-page">
      <div className="invoice-page-header">
        <div>
          {view === "create" && <button type="button" className="invoice-back-btn" onClick={() => { setView("list"); setShowPreview(false); }}>← Back to pharmacy invoices</button>}
          <h1>Pharmacy Invoices</h1>
          <p>Create medicine invoices using your pharmacy inventory.</p>
        </div>
        <div className="invoice-header-actions">
          <button type="button" className="invoice-secondary-btn" onClick={loadAll} disabled={loading}>Refresh</button>
          {view === "list" && <button type="button" className="invoice-primary-btn" onClick={openCreate}>+ Create Invoice</button>}
        </div>
      </div>

      {error && <div className="invoice-alert error">{error}</div>}
      {success && <div className="invoice-alert success">{success}</div>}

      {view === "list" ? (
        <div className="invoice-list-card">
          <div className="invoice-list-toolbar">
            <div className="invoice-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice number or customer..." /></div>
            <div className="invoice-count">{filteredInvoices.length} invoices</div>
          </div>
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead><tr><th>INVOICE NUMBER</th><th>CUSTOMER</th><th>DATE</th><th>MEDICINES</th><th>TOTAL</th><th>DELIVERY</th><th>ACTION</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="7" className="invoice-empty">Loading pharmacy invoices...</td></tr> :
                  filteredInvoices.length === 0 ? <tr><td colSpan="7" className="invoice-empty"><div className="invoice-empty-icon">₹</div><strong>No pharmacy invoices found</strong><span>Create your first pharmacy invoice.</span></td></tr> :
                  filteredInvoices.map((item) => (
                    <tr key={item._id || item.id}>
                      <td><strong>{item.invoiceNumber}</strong></td>
                      <td><div className="invoice-customer"><div className="invoice-avatar">{(item.customerName || "C").charAt(0).toUpperCase()}</div><div><strong>{item.customerName || "-"}</strong>{item.phone && <small>{item.phone}</small>}</div></div></td>
                      <td>{formatDate(item.invoiceDate)}</td>
                      <td>{(item.items || []).map((line) => line.medicineName).filter(Boolean).slice(0, 2).join(", ") || "Medicine items"}</td>
                      <td><strong>{money(item.total)}</strong></td>
                      <td><span className={`pharmacy-delivery-status ${String(item.status || "").toLowerCase() === "sent" ? "is-sent" : "is-pending"}`}>{String(item.status || "").toLowerCase() === "sent" ? "Sent" : "Not sent"}</span></td>
                      <td><div className="invoice-actions pharmacy-invoice-actions">
                            <button
                                type="button"
                                className="pharmacy-action-btn pharmacy-action-edit"
                                title="Edit Invoice"
                                onClick={() => editInvoice(item)}
                            >
                                <Pencil size={19} />
                            </button>

                            <button
                                type="button"
                                className="pharmacy-action-btn pharmacy-action-preview"
                                title="Preview Invoice"
                                onClick={() => {
                                editInvoice(item);
                                setShowPreview(true);
                                }}
                            >
                                <Eye size={19} />
                            </button>

                            <button
                                type="button"
                                className="pharmacy-action-btn pharmacy-action-pdf"
                                title="Download PDF"
                                onClick={() => downloadPDF(item)}
                            >
                                <Download size={19} />
                            </button>

                                                        
                                <button
                                    type="button"
                                    className="invoice-whatsapp-btn"
                                    onClick={() => sendWhatsApp(item)}
                                    disabled={saving}
                                    title="Send invoice on WhatsApp"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                        className="invoice-whatsapp-svg"
                                        fill="currentColor"
                                    >
                                        <path d="M20.52 3.48A11.8 11.8 0 0 0 12.1 0C5.55 0 .22 5.32.22 11.87c0 2.1.55 4.15 1.6 5.96L.12 24l6.33-1.66a11.9 11.9 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.47-8.42ZM12.1 21.75h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.66-.24-.38a9.83 9.83 0 0 1-1.51-5.25c0-5.46 4.45-9.9 9.91-9.9a9.83 9.83 0 0 1 7.01 2.9 9.83 9.83 0 0 1 2.9 7.01c0 5.46-4.45 9.9-9.92 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.05-.97-.28-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.78-1.66-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.28.3-1.04 1.02-1.04 2.49s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
                                    </svg>
                                    <span>Send on WhatsApp</span>
                                </button>



                            <button
                                type="button"
                                className="pharmacy-action-btn pharmacy-action-delete"
                                title="Delete Invoice"
                                onClick={() => deleteInvoice(item)}
                            >
                                <Trash2 size={19} />
                            </button>
                            </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={saveInvoice}>
          <div className="invoice-create-layout">
            <div className="invoice-create-main">
              <section className="invoice-card">
                <div className="invoice-card-header"><h2>Invoice Details</h2><span className="pharmacy-invoice-badge">Pharmacy</span></div>
                <div className="invoice-form-grid">
                  <div className="invoice-field"><label>Invoice Number</label><input readOnly value={form.invoiceNumber || "Assigned when saved"} /></div>
                  <div className="invoice-field"><label>Invoice Date</label><input type="date" required value={form.invoiceDate} onChange={(e) => updateField("invoiceDate", e.target.value)} /></div>
                </div>
              </section>

              <section className="invoice-card">
                <div className="invoice-card-header"><h2>Billed By</h2></div>
                <div className="invoice-billed-profile">
                  <div className="invoice-business-logo">{businessLogo ? <img src={businessLogo} alt={businessName} /> : <span>{businessName.charAt(0).toUpperCase()}</span>}</div>
                  <div><strong>{businessName}</strong>{businessOwner && <span>{businessOwner}</span>}{businessAddress && <span>{businessAddress}</span>}{businessPhone && <span>{businessPhone}</span>}{businessEmail && <span>{businessEmail}</span>}</div>
                </div>
              </section>

              <section className="invoice-card">
                <div className="invoice-card-header"><div><h2>Billed To</h2><p>Search an existing customer or enter new customer details.</p></div></div>
                <div className="invoice-form-grid">
                  <div className="invoice-field invoice-field-full pharmacy-customer-search">
                    <label>Search Customer / Lead</label>
                    <input value={customerSearch} onFocus={() => setShowCustomerOptions(true)} onChange={(e) => { setCustomerSearch(e.target.value); updateField("customerName", e.target.value); updateField("customerId", ""); setShowCustomerOptions(true); }} placeholder="Search by name, phone or email — or type a new name" autoComplete="off" />
                    {showCustomerOptions && filteredCustomers.length > 0 && <div className="pharmacy-customer-options">{filteredCustomers.map((customer) => <button type="button" key={customer._id || customer.id} onMouseDown={(e) => e.preventDefault()} onClick={() => chooseCustomer(customer)}><strong>{customer.name || customer.fullName || customer.patientName || "Customer"}</strong><span>{customer.phone || customer.mobile || customer.email || ""}</span></button>)}</div>}
                  </div>
                  <div className="invoice-field"><label>Customer Name *</label><input required value={form.customerName} onChange={(e) => { updateField("customerName", e.target.value); setCustomerSearch(e.target.value); }} placeholder="Enter customer name" /></div>
                  <div className="invoice-field"><label>Phone / WhatsApp</label><input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Enter phone number" /></div>
                  <div className="invoice-field"><label>Payment Mode</label><select value={form.paymentMode} onChange={(e) => updateField("paymentMode", e.target.value)}><option value="">Select payment mode</option><option value="Credit Card">Credit Card</option><option value="Debit Card">Debit Card</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option></select></div>
                  <div className="invoice-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Enter email" /></div>
                  <div className="invoice-field"><label>Address</label><input value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Enter address" /></div>
                </div>
              </section>

              <section className="invoice-card">
                <div className="invoice-card-header"><div><h2>Medicines & Items</h2><p>Select medicines already added to Pharmacy inventory.</p></div><button type="button" className="invoice-add-item-btn" onClick={addItem}>+ Add medicine</button></div>
                <div className="pharmacy-invoice-lines">
                  {calculatedItems.map((item, index) => (
                    <div className="pharmacy-invoice-line" key={`${item.medicineId}-${index}`}>
                      <div className="invoice-field pharmacy-line-field"><label>Medicine</label><select required value={item.medicineId} onChange={(e) => updateItem(index, "medicineId", e.target.value)}><option value="">Select medicine</option>{medicines.map((medicine) => <option key={medicine.id} value={medicine.id} disabled={medicine.quantity < 1 && medicine.id !== item.medicineId}>{medicine.name} — {money(medicine.price)} (Stock: {medicine.quantity})</option>)}</select>{item.medicine && <small>Expiry: {item.medicine.expiryDate ? formatDate(item.medicine.expiryDate) : "—"} · Available: {item.medicine.quantity}</small>}</div>
                      <div className="pharmacy-line-field"><label>Unit Price</label><input className="pharmacy-price-readonly" readOnly value={item.medicine ? money(item.medicine.price) : ""} placeholder="Auto-filled" /></div>
                      <div className="pharmacy-line-field"><label>Quantity</label><input type="number" min="1" step="1" required value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} /></div>
                      <div className="pharmacy-line-field pharmacy-line-amount-field"><label>Amount</label><strong className="pharmacy-line-total">{money(item.total)}</strong></div>
                      <button type="button" className="invoice-remove-item" onClick={() => removeItem(index)} disabled={form.items.length === 1} aria-label="Remove medicine">×</button>
                    </div>
                  ))}
                </div>
                <div className="invoice-bottom-area">
                  <div className="invoice-notes"><label>Notes for customer</label><textarea rows="4" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Add a note..." /></div>
                  <div className="invoice-calculation">
                    <div className="invoice-grand-total"><span>Grand Total</span><strong>{money(totals.total)}</strong></div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="invoice-create-sidebar">
              <div className="invoice-card invoice-actions-card">
                <h2>Actions</h2>
                <button type="submit" className="invoice-send-btn" disabled={saving}>{saving ? "Saving..." : form._id ? "Update Invoice" : "Save Invoice"}</button>
                <button type="button" className="invoice-outline-action" onClick={() => { setError(""); setShowPreview(true); }}>◉ Preview invoice</button>
                <button type="button" className="invoice-outline-action" onClick={async () => { if (!form._id) { setError("Save the invoice first to download its PDF."); return; } const invoice = invoices.find((item) => String(item._id) === String(form._id)); if (invoice) await downloadPDF(invoice); }}>↓ Download PDF</button>
                <button type="button" className="invoice-outline-action" onClick={printInvoice}>⎙ Print</button>
               
                    {form._id && (
                        <button
                            type="button"
                            className="invoice-whatsapp-btn"
                            onClick={() =>
                                sendWhatsApp({
                                    _id: form._id,
                                    phone: form.phone,
                                })
                            }
                            disabled={saving}
                            title="Send invoice on WhatsApp"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className="invoice-whatsapp-svg"
                                fill="currentColor"
                            >
                                <path d="M20.52 3.48A11.8 11.8 0 0 0 12.1 0C5.55 0 .22 5.32.22 11.87c0 2.1.55 4.15 1.6 5.96L.12 24l6.33-1.66a11.9 11.9 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.47-8.42ZM12.1 21.75h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.66-.24-.38a9.83 9.83 0 0 1-1.51-5.25c0-5.46 4.45-9.9 9.91-9.9a9.83 9.83 0 0 1 7.01 2.9 9.83 9.83 0 0 1 2.9 7.01c0 5.46-4.45 9.9-9.92 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.05-.97-.28-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.78-1.66-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.28.3-1.04 1.02-1.04 2.49s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
                            </svg>
                            <span>Send on WhatsApp</span>
                        </button>
                    )}

              </div>
              <div className="invoice-card invoice-summary-card">
                <h2>Invoice Summary</h2>
                <div><span>Invoice Number</span><strong>{form.invoiceNumber || "Assigned when saved"}</strong></div>
                <div><span>Invoice Date</span><strong>{formatDate(form.invoiceDate)}</strong></div>
                <div><span>Customer</span><strong>{form.customerName || "Not selected"}</strong></div>
                <div><span>Medicine lines</span><strong>{calculatedItems.length}</strong></div>
                <div><span>Total</span><strong>{money(totals.total)}</strong></div>
              </div>
            </aside>
          </div>
        </form>
      )}

      {showPreview && (
        <div className="invoice-preview-overlay pharmacy-preview-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPreview(false); }}>
          <div className="invoice-preview-modal">
            <div className="invoice-preview-head">
              <div><strong>Invoice preview</strong><span>Pharmacy invoice · {form.invoiceNumber || "Number assigned after save"}</span></div>
              <div className="invoice-preview-head-actions">
                {form._id && <button type="button" className="pharmacy-whatsapp-button" onClick={() => sendWhatsApp({ _id: form._id, phone: form.phone })} disabled={saving}>Send on WhatsApp</button>}
                {form._id && <button type="button" onClick={() => downloadPDF(invoices.find((item) => String(item._id) === String(form._id)) || { _id: form._id, invoiceNumber: form.invoiceNumber })}>Download PDF</button>}
                <button type="button" onClick={() => window.print()}>Print</button>
                <button type="button" onClick={() => setShowPreview(false)}>×</button>
              </div>
            </div>
            <div className="invoice-preview-scroll">{previewDocument()}</div>
            <div className="invoice-preview-footer"><button type="button" className="invoice-secondary-btn" onClick={() => setShowPreview(false)}>Close</button><button type="button" className="invoice-primary-btn" onClick={saveInvoice} disabled={saving}>{saving ? "Saving..." : form._id ? "Update Invoice" : "Save Invoice"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

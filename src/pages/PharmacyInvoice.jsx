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
  discountType: "percentage",
  discountValue: "0",
  status: "Unpaid",
  items: [{ medicineId: "", quantity: "1", unitType: "Pack" }],
});

const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const lineAmounts = (price, quantity, gstRate = 0) => {
  const taxableAmount = roundMoney(Number(price || 0) * Number(quantity || 0));
  const gstAmount = roundMoney(taxableAmount * Number(gstRate || 0) / 100);
  return {
    taxableAmount,
    gstAmount,
    total: roundMoney(taxableAmount + gstAmount),
  };
};

export default function PharmacyInvoice() {
  const [view, setView] = useState("list");
  const [medicines, setMedicines] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(newInvoice);
  const [showPreview, setShowPreview] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [medicineSearch, setMedicineSearch] = useState({});
const [showMedicineOptions, setShowMedicineOptions] = useState({});
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

    const medicineList = Array.isArray(medicineData.medicines)
      ? medicineData.medicines
      : [];

    setMedicines(
      medicineList.map((item) => ({
        ...item,
        _id: String(item._id || item.id || ""),
        id: String(item._id || item.id || ""),
        name: item.name || item.medicineName || "",
        batchNo: item.batchNo || item.batchNumber || "",
        price: Number(item.packPrice ?? item.price ?? item.mrp ?? item.unitPrice ?? 0),
        quantity: Number(item.unitInStock ?? item.quantity ?? item.stock ?? 0),
        looseUnits: Number(item.looseUnits || 0),
        packSize: Number(item.packSize || 1),
        gst: Number(item.gst || 0),
        expiryDate: item.expiryDate || item.expiry || "",
      }))
    );

    setInvoices(
      Array.isArray(invoiceData.invoices) ? invoiceData.invoices : []
    );
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

const calculatedItems = useMemo(
  () =>
    form.items.map((line) => {
      const medicine = medicines.find(
        (item) => String(item._id || item.id) === String(line.medicineId)
      );

      const packPrice = Number(medicine?.packPrice ?? medicine?.price ?? 0);
      const packSize = Math.max(1, Number(medicine?.packSize) || 1);
      const gstRate = Number(medicine?.gst ?? 0);

      const unitPrice =
        line.unitType === "Piece"
          ? packPrice / packSize
          : packPrice;

      const quantity = Number(line.quantity) || 0;
      const taxableAmount =
        Math.round(unitPrice * quantity * 100) / 100;
      const gstAmount =
        Math.round(taxableAmount * gstRate) / 100;
      const total =
        Math.round((taxableAmount + gstAmount) * 100) / 100;

      return {
        ...line,
        medicine,
        packSize,
        unitPrice,
        gstRate,
        taxableAmount,
        gstAmount,
        total,
      };
    }),
  [form.items, medicines]
);

  const totals = useMemo(() => {
    const subtotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.taxableAmount, 0));
    const gstAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.gstAmount, 0));
    const preDiscountTotal = roundMoney(subtotal + gstAmount);
    const rawDiscountValue = Math.max(0, Number(form.discountValue) || 0);
    const discountAmount = roundMoney(
      form.discountType === "fixed"
        ? Math.min(rawDiscountValue, preDiscountTotal)
        : Math.min(preDiscountTotal, preDiscountTotal * Math.min(rawDiscountValue, 100) / 100)
    );
    const discountedPreRoundTotal = roundMoney(preDiscountTotal - discountAmount);
    const total = Math.max(0, Math.round(discountedPreRoundTotal));
    return {
      subtotal,
      gstAmount,
      preDiscountTotal,
      discountType: form.discountType || "percentage",
      discountValue: rawDiscountValue,
      discountAmount,
      roundOff: roundMoney(total - discountedPreRoundTotal),
      total,
    };
  }, [calculatedItems, form.discountType, form.discountValue]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateItem = (index, field, value) => setForm((prev) => ({
    ...prev,
    items: prev.items.map((item, i) => i === index
      ? { ...item, [field]: value }
      : item),
  }));

  const addItem = () => setForm((prev) => ({
    ...prev,
    items: [...prev.items, { medicineId: "", quantity: "1", unitType: "Pack" }],
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

  const getFilteredMedicines = (index) => {
  const query = (medicineSearch[index] || "").trim().toLowerCase();

  return medicines
    .filter((medicine) => {
      const searchableText = [
        medicine.name,
        medicine.batchNo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || searchableText.includes(query);
    })
    .slice(0, 50);
};



const chooseMedicine = (index, medicine) => {
  const medicineId = String(medicine._id || medicine.id || "");

  const price = Number(
    medicine.price ??
    medicine.packPrice ??
    medicine.mrp ??
    medicine.unitPrice ??
    0
  );

  const stock = Number(
    medicine.quantity ??
    medicine.unitInStock ??
    medicine.stock ??
    0
  );

  setForm((previous) => {
    const items = [...previous.items];

    items[index] = {
      ...items[index],
      medicineId,
      medicineName: medicine.name || medicine.medicineName || "",
      batchNo: medicine.batchNo || medicine.batchNumber || "",
      price,
      quantity: "1",
      unitType: items[index].unitType || "Pack",
      availableStock: stock,
      expiryDate: medicine.expiryDate || medicine.expiry || "",
    };

    return { ...previous, items };
  });

  setMedicineSearch((previous) => ({
    ...previous,
    [index]: "",
  }));

  setShowMedicineOptions((previous) => ({
    ...previous,
    [index]: false,
  }));
};



  const openCreate = () => {
    setError("");
    setSuccess("");
    setShowPreview(false);
    setForm(newInvoice());
    setCustomerSearch("");
    setView("create");
  };

  const editInvoice = (invoice) => {
    setForm({
    ...newInvoice(),
    ...invoice,
    _id: invoice._id || invoice.id || "",
    invoiceDate: invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toISOString().slice(0, 10)
        : today(),
    phone: invoice.phone || "",
    email: invoice.email || "",
    address: invoice.address || "",
    paymentMode: invoice.paymentMode || "",
    discountType:
        String(invoice.discountType || "Percentage").toLowerCase() === "fixed"
            ? "fixed"
            : "percentage",
    discountValue: String(invoice.discountValue ?? 0),
    items: (invoice.items || []).map((item) => ({
        medicineId: String(item.medicineId?._id || item.medicineId || ""),
        quantity: String(item.quantity || 1),
        unitType: item.unitType || "Pack",
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
      const packSize = Math.max(1, Number(item.medicine.packSize || 1));
      const availableUnits = Number(item.medicine.quantity || 0) * packSize + Number(item.medicine.looseUnits || 0);
      const oldInvoice = form._id ? invoices.find((inv) => String(inv._id || inv.id) === String(form._id)) : null;
      const previouslyDeductedUnits = (oldInvoice?.items || [])
        .filter((old) => String(old.medicineId?._id || old.medicineId) === item.medicineId)
        .reduce((sum, old) => sum + Number(old.unitsDeducted || (Number(old.quantity || 0) * Number(old.packSize || packSize))), 0);
      const requestedUnits = Number(item.quantity) * (item.unitType === "Piece" ? 1 : packSize);
      if (requestedUnits > availableUnits + previouslyDeductedUnits) {
        setError(`Insufficient stock for ${item.medicine.name}. Available: ${availableUnits + previouslyDeductedUnits} pieces.`);
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
        paymentMode: form.paymentMode || "",
        invoiceDate: form.invoiceDate,
        notes: form.notes || "",
        discountType:
            totals.discountType === "fixed" ? "Fixed" : "Percentage",
        discountValue: totals.discountValue,
        discountAmount: totals.discountAmount,
        items: calculatedItems.map((item) => ({
            medicineId: item.medicineId,
            quantity: Number(item.quantity),
            unitType: item.unitType || "Pack",
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
          <thead><tr><th>#</th><th>MEDICINE</th><th>UNIT</th><th>QTY</th><th>RATE</th><th>TAXABLE</th><th>GST %</th><th>GST</th><th>TOTAL</th></tr></thead>
          <tbody>
            {lines.map((item, index) => (
              <tr key={`${item.medicineId || item.medicineName || "item"}-${index}`}>
                <td>{index + 1}</td>
                <td>{item.medicine?.name || item.medicineName || "Medicine"}</td>
                <td>{item.unitType || "Pack"}</td>
                <td>{Number(item.quantity) || 0}</td>
                <td>{money(item.unitPrice ?? item.price ?? item.medicine?.price ?? 0)}</td>
                <td>{money(item.taxableAmount ?? item.totalAmount ?? item.total ?? 0)}</td>
                <td>{Number(item.gstRate ?? item.medicine?.gst ?? 0)}%</td>
                <td>{money(item.gstAmount || 0)}</td>
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
          <div><span>Subtotal</span><strong>{money(summary.subtotal ?? invoiceData.subtotal ?? 0)}</strong></div>
          <div><span>GST</span><strong>{money(summary.gstAmount ?? invoiceData.gstAmount ?? 0)}</strong></div>
          <div><span>Discount{(summary.discountType ?? invoiceData.discountType) === "fixed" ? "" : ` (${Number(summary.discountValue ?? invoiceData.discountValue ?? 0)}%)`}</span><strong>− {money(summary.discountAmount ?? invoiceData.discountAmount ?? 0)}</strong></div>
          <div><span>Round Off</span><strong>{money(summary.roundOff ?? invoiceData.roundOff ?? 0)}</strong></div>
          <div className="grand"><span>Grand Total</span><strong>{money(summary.total ?? summary.grandTotal ?? invoiceData.total ?? 0)}</strong></div>
        </div>
      </div>
      <div className="invoice-document-footer">
        <strong>Thank you for your business.</strong>
        <span>Powered by SaleVitals</span>
      </div>
    </div>
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const searchable = `${invoice.invoiceNumber || ""} ${invoice.customerName || ""} ${invoice.phone || ""} ${(invoice.items || []).map((line) => line.medicineName || line.name || "").join(" ")}`.toLowerCase();
      if (query && !searchable.includes(query)) return false;

      const rawDate = invoice.invoiceDate || invoice.createdAt || "";
      const invoiceDate = rawDate ? new Date(rawDate) : null;
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (!invoiceDate || Number.isNaN(invoiceDate.getTime()) || invoiceDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);
        if (!invoiceDate || Number.isNaN(invoiceDate.getTime()) || invoiceDate > to) return false;
      }

      if (deliveryFilter !== "all") {
        const isSent = String(invoice.status || "").toLowerCase() === "sent";
        if (deliveryFilter === "sent" && !isSent) return false;
        if (deliveryFilter === "not-sent" && isSent) return false;
      }
      return true;
    });
  }, [invoices, search, dateFrom, dateTo, deliveryFilter]);

  const pharmacyInvoiceTotal = useMemo(
    () => filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total || invoice.grandTotal || 0), 0),
    [filteredInvoices]
  );

  const exportPharmacyInvoices = () => {
    const columns = [
      ["Invoice Number", (item) => item.invoiceNumber || ""],
      ["Customer", (item) => item.customerName || ""],
      ["Phone", (item) => item.phone || ""],
      ["Invoice Date", (item) => item.invoiceDate ? formatDate(item.invoiceDate) : ""],
      ["Medicines", (item) => (item.items || []).map((line) => line.medicineName || line.name || "").filter(Boolean).join("; ")],
      ["Total", (item) => Number(item.total || item.grandTotal || 0).toFixed(2)],
      ["Payment Mode", (item) => item.paymentMode || ""],
      ["Delivery Status", (item) => String(item.status || "").toLowerCase() === "sent" ? "Sent" : "Not sent"],
    ];
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columns.map(([heading]) => escapeCsv(heading)).join(","),
      ...filteredInvoices.map((item) => columns.map(([, getter]) => escapeCsv(getter(item))).join(",")),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pharmacy-invoices-${today()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const clearInvoiceFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setDeliveryFilter("all");
  };

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
        <>
          <style>{`
            .pharmacy-invoice-dashboard-stats {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin: 18px 0 14px;
            }
            .pharmacy-invoice-stat {
              display: flex;
              align-items: center;
              gap: 14px;
              min-width: 0;
              padding: 16px 18px;
              border: 1px solid #dce6f2;
              border-radius: 12px;
              background: #fff;
              box-shadow: 0 2px 8px rgba(20, 45, 80, .035);
            }
            .pharmacy-invoice-stat-icon {
              display: grid;
              place-items: center;
              flex: 0 0 44px;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: #eaf2ff;
              color: #2563eb;
              font-size: 23px;
              font-weight: 700;
            }
            .pharmacy-invoice-stat-icon.total-value { background: #e4f8ee; color: #059669; }
            .pharmacy-invoice-stat-label { color: #64748b; font-size: 12px; margin-bottom: 3px; }
            .pharmacy-invoice-stat-value { color: #10264c; font-size: 23px; font-weight: 750; line-height: 1.2; }
            .pharmacy-invoice-stat-note { color: #7b8ba5; font-size: 11px; margin-top: 4px; }
            .pharmacy-invoice-filters {
              display: grid;
              grid-template-columns: minmax(220px, 1.5fr) minmax(145px, .8fr) minmax(145px, .8fr) minmax(150px, .8fr) auto auto;
              gap: 10px;
              align-items: end;
              padding: 14px;
              border-bottom: 1px solid #e5ebf3;
              background: #fff;
            }
            .pharmacy-invoice-filter-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
            .pharmacy-invoice-filter-field label { color: #64748b; font-size: 11px; font-weight: 600; }
            .pharmacy-invoice-filter-field input, .pharmacy-invoice-filter-field select {
              box-sizing: border-box;
              width: 100%;
              min-width: 0;
              height: 38px;
              padding: 0 10px;
              border: 1px solid #d6e0ed;
              border-radius: 7px;
              background: #fff;
              color: #17345d;
              font-size: 12px;
              outline: none;
            }
            .pharmacy-invoice-filter-field input:focus, .pharmacy-invoice-filter-field select:focus { border-color: #7aa7ff; box-shadow: 0 0 0 2px rgba(37,99,235,.08); }
            .pharmacy-invoice-export, .pharmacy-invoice-clear {
              height: 38px;
              padding: 0 13px;
              border-radius: 7px;
              white-space: nowrap;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
            }
            .pharmacy-invoice-export { color: #059669; background: #fff; border: 1px solid #10b981; }
            .pharmacy-invoice-export:hover { background: #ecfdf5; }
            .pharmacy-invoice-clear { color: #475569; background: #fff; border: 1px solid #d6e0ed; }
            .pharmacy-invoice-filter-count { align-self: center; color: #7b8ba5; font-size: 11px; white-space: nowrap; }
            @media (max-width: 1050px) {
              .pharmacy-invoice-filters { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            @media (max-width: 640px) {
              .pharmacy-invoice-dashboard-stats { grid-template-columns: 1fr; }
              .pharmacy-invoice-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 10px; }
              .pharmacy-invoice-filter-search { grid-column: 1 / -1; }
              .pharmacy-invoice-filter-count { justify-self: start; }
              .pharmacy-invoice-stat { padding: 13px; }
              .pharmacy-invoice-stat-value { font-size: 20px; }
            }
          `}</style>
          <div className="pharmacy-invoice-dashboard-stats">
            <div className="pharmacy-invoice-stat">
              <div className="pharmacy-invoice-stat-icon">▤</div>
              <div>
                <div className="pharmacy-invoice-stat-label">Total Invoices</div>
                <div className="pharmacy-invoice-stat-value">{filteredInvoices.length}</div>
                <div className="pharmacy-invoice-stat-note">Invoices in selected period</div>
              </div>
            </div>
            <div className="pharmacy-invoice-stat">
              <div className="pharmacy-invoice-stat-icon total-value">₹</div>
              <div>
                <div className="pharmacy-invoice-stat-label">Total Invoice Value</div>
                <div className="pharmacy-invoice-stat-value">{money(pharmacyInvoiceTotal)}</div>
                <div className="pharmacy-invoice-stat-note">Across selected invoices</div>
              </div>
            </div>
          </div>
          <div className="invoice-list-card">
            <div className="pharmacy-invoice-filters">
              <div className="pharmacy-invoice-filter-field pharmacy-invoice-filter-search">
                <label htmlFor="pharmacy-invoice-search">Search</label>
                <input id="pharmacy-invoice-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, phone or medicine..." />
              </div>
              <div className="pharmacy-invoice-filter-field">
                <label htmlFor="pharmacy-invoice-from">From date</label>
                <input id="pharmacy-invoice-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="pharmacy-invoice-filter-field">
                <label htmlFor="pharmacy-invoice-to">To date</label>
                <input id="pharmacy-invoice-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="pharmacy-invoice-filter-field">
                <label htmlFor="pharmacy-invoice-delivery">Delivery status</label>
                <select id="pharmacy-invoice-delivery" value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="sent">Sent</option>
                  <option value="not-sent">Not sent</option>
                </select>
              </div>
              <button type="button" className="pharmacy-invoice-export" onClick={exportPharmacyInvoices}>▣ Export Excel</button>
              <button type="button" className="pharmacy-invoice-clear" onClick={clearInvoiceFilters}>Clear</button>
              <div className="pharmacy-invoice-filter-count">{filteredInvoices.length} invoices</div>
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
        </>
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
                  <div className="invoice-field"><label>Payment Mode</label><select value={form.paymentMode} onChange={(e) => updateField("paymentMode", e.target.value)}><option value="">Select payment mode</option><option value="Credit Card">Credit Card</option><option value="Debit Card">Debit Card</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Finance (EMI)">Finance (EMI)</option></select></div>
                  <div className="invoice-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Enter email" /></div>
                  <div className="invoice-field"><label>Address</label><input value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Enter address" /></div>
                </div>
              </section>

              <section className="invoice-card">
                <div className="invoice-card-header"><div><h2>Medicines & Items</h2><p>Select medicines already added to Pharmacy inventory.</p></div><button type="button" className="invoice-add-item-btn" onClick={addItem}>+ Add medicine</button></div>
                <div className="pharmacy-invoice-lines">
                  {calculatedItems.map((item, index) => (
                    <div className="pharmacy-invoice-line" key={`${item.medicineId}-${index}`}>
                      <div className="invoice-field pharmacy-line-field"><label>Medicine</label>
<div className="pharmacy-medicine-search">
  <input
    type="text"
    placeholder="Search medicine by name or batch..."
    value={
      showMedicineOptions[index]
        ? medicineSearch[index] || ""
        : item.medicine?.name || ""
    }
    autoComplete="off"
    onFocus={() => {
      setMedicineSearch((previous) => ({
        ...previous,
        [index]: item.medicine?.name || "",
      }));
      setShowMedicineOptions((previous) => ({
        ...previous,
        [index]: true,
      }));
    }}
    onChange={(e) => {
      setMedicineSearch((previous) => ({
        ...previous,
        [index]: e.target.value,
      }));
      updateItem(index, "medicineId", "");
      setShowMedicineOptions((previous) => ({
        ...previous,
        [index]: true,
      }));
    }}
    required={!item.medicineId}
  />

 
{showMedicineOptions[index] && (
  <div className="pharmacy-medicine-options">
    {getFilteredMedicines(index).length > 0 ? (
      getFilteredMedicines(index).map((medicine) => (
     <button
  type="button"
  key={medicine._id || medicine.id}
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => {
    chooseMedicine(index, medicine);
  }}
>
          <strong>{medicine.name}</strong>
          <span>
            Batch: {medicine.batchNo || "-"} ·
            {" "}{money(medicine.price)} / pack ·
            {" "}GST: {Number(medicine.gst || 0)}% ·
            {" "}Stock: {medicine.quantity} packs + {medicine.looseUnits} pieces
          </span>
        </button>
      ))
    ) : (
      <div className="pharmacy-medicine-no-results">
        No matching medicines found.
      </div>
    )}
  </div>
)}

</div>
{item.medicine && <small>Expiry: {item.medicine.expiryDate ? formatDate(item.medicine.expiryDate) : "—"} · Pack size: {item.medicine.packSize} · GST: {item.gstRate}% · Stock: {item.medicine.quantity} packs + {item.medicine.looseUnits} loose pieces</small>}</div>
                      <div className="pharmacy-line-field"><label>Sale Unit</label><select value={item.unitType || "Pack"} onChange={(e) => updateItem(index, "unitType", e.target.value)} disabled={!item.medicine}><option value="Pack">Pack</option><option value="Piece">Piece</option></select></div>
                      <div className="pharmacy-line-field"><label>Unit Price</label><input className="pharmacy-price-readonly" readOnly value={item.medicine ? money(item.unitPrice) : ""} placeholder="Auto-filled" /></div>
                      <div className="pharmacy-line-field"><label>Quantity</label><input type="number" min="1" step="1" required value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} /></div>
                      <div className="pharmacy-line-field pharmacy-line-amount-field"><label>Amount incl. GST</label><strong className="pharmacy-line-total">{money(item.total)}</strong><small>GST {item.gstRate}% · {money(item.gstAmount)}</small></div>
                      <button type="button" className="invoice-remove-item" onClick={() => removeItem(index)} disabled={form.items.length === 1} aria-label="Remove medicine">×</button>
                    </div>
                  ))}
                </div>
                <div className="pharmacy-bill-discount">
                  <div className="pharmacy-bill-discount-intro">
                    <span className="pharmacy-discount-icon">%</span>
                    <div>
                      <strong>Bill Discount</strong>
                      <p>Discount applies to the full invoice amount (subtotal + GST).</p>
                    </div>
                  </div>
                  <div className="pharmacy-bill-discount-field">
                    <label htmlFor="pharmacy-discount-type">Discount Type</label>
                    <select id="pharmacy-discount-type" value={form.discountType || "percentage"} onChange={(e) => updateField("discountType", e.target.value)}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed amount (₹)</option>
                    </select>
                  </div>
                  <div className="pharmacy-bill-discount-field">
                    <label htmlFor="pharmacy-discount-value">Discount Value</label>
                    <input id="pharmacy-discount-value" type="number" min="0" step="0.01" max={form.discountType === "percentage" ? "100" : undefined} value={form.discountValue ?? "0"} onChange={(e) => updateField("discountValue", e.target.value)} />
                  </div>
                  <div className="pharmacy-bill-discount-amount">
                    <span>Discount Amount</span>
                    <strong>− {money(totals.discountAmount)}</strong>
                  </div>
                </div>
                <div className="invoice-bottom-area">
                  <div className="invoice-notes"><label>Notes for customer</label><textarea rows="4" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Add a note..." /></div>
                  <div className="invoice-calculation">
                    <div><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div>
                    <div><span>GST</span><strong>{money(totals.gstAmount)}</strong></div>
                    <div><span>Discount</span><strong>− {money(totals.discountAmount)}</strong></div>
                    <div><span>Round Off</span><strong>{money(totals.roundOff)}</strong></div>
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
                <div><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div>
                <div><span>GST</span><strong>{money(totals.gstAmount)}</strong></div>
                <div><span>Discount</span><strong>− {money(totals.discountAmount)}</strong></div>
                <div><span>Round Off</span><strong>{money(totals.roundOff)}</strong></div>
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

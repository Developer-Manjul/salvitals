
import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../config/api";
import "./../styles/pharmacy.scss";

const API_BASE = getApiBaseUrl();

const EMPTY_MEDICINE = {
  name: "",
  price: "",
  quantity: "",
  expiryDate: "",
};

const getToken = () =>
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("vitalsToken") ||
  sessionStorage.getItem("salevitals_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("vitalsToken") ||
  localStorage.getItem("salevitals_token") ||
  "";

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
    const rowErrors = Array.isArray(data.errors)
      ? data.errors
          .slice(0, 5)
          .map((item) => `Row ${item.row}: ${item.message}`)
          .join(" ")
      : "";

    throw new Error(
      [data.message || "Something went wrong.", rowErrors]
        .filter(Boolean)
        .join(" ")
    );
  }

  return data;
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && value > 0) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) return "";

  const dateOnly = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnly) return dateOnly[1];

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime())
    ? text
    : parsed.toISOString().slice(0, 10);
}

function normalizeMedicine(row) {
  const getValue = (...keys) => {
    const key = Object.keys(row).find((item) =>
      keys.includes(item.trim().toLowerCase())
    );

    return key ? row[key] : "";
  };

  const rawPrice = getValue("price", "unit price", "selling price");
  const rawQuantity = getValue(
    "quantity",
    "qty",
    "stock",
    "stock quantity"
  );

  return {
    name: String(
      getValue("name", "medicine name", "medicine", "item name")
    ).trim(),
    price: rawPrice === "" ? "" : Number(rawPrice),
    quantity: rawQuantity === "" ? "" : Number(rawQuantity),
    expiryDate: formatDate(
      getValue("expiry date", "expiry", "expirydate")
    ),
  };
}

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [medicine, setMedicine] = useState(EMPTY_MEDICINE);
  const [showForm, setShowForm] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);

  const loadMedicines = async () => {
    try {
      setLoading(true);

      const data = await api("/api/pharmacy");

      setMedicines(
        (Array.isArray(data.medicines) ? data.medicines : []).map((item) => ({
          ...item,
          id: item._id || item.id,
          name: item.name || "",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          expiryDate: formatDate(item.expiryDate),
        }))
      );
    } catch (loadError) {
      setError(loadError.message || "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const updateField = (field, value) => {
    setMedicine((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetMedicineForm = () => {
    setMedicine(EMPTY_MEDICINE);
    setEditingMedicineId("");
    setShowForm(false);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");
    setMedicine(EMPTY_MEDICINE);
    setEditingMedicineId("");
    setShowForm(true);
  };

  const editMedicine = (item) => {
    setError("");
    setSuccess("");

    setMedicine({
      name: item.name || "",
      price: String(item.price ?? ""),
      quantity: String(item.quantity ?? ""),
      expiryDate: formatDate(item.expiryDate),
    });

    setEditingMedicineId(item._id || item.id);
    setShowForm(true);
  };

  const addMedicine = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!medicine.name.trim()) {
      setError("Please enter the medicine name.");
      return;
    }

    if (
      medicine.price === "" ||
      !Number.isFinite(Number(medicine.price)) ||
      Number(medicine.price) < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      medicine.quantity === "" ||
      !Number.isInteger(Number(medicine.quantity)) ||
      Number(medicine.quantity) < 0
    ) {
      setError("Please enter a valid whole-number quantity.");
      return;
    }

    if (!medicine.expiryDate) {
      setError("Please select the medicine expiry date.");
      return;
    }

    try {
      setSaving(true);

      const data = await api("/api/pharmacy", {
        method: "POST",
        body: JSON.stringify({
          name: medicine.name.trim(),
          price: Number(medicine.price),
          quantity: Number(medicine.quantity),
          expiryDate: medicine.expiryDate,
        }),
      });

      if (!data.medicine) {
        throw new Error("The server did not return the saved medicine.");
      }

      const savedMedicine = {
        ...data.medicine,
        id: data.medicine._id || data.medicine.id,
        expiryDate: formatDate(data.medicine.expiryDate),
      };

      setMedicines((previous) => [savedMedicine, ...previous]);
      resetMedicineForm();
      setSuccess(data.message || "Medicine added successfully.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save medicine.");
    } finally {
      setSaving(false);
    }
  };

  const updateMedicine = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!editingMedicineId) {
      setError("Medicine ID is missing. Please reopen the edit form.");
      return;
    }

    if (!medicine.name.trim()) {
      setError("Please enter the medicine name.");
      return;
    }

    if (
      medicine.price === "" ||
      !Number.isFinite(Number(medicine.price)) ||
      Number(medicine.price) < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      medicine.quantity === "" ||
      !Number.isInteger(Number(medicine.quantity)) ||
      Number(medicine.quantity) < 0
    ) {
      setError("Please enter a valid whole-number quantity.");
      return;
    }

    if (!medicine.expiryDate) {
      setError("Please select the medicine expiry date.");
      return;
    }

    try {
      setSaving(true);

      const data = await api(
        `/api/pharmacy/${encodeURIComponent(editingMedicineId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: medicine.name.trim(),
            price: Number(medicine.price),
            quantity: Number(medicine.quantity),
            expiryDate: medicine.expiryDate,
          }),
        }
      );

      if (!data.medicine) {
        throw new Error("The server did not return the updated medicine.");
      }

      const updatedMedicine = {
        ...data.medicine,
        id: data.medicine._id || data.medicine.id,
        expiryDate: formatDate(data.medicine.expiryDate),
      };

      setMedicines((previous) =>
        previous.map((item) =>
          String(item._id || item.id) === String(editingMedicineId)
            ? updatedMedicine
            : item
        )
      );

      resetMedicineForm();
      setSuccess(data.message || "Medicine updated successfully.");
    } catch (updateError) {
      setError(updateError.message || "Unable to update medicine.");
    } finally {
      setSaving(false);
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setImporting(true);

    try {
      const extension = file.name.split(".").pop().toLowerCase();
      let rows = [];

      if (extension === "csv") {
        const text = await file.text();
        const lines = text
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)
          .filter((line) => line.trim());

        if (lines.length < 2) {
          throw new Error(
            "CSV file must contain a header and at least one medicine."
          );
        }

        const parseCSVLine = (line) => {
          const values = [];
          let value = "";
          let quoted = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"' && quoted && line[i + 1] === '"') {
              value += '"';
              i++;
            } else if (char === '"') {
              quoted = !quoted;
            } else if (char === "," && !quoted) {
              values.push(value.trim());
              value = "";
            } else {
              value += char;
            }
          }

          values.push(value.trim());
          return values;
        };

        const headers = parseCSVLine(lines[0]).map((header) =>
          header.trim().toLowerCase()
        );

        rows = lines.slice(1).map((line) => {
          const values = parseCSVLine(line);

          return Object.fromEntries(
            headers.map((header, index) => [
              header,
              values[index] ?? "",
            ])
          );
        });
      } else if (extension === "xlsx") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          cellDates: true,
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!firstSheet) {
          throw new Error("The Excel file does not contain a worksheet.");
        }

        rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
      } else {
        throw new Error("Please select an .xlsx or .csv file.");
      }

      const parsed = rows
        .map(normalizeMedicine)
        .filter(
          (item) =>
            item.name ||
            item.price !== "" ||
            item.quantity !== "" ||
            item.expiryDate
        );

      if (!parsed.length) {
        throw new Error(
          "No medicines found. Check the column headings and file data."
        );
      }

      const invalidRow = parsed.find(
        (item) =>
          !item.name ||
          item.price === "" ||
          !Number.isFinite(item.price) ||
          item.price < 0 ||
          item.quantity === "" ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 0 ||
          !item.expiryDate ||
          Number.isNaN(new Date(item.expiryDate).getTime())
      );

      if (invalidRow) {
        throw new Error(
          `Check the medicine name, price, quantity and expiry date for "${
            invalidRow.name || "unnamed medicine"
          }".`
        );
      }

      if (parsed.length > 1000) {
        throw new Error("Import is limited to 1,000 medicines per file.");
      }

      const data = await api("/api/pharmacy/import", {
        method: "POST",
        body: JSON.stringify({ medicines: parsed }),
      });

      const importedMedicines = (
        Array.isArray(data.medicines) ? data.medicines : []
      ).map((item) => ({
        ...item,
        id: item._id || item.id,
        expiryDate: formatDate(item.expiryDate),
      }));

      setMedicines((previous) => [...importedMedicines, ...previous]);

      setSuccess(
        data.message ||
          `${importedMedicines.length} medicine(s) imported successfully.`
      );
    } catch (importError) {
      setError(
        importError.message ||
          "Unable to import this file. Please check its format."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const removeMedicine = async (id) => {
    setError("");
    setSuccess("");

    if (!id) {
      setError("Medicine ID is missing. Please refresh the page and try again.");
      return;
    }

    try {
      const data = await api(`/api/pharmacy/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setMedicines((previous) =>
        previous.filter(
          (item) => String(item._id || item.id) !== String(id)
        )
      );

      setSuccess(data.message || "Medicine deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete medicine.");
    }
  };

  const filteredMedicines = medicines.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = medicines.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const stockValue = medicines.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="pharmacy-page">
      <div className="pharmacy-header">
        <div>
          <h2>Pharmacy</h2>
          <p>Manage medicines, stock quantities and expiry dates.</p>
        </div>

        <div className="pharmacy-header-actions">
          <button
            type="button"
            className="pharmacy-btn pharmacy-btn-outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing || loading}
          >
            {importing ? "Importing..." : "Import Excel / CSV"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            hidden
            onChange={importFile}
          />

          <button
            type="button"
            className="pharmacy-btn pharmacy-btn-primary"
            onClick={openAddForm}
          >
            + Add Medicine
          </button>
        </div>
      </div>

      {error && (
        <div className="pharmacy-alert pharmacy-alert-error">{error}</div>
      )}

      {success && (
        <div className="pharmacy-alert pharmacy-alert-success">{success}</div>
      )}

      <div className="pharmacy-stats">
        <div className="pharmacy-stat-card">
          <span>Total Medicines</span>
          <strong>{medicines.length}</strong>
        </div>

        <div className="pharmacy-stat-card">
          <span>Total Stock (Pieces)</span>
          <strong>{totalStock.toLocaleString("en-IN")}</strong>
        </div>

        <div className="pharmacy-stat-card">
          <span>Stock Value</span>
          <strong>{formatMoney(stockValue)}</strong>
        </div>
      </div>

      {showForm && (
        <div className="pharmacy-form-card">
          <div className="pharmacy-form-heading">
            <div>
              <h3>{editingMedicineId ? "Edit Medicine" : "Add Medicine"}</h3>
              <p>
                {editingMedicineId
                  ? "Update the medicine and stock details."
                  : "Enter the medicine and current stock details."}
              </p>
            </div>

            <button
              type="button"
              className="pharmacy-close-btn"
              onClick={resetMedicineForm}
              disabled={saving}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={editingMedicineId ? updateMedicine : addMedicine}>
            <div className="pharmacy-form-grid">
              <label>
                Medicine Name *
                <input
                  type="text"
                  placeholder="e.g. Tablet Name"
                  value={medicine.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Price (₹) *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={medicine.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Quantity (Pieces) *
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 200"
                  value={medicine.quantity}
                  onChange={(event) =>
                    updateField("quantity", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Expiry Date *
                <input
                  type="date"
                  value={medicine.expiryDate}
                  onChange={(event) =>
                    updateField("expiryDate", event.target.value)
                  }
                  required
                />
              </label>
            </div>

            <div className="pharmacy-form-actions">
              <button
                type="button"
                className="pharmacy-btn pharmacy-btn-outline"
                onClick={resetMedicineForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="pharmacy-btn pharmacy-btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingMedicineId
                    ? "Update Medicine"
                    : "Save Medicine"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pharmacy-inventory-card">
        <div className="pharmacy-inventory-heading">
          <div>
            <h3>Medicine Inventory</h3>
            <p>{filteredMedicines.length} medicine(s)</p>
          </div>

          <input
            className="pharmacy-search"
            type="search"
            placeholder="Search medicines..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="pharmacy-table-wrapper">
          <table className="pharmacy-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Stock Value</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="pharmacy-empty">
                    Loading medicines...
                  </td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="pharmacy-empty">
                    {search
                      ? "No medicines match your search."
                      : "No medicines added yet. Add a medicine manually or import an Excel/CSV file."}
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((item) => (
                  <tr key={item._id || item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{formatMoney(item.price)}</td>
                    <td>{item.quantity.toLocaleString("en-IN")} pcs</td>
                    <td>{item.expiryDate || "-"}</td>
                    <td>{formatMoney(item.price * item.quantity)}</td>
                    <td>
                      <div className="pharmacy-row-actions">
                        <button
                          type="button"
                          className="pharmacy-icon-btn pharmacy-edit-icon"
                          onClick={() => editMedicine(item)}
                          title="Edit medicine"
                          aria-label={`Edit ${item.name}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="pharmacy-icon-btn pharmacy-delete-icon"
                          onClick={() =>
                            removeMedicine(item._id || item.id)
                          }
                          title="Delete medicine"
                          aria-label={`Delete ${item.name}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="m19 6-1 14H6L5 6" />
                            <path d="M10 11v5M14 11v5" />
                          </svg>
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
}

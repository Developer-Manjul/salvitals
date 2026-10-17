
import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../config/api";
import "./../styles/pharmacy.scss";

const API_BASE = getApiBaseUrl();

const EMPTY_MEDICINE = {
  name: "",
  batchNo: "",
  packPrice: "",
  gst: "0",
  packSize: "10",
  unitInStock: "",
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

function calculateGST(basePrice, gstRate) {
  return ((Number(basePrice) || 0) * (Number(gstRate) || 0)) / 100;
}

function calculateFinalPrice(basePrice, gstRate) {
  return (Number(basePrice) || 0) + calculateGST(basePrice, gstRate);
}

function formatDate(value) {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && value > 0) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) return "";

  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const monthYear = text.match(/^([A-Za-z]{3,9})[-\s]+(\d{4})$/);

  if (monthYear) {
    const parsed = new Date(
      `${monthYear[1]} 1, ${monthYear[2]} 00:00:00 UTC`
    );

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeMedicine(row) {
  const getValue = (...aliases) => {
    const wanted = new Set(aliases.map(normalizeHeader));
    const key = Object.keys(row).find((item) =>
      wanted.has(normalizeHeader(item))
    );

    return key === undefined ? "" : row[key];
  };

  const rawPackPrice = getValue(
    "packPrice",
    "Pack(MRP)",
    "Pack MRP",
    "Pack Price",
    "Base Price",
    "BasePrice",
    "MRP",
    "price"
  );

  const rawGST = getValue(
    "gst",
    "GST (%)",
    "GST %",
    "GST Percentage",
    "GST Rate",
    "Tax Rate"
  );

  const rawPackSize = getValue(
    "packSize",
    "Pack Size",
    "Pieces Per Pack",
    "Tablets Per Pack",
    "Units Per Pack"
  );

  const rawStock = getValue(
    "unitInStock",
    "Units in Stock",
    "Unit in Stock",
    "stock",
    "quantity",
    "qty"
  );

  const gstText =
    rawGST === "" || rawGST === null || rawGST === undefined
      ? "0"
      : String(rawGST).replace(/%/g, "").trim();

  const packSizeText =
    rawPackSize === "" || rawPackSize === null || rawPackSize === undefined
      ? "10"
      : String(rawPackSize).trim();

  return {
    name: String(
      getValue("name", "Med Name", "Medicine Name", "Medicine", "Item Name")
    ).trim(),

    batchNo: String(
      getValue("batchNo", "Batch", "Batch No", "Batch Number")
    ).trim(),

    packPrice:
      rawPackPrice === "" || rawPackPrice === null
        ? ""
        : Number(
            typeof rawPackPrice === "string"
              ? rawPackPrice.replace(/,/g, "").trim()
              : rawPackPrice
          ),

    gst: gstText === "" ? 0 : Number(gstText),

    packSize: Number(packSizeText),

    unitInStock:
      rawStock === "" || rawStock === null
        ? ""
        : Number(rawStock),

    expiryDate: formatDate(
      getValue("expiryDate", "Expiry", "Expiry Date")
    ),
  };
}

function normalizeLoadedMedicine(item) {
  return {
    ...item,
    id: item._id || item.id,
    name: item.name || "",
    batchNo: item.batchNo || "",
    packPrice: Number(item.packPrice) || 0,
    gst: Number(item.gst) || 0,
    packSize: Number(item.packSize) || 10,
    unitInStock: Number(item.unitInStock) || 0,
    expiryDate: formatDate(item.expiryDate),
  };
}

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [medicine, setMedicine] = useState(EMPTY_MEDICINE);
  const [showForm, setShowForm] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
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
        (Array.isArray(data.medicines) ? data.medicines : []).map(
          normalizeLoadedMedicine
        )
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
      batchNo: item.batchNo || "",
      packPrice: String(item.packPrice ?? ""),
      gst: String(item.gst ?? 0),
      packSize: String(item.packSize ?? 10),
      unitInStock: String(item.unitInStock ?? ""),
      expiryDate: formatDate(item.expiryDate),
    });

    setEditingMedicineId(item._id || item.id);
    setShowForm(true);
  };

  const validateMedicine = () => {
    if (!medicine.name.trim()) {
      setError("Please enter the medicine name.");
      return false;
    }

    if (!medicine.batchNo.trim()) {
      setError("Please enter the batch number.");
      return false;
    }

    if (
      medicine.packPrice === "" ||
      !Number.isFinite(Number(medicine.packPrice)) ||
      Number(medicine.packPrice) < 0
    ) {
      setError("Please enter a valid base price.");
      return false;
    }

    if (
      medicine.gst === "" ||
      !Number.isFinite(Number(medicine.gst)) ||
      Number(medicine.gst) < 0 ||
      Number(medicine.gst) > 100
    ) {
      setError("Please enter a valid GST percentage between 0 and 100.");
      return false;
    }

    if (
      medicine.packSize === "" ||
      !Number.isInteger(Number(medicine.packSize)) ||
      Number(medicine.packSize) < 1
    ) {
      setError("Please enter a valid whole-number pack size greater than zero.");
      return false;
    }

    if (
      medicine.unitInStock === "" ||
      !Number.isInteger(Number(medicine.unitInStock)) ||
      Number(medicine.unitInStock) < 0
    ) {
      setError("Please enter a valid whole-number unit stock.");
      return false;
    }

    if (!medicine.expiryDate || !formatDate(medicine.expiryDate)) {
      setError("Please select a valid medicine expiry date.");
      return false;
    }

    return true;
  };

  const addMedicine = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validateMedicine()) return;

    try {
      setSaving(true);

      const data = await api("/api/pharmacy", {
        method: "POST",
        body: JSON.stringify({
          name: medicine.name.trim(),
          batchNo: medicine.batchNo.trim(),
          packPrice: Number(medicine.packPrice),
          gst: Number(medicine.gst),
          packSize: Number(medicine.packSize),
          unitInStock: Number(medicine.unitInStock),
          expiryDate: medicine.expiryDate,
        }),
      });

      if (!data.medicine) {
        throw new Error("The server did not return the saved medicine.");
      }

      setMedicines((previous) => [
        normalizeLoadedMedicine(data.medicine),
        ...previous,
      ]);

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

    if (!validateMedicine()) return;

    try {
      setSaving(true);

      const data = await api(
        `/api/pharmacy/${encodeURIComponent(editingMedicineId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: medicine.name.trim(),
            batchNo: medicine.batchNo.trim(),
            packPrice: Number(medicine.packPrice),
            gst: Number(medicine.gst),
            packSize: Number(medicine.packSize),
            unitInStock: Number(medicine.unitInStock),
            expiryDate: medicine.expiryDate,
          }),
        }
      );

      if (!data.medicine) {
        throw new Error("The server did not return the updated medicine.");
      }

      const updatedMedicine = normalizeLoadedMedicine(data.medicine);

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

        const headers = parseCSVLine(lines[0]);

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

        rows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "",
          raw: false,
        });
      } else {
        throw new Error("Please select an .xlsx or .csv file.");
      }

      const parsed = rows
        .map(normalizeMedicine)
        .filter(
          (item) =>
            item.name ||
            item.batchNo ||
            item.packPrice !== "" ||
            item.gst !== 0 ||
            item.unitInStock !== "" ||
            item.expiryDate
        );

      if (!parsed.length) {
        throw new Error(
          "No medicines found. Expected columns: Med Name, Batch, Pack Price, GST (%), Pack Size, Units in Stock, Expiry."
        );
      }

      const invalidRow = parsed.find(
        (item) =>
          !item.name ||
          !item.batchNo ||
          item.packPrice === "" ||
          !Number.isFinite(item.packPrice) ||
          item.packPrice < 0 ||
          !Number.isFinite(item.gst) ||
          item.gst < 0 ||
          item.gst > 100 ||
          !Number.isInteger(item.packSize) ||
          item.packSize < 1 ||
          item.unitInStock === "" ||
          !Number.isInteger(item.unitInStock) ||
          item.unitInStock < 0 ||
          !item.expiryDate
      );

      if (invalidRow) {
        throw new Error(
          `Check medicine name, batch, pack price, GST (0–100), pack size, packs in stock and expiry date for "${itemName(invalidRow)}".`
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
      ).map(normalizeLoadedMedicine);

      setMedicines((previous) => [
        ...importedMedicines,
        ...previous,
      ]);

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
    `${item.name} ${item.batchNo || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMedicines = filteredMedicines.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const totalStock = medicines.reduce(
    (total, item) => total + item.unitInStock,
    0
  );

  const stockValue = medicines.reduce(
    (total, item) => total + calculateFinalPrice(item.packPrice, item.gst) * item.unitInStock,
    0
  );

  const previewGST = calculateGST(medicine.packPrice, medicine.gst);
  const previewFinalPrice = calculateFinalPrice(medicine.packPrice, medicine.gst);

  return (
    <div className="pharmacy-page">
      <div className="pharmacy-header">
        <div>
          <h2>Pharmacy</h2>
          <p>Manage medicines, batch numbers, stock and expiry dates.</p>
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
          <span>Packs in Stock</span>
          <strong>{totalStock.toLocaleString("en-IN")}</strong>
        </div>

        <div className="pharmacy-stat-card">
          <span>Stock Value (Final Pack Price × Packs)</span>
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
                  : "Enter the base price, GST percentage and pack size."}
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
                  placeholder="e.g. ABC Tablet"
                  value={medicine.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Batch No. *
                <input
                  type="text"
                  placeholder="e.g. BATCH-001"
                  value={medicine.batchNo}
                  onChange={(event) =>
                    updateField("batchNo", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Base Price (₹) *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 82.70"
                  value={medicine.packPrice}
                  onChange={(event) =>
                    updateField("packPrice", event.target.value)
                  }
                  required
                />
                <small>GST will be added to this base price.</small>
              </label>

              <label>
                GST (%) *
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 5"
                  value={medicine.gst}
                  onChange={(event) =>
                    updateField("gst", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Pack Size (tablets/pieces per pack) *
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 10"
                  value={medicine.packSize}
                  onChange={(event) => updateField("packSize", event.target.value)}
                  required
                />
              </label>

              <label>
                Unit in Stock *
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 19"
                  value={medicine.unitInStock}
                  onChange={(event) =>
                    updateField("unitInStock", event.target.value)
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

            {medicine.packPrice !== "" &&
              medicine.gst !== "" &&
              Number.isFinite(Number(medicine.packPrice)) &&
              Number.isFinite(Number(medicine.gst)) &&
              Number(medicine.packPrice) >= 0 &&
              Number(medicine.gst) >= 0 &&
              Number(medicine.gst) <= 100 && (
                <div className="pharmacy-gst-preview">
                  <span>
                    Base Price: {formatMoney(medicine.packPrice)}
                  </span>
                  <span>
                    GST ({Number(medicine.gst)}%): {formatMoney(previewGST)}
                  </span>
                  <strong>Final Price: {formatMoney(previewFinalPrice)}</strong>
                </div>
              )}

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
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="pharmacy-table-wrapper">
          <table className="pharmacy-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Batch No.</th>
                <th>Base Price</th>
                <th>GST (%)</th>
                <th>Pack Size</th>
                <th>GST Amount</th>
                <th>Final Price</th>
               <th>Unit in Stock</th>
                <th>Expiry Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="pharmacy-empty">
                    Loading medicines...
                  </td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="10" className="pharmacy-empty">
                    {search
                      ? "No medicines match your search."
                      : "No medicines added yet. Add a medicine manually or import an Excel/CSV file."}
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((item) => (
                  <tr key={item._id || item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.batchNo || "-"}</td>
                    <td>{formatMoney(item.packPrice)}</td>
                    <td>{item.gst}%</td>
                    <td>{item.packSize} pcs/pack</td>
                   <td>
                  {formatMoney(calculateGST(item.packPrice, item.gst))}
                </td>
                    <td>{formatMoney(calculateFinalPrice(item.packPrice, item.gst))}</td>
                    <td>{item.unitInStock.toLocaleString("en-IN")} packs ({(item.unitInStock * item.packSize).toLocaleString("en-IN")} pcs)</td>
                    <td>{item.expiryDate || "-"}</td>
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

        {!loading && filteredMedicines.length > 0 && (
          <div className="pharmacy-pagination">
            <div className="pharmacy-pagination-info">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredMedicines.length)} of {filteredMedicines.length} medicines
            </div>

            <div className="pharmacy-pagination-controls">
              <button
                type="button"
                className="pharmacy-page-btn"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - safeCurrentPage) <= 1
                )
                .reduce((pages, page, index, visiblePages) => {
                  if (index > 0 && page - visiblePages[index - 1] > 1) {
                    pages.push("ellipsis-" + page);
                  }
                  pages.push(page);
                  return pages;
                }, [])
                .map((page) =>
                  typeof page === "string" ? (
                    <span className="pharmacy-page-ellipsis" key={page}>…</span>
                  ) : (
                    <button
                      type="button"
                      key={page}
                      className={`pharmacy-page-btn ${safeCurrentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                      aria-current={safeCurrentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )
                )}

              <button
                type="button"
                className="pharmacy-page-btn"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function itemName(item) {
  return item?.name || "unnamed medicine";
}

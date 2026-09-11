import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function Services() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [editingService, setEditingService] = useState(null);

    const [form, setForm] = useState({
        name: "",
    });

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("vitalsToken") ||
            sessionStorage.getItem("token") ||
            sessionStorage.getItem("vitalsToken") ||
            ""
        );
    };

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                setError("Please sign in again.");
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${getApiBaseUrl()}/api/services`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(
                    data.message ||
                    "Unable to load services."
                );
                setLoading(false);
                return;
            }

            setServices(data.services || []);
            setLoading(false);
        } catch (err) {
            console.error(
                "Load services error:",
                err
            );

            setError(
                "Unable to connect to server."
            );

            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingService(null);

        setForm({
            name: "",
        });

        setError("");
        setShowModal(true);
    };

    const openEditModal = (service) => {
        setEditingService(service);

        setForm({
            name: service.name || "",
        });

        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingService(null);
        setForm({
            name: "",
        });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const serviceName =
                form.name.trim();

            if (!serviceName) {
                setError(
                    "Please enter service name."
                );

                setSaving(false);
                return;
            }

            const token = getToken();

            if (!token) {
                setError(
                    "Please sign in again."
                );

                setSaving(false);
                return;
            }

            const isEditing =
                Boolean(editingService);

            const url = isEditing
                ? `${getApiBaseUrl()}/api/services/${editingService._id}`
                : `${getApiBaseUrl()}/api/services`;

            const method = isEditing
                ? "PUT"
                : "POST";

            const response = await fetch(
                url,
                {
                    method,
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                    body:
                        JSON.stringify({
                            name:
                                serviceName,
                        }),
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    data.message ||
                    (
                        isEditing
                            ? "Unable to update service."
                            : "Unable to add service."
                    )
                );

                setSaving(false);
                return;
            }

            if (isEditing) {
                setServices((prev) =>
                    prev.map((service) =>
                        service._id ===
                        editingService._id
                            ? data.service
                            : service
                    )
                );
            } else {
                setServices((prev) => [
                    data.service,
                    ...prev,
                ]);
            }

            setShowModal(false);

            setEditingService(null);

            setForm({
                name: "",
            });

            setSaving(false);

        } catch (err) {
            console.error(
                "Save service error:",
                err
            );

            setError(
                "Unable to connect to server."
            );

            setSaving(false);
        }
    };

    const handleDelete = async (service) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${service.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setError("");

            const token = getToken();

            if (!token) {
                alert(
                    "Please sign in again."
                );

                setDeleting(false);
                return;
            }

            const response =
                await fetch(
                    `${getApiBaseUrl()}/api/services/${service._id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    data.message ||
                    "Unable to delete service."
                );

                setDeleting(false);
                return;
            }

            setServices((prev) =>
                prev.filter(
                    (item) =>
                        item._id !==
                        service._id
                )
            );

            setDeleting(false);

        } catch (err) {
            console.error(
                "Delete service error:",
                err
            );

            setError(
                "Unable to connect to server."
            );

            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="services-page">
                <div className="services-loading">
                    Loading services...
                </div>
            </div>
        );
    }

    return (
        <div className="services-page">

            <div className="services-card">

                <div className="services-card-header">

                    <div>
                        <h2>
                            Services
                        </h2>

                        <p>
                            Manage the services offered by your clinic.
                        </p>
                    </div>

                </div>

                {error && !showModal && (
                    <div className="services-error">
                        {error}
                    </div>
                )}

                <div className="services-toolbar">

                    <span>
                        {services.length}{" "}
                        {services.length === 1
                            ? "service"
                            : "services"}
                    </span>

                    <button
                        type="button"
                        className="services-add-btn"
                        onClick={
                            openAddModal
                        }
                    >
                        <span>
                            +
                        </span>

                        Add service
                    </button>

                </div>

                <div className="services-table-wrap">

                    <table className="services-table">

                        <thead>
                            <tr>

                                <th>
                                    SERVICE
                                </th>

                                <th className="services-action-heading">
                                    ACTION
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {services.length === 0 ? (
                                <tr>

                                    <td
                                        colSpan="2"
                                        className="services-empty"
                                    >
                                        No services added yet.
                                    </td>

                                </tr>
                            ) : (
                                services.map(
                                    (service) => (
                                        <tr
                                            key={
                                                service._id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        service.name
                                                    }
                                                </strong>
                                            </td>

                                            <td>

                                                <div className="services-row-actions">

                                                    <button
                                                        type="button"
                                                        className="service-edit-btn"
                                                        onClick={() =>
                                                            openEditModal(
                                                                service
                                                            )
                                                        }
                                                        aria-label={`Edit ${service.name}`}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="service-delete-btn"
                                                        onClick={() =>
                                                            handleDelete(
                                                                service
                                                            )
                                                        }
                                                        disabled={
                                                            deleting
                                                        }
                                                        aria-label={`Delete ${service.name}`}
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {showModal && (
                <div
                    className="service-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="service-modal">

                        <div className="service-modal-header">

                            <div>

                                <h3>
                                    {editingService
                                        ? "Edit service"
                                        : "Add service"}
                                </h3>

                                <p>
                                    {editingService
                                        ? "Update your service name."
                                        : "Add a service to your clinic."}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="service-modal-close"
                                onClick={
                                    closeModal
                                }
                            >
                                ×
                            </button>

                        </div>

                        {error && (
                            <div className="services-error">
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="service-form-field">

                                <label>
                                    Name
                                </label>

                                <input
                                    type="text"
                                    value={
                                        form.name
                                    }
                                    onChange={(e) =>
                                        setForm({
                                            name:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Enter service name"
                                    autoFocus
                                />

                            </div>

                            <div className="service-modal-footer">

                                <button
                                    type="button"
                                    className="service-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="service-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingService
                                            ? "Update service"
                                            : "Save service"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}
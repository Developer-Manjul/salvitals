import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../config/api";

export default function ClinicProfile({ user, isHealthcare = false }) {
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    clinicName: user?.clinicName || "",
    phone: user?.phone || "",
    phoneCountryCode: "+91",
    speciality: user?.speciality || "",
    numberOfDoctors: user?.numberOfDoctors || "",
    displayName: user?.displayName || user?.clinicName || "",
    address: "",
    gstin: "",
    zipCode: "",
    website: "",
    clinicLogo: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
        `${getApiBaseUrl()}/api/auth/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to load profile."
        );
        setLoading(false);
        return;
      }

      const profileUser = data.user || {};

      setProfile({
        name: profileUser.name || user?.name || "",
        email: profileUser.email || user?.email || "",
        clinicName: profileUser.clinicName || user?.clinicName || "",
        phone: profileUser.phone || user?.phone || "",
        phoneCountryCode:
          profileUser.phoneCountryCode || "+91",
        speciality: profileUser.speciality || user?.speciality || "",
        numberOfDoctors:
          profileUser.numberOfDoctors || user?.numberOfDoctors || "",
        displayName:
          profileUser.displayName || profileUser.clinicName || user?.clinicName || "",
        address:
          profileUser.address || "",
        gstin:
          profileUser.gstin || "",
        zipCode:
          profileUser.zipCode || "",
        website:
          profileUser.website || "",
        clinicLogo:
          profileUser.clinicLogo || "",
      });

      setLoading(false);
    } catch (err) {
      console.error(
        "Load profile error:",
        err
      );

      setError(
        "Unable to connect to server."
      );

      setLoading(false);
    }
  };

  const handleChange = (
    field,
    value
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a PNG, JPG, WEBP or SVG image."
      );
      return;
    }

    if (file.size > 240 * 1024) {
      setError(
        "Logo size must be 240 KB or less."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((prev) => ({
        ...prev,
        clinicLogo: reader.result,
      }));

      setMessage("");
      setError("");
    };

    reader.onerror = () => {
      setError(
        "Unable to read the selected logo."
      );
    };

    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setProfile((prev) => ({
      ...prev,
      clinicLogo: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setMessage("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Please sign in again."
        );
        setSaving(false);
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: profile.name,
            clinicName: profile.clinicName,
            phone: profile.phone,
            phoneCountryCode:
              profile.phoneCountryCode,
            speciality: profile.speciality,
            numberOfDoctors:
              profile.numberOfDoctors,
            displayName:
              profile.displayName,
            address: profile.address,
            gstin: profile.gstin,
            zipCode: profile.zipCode,
            website: profile.website,
            clinicLogo:
              profile.clinicLogo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to save your profile."
        );
        setSaving(false);
        return;
      }

      const updatedUser =
        data.user || {};

      setProfile({
        name:
          updatedUser.name || "",

        email:
          updatedUser.email ||
          profile.email,

        clinicName:
          updatedUser.clinicName || "",

        phone:
          updatedUser.phone || "",

        phoneCountryCode:
          updatedUser.phoneCountryCode ||
          "+91",

        speciality:
          updatedUser.speciality || "",

        numberOfDoctors:
          updatedUser.numberOfDoctors || "",

        displayName:
          updatedUser.displayName || "",

        address:
          updatedUser.address || "",

        gstin:
          updatedUser.gstin || "",

        zipCode:
          updatedUser.zipCode || "",

        website:
          updatedUser.website || "",

        clinicLogo:
          updatedUser.clinicLogo || "",
      });

      const currentUserJson =
        localStorage.getItem("vitalsUser") ||
        localStorage.getItem("user") ||
        localStorage.getItem("salevitals_user") ||
        sessionStorage.getItem("vitalsUser") ||
        sessionStorage.getItem("user") ||
        sessionStorage.getItem("salevitals_user") ||
        "{}";

      let currentUser = {};

      try {
        currentUser =
          JSON.parse(currentUserJson);
      } catch {
        currentUser = {};
      }

      const savedUser = {
        ...currentUser,
        ...updatedUser,
      };

      if (
        localStorage.getItem("vitalsUser")
      ) {
        localStorage.setItem(
          "vitalsUser",
          JSON.stringify(savedUser)
        );
      }

      if (
        localStorage.getItem("user")
      ) {
        localStorage.setItem(
          "user",
          JSON.stringify(savedUser)
        );
      }

      if (
        localStorage.getItem(
          "salevitals_user"
        )
      ) {
        localStorage.setItem(
          "salevitals_user",
          JSON.stringify(savedUser)
        );
      }

      if (
        sessionStorage.getItem("vitalsUser")
      ) {
        sessionStorage.setItem(
          "vitalsUser",
          JSON.stringify(savedUser)
        );
      }

      if (
        sessionStorage.getItem("user")
      ) {
        sessionStorage.setItem(
          "user",
          JSON.stringify(savedUser)
        );
      }

      if (
        sessionStorage.getItem(
          "salevitals_user"
        )
      ) {
        sessionStorage.setItem(
          "salevitals_user",
          JSON.stringify(savedUser)
        );
      }

      setMessage(
        "Your profile saved successfully."
      );

      setSaving(false);
    } catch (err) {
      console.error(
        "Save profile error:",
        err
      );

      setError(
        "Unable to connect to server."
      );

      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="clinic-profile-page">
        <div className="clinic-profile-loading">
          Loading  profile...
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-profile-page">

      <div className="clinic-profile-header">
        <div>
          <h2>
            {isHealthcare ? "Profile" : "Business Profile"}
          </h2>

          <p>
            Appears on invoices, forms and
            WhatsApp templates.
          </p>
        </div>
      </div>

      {message && (
        <div className="clinic-profile-success">
          {message}
        </div>
      )}

      {error && (
        <div className="clinic-profile-error">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="clinic-profile-form"
      >

        <div className="clinic-logo-section">

          <div className="clinic-logo-preview">

            {profile.clinicLogo ? (
              <img
                src={profile.clinicLogo}
                alt="your logo"
              />
            ) : (
              <div className="clinic-logo-placeholder">
                <span>∿</span>
              </div>
            )}

          </div>

          <div className="clinic-logo-content">

            <strong>
              {isHealthcare ? "Website logo" : "Business logo"}
            </strong>

            <span>
              PNG, JPG or WEBP supported
            </span>

            <div className="clinic-logo-actions">

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                hidden
              />

              <button
                type="button"
                className="clinic-upload-btn"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <span>↥</span>
                Upload new
              </button>

              {profile.clinicLogo && (
                <button
                  type="button"
                  className="clinic-remove-btn"
                  onClick={removeLogo}
                >
                  Remove
                </button>
              )}

            </div>

          </div>

        </div>

        <div className="clinic-profile-grid">

          <div className="clinic-field">

            <label>
              {isHealthcare ? "Business Name" : "Business Name"}
            </label>

            <input
              type="text"
              value={profile.clinicName}
              onChange={(e) =>
                handleChange(
                  "clinicName",
                  e.target.value
                )
              }
              placeholder={
                isHealthcare
                  ? "Enter business name"
                  : "Enter business name"
              }
            />

          </div>

          <div className="clinic-field">

            <label>
              Display Name
            </label>

            <input
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                handleChange(
                  "displayName",
                  e.target.value
                )
              }
              placeholder="Enter display name"
            />

          </div>

          <div className="clinic-field">

            <label>
              {isHealthcare ? "Person Name" : "Contact Person"}
            </label>

            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                handleChange(
                  "name",
                  e.target.value
                )
              }
              placeholder={
                isHealthcare
                  ? "Enter person name"
                  : "Enter contact person"
              }
            />

          </div>

          <div className="clinic-field">

            <label>
              Work email
            </label>

            <input
              type="email"
              value={profile.email}
              disabled
            />

            <small>
              Email cannot be changed here.
            </small>

          </div>

          <div className="clinic-field">

            <label>
              Phone Number
            </label>

            <div className="clinic-phone-row">

              <input
                className="clinic-country-code"
                type="text"
                value={
                  profile.phoneCountryCode
                }
                onChange={(e) =>
                  handleChange(
                    "phoneCountryCode",
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                inputMode="numeric"
                value={
                  profile.phone
                }
                onChange={(e) =>
                  handleChange(
                    "phone",
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Enter phone number"
              />

            </div>

          </div>

          <div className="clinic-field">

            <label>
              Speciality
            </label>

            <input
              type="text"
              value={
                profile.speciality
              }
              onChange={(e) =>
                handleChange(
                  "speciality",
                  e.target.value
                )
              }
              placeholder="Select speciality"
            />

          </div>

          <div className="clinic-field">

            <label>
              Number of Team
            </label>

            <select
              value={
                profile.numberOfDoctors
              }
              onChange={(e) =>
                handleChange(
                  "numberOfDoctors",
                  e.target.value
                )
              }
            >

              <option value="">
                Select number of team
              </option>

              <option value="1">
                1
              </option>

              <option value="3">
                3
              </option>

              <option value="5">
                5
              </option>

              <option value="custom">
                More
              </option>

            </select>

          </div>

          <div className="clinic-field">

            <label>
              Tax number / GSTIN
            </label>

            <input
              type="text"
              value={
                profile.gstin
              }
              onChange={(e) =>
                handleChange(
                  "gstin",
                  e.target.value
                )
              }
              placeholder="Enter GSTIN or tax number"
            />

          </div>

          <div className="clinic-field clinic-field-full">

            <label>
              Address
            </label>

            <textarea
              rows="3"
              value={
                profile.address
              }
              onChange={(e) =>
                handleChange(
                  "address",
                  e.target.value
                )
              }
              placeholder="Enter complete clinic address"
            />

          </div>

          <div className="clinic-field">

            <label>
              ZIP Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={
                profile.zipCode
              }
              onChange={(e) =>
                handleChange(
                  "zipCode",
                  e.target.value
                )
              }
              placeholder="Enter ZIP code"
            />

          </div>

          <div className="clinic-field">

            <label>
              Website link
            </label>

            <input
              type="url"
              value={
                profile.website
              }
              onChange={(e) =>
                handleChange(
                  "website",
                  e.target.value
                )
              }
              placeholder="https://yourclinic.com"
            />

          </div>

        </div>

        <div className="clinic-profile-footer">

          <button
            type="button"
            className="clinic-cancel-btn"
            onClick={loadProfile}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="clinic-save-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>

        </div>

      </form>

    </div>
  );
}
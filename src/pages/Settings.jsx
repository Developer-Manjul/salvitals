import { useState } from "react";
import ClinicProfile from "./ClinicProfile";
import Services from "./Services";

const settingsGroups = [
  {
    label: "Profile",
    items: [
      "Profile",
      "Doctors",
      "Team Members",
      "Roles & Permissions",
    ],
  },
  {
    label: "CRM",
    items: [
      "Lead Sources",
      "Lead Stages",
      "Services",
      "Form Settings",
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      "WhatsApp",
      "Integrations",
      "Notification Settings",
      "AI Settings",
    ],
  },
  {
    label: "BILLING",
    items: [
      "Invoice Settings",
      "GST Settings",
      "Payment Settings",
      "Plan & Billing",
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      "Security",
    ],
  },
];

function PlaceholderContent({ title }) {
  return (
    <div className="settings-placeholder">
      <div className="settings-placeholder-inner">
        <h2>{title}</h2>

        <p>
          Configure your {title.toLowerCase()} settings here.
        </p>
      </div>
    </div>
  );
}

export default function Settings({ user }) {
  const [activeTab, setActiveTab] =
    useState("Clinic Profile");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Clinic Profile":
        return (
          <ClinicProfile
            user={user}
          />
        );

      case "Doctors":
        return (
          <PlaceholderContent
            title="Doctors"
          />
        );

      case "Team Members":
        return (
          <PlaceholderContent
            title="Team Members"
          />
        );

      case "Roles & Permissions":
        return (
          <PlaceholderContent
            title="Roles & Permissions"
          />
        );

      case "Lead Sources":
        return (
          <PlaceholderContent
            title="Lead Sources"
          />
        );

      case "Lead Stages":
        return (
          <PlaceholderContent
            title="Lead Stages"
          />
        );

      case "Services":
        return (
          <Services />
        );
      case "Form Settings":
        return (
          <PlaceholderContent
            title="Form Settings"
          />
        );

      case "WhatsApp":
        return (
          <PlaceholderContent
            title="WhatsApp"
          />
        );

      case "Integrations":
        return (
          <PlaceholderContent
            title="Integrations"
          />
        );

      case "Notification Settings":
        return (
          <PlaceholderContent
            title="Notification Settings"
          />
        );

      case "AI Settings":
        return (
          <PlaceholderContent
            title="AI Settings"
          />
        );

      case "Invoice Settings":
        return (
          <PlaceholderContent
            title="Invoice Settings"
          />
        );

      case "GST Settings":
        return (
          <PlaceholderContent
            title="GST Settings"
          />
        );

      case "Payment Settings":
        return (
          <PlaceholderContent
            title="Payment Settings"
          />
        );

      case "Plan & Billing":
        return (
          <PlaceholderContent
            title="Plan & Billing"
          />
        );

      case "Security":
        return (
          <PlaceholderContent
            title="Security"
          />
        );

      default:
        return (
          <ClinicProfile
            user={user}
          />
        );
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>
          Settings
        </h1>
        <p>
          Configure your profile, team, pipeline, billing and integrations.
        </p>
      </div>
      <div className="settings-layout">
        <aside className="settings-sidebar">
          {settingsGroups.map((group) => (
            <div
              className="settings-group"
              key={group.label}
            >

              <div className="settings-group-label">
                {group.label}
              </div>

              <div className="settings-group-items">

                {group.items.map((item) => {

                  const isActive =
                    activeTab === item;

                  return (
                    <button
                      type="button"
                      key={item}
                      className={
                        isActive
                          ? "settings-tab active"
                          : "settings-tab"
                      }
                      onClick={() =>
                        handleTabChange(item)
                      }
                    >

                      <span className="settings-tab-text">
                        {item}
                      </span>

                      {isActive && (
                        <span className="settings-tab-arrow">
                          ›
                        </span>
                      )}

                    </button>
                  );

                })}

              </div>

            </div>
          ))}

        </aside>

        <main className="settings-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
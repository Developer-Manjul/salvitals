const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Role = require("../models/Role");

dotenv.config();

const roles = [
  {
    name: "Owner",
    slug: "owner",
    permissions: ["*"],
  },

  {
    name: "Administrator",
    slug: "administrator",
    permissions: [
      "dashboard.view",

      "leads.view",
      "leads.create",
      "leads.edit",
      "leads.delete",

      "followups.view",
      "followups.create",
      "followups.edit",
      "followups.delete",

      "contacts.view",
      "contacts.create",
      "contacts.edit",
      "contacts.delete",

      "calendar.view",
      "calendar.create",
      "calendar.edit",
      "calendar.delete",

      "whatsapp.view",
      "whatsapp.use",
      "whatsapp.manage",

      "ai.view",
      "ai.use",

      "invoices.view",
      "invoices.create",
      "invoices.edit",
      "invoices.delete",
      "invoices.send",

      "doctors.view",
      "doctors.create",
      "doctors.edit",
      "doctors.delete",

      "team.view",
      "team.create",
      "team.edit",
      "team.delete",

      "services.view",
      "services.create",
      "services.edit",
      "services.delete",

      "integrations.view",
      "integrations.manage",

      "ai_settings.view",
      "ai_settings.edit",

      "notifications.view",
      "notifications.manage",

      "business_profile.view",

      "roles.view",
    ],
  },

  {
    name: "Manager",
    slug: "manager",
    permissions: [
      "dashboard.view",

      "leads.view",
      "leads.create",
      "leads.edit",

      "followups.view",
      "followups.create",
      "followups.edit",

      "contacts.view",
      "contacts.create",
      "contacts.edit",

      "calendar.view",
      "calendar.create",
      "calendar.edit",

      "invoices.view",
      "invoices.create",
      "invoices.edit",
      "invoices.send",

      "doctors.view",
      "doctors.create",
      "doctors.edit",

      "team.view",
      "team.create",
      "team.edit",

      "services.view",
      "services.create",
      "services.edit",

      "ai.view",
      "ai.use",

      "ai_settings.view",

      "notifications.view",

      "business_profile.view",
    ],
  },

  {
    name: "Sales Executive",
    slug: "sales-executive",
    permissions: [
      "dashboard.view",

      "leads.view",
      "leads.create",
      "leads.edit",

      "followups.view",
      "followups.create",
      "followups.edit",

      "contacts.view",
      "contacts.create",
      "contacts.edit",

      "calendar.view",
      "calendar.create",
      "calendar.edit",

      "whatsapp.view",
      "whatsapp.use",

      "ai.view",
      "ai.use",

      "invoices.view",
      "invoices.create",
      "invoices.send",

      "services.view",
      "services.create",

      "notifications.view",
    ],
  },
];

const seedRoles = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("MongoDB connected.");

    for (const roleData of roles) {
      let role = await Role.findOne({
        slug: roleData.slug,
      });

      if (role) {
        role.name = roleData.name;
        role.permissions = roleData.permissions;
        role.isSystemRole = true;
        role.status = "active";

        await role.save();

        console.log(
          `Role updated: ${role.name}`
        );
      } else {
        role = await Role.create({
          name: roleData.name,
          slug: roleData.slug,
          permissions: roleData.permissions,
          isSystemRole: true,
          status: "active",
        });

        console.log(
          `Role created: ${role.name}`
        );
      }
    }

    console.log(
      "All system roles seeded successfully."
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "Role seeding failed:"
    );

    console.error(
      error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedRoles();
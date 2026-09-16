require("dotenv").config();

const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Contact = require("../models/Contact");
const Notification = require("../models/Notification");
const { processNewLead } = require("../services/leadProcessingService");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const leads = await Lead.find({
    metaLeadId: { $exists: true, $type: "string", $ne: "" },
    source: { $in: ["Facebook", "Instagram"] },
  }).sort({ createdAt: 1, _id: 1 });

  let contactsCreated = 0;
  let notificationsBefore = 0;
  let notificationsAfter = 0;

  for (const lead of leads) {
    const existingNotification = await Notification.exists({
      userId: lead.userId,
      type: "new_lead",
      leadId: lead._id,
    });
    if (existingNotification) notificationsBefore += 1;

    const result = await processNewLead(lead);
    if (result.contactResult?.created) contactsCreated += 1;

    const notification = await Notification.exists({
      userId: lead.userId,
      type: "new_lead",
      leadId: lead._id,
    });
    if (notification) notificationsAfter += 1;
  }

  const contacts = await Contact.countDocuments({ deletedAt: null });
  console.log(JSON.stringify({
    metaLeads: leads.length,
    contactsCreated,
    notificationsBefore,
    notificationsAfter,
    activeContacts: contacts,
  }));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("REPAIR META LEAD PROCESSING ERROR:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});

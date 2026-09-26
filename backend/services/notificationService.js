const Notification = require("../models/Notification");

async function createLeadNotification(lead) {
  try {
    await Notification.updateOne(
      {
        userId: lead.userId,
        type: "new_lead",
        leadId: lead._id,
      },
      {
        $setOnInsert: {
          userId: lead.userId,
          type: "new_lead",
          title: "New lead received",
          message: lead.name,
          leadId: lead._id,
          source: lead.source || "Other",
          isRead: false,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("CREATE LEAD NOTIFICATION ERROR:", error.message);
  }
}

module.exports = { createLeadNotification };
const { createContactFromLead } = require("./contactService");
const { createLeadNotification } = require("./notificationService");

async function processNewLead(lead) {
  console.log("LEAD CREATED:", {
    userId: String(lead.userId),
    leadId: String(lead._id),
    source: lead.source || "Other",
  });

  let contactResult;
  try {
    contactResult = await createContactFromLead(lead);
    if (contactResult?.created) {
      console.log("CONTACT CREATED:", String(contactResult.contact._id));
    } else if (contactResult?.duplicate) {
      console.log("CONTACT ALREADY EXISTS:", String(lead._id));
    } else if (contactResult?.reason === "limit") {
      console.log("CONTACT SKIPPED - LIMIT REACHED:", String(lead._id));
    }
  } catch (error) {
    console.error("LEAD CONTACT PROCESSING ERROR:", error.message);
  }

  try {
    await createLeadNotification(lead);
    console.log("NOTIFICATION CREATED OR ALREADY EXISTS:", String(lead._id));
  } catch (error) {
    console.error("LEAD NOTIFICATION PROCESSING ERROR:", error.message);
  }

  return { lead, contactResult };
}

module.exports = { processNewLead };

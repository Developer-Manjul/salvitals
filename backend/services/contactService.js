const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const Invoice = require("../models/Invoice");
const InvoiceCounter = require("../models/InvoiceCounter");
const User = require("../models/User");
const { getActivePlan } = require("../utils/contactLimits");

function contactPayloadFromLead(lead) {
  return {
    userId: lead.userId,
    leadId: lead._id,
    leadCreatedAt: lead.createdAt || null,
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "Manual",
    service: lead.service || "",
    doctor: lead.preferredDoctor || "",
    owner: lead.owner || "",
    gender: lead.gender || "",
    age: lead.age || "",
    tags: Array.isArray(lead.tags)
      ? lead.tags
      : [],
  };
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "");
}

function normalizePatientPrefix(value = "SV") {
  return String(value || "SV")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, "X");
}

async function ensureInvoiceCounter(userId) {
  try {
    await InvoiceCounter.updateOne(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000 && error?.code !== 11001) {
      throw error;
    }

    if (!(await InvoiceCounter.exists({ userId }))) {
      throw error;
    }
  }
}

async function allocatePatientId(userId, prefix, session = null) {
  const normalizedPrefix = normalizePatientPrefix(prefix);
  const options = {
    new: true,
    upsert: false,
  };

  if (session) {
    options.session = session;
  }

  while (true) {
    const counter = await InvoiceCounter.findOneAndUpdate(
      { userId },
      {
        $inc: {
          [`prefixSequences.${normalizedPrefix}`]: 1,
        },
      },
      options
    );

    if (!counter) {
      throw new Error("Unable to allocate a Patient ID counter.");
    }

    const sequence =
      counter.prefixSequences?.get
        ? counter.prefixSequences.get(normalizedPrefix)
        : counter.prefixSequences?.[normalizedPrefix];
    const patientId = `${normalizedPrefix}${String(
      sequence || 1
    ).padStart(3, "0")}`;
    let existingQuery = Contact.findOne({
      userId,
      patientId,
    }).select("_id");

    if (session) {
      existingQuery = existingQuery.session(session);
    }

    if (!(await existingQuery.lean())) {
      return patientId;
    }
  }
}

async function findLegacyPatientId(userId, contact, session = null) {
  const contactId = String(contact?._id || "");
  if (contactId) {
    let invoiceQuery = Invoice.findOne({
      userId,
      customerId: contactId,
      patientId: { $nin: ["", null] },
    })
      .sort({ createdAt: 1 })
      .select("patientId");

    if (session) {
      invoiceQuery = invoiceQuery.session(session);
    }

    const invoice = await invoiceQuery.lean();
    if (invoice?.patientId) {
      return invoice.patientId;
    }
  }

  const email = normalizeEmail(contact?.normalizedEmail || contact?.email);
  const phone = normalizePhone(contact?.normalizedPhone || contact?.phone);
  const identityFilters = [];

  if (email) {
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    identityFilters.push({
      customerEmail: new RegExp(`^${escapedEmail}$`, "i"),
    });
  }

  if (phone.length >= 4) {
    const phoneSuffix = phone.slice(-Math.min(7, phone.length));
    identityFilters.push({
      customerPhone: {
        $regex: phoneSuffix.split("").join("\\D*"),
      },
    });
  }

  if (!identityFilters.length) {
    return "";
  }

  let invoicesQuery = Invoice.find({
    userId,
    patientId: { $nin: ["", null] },
    $or: identityFilters,
  })
    .sort({ createdAt: 1 })
    .select("patientId customerEmail customerPhone");

  if (session) {
    invoicesQuery = invoicesQuery.session(session);
  }

  const invoices = await invoicesQuery.lean();
  const match = invoices.find(
    (invoice) =>
      (email && normalizeEmail(invoice.customerEmail) === email) ||
      (phone && normalizePhone(invoice.customerPhone) === phone)
  );

  return match?.patientId || "";
}

async function ensureContactPatientId(
  contact,
  userId,
  prefix = "SV",
  session = null
) {
  if (String(contact?.patientId || "").trim()) {
    return contact.patientId;
  }

  if (!session) {
    await ensureInvoiceCounter(userId);
  }

  const legacyPatientId = await findLegacyPatientId(
    userId,
    contact,
    session
  );
  let patientId = legacyPatientId;

  if (patientId) {
    let duplicateQuery = Contact.findOne({
      userId,
      patientId,
      _id: { $ne: contact._id },
    }).select("_id");

    if (session) {
      duplicateQuery = duplicateQuery.session(session);
    }

    if (await duplicateQuery.lean()) {
      patientId = "";
    }
  }

  if (!patientId) {
    patientId = await allocatePatientId(userId, prefix, session);
  }

  const updateOptions = { new: true };
  if (session) {
    updateOptions.session = session;
  }

  const updatedContact = await Contact.findOneAndUpdate(
    {
      _id: contact._id,
      userId,
      $or: [
        { patientId: { $exists: false } },
        { patientId: "" },
        { patientId: null },
      ],
    },
    {
      $set: { patientId },
    },
    updateOptions
  );

  if (updatedContact?.patientId) {
    contact.patientId = updatedContact.patientId;
    return updatedContact.patientId;
  }

  let currentContactQuery = Contact.findOne({
    _id: contact._id,
    userId,
  }).select("patientId");

  if (session) {
    currentContactQuery = currentContactQuery.session(session);
  }

  const currentContact = await currentContactQuery.lean();
  if (!currentContact?.patientId) {
    throw new Error("Unable to assign a Patient ID to this customer.");
  }

  contact.patientId = currentContact.patientId;
  return currentContact.patientId;
}

function addNormalizedIdentity(payload) {
  return {
    ...payload,
    email: String(payload.email || "").trim(),
    phone: String(payload.phone || "").trim(),
    normalizedEmail: normalizeEmail(payload.email),
    normalizedPhone: normalizePhone(payload.phone),
  };
}

function contactPayloadFromInput(input, userId) {
  return {
    userId,
    leadId: input.leadId || null,
    leadCreatedAt: input.leadCreatedAt || null,
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    source: String(input.source || "Manual").trim(),
    service: String(input.service || "").trim(),
    doctor: String(
      input.doctor ||
      input.preferredDoctor ||
      ""
    ).trim(),
    owner: String(input.owner || "").trim(),
    gender: String(input.gender || "").trim(),
    age: String(input.age || "").trim(),
    tags: Array.isArray(input.tags)
      ? input.tags
          .map(String)
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
}

/*
|--------------------------------------------------------------------------
| Junk Lead Helpers
|--------------------------------------------------------------------------
*/

function normalizeStage(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isJunkLead(lead) {
  const stage = normalizeStage(
    lead?.stage ||
    lead?.leadStage ||
    lead?.status ||
    ""
  );

  return (
    stage === "junk" ||
    stage === "junk lead"
  );
}

/*
|--------------------------------------------------------------------------
| Count only NON-JUNK leads
|--------------------------------------------------------------------------
*/

async function getNonJunkLeadCount(
  userId,
  session = null
) {
  let query = Lead.find({
    userId,
  }).select(
    "stage leadStage status"
  );

  if (session) {
    query = query.session(session);
  }

  const leads = await query.lean();

  return leads.filter(
    (lead) => !isJunkLead(lead)
  ).length;
}

/*
|--------------------------------------------------------------------------
| Contact Usage
|--------------------------------------------------------------------------
*/

async function getContactUsage(
  userId,
  plan = null
) {
  const activePlan =
    plan || await getActivePlan(userId);

  const junkContacts =
    await Lead.find({
      userId,
    }).select("_id stage leadStage status").lean();

  const junkLeadIds =
    junkContacts
      .filter(isJunkLead)
      .map((lead) => lead._id);

  const contactCount =
    await Contact.countDocuments({
      userId,
      deletedAt: null,
      leadId: {
        $nin: junkLeadIds,
      },
    });

  const used = contactCount;

  const available =
    activePlan.limit === null
      ? null
      : Math.max(
          activePlan.limit - used,
          0
        );

  return {
    plan:
      activePlan.planName,
    planId:
      activePlan.planId,
    limit:
      activePlan.limit,
    used,
    available,
    isLimitReached:
      activePlan.limit !== null &&
      used >= activePlan.limit,
  };
}

async function getAuthoritativeContactCount(userId) {
  const junkLeads = await Lead.find({
    userId,
  }).select("_id stage leadStage status").lean();

  const junkLeadIds = junkLeads
    .filter(isJunkLead)
    .map((lead) => lead._id);

  return Contact.countDocuments({
    userId,
    deletedAt: null,
    leadId: {
      $nin: junkLeadIds,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Create Contact With Quota
|--------------------------------------------------------------------------
*/

async function createContactWithQuota(
  payload,
  userId,
  { patientPrefix = "SV" } = {}
) {
  payload = addNormalizedIdentity(payload);
  payload.patientId = "";
  await ensureInvoiceCounter(userId);
  const session =
    await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(
      async () => {
        await User.updateOne(
          {
            _id: userId,
          },
          {
            $inc: {
              contactQuotaVersion: 1,
            },
          },
          {
            session,
          }
        );

        const existing =
          payload.leadId
            ? await Contact.findOne({
                userId,
                leadId:
                  payload.leadId,
              }).session(session)
            : null;

        let matchingContact = existing;

        if (!matchingContact && payload.normalizedPhone) {
          const phoneMatches =
            await Contact.find({
              userId,
            }).select("_id leadId phone email normalizedPhone normalizedEmail leadCreatedAt").session(session);

          matchingContact = phoneMatches.find((contact) =>
            normalizePhone(contact.normalizedPhone || contact.phone) === payload.normalizedPhone
          ) || null;
        }

        if (!matchingContact && payload.normalizedEmail) {
          const emailMatches =
            await Contact.find({
              userId,
            }).select("_id leadId phone email normalizedPhone normalizedEmail leadCreatedAt").session(session);

          matchingContact = emailMatches.find((contact) =>
            normalizeEmail(contact.normalizedEmail || contact.email) === payload.normalizedEmail
          ) || null;
        }

        if (matchingContact) {
          matchingContact.deletedAt = null;
          matchingContact.normalizedEmail =
            payload.normalizedEmail;
          matchingContact.normalizedPhone =
            payload.normalizedPhone;

          if (
            payload.leadId &&
            !matchingContact.leadId
          ) {
            matchingContact.leadId =
              payload.leadId;
          }

          if (
            !matchingContact.leadCreatedAt &&
            payload.leadCreatedAt
          ) {
            matchingContact.leadCreatedAt =
              payload.leadCreatedAt;
          }

          await ensureContactPatientId(
            matchingContact,
            userId,
            patientPrefix,
            session
          );
          await matchingContact.save({
            session,
          });

          result = {
            created: false,
            duplicate: true,
            contact: matchingContact,
          };

          return;
        }

        const plan =
          await getActivePlan(userId);

        const junkLeads =
          await Lead.find({
            userId,
          }).select("_id stage leadStage status").lean();

        const junkLeadIds =
          junkLeads
            .filter(isJunkLead)
            .map((lead) => lead._id);

        const contactCount =
        await Contact.countDocuments({
          userId,
          deletedAt: null,
          leadId: {
            $nin: junkLeadIds,
          },
        }).session(session);

      const used = contactCount;

        const available =
          plan.limit === null
            ? null
            : Math.max(
                plan.limit - used,
                0
              );

        const usage = {
          plan:
            plan.planName,
          planId:
            plan.planId,
          limit:
            plan.limit,
          used,
          available,
          isLimitReached:
            plan.limit !== null &&
            used >= plan.limit,
        };

        if (
          plan.limit !== null &&
          used >= plan.limit
        ) {
          result = {
            created: false,
            skipped: true,
            reason: "limit",
            usage,
          };

          return;
        }

        const legacyPatientId = await findLegacyPatientId(
          userId,
          payload,
          session
        );
        let contactPatientId = legacyPatientId;

        if (contactPatientId) {
          const legacyContactQuery = Contact.findOne({
            userId,
            patientId: contactPatientId,
          }).select("_id");

          if (session) {
            legacyContactQuery.session(session);
          }

          if (await legacyContactQuery.lean()) {
            contactPatientId = "";
          }
        }

        payload.patientId =
          contactPatientId ||
          await allocatePatientId(
            userId,
            patientPrefix,
            session
          );

        const [contact] =
          await Contact.create(
            [payload],
            {
              session,
            }
          );

        result = {
          created: true,
          contact,
        };
      }
    );

    if (result?.created) {
      result.usage =
        await getContactUsage(
          userId
        );
    }

    return result;
  } catch (error) {
    if (
      error?.code === 11000 ||
      error?.code === 11001
    ) {
      const identityFilters = [
        ...(payload.normalizedPhone
          ? [{ normalizedPhone: payload.normalizedPhone }]
          : []),
        ...(payload.normalizedEmail
          ? [{ normalizedEmail: payload.normalizedEmail }]
          : []),
      ];
      const duplicateFilter = payload.leadId
        ? {
            userId,
            leadId: payload.leadId,
          }
        : identityFilters.length
          ? {
              userId,
              $or: identityFilters,
            }
          : null;
      const duplicate = duplicateFilter
        ? await Contact.findOne({
            ...duplicateFilter,
            deletedAt: null,
          })
        : null;

      if (duplicate) {
        return {
          created: false,
          duplicate: true,
          contact: duplicate,
          usage: await getContactUsage(userId),
        };
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

/*
|--------------------------------------------------------------------------
| Create Contact From Lead
|--------------------------------------------------------------------------
*/

async function createContactFromLead(
  lead
) {
  try {
    if (isJunkLead(lead)) {
      return {
        created: false,
        skipped: true,
        reason: "junk",
      };
    }

    const result =
      await createContactWithQuota(
        contactPayloadFromLead(
          lead
        ),
        lead.userId
      );

    if (
      result?.reason === "limit"
    ) {
      console.log(
        "CONTACT QUOTA FULL; LEAD KEPT:",
        lead._id
      );
    }

    return result;
  } catch (error) {
    console.error(
      "CREATE CONTACT FROM LEAD ERROR:",
      error.message
    );

    return {
      created: false,
      skipped: true,
      reason: "error",
      error,
    };
  }
}

module.exports = {
  createContactFromLead,
  createContactWithQuota,
  ensureContactPatientId,
  ensureInvoiceCounter,
  getContactUsage,
  getAuthoritativeContactCount,
  contactPayloadFromInput,
  addNormalizedIdentity,
};
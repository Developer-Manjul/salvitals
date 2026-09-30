const Contact = require("../models/Contact");
const Lead = require("../models/Lead");

const {
  createContactWithQuota,
  getContactUsage,
  contactPayloadFromInput,
} = require("../services/contactService");

const {
  getWorkspaceContext,
  hasPermission,
} = require("../utils/workspace");

const getContext = async (req) => {
  return await getWorkspaceContext(req);
};

const requirePermission = (
  context,
  permission,
  res
) => {
  if (!context) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return false;
  }

  if (!hasPermission(context, permission)) {
    res.status(403).json({
      success: false,
      message:
        "You do not have permission to perform this action.",
      permission,
    });

    return false;
  }

  return true;
};

async function getUsage(userId, plan = null) {
  return getContactUsage(userId, plan);
}

function limitResponse(res, usage) {
  const code =
    usage.planId === null
      ? "CONTACT_SUBSCRIPTION_REQUIRED"
      : "CONTACT_LIMIT_REACHED";

  const message =
    usage.planId === null
      ? "An active paid subscription is required to save contacts."
      : usage.limit === null
      ? "Your Enterprise contact limit is not configured yet."
      : usage.used > usage.limit
      ? `Your current plan allows ${usage.limit} contacts, but you currently have ${usage.used} contacts. Please upgrade your plan or remove contacts to add new contacts.`
      : `You've reached your ${usage.limit} contact limit. Upgrade your plan to save more contacts.`;

  return res.status(409).json({
    success: false,
    code,
    message,
    limit: usage.limit,
    current: usage.used,
    plan: usage.plan,
  });
}

exports.getContacts = async (
  req,
  res
) => {
  try {
    const context =
      await getContext(req);

    if (
      !requirePermission(
        context,
        "contacts.view",
        res
      )
    ) {
      return;
    }

    const workspaceOwnerId =
      context.workspaceOwnerId;

    const [
      contacts,
      usage,
    ] = await Promise.all([
      Contact.find({
        userId: workspaceOwnerId,
        deletedAt: null,
      })
        .sort({
          createdAt: -1,
        })
        .lean(),

      getUsage(workspaceOwnerId),
    ]);

    return res.json({
      success: true,
      contacts,
      usage,
    });
  } catch (error) {
    console.error(
      "GET CONTACTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load contacts",
    });
  }
};

exports.getUsage = async (
  req,
  res
) => {
  try {
    const context =
      await getContext(req);

    if (
      !requirePermission(
        context,
        "contacts.view",
        res
      )
    ) {
      return;
    }

    const workspaceOwnerId =
      context.workspaceOwnerId;

    const usage =
      await getUsage(workspaceOwnerId);

    return res.json({
      success: true,
      ...usage,
    });
  } catch (error) {
    console.error(
      "GET CONTACT USAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load contact usage",
    });
  }
};

exports.createContact = async (
  req,
  res
) => {
  try {
    const context =
      await getContext(req);

    if (
      !requirePermission(
        context,
        "contacts.create",
        res
      )
    ) {
      return;
    }

    const workspaceOwnerId =
      context.workspaceOwnerId;

    if (
      !String(
        req.body?.name || ""
      ).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Contact name is required",
      });
    }

    const result =
      await createContactWithQuota(
        contactPayloadFromInput(
          req.body,
          workspaceOwnerId
        ),
        workspaceOwnerId
      );

    if (
      !result.created &&
      !result.duplicate
    ) {
      return limitResponse(
        res,
        result.usage
      );
    }

    return res
      .status(
        result.duplicate
          ? 200
          : 201
      )
      .json({
        success: true,
        contact:
          result.contact,
        usage:
          result.usage ||
          await getUsage(
            workspaceOwnerId
          ),
      });
  } catch (error) {
    console.error(
      "CREATE CONTACT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create contact",
    });
  }
};

exports.convertLead = async (
  req,
  res
) => {
  try {
    const context =
      await getContext(req);

    if (
      !requirePermission(
        context,
        "contacts.create",
        res
      )
    ) {
      return;
    }

    const workspaceOwnerId =
      context.workspaceOwnerId;

    const lead =
      await Lead.findOne({
        _id: req.params.leadId,
        userId: workspaceOwnerId,
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message:
          "Lead not found",
      });
    }

    const result =
      await createContactWithQuota(
        contactPayloadFromInput(
          {
            ...lead.toObject(),
            doctor:
              lead.preferredDoctor,
            leadId: lead._id,
          },
          workspaceOwnerId
        ),
        workspaceOwnerId
      );

    if (
      !result.created &&
      !result.duplicate
    ) {
      return limitResponse(
        res,
        result.usage
      );
    }

    return res
      .status(
        result.duplicate
          ? 200
          : 201
      )
      .json({
        success: true,
        contact:
          result.contact,
        usage:
          result.usage ||
          await getUsage(
            workspaceOwnerId
          ),
      });
  } catch (error) {
    console.error(
      "CONVERT LEAD CONTACT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to convert lead to contact",
    });
  }
};

exports.deleteContact = async (
  req,
  res
) => {
  try {
    const context =
      await getContext(req);

    if (
      !requirePermission(
        context,
        "contacts.delete",
        res
      )
    ) {
      return;
    }

    const workspaceOwnerId =
      context.workspaceOwnerId;

    const contact =
      await Contact.findOneAndUpdate(
        {
          _id: req.params.id,
          userId:
            workspaceOwnerId,
          deletedAt: null,
        },
        {
          $set: {
            deletedAt:
              new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message:
          "Contact not found",
      });
    }

    return res.json({
      success: true,
      usage:
        await getUsage(
          workspaceOwnerId
        ),
    });
  } catch (error) {
    console.error(
      "DELETE CONTACT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete contact",
    });
  }
};
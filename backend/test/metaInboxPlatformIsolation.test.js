const test = require("node:test");
const assert = require("node:assert/strict");

const WORKSPACE_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const WORKSPACE_B = "bbbbbbbbbbbbbbbbbbbbbbbb";

const workspace = require("../utils/workspace");
const originalGetWorkspaceContext = workspace.getWorkspaceContext;
const originalHasPermission = workspace.hasPermission;
workspace.getWorkspaceContext = async () => ({
  workspaceOwnerId: WORKSPACE_A,
  isOwner: true,
});
workspace.hasPermission = () => true;

const inboxController = require("../controllers/metaInboxController");
workspace.getWorkspaceContext = originalGetWorkspaceContext;
workspace.hasPermission = originalHasPermission;

const MetaConversation = require("../models/MetaConversation");
const MetaMessage = require("../models/MetaMessage");

const conversations = [
  {
    _id: "111111111111111111111111",
    userId: WORKSPACE_A,
    platform: "facebook",
    unreadCount: 2,
    status: "open",
  },
  {
    _id: "222222222222222222222222",
    userId: WORKSPACE_A,
    platform: "instagram",
    unreadCount: 3,
    status: "open",
  },
  {
    _id: "333333333333333333333333",
    userId: WORKSPACE_A,
    platform: "whatsapp",
    unreadCount: 11,
    status: "open",
  },
  {
    _id: "444444444444444444444444",
    userId: WORKSPACE_B,
    platform: "facebook",
    unreadCount: 7,
    status: "open",
  },
  {
    _id: "555555555555555555555555",
    userId: WORKSPACE_B,
    platform: "whatsapp",
    unreadCount: 13,
    status: "open",
  },
];

const messages = [
  {
    _id: "666666666666666666666666",
    userId: WORKSPACE_A,
    conversationId: conversations[2]._id,
    platform: "whatsapp",
    sentAt: new Date(),
  },
];

function matches(document, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    if (condition && Array.isArray(condition.$in)) {
      return condition.$in.includes(document[key]);
    }

    return String(document[key]) === String(condition);
  });
}

function makeQuery(rows) {
  let offset = 0;
  let limit = Infinity;

  return {
    sort() {
      return this;
    },
    skip(value) {
      offset = value;
      return this;
    },
    limit(value) {
      limit = value;
      return this;
    },
    async lean() {
      return rows().slice(offset, offset + limit);
    },
  };
}

function response() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("Social and WhatsApp inbox API handlers isolate platform and workspace data", async () => {
  const originals = {
    conversationFind: MetaConversation.find,
    conversationCount: MetaConversation.countDocuments,
    conversationFindOne: MetaConversation.findOne,
    conversationUpdate: MetaConversation.updateOne,
    conversationFindOneAndUpdate: MetaConversation.findOneAndUpdate,
    messageFind: MetaMessage.find,
    messageCount: MetaMessage.countDocuments,
  };
  const conversationFilters = [];
  const messageFilters = [];

  MetaConversation.find = (filter) => {
    conversationFilters.push(filter);
    return makeQuery(() => conversations.filter((item) => matches(item, filter)));
  };
  MetaConversation.countDocuments = async (filter) => {
    conversationFilters.push(filter);
    return conversations.filter((item) => matches(item, filter)).length;
  };
  MetaConversation.findOne = async (filter) =>
    conversations.find((item) => matches(item, filter)) || null;
  MetaConversation.updateOne = async () => ({ acknowledged: true });
  MetaConversation.findOneAndUpdate = async (filter) =>
    conversations.find((item) => matches(item, filter)) || null;
  MetaMessage.find = (filter) => {
    messageFilters.push(filter);
    return makeQuery(() => messages.filter((item) => matches(item, filter)));
  };
  MetaMessage.countDocuments = async (filter) => {
    messageFilters.push(filter);
    return messages.filter((item) => matches(item, filter)).length;
  };

  try {
    const socialResponse = response();
    await inboxController.getConversations(
      { query: {}, params: {} },
      socialResponse
    );

    assert.equal(socialResponse.statusCode, 200);
    assert.deepEqual(
      socialResponse.body.conversations.map((item) => item.platform),
      ["facebook", "instagram"]
    );
    assert.equal(socialResponse.body.pagination.total, 2);
    assert.equal(
      socialResponse.body.conversations.reduce(
        (total, item) => total + item.unreadCount,
        0
      ),
      5
    );
    assert.deepEqual(conversationFilters[0], {
      userId: WORKSPACE_A,
      platform: { $in: ["facebook", "instagram"] },
    });

    const socialWhatsAppQueryResponse = response();
    await inboxController.getConversations(
      { query: { platform: "whatsapp" }, params: {} },
      socialWhatsAppQueryResponse
    );
    assert.deepEqual(socialWhatsAppQueryResponse.body.conversations, []);
    assert.equal(socialWhatsAppQueryResponse.body.pagination.total, 0);

    const whatsappResponse = response();
    await inboxController.getWhatsAppConversations(
      { query: {}, params: {} },
      whatsappResponse
    );
    assert.deepEqual(
      whatsappResponse.body.conversations.map((item) => item.platform),
      ["whatsapp"]
    );
    assert.equal(whatsappResponse.body.pagination.total, 1);
    assert.equal(whatsappResponse.body.conversations[0].unreadCount, 11);

    const socialDetailsResponse = response();
    await inboxController.getConversationMessages(
      { query: {}, params: { id: conversations[2]._id } },
      socialDetailsResponse
    );
    assert.equal(socialDetailsResponse.statusCode, 404);

    const whatsappDetailsResponse = response();
    await inboxController.getWhatsAppConversationMessages(
      { query: {}, params: { id: conversations[2]._id } },
      whatsappDetailsResponse
    );
    assert.equal(whatsappDetailsResponse.statusCode, 200);
    assert.deepEqual(
      whatsappDetailsResponse.body.messages.map((item) => item.platform),
      ["whatsapp"]
    );
    assert.deepEqual(messageFilters[0], {
      userId: WORKSPACE_A,
      conversationId: conversations[2]._id,
      platform: "whatsapp",
    });

    const otherWorkspaceResponse = response();
    await inboxController.getWhatsAppConversationMessages(
      { query: {}, params: { id: conversations[4]._id } },
      otherWorkspaceResponse
    );
    assert.equal(otherWorkspaceResponse.statusCode, 404);
  } finally {
    MetaConversation.find = originals.conversationFind;
    MetaConversation.countDocuments = originals.conversationCount;
    MetaConversation.findOne = originals.conversationFindOne;
    MetaConversation.updateOne = originals.conversationUpdate;
    MetaConversation.findOneAndUpdate = originals.conversationFindOneAndUpdate;
    MetaMessage.find = originals.messageFind;
    MetaMessage.countDocuments = originals.messageCount;
  }
});

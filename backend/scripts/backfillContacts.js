require("dotenv").config();

const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const { createContactFromLead } = require("../services/contactService");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  let processed = 0;
  let created = 0;
  let skipped = 0;

  const leads = Lead.find({})
    .sort({ createdAt: 1, _id: 1 })
    .cursor();

  for await (const lead of leads) {
    processed += 1;
    const result = await createContactFromLead(lead);
    if (result?.created) {
      created += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(JSON.stringify({ processed, created, skipped }));
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("BACKFILL CONTACTS ERROR:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});

import test from "node:test";
import assert from "node:assert/strict";
import { isLeadWithinDateRange } from "./leadDateRange.js";

test("date range includes every time on the selected same day", () => {
  const startOfDay = new Date(2024, 5, 15, 0, 0, 0, 0);
  const endOfDay = new Date(2024, 5, 15, 23, 59, 59, 999);

  assert.equal(isLeadWithinDateRange(startOfDay, "2024-06-15", "2024-06-15"), true);
  assert.equal(isLeadWithinDateRange(endOfDay, "2024-06-15", "2024-06-15"), true);
  assert.equal(
    isLeadWithinDateRange(new Date(2024, 5, 16), "2024-06-15", "2024-06-15"),
    false
  );
  assert.equal(
    isLeadWithinDateRange(new Date(2024, 5, 14, 23, 59, 59, 999), "2024-06-15", "2024-06-15"),
    false
  );
});

test("date range includes month-end boundaries and excludes the following day", () => {
  assert.equal(
    isLeadWithinDateRange(new Date(2024, 0, 31, 23, 59, 59, 999), "", "2024-01-31"),
    true
  );
  assert.equal(
    isLeadWithinDateRange(new Date(2024, 1, 1), "", "2024-01-31"),
    false
  );
  assert.equal(
    isLeadWithinDateRange(new Date(2024, 1, 1, 0, 0, 0, 1), "2024-01-31", "2024-02-01"),
    true
  );
});

test("one-sided and cleared date filters behave independently", () => {
  const timestamp = new Date(2024, 3, 10, 12);

  assert.equal(isLeadWithinDateRange(timestamp, "2024-04-10"), true);
  assert.equal(isLeadWithinDateRange(timestamp, "", "2024-04-10"), true);
  assert.equal(isLeadWithinDateRange(timestamp, "", ""), true);
  assert.equal(isLeadWithinDateRange(timestamp, "2024-04-11", "2024-04-10"), false);
  assert.equal(isLeadWithinDateRange(timestamp, "2024-02-30", ""), false);
});

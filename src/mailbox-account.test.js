import test from "node:test";
import assert from "node:assert/strict";
import { MAILBOX_ACCOUNT_EMAIL, MAILBOX_SCAN_STORAGE_KEY } from "./mailbox-scan.js";
import { isApplicationKey } from "./migrate-local-data.js";

test("PA Gmail has isolated, registered mailbox records", () => {
  assert.equal(MAILBOX_ACCOUNT_EMAIL, "aamer.pa26@gmail.com");
  assert.equal(MAILBOX_SCAN_STORAGE_KEY, "an2r-gmail-deadlines-v1:aamer.pa26@gmail.com");
  for (const key of [
    "an2r-gmail-deadlines-v1",
    "an2r-mailbox-archive-v1",
    MAILBOX_SCAN_STORAGE_KEY,
    "an2r-mailbox-archive-v1:aamer.pa26@gmail.com",
  ]) assert.equal(isApplicationKey(key), true);
});

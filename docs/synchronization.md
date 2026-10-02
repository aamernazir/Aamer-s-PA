# Saving and synchronization

The React app still runs on GitHub Pages and uses the existing Firebase project.
No new backend, service, or credentials are required by this change.

## Modules and storage

Modules continue to call `window.storage.get/set/delete/list`. The active
implementation is `src/cloud-storage.js`, which binds `src/sync-storage.js` to
the approved user's UID and the Firestore adapter in `src/firestore-sync.js`.
The older `src/firebase-storage.js/firebase-storage.js` is not imported by the
React entry point.

Register application data keys in `src/migrate-local-data.js`. API keys and
session credentials must never be registered. Stored module values are JSON
strings. Private and shared records use separate browser keys and cloud paths.

Each browser record contains the latest value, the last cloud value used as
the editing baseline, and whether an upload is pending. Saving the value and
pending flag is one localStorage write. Modules persist on state changes;
the 600 ms debounce applies to cloud uploads, not local saves. Browser storage
quota failures are reported as failed saves, not successful offline saves.

## Retry and conflict behavior

Pending changes survive page reloads and sign-out. Only the owning account can
resume them through the app. Uploads retry after edits, on sign-in/reconnect,
every 30 seconds while the page is open, and through the Retry sync button.
Deletes remain queued as tombstones until acknowledged. A new edit made during
an upload remains pending until that newer value is acknowledged.

For private records, Firestore transactions compare the cloud value with the editing
baseline. Another device's changes are not silently overwritten. Conflicts
preserve the browser version and offer an explicit choice between the latest
cloud version and this browser's version. This resolves the entire stored
module record, not individual fields. The previous browser version is backed
up in account-scoped browser storage before resolution; it is included in the
downloadable browser backup. There is no automatic field-level merge or backup
restore UI in this step.

Shared project copies retain the existing Firestore rules and write contract.
Those rules deny direct reads of missing shared documents, so the adapter uses
owner-filtered queries and a best-effort comparison before writing. Shared-copy
comparison is not atomic; simultaneous shared-copy writes can still race. The
authoritative private project record uses the transaction protection above.
Full sharing semantics and permissions remain a separate planned improvement.

A loaded page retains its editing baseline. Use Reload data to fetch newer
cloud data. Another tab changing an observed record blocks further stale
editing until reload. On account changes the document reloads, preventing old
module callbacks from saving under a different account.

## Safe loading and legacy data

Cloud reads use server-confirmed results. If a read fails, an existing valid
account cache can be used. With no valid cache, saving that record is blocked
and a recovery screen replaces the modules. Sample/seed data cannot be saved
over an unread cloud document. Invalid JSON and malformed local envelopes are
also rejected. Full per-module schema validation is not implemented here.

Older `an-pa:` browser records do not identify their owner. They are retained
without automatic migration. The user may explicitly import their own records
under "Older browser data is available." That browser's legacy records are
then assigned to the selected account. Existing account records are preserved
and credentials remain excluded. Signing in does not automatically claim data
left by another account.

## Boundaries and validation

Offline support applies to data in an already loaded app. This change does not
add a service worker or guarantee that the website can start without a network
connection. Clearing browser data removes pending edits and local backups, so
sync or export them first. A browser backup covers stored account records, not
unsubmitted form fields or edits that failed a browser-storage write.

Run `node --test src/*.test.js` and `npm run build`. The GitHub Pages workflow
runs the storage tests before uploading a deployment artifact. Tests cover
credentials, account isolation, reload/retry, deletes, concurrent edits,
conflicts, failed reads, storage quota errors, and timeouts. Browser smoke
validation exercised the sign-in gate and the real synchronization engine
using simulated account/cloud responses; it did not access production data.

Authenticated production Firebase behavior and the deployed Firestore rules
must still be verified with an approved account after deployment.

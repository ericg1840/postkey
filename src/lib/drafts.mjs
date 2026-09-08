// Reconciling a device's local drafts with the copy on the server.
//
// Drafts stay in localStorage as the working copy — every caller reads them
// synchronously, including from useState initializers — and the server is the
// shared record that lets the same drafts show up on a phone and a laptop.
// This file is the part worth reasoning about carefully: what happens when
// both sides changed.
//
// Last write wins, on `updatedAt`. Drafts are edited by one person a few times
// a week, so a genuine simultaneous edit on two devices is rare, and when it
// does happen the newer of two versions of your own draft is the right answer.
//
// Deletes need tombstones rather than absence. "The server doesn't have it"
// is ambiguous — it means either "you created this offline and never pushed
// it" or "you deleted it from your phone an hour ago". Without a record of
// the delete, a stale second device pushes the draft back up and it appears
// to rise from the dead. So the server keeps deleted ids and this drops them.

// Missing or unparseable timestamps sort oldest rather than throwing, so one
// malformed record can't take the whole merge down with it.
function timeOf(draft) {
  const parsed = Date.parse(draft?.updatedAt ?? "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * @param local   drafts currently in localStorage
 * @param remote  drafts the server returned
 * @param deletedIds ids the server has tombstoned
 * @returns { merged, toPush } — what this device should store, and which of
 *          those the server doesn't yet have in this form.
 */
export function mergeDrafts(local, remote, deletedIds = []) {
  const tombstoned = new Set(deletedIds);
  const remaining = new Map();
  for (const draft of Array.isArray(remote) ? remote : []) {
    if (draft?.id && !tombstoned.has(draft.id)) remaining.set(draft.id, draft);
  }

  const merged = [];
  const toPush = [];

  for (const draft of Array.isArray(local) ? local : []) {
    if (!draft?.id) continue;
    // Deleted on another device. Dropping it here is the whole point of the
    // tombstone; pushing it would undo the delete.
    if (tombstoned.has(draft.id)) continue;

    const server = remaining.get(draft.id);
    if (!server) {
      // Only this device has it — either created offline or a push that
      // failed. Either way the server needs it.
      merged.push(draft);
      toPush.push(draft);
      continue;
    }

    remaining.delete(draft.id);
    // Ties go to the server: a local copy with an identical timestamp is the
    // same version, and pushing it again would be a pointless write.
    if (timeOf(draft) > timeOf(server)) {
      merged.push(draft);
      toPush.push(draft);
    } else {
      merged.push(server);
    }
  }

  // Everything the server has that this device has never seen — a draft
  // written on the other device, which is the case this whole feature exists
  // for.
  for (const draft of remaining.values()) merged.push(draft);

  return { merged, toPush };
}

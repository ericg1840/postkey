// Pure helpers behind the listing-description generator. Kept out of
// DescriptionTool.jsx so they can be tested directly — the component file is
// JSX, which the node test runner can't parse.

// FNV-1a over the address, used to pick where in each phrase pool a listing
// starts. The generator previously began every description at index 0, so an
// agent writing four listings got the same opening sentence and the same lead
// phrase in every category four times. Seeding from the address means two
// listings differ on the first try without anyone touching the pools.
//
// Deterministic on purpose: regenerating the same address gives the same copy
// back, so an agent who navigates away and returns doesn't lose the wording
// they already decided they liked.
export function seedFromText(text) {
  // Normalized so "123 Main St", "123 main st" and a stray trailing space are
  // one listing rather than three different rolls of the dice.
  const normalized = String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    // imul keeps the 32-bit overflow semantics FNV needs; a plain * would
    // lose precision past 2^53 and collapse the distribution.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

// Rotates the order of independent sentence blocks. Varying *word choice*
// alone still produced the same shape every time — opener, highlight,
// features, suite, exterior, parking, lot, amenities, updates — and that
// shape is what makes generated copy recognizable. Rotation rather than a
// shuffle so the result stays deterministic and adjacent blocks mostly stay
// adjacent, instead of scattering related sentences.
export function rotateBlocks(blocks, n) {
  if (blocks.length < 2) return blocks.slice();
  const offset = ((Math.trunc(n) % blocks.length) + blocks.length) % blocks.length;
  return [...blocks.slice(offset), ...blocks.slice(0, offset)];
}

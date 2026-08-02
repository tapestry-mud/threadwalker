import * as tapestry from "@tapestry/engine";

// The school's kick book (Task 15 Step 4 / spec 9.4: "kick is learned from a
// book found in the school"). The mint bench (Task 7) has no way to place a
// tagged item through its own wizard - the OracleEntry table schema has no
// tags field (see week-one-ward.js:6-15 for the full trace of that gap,
// confirmed there against oracle-tables.ts and resolver.ts). That file's
// accepted fallback is reused here verbatim, just for a book instead of a
// ward staff: a threadwalker hook that watches ONLY the school's own run
// (matched by the FORCED seed baked into its template - Step 2 bakes the
// school with `mint bake school ... school 1 1 <seed>` and records that seed
// in a comment on areas/corridor/items/school-portal.yaml) and places the
// book on the floor of the FIRST room the player walks into after entry.
// That is always the earliest possible point in the run, so the book is
// guaranteed encountered before anything else - no backtracking required
// (spec 4.4's "self-contained placement"), same as the staff in week one.
//
// SCHOOL_BAKED / SCHOOL_SEED below are PLACEHOLDERS (Task 15 Step 1/4 prep
// does not bake the school - that is Step 2, out of this pass's scope).
//
// A numeric seed placeholder alone is NOT safe here: every seed-parsing path
// in the oracle package (area-gen.ts, oracle-admin.ts, mint-flow.ts,
// solo-flow.ts) explicitly ACCEPTS 0 as a legitimate forced seed - they only
// reject NaN or negative values. So a placeholder of 0 would collide with
// any template (school or unrelated) ever baked with forced seed 0, a
// natural choice for a throwaway/test bake: its run slug would be byte-
// identical to "oracle-run-0-...", and this hook would silently place the
// kick book into the wrong run with no error and no log.
//
// SCHOOL_BAKED is the actual gate: it short-circuits the handler before any
// prefix-matching math runs at all, so "not yet wired" is structurally
// impossible to misfire regardless of what SCHOOL_SEED happens to hold.
// When Step 2 bakes the school and Step 3 wires the real templateId into
// school-portal.yaml and frontier.js, come back here and:
//   1. set SCHOOL_SEED to the exact forced seed used for the bake
//      (matching the comment left in school-portal.yaml), and
//   2. flip SCHOOL_BAKED to true
// or the book will never place.
//
// ASCII; braces on all control flow.

var SCHOOL_BAKED = false;
var SCHOOL_SEED = 0;
var SCHOOL_RUN_PREFIX = "oracle-run-" + ((SCHOOL_SEED >>> 0).toString(16)) + "-";
var KICK_BOOK_TEMPLATE = "tapestry-mud-threadwalker:book-of-the-kick";
var BOOK_ROOM_LINE = "A thin bound manual lies here, pages splayed open.\r\n";

// In-memory only (module scope): resets on a container restart, which at
// worst re-places one extra book on the next move after a restart -
// harmless, and avoids a permanent per-player no-book-on-replay bug that a
// persisted player property would have caused (a player who leaves, tears
// down, and re-pulls the SAME thread gets a brand-new run area; a
// property-based flag from their first run would have blocked the book
// from ever appearing again).
var _bookPlacedRuns = {};

function activeRunSlug(entityId) {
    var raw = tapestry.world.getProperty(entityId, "oracle_active_run") || "";
    if (raw === "") { return null; }
    var slug = String(raw).split("|")[0];
    return slug || null;
}

function placeKickBookOnce(roomId, runSlug) {
    if (_bookPlacedRuns[runSlug]) { return; }
    _bookPlacedRuns[runSlug] = true;
    var item = tapestry.items.createFromTemplate(KICK_BOOK_TEMPLATE);
    if (!item || !item.id) { return; }
    tapestry.world.placeEntity(item.id, roomId);
    tapestry.world.sendToRoom(roomId, BOOK_ROOM_LINE);
}

tapestry.events.on("player.direction.moved", function (evt) {
    try {
        if (!SCHOOL_BAKED) { return; }
        var data = evt && evt.data;
        var entityId = data && data.entityId;
        var toRoom = data && data.toRoom;
        if (!entityId || !toRoom) { return; }
        var runSlug = activeRunSlug(entityId);
        if (!runSlug) { return; }
        if (runSlug.indexOf(SCHOOL_RUN_PREFIX) !== 0) { return; }
        placeKickBookOnce(toRoom, runSlug);
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
});

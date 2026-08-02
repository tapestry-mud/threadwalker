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
// SCHOOL_SEED below is a PLACEHOLDER (Task 15 Step 1/4 prep does not bake
// the school - that is Step 2, out of this pass's scope). Until Step 2
// bakes the school and Step 3 wires the real templateId into
// school-portal.yaml and frontier.js, no run slug will ever start with
// SCHOOL_RUN_PREFIX (a real forced seed will never happen to be 0), so this
// hook fails closed - it never fires - exactly like school-portal.yaml's own
// REPLACE_AT_BAKE sentinel refuses rather than misbehaving. When Step 2
// bakes the school, replace the 0 below with that exact forced seed value
// (matching the comment left in school-portal.yaml) or the book will never
// place.
//
// ASCII; braces on all control flow.

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

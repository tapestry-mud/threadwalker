import * as tapestry from "@tapestry/engine";

// Week one's ward gate (Task 16 / spec 11: "the capability primitive with the
// ward as its one instance"). The mint bench (Task 7) has no way to place a
// tagged mob or item through its own wizard, and the underlying oracle table
// schema (OracleEntry: w/id/name/desc/balance_ref/rarity) has no tags field
// either - verified by reading oracle-tables.ts and resolver.ts before
// writing this. Every oracle run's one wandering boss spawns from the SAME
// shared archetype (tapestry-oracle:swell-boss, tags: [] in @tapestry/oracle)
// regardless of which template baked it, so tagging that archetype file
// would ward every boss in every future week, not just this one - editing
// it would also mean editing a different pack/repo than threadwalker for a
// threadwalker-only content week. This is a real gap in @tapestry/oracle's
// placement surface, not a threadwalker authoring gap; see the Task 16
// report for the full trace.
//
// Accepted fallback per the Task 16 brief ("place them as hand-authored
// content layered on top of the minted run"): this hook watches ONLY week
// one's run (matched by the fixed seed baked into its template - see
// content/notes/week-one-mint.md in rocky) and, using nothing but real
// engine-exposed scripting APIs (tapestry.items.createFromTemplate +
// tapestry.world.placeEntity + tapestry.world.addTag, all confirmed against
// the engine source, none of them admin-only):
//
//   1. Places a real staff (tapestry-core:staff-of-dispel-ward, already
//      tagged cap_ward_dispel in @tapestry/core) on the floor of the FIRST
//      room the player walks into after entry. That is always the earliest
//      possible point in the run, so the staff is guaranteed encountered
//      before anything else - no backtracking is ever required to reach it
//      (spec 4.4's "self-contained placement").
//   2. Tags whichever mob instance turns out to be the run's one wandering
//      boss (tapestry-oracle:swell-boss - unique among the tier archetypes
//      by its "guardian" keyword) with req_ward_dispel the moment it is
//      seen, and overwrites its description with telegraphing prose that
//      hints a ward exists (Task 9 Step 2b) without spelling out the verb
//      (the staff's own description already does that: "Level it at a ward
//      and DISPEL").
//
// Both actions are idempotent (an in-memory per-run placed-flag for the
// staff, a live hasTag check for the boss), so this hook is safe to re-fire
// on every room the player walks into, and safe across a grind-death repop
// (Task 12): repop clears the "visited" marker and respawns the boss as a
// FRESH, untagged instance (population.ts's run.grind_repop handler), so
// this hook re-tags it the same way the dispel verb re-wards it per that
// task's SA1 finding - never a room flag, always the live instance.
//
// ASCII; braces on all control flow.

var WEEK_ONE_SEED = 11223344;
var WEEK_ONE_RUN_PREFIX = "oracle-run-" + ((WEEK_ONE_SEED >>> 0).toString(16)) + "-";
var WARD_STAFF_TEMPLATE = "tapestry-core:staff-of-dispel-ward";
var WARD_BOSS_DESC =
    "A vast shape holds this room, wrapped thread over thread in a shimmering " +
    "ward. Steel will not reach what the ward protects - something must " +
    "unravel it first.";
var STAFF_ROOM_LINE =
    "A staff leans against the wall here, humming faintly.\r\n";

// The mob's rolled/baked name (e.g. "the head chef") differs per bake, so the
// telegraph line is built from it rather than a fixed "the guardian" label -
// otherwise the broadcast text ("The guardian is wound...") would read as
// mismatched against the room's own "the head chef is here" listing line.
function telegraphLineFor(name) {
    var subject = name && name.trim() !== "" ? name : "something here";
    return subject + " is wound in a shimmering ward, thread over thread. " +
        "Ordinary steel will not reach it.\r\n";
}

// In-memory only (module scope): resets on a container restart, which at
// worst re-places one extra staff on the next move after a restart -
// harmless, and avoids a permanent per-player no-staff-on-replay bug that a
// persisted player property would have caused (a player who leaves, tears
// down, and re-pulls the SAME thread gets a brand-new run area; a
// property-based flag from their first run would have blocked the staff
// from ever appearing again).
var _staffPlacedRuns = {};

function activeRunSlug(entityId) {
    var raw = tapestry.world.getProperty(entityId, "oracle_active_run") || "";
    if (raw === "") { return null; }
    var slug = String(raw).split("|")[0];
    return slug || null;
}

function placeWardStaffOnce(roomId, runSlug) {
    if (_staffPlacedRuns[runSlug]) { return; }
    _staffPlacedRuns[runSlug] = true;
    var item = tapestry.items.createFromTemplate(WARD_STAFF_TEMPLATE);
    if (!item || !item.id) { return; }
    tapestry.world.placeEntity(item.id, roomId);
    tapestry.world.sendToRoom(roomId, STAFF_ROOM_LINE);
}

function wardBossIfPresent(roomId) {
    var npcs = tapestry.world.getEntitiesInRoom(roomId, "npc") || [];
    for (var i = 0; i < npcs.length; i++) {
        var mobId = npcs[i].id;
        var keywords = tapestry.world.getEntityKeywords(mobId) || [];
        var isGuardian = false;
        for (var k = 0; k < keywords.length; k++) {
            if (String(keywords[k]).toLowerCase() === "guardian") {
                isGuardian = true;
                break;
            }
        }
        if (!isGuardian) { continue; }
        if (tapestry.world.hasTag(mobId, "req_ward_dispel")) { continue; }
        tapestry.world.addTag(mobId, "req_ward_dispel");
        tapestry.world.setProperty(mobId, "description", WARD_BOSS_DESC);
        var name = npcs[i].name && npcs[i].name.trim() !== "" ? npcs[i].name : "something here";
        tapestry.world.setProperty(mobId, "swell_line1_tell_full", name + " winds up a heavy STRIKE - sidestep it!\r\n");
        tapestry.world.setProperty(mobId, "swell_line1_tell_shape", name + " winds up for something heavy.\r\n");
        tapestry.world.setProperty(mobId, "swell_line2_tell_full", name + " rears back for a crushing SLAM - brace for it!\r\n");
        tapestry.world.setProperty(mobId, "swell_line2_tell_shape", name + " rears back for something crushing.\r\n");
        tapestry.world.setProperty(mobId, "swell_tell_hidden", name + " gathers some dark energy.\r\n");
        tapestry.world.setProperty(mobId, "swell_narration_countered", "Clean read. Your counter lands and " + name + " staggers.");
        tapestry.world.setProperty(mobId, "swell_narration_whiffed", "Wrong move. The blow crashes through your guard.");
        tapestry.world.setProperty(mobId, "swell_narration_weathered", "Too slow. The blow lands full force.");
        tapestry.world.sendToRoom(roomId, telegraphLineFor(npcs[i].name));
    }
}

tapestry.events.on("player.direction.moved", function (evt) {
    try {
        var data = evt && evt.data;
        var entityId = data && data.entityId;
        var toRoom = data && data.toRoom;
        if (!entityId || !toRoom) { return; }
        var runSlug = activeRunSlug(entityId);
        if (!runSlug) { return; }
        if (runSlug.indexOf(WEEK_ONE_RUN_PREFIX) !== 0) { return; }
        placeWardStaffOnce(toRoom, runSlug);
        wardBossIfPresent(toRoom);
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
});

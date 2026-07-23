import * as tapestry from "@tapestry/engine";

// The Weaver first-login opener (spec "The Story", the inciting incident;
// output-cadence-cutscenes spec, slice 2). Plays once, before a brand-new
// player is ever handed control, then drops them at the hub. Plants the
// mystery the whole game investigates (where is the Weaver, what happened
// to the Loom) and ties it directly to the player's own threadwalker gift:
// the same rupture that took the Weaver is what pulled the player in and
// changed them. Consistent with the hub-keeper's established fiction
// (scripts/mobs/hub-keeper.js): "The Weaver used to stand right where you
// are. Nobody has seen them since the Loom went quiet." That "right where
// you are" is the Tapestry Hall, where the keeper stands and where this
// opener stages the Weaver. The keeper also says the Loom itself is
// undiscovered ("I have never found the door") - so this opener never
// claims the player wakes up IN the Loom, only that they wake up back at
// the hub (the Waystone Hall) after being swept through the weave. Do not
// contradict that line in any future rewrite of this file.
//
// Beat text is data, not hardcoded engine prose (the engine owns pacing;
// content owns words). pauseAfter is in engine ticks, 100ms each
// (CutsceneManager.DefaultPauseAfterTicks is 20, about 2s) - the numbers
// below are hand-tuned for dramatic timing, not the engine default.
//
// ASCII only; braces on all control flow.

var HUB_ENTRY_ROOM_ID = "tapestry-mud-threadwalker:hub-entry";
var OPENER_SEEN_PROPERTY = "weaver_opener_seen";
var RECALL_ROOM_PROPERTY = "recall_room_id";

// The hub is this world's recall point. `recall_room_id` is registered by
// @tapestry/core (properties.yml) and honoured by both core's recall verb and
// its death handler; when it is unset both fall back to tapestry-core:recall,
// which in this world is a two-room pocket with no exit back to the hub. Set it
// on every connect (not just in the opener's onComplete) so a character that
// reaches the world by any other path - an admin seed, a future login route -
// still has a working way home. Idempotent: same value written every time.
function ensureRecallRoom(entityId) {
    if (!entityId) { return; }
    tapestry.world.setProperty(entityId, RECALL_ROOM_PROPERTY, HUB_ENTRY_ROOM_ID);
}

var WEAVER_OPENER_BEATS = [
    { text: "The Weaver stands at the Tapestry, working the threads like a loom no one else can see.", pauseAfter: 35 },
    { text: "You are close enough to watch. You have watched before. This looks the same as always.", pauseAfter: 30 },
    { text: "Then a thread snaps, and white light tears open where it broke.", pauseAfter: 15 },
    { text: "The Weaver turns toward the tear, reaching for it, calling out one word you cannot catch.", pauseAfter: 15 },
    { text: "The light takes them whole.", pauseAfter: 10 },
    { text: "You run for the tear before you decide to. Your hand closes on it as it starts to close.", pauseAfter: 12 },
    { text: "The world unravels into thread. You are inside the weave now, and it is moving.", pauseAfter: 15 },
    { text: "Colors that are not colors. A rush of pattern, too fast to read, dragging you somewhere.", pauseAfter: 15 },
    { text: "Then, all at once, stillness.", pauseAfter: 25 },
    { text: "You are on your knees on cold stone, alone. The Tapestry hums quietly nearby, mending itself thread by thread. The Weaver is nowhere.", pauseAfter: 30 },
    { text: "Your hand still remembers the shape of the tear. Something in you changed when you touched it. You are a threadwalker now, whether you asked to be or not.", pauseAfter: 0 }
];

function hasSeenOpener(entityId) {
    return !!tapestry.world.getProperty(entityId, OPENER_SEEN_PROPERTY);
}

function playWeaverOpener(entityId) {
    // Re-check at the moment we actually start: the deferred tick below gives a second
    // caller (character.created and player.login can never both fire for the same
    // connect, but a defensive re-check costs nothing) a chance to have already set it.
    if (hasSeenOpener(entityId)) { return; }

    tapestry.cutscene.play(entityId, WEAVER_OPENER_BEATS, { skippable: true }, function () {
        // Set BEFORE the teleport, and only here (never at cutscene start): if the player
        // disconnects mid-opener, onComplete never fires, the flag stays false, and the
        // very next player.login (or, if the connection never even reaches persistence,
        // there simply is no next login yet) replays the opener from the top instead of
        // leaving a fresh character stranded with no path into the game (see the CRITICAL
        // gap Task 14 found: LocationRoomId is never otherwise set for a new character).
        tapestry.world.setProperty(entityId, OPENER_SEEN_PROPERTY, true);
        tapestry.world.teleportEntity(entityId, HUB_ENTRY_ROOM_ID);
        tapestry.world.sendRoomDescription(entityId);
    });
}

function maybeStartOpener(entityId) {
    if (!entityId) { return; }
    if (hasSeenOpener(entityId)) { return; }
    if (tapestry.cutscene.isActive(entityId)) { return; }

    // Defer exactly one tick past this handler. FinalizeCreating (new character) and
    // CompleteLogin (existing character) both unconditionally enqueue their own "motd"
    // and "look" commands right after publishing the event this hook listens on, and
    // those commands are still queued and run on the very next tick no matter what this
    // hook does. Waiting one tick lets that engine-native welcome/motd/room-look settle
    // first, so the opener's own beats never interleave with it - the cutscene starts
    // clean, immediately after, instead of racing it. This is the one narrow, deliberate
    // use of schedule in this file; it defers the START by a tick, it does not pace the
    // cutscene itself (CutsceneManager/CutscenePulse own that tick-by-tick).
    var handle = tapestry.schedule.every(1, function () {
        try {
            tapestry.schedule.cancel(handle);
            playWeaverOpener(entityId);
        } catch (err) {
            // graceful: never throw into the engine loop (tick handlers run outside any
            // command dispatch's own error boundary).
        }
    });
}

// Fires exactly once per character, the moment chargen commits - the true "first ever
// connect" hook for a brand-new player.
tapestry.events.on("character.created", function (evt) {
    try {
        ensureRecallRoom(evt && evt.sourceEntityId);
        maybeStartOpener(evt && evt.sourceEntityId);
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
});

// Fires on every subsequent login. A no-op once weaver_opener_seen is true; the only
// time it actually starts the opener is the narrow disconnect-mid-cutscene edge case
// above, where character.created already fired once but never got to completion.
tapestry.events.on("player.login", function (evt) {
    try {
        ensureRecallRoom(evt && evt.sourceEntityId);
        maybeStartOpener(evt && evt.sourceEntityId);
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
});

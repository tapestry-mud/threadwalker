import * as tapestry from "@tapestry/engine";

// frontier.js - where the corridor puts you (spec 3.3).
//
// The CORRIDOR ORDER below is the calendar. It is append-only: a new week adds one
// row at the END and nothing above it moves. Each row pairs a thread's baked
// templateId with the corridor room that holds its door.
//
// `recall` is not intercepted. Core's recall.ts teleports to recall_room_id, so the
// frontier is kept CURRENT on that property instead - written on login and again
// every time a thread is earned. That gets spec 3.3's "recall from anywhere lands
// you at your frontier" with no command override and no second mechanism.
//
// ASCII; braces on all control flow.

var CORRIDOR_ORDER = [
    { templateId: "REPLACE_AT_BAKE", roomId: "tapestry-mud-threadwalker:corridor-school" }
];

var CORRIDOR_HALL = "tapestry-mud-threadwalker:corridor-hall";
var RECALL_ROOM_PROPERTY = "recall_room_id";

function earnedThreads(entityId) {
    var raw = tapestry.world.getProperty(entityId, "threads_earned") || "[]";
    try {
        var parsed = JSON.parse(String(raw));
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (err) {
        // graceful: a corrupt list reads as none earned, which lands the player at
        // school - the safe direction, and self-correcting on their next clear.
    }
    return [];
}

/** The room holding the first door this player has not yet earned. A player who has
 *  cleared everything lands at the near end of the hall, which is the archive plus
 *  the Tapestry itself - correct, not a fallback. */
export function frontierRoomFor(entityId) {
    var earned = earnedThreads(entityId);
    for (var i = 0; i < CORRIDOR_ORDER.length; i++) {
        var row = CORRIDOR_ORDER[i];
        if (earned.indexOf(row.templateId) === -1) {
            return row.roomId;
        }
    }
    return CORRIDOR_HALL;
}

/** Keep recall_room_id pointed at the frontier. Idempotent; safe to call often. */
export function syncFrontier(entityId) {
    if (!entityId) {
        return;
    }
    try {
        tapestry.world.setProperty(entityId, RECALL_ROOM_PROPERTY, frontierRoomFor(entityId));
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
}

// Re-point on every login, so a character who earned a thread in a previous session
// recalls to the right door.
tapestry.events.on("player.login", function (evt) {
    try {
        syncFrontier(evt && evt.sourceEntityId);
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
});

// Re-point the moment a thread is earned. There is no generic property-change event
// in the engine to listen on here: Entity.SetProperty only notifies IPropertyObserver
// in-process, and the engine's own bridge to the event bus (EntityStatusBroadcaster)
// only republishes a write as entity.<topic>.changed for keys explicitly registered
// observable via PropertyRegistry.RegisterObservable - threads_earned is not one of
// those keys, so no event of that shape is ever published for it. Shipping a listener
// for "entity.property.changed" would be inert with no way to notice, since
// syncFrontier also runs on every player.login and would paper over the gap. Instead,
// oracle's thread-clear.ts publishes an explicit thread.earned event from its
// onComplete, once the grant actually lands, and that is what this listens on.
// events.publish sets no sourceEntityId, so the player id travels in evt.data.entityId.
tapestry.events.on("thread.earned", function (evt) {
    try {
        var data = evt && evt.data;
        syncFrontier(data && data.entityId);
    } catch (err) {
        // graceful: never throw into the engine loop.
    }
});

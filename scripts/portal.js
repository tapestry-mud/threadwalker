import * as tapestry from "@tapestry/engine";
import { startRun, heldThreadFor } from "@tapestry/oracle";
import { frontierRoomFor } from "./frontier.js";

// portal.js - what happens when you walk into a portal fixture (spec 4).
//
// ONE PORTAL PER THREAD, TWO BEHAVIORS (spec 4.1): holding that thread's key takes
// you to the Unraveling; not holding it takes you to the normal run. If you want
// the normal run again after earning the thread, leave the thread in the hub. No
// prompt, no menu, and the rule explains itself the first time somebody tries it.
//
// WHY A FIXTURE AND NOT A KEYWORD EXIT: keyword exits are invisible in the room
// render (ApiMessaging.SendRoomDescription builds its exits line from directional
// exits only), which is exactly the invisible-command failure this design deletes.
// A floor fixture IS rendered and IS look-able. So the portal is an item and this
// override is what makes ENTER see it.
//
// CROSS-PACK IMPORT: a bare `import { ... } from "@tapestry/oracle"` resolves to
// that pack's dist/scripts/index.js (TapestryModuleLoader's EntryRelFile), the
// same convention @tapestry/cooking uses for its `import * as survival from
// "@tapestry/survival"` interop (scripts/cook-buff.ts). startRun and
// heldThreadFor are re-exported through oracle's scripts/index.ts as part of
// this task; neither was reachable from outside the pack before.
//
// ASCII; braces on all control flow.

var THREAD_PORTAL_TAG = "thread_portal";
var HUB_PORTAL_TAG = "hub_portal";

function findPortalInRoom(roomId, keyword) {
    var items = tapestry.world.getEntitiesInRoom(roomId, "item") || [];
    var lower = String(keyword || "").toLowerCase();
    for (var i = 0; i < items.length; i++) {
        var id = items[i].id;
        var isPortal = tapestry.world.hasTag(id, THREAD_PORTAL_TAG) || tapestry.world.hasTag(id, HUB_PORTAL_TAG);
        if (!isPortal) {
            continue;
        }
        var keywords = tapestry.world.getEntityKeywords(id) || [];
        for (var k = 0; k < keywords.length; k++) {
            if (String(keywords[k]).toLowerCase() === lower) {
                return { id: id, name: items[i].name };
            }
        }
    }
    return null;
}

function numberProp(itemId, name, fallback) {
    var raw = tapestry.world.getProperty(itemId, name);
    var n = parseInt(String(raw), 10);
    if (isNaN(n)) {
        return fallback;
    }
    return n;
}

/** Walk a thread portal. Returns nothing; every failure path messages the actor
 *  and leaves them standing where they were. */
export function enterThreadPortal(actor, portal) {
    var templateId = String(tapestry.world.getProperty(portal.id, "template_id") || "");
    if (templateId === "" || templateId === "REPLACE_AT_BAKE") {
        actor.send("This door is not finished. Nothing is behind it yet.\r\n");
        return;
    }
    var band = {
        min: numberProp(portal.id, "band_min", 1),
        max: numberProp(portal.id, "band_max", 1),
        unravelingBoost: numberProp(portal.id, "unraveling_boost", 0)
    };
    // Holding the thread keyed to THIS template takes you to the Unraveling. A
    // thread from a different week is not this door's key and does nothing here
    // (spec 7.4's second binding), which self-enforces the level gate: to hold
    // week twenty's thread you must have cleared week twenty's normal run.
    var mode = heldThreadFor(actor.entityId, templateId) ? "unraveling" : "normal";
    if (mode === "unraveling") {
        actor.send("The thread in your hand goes taut, and the door opens onto something older and much less kind.\r\n");
    }
    startRun(actor, templateId, band, mode, actor.roomId);
}

/** Walk the hub's Tapestry. frontier.js owns where that lands. */
export function enterHubPortal(actor, portal) {
    var target = frontierRoomFor(actor.entityId);
    tapestry.world.sendToRoomExcept(actor.roomId, actor.entityId,
        actor.name + " steps into the weave and is gone.\r\n");
    tapestry.world.teleportEntity(actor.entityId, target);
    tapestry.world.sendRoomDescription(actor.entityId);
}

export { findPortalInRoom };

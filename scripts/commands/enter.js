import * as tapestry from "@tapestry/engine";
import { findPortalInRoom, enterThreadPortal, enterHubPortal } from "../portal.js";

// enter (override) - portals first, keyword exits second.
//
// Core's own `enter` (@tapestry/core scripts/commands/enter.ts) matches ONLY
// keyword exits, so it cannot see a portal fixture. Commands support
// { override: true } with a dependency edge on the owning pack, and this pack
// depends on @tapestry/core, so this is the supported route rather than a fork.
// @tapestry/viewer's tell/reply override is the shipped precedent.
//
// The keyword-exit half below is core's behavior reproduced verbatim, including
// the door checks and the room broadcast, so overriding costs the player nothing.
//
// ASCII; braces on all control flow.

tapestry.commands.register({
    name: "enter",
    override: true,
    roles: ["player"],
    args: {
        portal: { type: "keyword", required: true }
    },
    handler: function (actor, resolved) {
        var keyword = String(resolved.portal || "").toLowerCase();
        var roomId = actor.roomId;

        if (!roomId) {
            actor.send("You aren't anywhere.\r\n");
            return;
        }

        var portal = findPortalInRoom(roomId, keyword);
        if (portal) {
            var kind = tapestry.world.getProperty(portal.id, "portal_kind");
            if (kind === "hub") {
                enterHubPortal(actor, portal);
                return;
            }
            enterThreadPortal(actor, portal);
            return;
        }

        var exits = tapestry.portals.getKeywordExits(roomId);
        var match = null;
        for (var i = 0; i < exits.length; i++) {
            if (exits[i].keyword.toLowerCase() === keyword) {
                match = exits[i];
                break;
            }
        }

        if (!match) {
            actor.send("You don't see that here.\r\n");
            return;
        }

        if (match.door) {
            if (match.door.isLocked) {
                actor.send("That is locked.\r\n");
                return;
            }
            if (match.door.isClosed) {
                actor.send("That is closed.\r\n");
                return;
            }
        }

        tapestry.world.sendToRoomExcept(roomId, actor.entityId,
            actor.name + " passes through the " + match.name + ".\r\n");
        tapestry.world.teleportEntity(actor.entityId, match.targetRoomId);
        tapestry.world.sendRoomDescription(actor.entityId);
    }
});

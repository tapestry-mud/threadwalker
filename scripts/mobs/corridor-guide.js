import * as tapestry from "@tapestry/engine";
import { frontierRoomFor } from "../frontier.js";

// The corridor guide. Explains the corridor and NOTHING ELSE (spec 9.3).
//
// The old oracle guide handed over the starter kit on a say-trigger, and that
// trigger had a measured race: one bot's `say HELLO` six seconds after entry was
// silently dropped, while the identical input twelve seconds later fired. Rather
// than fix the race, the mechanism was deleted. This guide is load-bearing for
// nothing, so it cannot strand anyone.
//
// ASCII; braces on all control flow.

tapestry.mobs.registerScript("tapestry-mud-threadwalker:corridor-guide", {
    onSay: function (mob, player, text) {
        try {
            var lower = String(text || "").toLowerCase();
            if (/\b(where|far|progress|next|frontier|lost)\b/.test(lower)) {
                var room = frontierRoomFor(player.entityId);
                var here = room === mob.roomId
                    ? "You are standing at it. The door in front of you is the next one you have not walked."
                    : "Further down. Keep going until a door has no thread of yours on it.";
                tapestry.mobs.command(mob.entityId, "say " + here);
                return;
            }
            if (/\b(thread|threads|key|unravel|unraveling)\b/.test(lower)) {
                tapestry.mobs.command(mob.entityId, "say Clear a thread and it gives you a length of itself. Bring that back through the same door and the door opens onto the hard version.");
                tapestry.mobs.command(mob.entityId, "say Leave it behind and the door is ordinary again. Nothing is ever spent.", 2);
                return;
            }
            if (/\b(door|doors|portal|enter|how)\b/.test(lower)) {
                tapestry.mobs.command(mob.entityId, "say Walk to a door and ENTER it. That is the whole of it.");
                return;
            }
            tapestry.mobs.command(mob.entityId, "say The hall runs in order. Oldest behind you, newest ahead. Ask me about the DOORS or about THREADS.");
        } catch (err) {
            // graceful: never throw into the hook dispatcher.
        }
    }
});

import * as tapestry from "@tapestry/engine";

// The old keeper stands watch over the Tapestry. World-fiction only: the
// Weaver, the Loom, the Pattern. Never explains mechanics.
tapestry.mobs.registerScript("tapestry-mud-threadwalker:hub-keeper", {
    onLook: function(mob, player) {
        tapestry.mobs.command(mob.entityId, "emote looks up slowly from the threads.");
        tapestry.mobs.command(mob.entityId,
            "say The Weaver used to stand right where you are. Nobody has seen them since the Loom went quiet.", 1.0);
    },

    onSay: function(mob, player, text) {
        var lower = text.toLowerCase();

        if (lower.indexOf("weaver") >= 0) {
            tapestry.mobs.command(mob.entityId,
                "say The Weaver wove all of this, thread by thread. Then one day the Loom stopped, and so did they.");
            return;
        }

        if (lower.indexOf("loom") >= 0) {
            tapestry.mobs.command(mob.entityId,
                "say The Loom sits behind the Tapestry somewhere. I have never found the door.");
            return;
        }

        if (lower.indexOf("pattern") >= 0 || lower.indexOf("tapestry") >= 0) {
            tapestry.mobs.command(mob.entityId,
                "say Every thread you see was pulled from the Pattern. It still holds. The Weaver just isn't tending it anymore.");
            return;
        }
    }
});

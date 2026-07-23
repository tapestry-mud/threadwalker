import * as tapestry from "@tapestry/engine";

// A fellow threadwalker resting in the Waystone Hall. World-fiction only:
// what a threadwalker is, the missing Weaver. Never explains mechanics.
tapestry.mobs.registerScript("tapestry-mud-threadwalker:hub-wanderer", {
    onSay: function(mob, player, text) {
        var lower = text.toLowerCase();

        if (/\b(hello|hi)\b/.test(lower)) {
            tapestry.mobs.command(mob.entityId,
                "say Rest easy. We're all threadwalkers here, between one thread and the next.");
            return;
        }

        if (lower.indexOf("threadwalker") >= 0) {
            tapestry.mobs.command(mob.entityId,
                "say That's what we are now. We walk into the weave and pull threads loose. What we bring back stays real.");
            return;
        }

        if (lower.indexOf("weaver") >= 0) {
            tapestry.mobs.command(mob.entityId,
                "say I never met the Weaver. Just the empty space where they used to work.");
            return;
        }
    }
});

import * as tapestry from "@tapestry/engine";

var AFTERMATH_ROOM = "tapestry-mud-threadwalker:school-aftermath";

// The lesson cannot be beaten. onAttack fires once, synchronously, at
// combat.engage - before any per-tick damage phase ever runs - so the fight
// is cut short right here and scripted as a loss. It is never allowed to
// become a real vital.depleted death: the school is authored content, not an
// oracle run, so oracle_active_run is empty and a real death would hit
// core's non-run branch (wake at recall) instead of completing the quest.
// See quests/school.yaml + scripts/quests/school.js for the completion beat.
tapestry.mobs.registerScript("tapestry-mud-threadwalker:the-lesson", {
    onLook: function (mob, player) {
        tapestry.mobs.command(mob.entityId, "emote does not move. It does not need to.");
    },

    // attacker may be null if the engager could not be resolved.
    onAttack: function (mob, attacker) {
        if (!attacker) {
            return;
        }

        // Cut the fight short here, before any damage tick can apply. These two
        // calls run synchronously, in this same tick - combat.engage adds both
        // sides to the real combat list *before* it dispatches onAttack (see
        // CombatManager.Engage, which calls AddToCombatList then publishes
        // combat.engage - both synchronous), so if this cleanup were deferred
        // even one tick, the engine's own per-tick auto-attack phase could
        // resolve real damage against the attacker before we ever clear their
        // combat state. That would turn the designed loss into a real
        // vital.depleted death, which is exactly what this script exists to
        // prevent. Do not move these two calls into the deferred block below.
        tapestry.combat.removeFromAllCombat(attacker.entityId);
        tapestry.stats.restoreVitals(attacker.entityId);

        // Everything below is pure narration/output with no state-timing
        // requirement, so defer it by one tick: onAttack runs synchronously
        // inside combat.engage() itself, and the shared attack handler
        // (@tapestry/core scripts/combat/commands.ts) only sends the
        // attacker's own "You attack the lesson!" confirmation *after*
        // engage() returns. Without this defer, the mob's reaction, the loss
        // narration, and the room transition all print before the player's
        // own attack line ever does (S2-8). Deferring by one tick lets
        // engage() return (and commands.ts send its confirmation) first, so
        // the natural reading order - "You attack the lesson!" -> reaction ->
        // loss narration -> aftermath room - holds. Mirrors
        // scripts/hooks/weaver-opener.js:93-101's exact one-tick defer
        // pattern; this is the one narrow, deliberate use of schedule in this
        // file.
        var handle = tapestry.schedule.every(1, function () {
            try {
                tapestry.schedule.cancel(handle);

                tapestry.mobs.command(mob.entityId, "emote unravels you before you land a single blow.");

                tapestry.world.send(attacker.entityId,
                    "\r\nThe lesson does not fight back so much as it happens to you. For a moment " +
                    "you are thread and nothing else, pulled thin across the weave. Then you are " +
                    "standing again, and it is over.\r\n");

                tapestry.world.teleportEntity(attacker.entityId, AFTERMATH_ROOM);
                tapestry.world.sendRoomDescription(attacker.entityId);
            } catch (err) {
                // graceful: never throw into the engine loop (tick handlers run
                // outside any command dispatch's own error boundary).
            }
        });
    }
});

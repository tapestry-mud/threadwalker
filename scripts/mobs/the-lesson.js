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

        tapestry.mobs.command(mob.entityId, "emote unravels you before you land a single blow.");

        // Cut the fight short here, before any damage tick can apply. This is
        // a scripted loss, not real combat resolution.
        tapestry.combat.removeFromAllCombat(attacker.entityId);
        tapestry.stats.restoreVitals(attacker.entityId);

        tapestry.world.send(attacker.entityId,
            "\r\nThe lesson does not fight back so much as it happens to you. For a moment " +
            "you are thread and nothing else, pulled thin across the weave. Then you are " +
            "standing again, and it is over.\r\n");

        tapestry.world.teleportEntity(attacker.entityId, AFTERMATH_ROOM);
        tapestry.world.sendRoomDescription(attacker.entityId);
    }
});

import * as tapestry from "@tapestry/engine";

// The school's designed loss: a scripted defeat (scripts/mobs/the-lesson.js),
// not a real combat death - Law 1, "no death pays zero," felt not read.
// Completing the final "reach the aftermath" objective marks the school
// done: the first reward pays out automatically from this quest's own
// rewards block (engine-dispatched on completion), and this script sets the
// trophy property that unlocks the Tapestry board (Task 6 reads it).
tapestry.quests.registerScript("tapestry-mud-threadwalker:school", {
    onGranted: function (player) {
        // Return false -- let the default banner show via the notification queue.
        return false;
    },

    onCompleted: function (player) {
        tapestry.world.setProperty(player.entityId, "tapestry_unlocked", true);
        tapestry.world.send(player.entityId,
            "\r\nYou lost - and yet your hand closes on something real, pulled whole " +
            "from the weave. You are a threadwalker now. The Tapestry opens to you.\r\n");
    }
});

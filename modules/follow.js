const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalFollow, GoalNear } = require('mineflayer-pathfinder').goals

var bot = null, ai = null

module.exports = async function (...args) {
    if (args[4] === true) {
        [bot, ai] = args;
        bot.loadPlugin(pathfinder)
        const defaultMove = new Movements(bot)
        defaultMove.canDig = false
        defaultMove.canPlaceBlocks = false
        bot.pathfinder.setMovements(defaultMove)
        return;
    }
    const [add, username] = args;

    if (add === "goto") {
        await bot.pathfinder.goto(new GoalNear(...username.split(","), 3)).catch(err => { });
        const response = await ai.chat("System: You have completed your GOTO task. Now complete your next instruction, or decide if a different action is needed based on the last message.If there is no need for a different action dont respond to this message.", { sayignore: true });
        return;
    }
    else if (add === "unfollow") return bot.pathfinder.setGoal(null);
    else {
        const target = bot.players[username.toLowerCase()] ? bot.players[username.toLowerCase()].entity : null
        var success = true
        if (!target) success = false
        try {
            await bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
            return true;
        } catch (err) { success = false };
        if (!success) {
            await ai.chat("system: say I can't follow you, I don't see you!");
            return true;
        }
    }
}
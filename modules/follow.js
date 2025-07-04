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
        const [x, y, z] = username.split(",").map(Number)
        const currentGoal = bot.pathfinder.goal
        if (
            currentGoal &&
            currentGoal.x === x &&
            currentGoal.y === y &&
            currentGoal.z === z
        ) {
            await ai.chat("Kanka zaten oradayım, başka bir yere gitmemi ister misin? 😎 (Kaynak: https://github.com/PrismarineJS/mineflayer-pathfinder)");
            return;
        }
        await bot.pathfinder.goto(new GoalNear(x, y, z, 3)).catch(err => { });
        return await ai.chat("System: Gitmek istediğin yere Ulaştın. Şimdi başka bir eylem yapmak istersen yap, eğer yapmak istediğin eylem yoksa bu mesaja cevap verme.");
    }
    else if (!add) return bot.pathfinder.setGoal(null);
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
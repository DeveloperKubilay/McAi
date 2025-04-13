const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalFollow,GoalNear } = require('mineflayer-pathfinder').goals

module.exports = async function() {
    bot.loadPlugin(pathfinder)
    const defaultMove = new Movements(bot)
    defaultMove.canDig = false 
    defaultMove.canPlaceBlocks = false 
    bot.pathfinder.setMovements(defaultMove)

    global.followSystem = async function(add,username){
        if(add === "goto"){
            await bot.pathfinder.goto(new GoalNear(...username.split(","), 3)).catch(err => {});
            const response = await ai.chat("System: You have completed your GOTO task. Now complete your next instruction, or decide if a different action is needed based on the last message.If there is no need for a different action dont respond to this message.");
            await ai.think(response,{sayignore:true});
            return;
        }
        else if(add === "unfollow") return bot.pathfinder.setGoal(null);
        else{ 
            const target = bot.players[username.toLowerCase()] ? bot.players[username.toLowerCase()].entity : null
            var success = true
            if (!target) success = false
            try {
                await bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
                return true;
            } catch (err) { success = false };
            if(!success) {
                const response = await ai.chat("system: say I can't follow you, I don't see you!");
                await ai.think(response,{sayignore:true});
                return true;
            }
    }

    }
    
}
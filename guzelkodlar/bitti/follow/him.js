// This example uses promises instead of events like "goal_reached" for a cleaner look

const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalFollow } = require('mineflayer-pathfinder').goals

const bot = mineflayer.createBot({
    host: process.argv[2] || 'localhost',
    port: parseInt(process.argv[3]) || 25565,
    username: process.argv[4] || 'blockPlacer',
    password: process.argv[5]
})

// Load plugins
bot.loadPlugin(pathfinder)
bot.once('spawn', () => {
        // Set pathfinder movements
        const defaultMove = new Movements(bot)
        defaultMove.canDig = false 
        defaultMove.canPlaceBlocks = false 
        bot.pathfinder.setMovements(defaultMove)

        bot.on('chat', async (username, message) => {
                // If username is the same as the Bot's username, don't continue
                if (username === bot.username) return

                // Check for specific commands and usernames
                if (message === 'f') {
                        stopFollowing(username)
                } else if (message === 'follow me' && username === 'valancess') {
                        followUser(username)
                }
        })

        async function followUser(username) {
                const target = bot.players[username] ? bot.players[username].entity : null

                // If Player doesn't exist, don't continue
                if (!target) return bot.chat("I don't see you!")

                // Follow the player
                try {
                        bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
                        bot.chat(`I'm following you, ${username}!`)
                } catch (err) {
                        bot.chat("I couldn't follow you!")
                }
        }
        
async function stopFollowing() {
        bot.pathfinder.setGoal(null); // Hedefi sıfırla
        bot.chat("I've stopped following!");
}

})

const mineflayer = require('mineflayer')
const { pathfinder, goals } = require('mineflayer-pathfinder')
const GoalFollow = goals.GoalFollow
const GoalBlock = goals.GoalBlock

const bot = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: process.argv[4] ? process.argv[4] : 'sleeper',
    password: process.argv[5]     
})

bot.loadPlugin(pathfinder)
bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
bot.on('error', console.log)

bot.on('message', (msg) => {
    if (msg.toString().includes('find')) {
        locateBlock()
    }
})

async function locateBlock() {
    await bot.waitForChunksToLoad()
    const block = bot.findBlocks({
        matching: block => block.name.includes("emerald_block"),
        maxDistance: 256,
        count: 5,
    })
    console.log(block)
    const x = block[0].x
    const y = block[0].y + 1
    const z = block[0].z
    const goal = new GoalBlock(x, y, z)
    bot.pathfinder.setGoal(goal)
}
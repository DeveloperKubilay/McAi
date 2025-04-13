/*
 * This script will automatically look at the closest entity.
 * It checks for a near entity every tick.
 */
const mineflayer = require('mineflayer')

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log('Usage : node looker.js <host> <port> [<name>] [<password>]')
  process.exit(1)
}

const bot = mineflayer.createBot({
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4] ? process.argv[4] : 'looker',
  password: process.argv[5]
})

bot.once('spawn', function () {
  setInterval(() => {
    const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30)
    const nearestEntity = bot.nearestEntity()
    const entity = nearestPlayer || nearestEntity
    if (!entity) return
        bot.lookAt(entity.position.offset(0, 1.6, 0))
 
      //  bot.lookAt(entity.position)
    
  }, 50)
})
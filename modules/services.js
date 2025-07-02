module.exports = async function (bot, ai, userdata) {

  var amiinwater = false;
  var goesleep = false;

  setInterval(() => {
    if (!bot.pathfinder.isMoving()) {
      if (bot.entity.isInWater) {
        amiinwater = true;
        bot.setControlState('jump', true)
      } else if (amiinwater) {
        amiinwater = false;
        bot.setControlState('jump', false)
      }

      const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30)
      const nearestEntity = bot.nearestEntity()
      const entity = nearestPlayer || nearestEntity
      if (!entity) return
      bot.lookAt(entity.position.offset(0, 1.6, 0))
    }
  }, 100)

  bot.on('wake', async () => {

    /* if(!bot.time.isDay){
       const response = await ai.chat(userdata.name + ": Uyurken nedenini bilmiyorum ama kaldırıldım");
     }else{*/
    const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30);

    const response = await ai.chat(userdata.name + `: Uyandım sabah oldu ${nearestPlayer ? nearestPlayer.name + " yanımda günaydınmı desem?"
      : '(noresponse kullanmak önerilir)'} `);
    //  }
  })

  bot.on('time', async () => {
    //bot.time.timeOfDay
    if ((!bot.time.isDay || bot.isRaining) && !bot.isSleeping && !goesleep) {
      goesleep = true;
      await ai.chat(userdata.name + ": Akşam oldu, uyumam gerek. Eve gitmem lazım. (eve gitmek ve noresponse kullanmak önerilir)"
      );
    }
  })

  ///Services 

  bot.on('spawn', () => {
    bot.chat('I spawned, watch out!')
  })
  bot.on('spawnReset', (message) => {
    bot.chat('Oh noez! My bed is broken.')
  })
  bot.on('forcedMove', () => {
    bot.chat(`I have been forced to move to ${bot.entity.position}`)
  })
  bot.on('health', () => {
    bot.chat(`I have ${bot.health} health and ${bot.food} food`)
  })
  bot.on('death', () => {
    bot.chat('I died x.x')
  })
  bot.on('kicked', (reason) => { console.log("I am kicked"); process.exit(1) })
  bot.on('rain', () => {
    if (bot.isRaining) {
      bot.chat('It started raining.')
    } else {
      bot.chat('It stopped raining.')
    }
  })
  bot.on('noteHeard', (block, instrument, pitch) => {
    bot.chat(`Music for my ears! I just heard a ${instrument.name}`)
  })
  bot.on('chestLidMove', (block, isOpen) => {
    const action = isOpen ? 'open' : 'close'
    bot.chat(`Hey, did someone just ${action} a chest?`)
  })
  bot.on('playerJoined', (player) => {
    if (player.username !== bot.username) {
      bot.chat(`Hello, ${player.username}! Welcome to the server.`)
    }
  })
  bot.on('playerLeft', (player) => {
    if (player.username === bot.username) return
    bot.chat(`Bye ${player.username}`)
  })
  bot.on('playerCollect', (collector, collected) => {
    if (collector.type === 'player') {
      const item = collected.getDroppedItem()
      bot.chat(`${collector.username !== bot.username ? ("I'm so jealous. " + collector.username) : 'I '} collected ${item.count} ${item.displayName}`)
    }
  })
  bot.on('entityEat', (entity) => {
    if (entity.type === 'player' && entity.username !== bot.username) {
      bot.chat(`${entity.username} just ate something.`)
    }
  })

  bot.on('entityHurt', (entity) => {
    if (entity.type === 'mob') {
      bot.chat(`Haha! The ${entity.displayName} got hurt!`)
    } else if (entity.type === 'player') {
      bot.chat(`Aww, poor ${entity.username} got hurt. Maybe you shouldn't have a ping of ${bot.players[entity.username].ping}`)
    }
  })
  bot.on('entitySwingArm', (entity) => {
    bot.chat(`${entity.username}, I see that your arm is working fine.`)
  })
  bot.on('entityCrouch', (entity) => {
    bot.chat(`${entity.username}: you so sneaky.`)
  })
  bot.on('entityUncrouch', (entity) => {
    bot.chat(`${entity.username}: welcome back from the land of hunchbacks.`)
  })
  bot.on('entitySleep', (entity) => {
    bot.chat(`Good night, ${entity.username}`)
  })
  bot.on('entityWake', (entity) => {
    bot.chat(`Top of the morning, ${entity.username}`)
  })
  bot.on('entityEat', (entity) => {
    bot.chat(`${entity.username}: OM NOM NOM NOMONOM. That's what you sound like.`)
  })
  bot.on('entityAttach', (entity, vehicle) => {
    if (entity.type === 'player' && vehicle.type === 'object') {
      bot.chat(`Sweet, ${entity.username} is riding that ${vehicle.displayName}`)
    }
  })
  bot.on('entityDetach', (entity, vehicle) => {
    if (entity.type === 'player' && vehicle.type === 'object') {
      bot.chat(`Lame, ${entity.username} stopped riding the ${vehicle.displayName}`)
    }
  })
  bot.on('entityEquipmentChange', (entity) => {
    console.log('entityEquipmentChange', entity)
  })
  bot.on('entityEffect', (entity, effect) => {
    console.log('entityEffect', entity, effect)
  })
  bot.on('entityEffectEnd', (entity, effect) => {
    console.log('entityEffectEnd', entity, effect)
  })


}
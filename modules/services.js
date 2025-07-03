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

  ///Services 
  var logs = {}
  setInterval(async () => {
    text = "";
    Object.entries(logs).forEach(([name, value]) => {
      text += `${value}\n`;
    })
    if (!text) return;
    text = "Oyun dünyasında olan bitenler:\n" + text;
    console.log(text);
    logs = {}
    await ai.chat(text)
  }, 2000)

  bot.on('wake', async () => {
    /* if(!bot.time.isDay){
       const response = await ai.chat(userdata.name + ": Uyurken nedenini bilmiyorum ama kaldırıldım");
     }else{*/
    const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30);

    const response = logs[0] = userdata.name + `: Uyandım sabah oldu ${nearestPlayer ? nearestPlayer.name + " yanımda günaydınmı desem?"
      : '(noresponse kullanmak önerilir)'} `;
    //  }
  })

  bot.on('time', async () => {
    if ((!bot.time.isDay || bot.isRaining) && !bot.isSleeping && !goesleep) {
      goesleep = true;
      logs[6] = userdata.name + ": Güneş batıyor, uyumam gerek. (eve gitmek ve noresponse kullanmak önerilir)";
    }
  })


  bot.on('spawnReset', (message) => {
    logs[1] = userdata.name + `: Spawn noktam sıfırlandı. galiba yatağım kırıldı (noresponse kullanmak önerilir)`;
  })
  bot.on('forcedMove', () => {
    logs[1] = userdata.name + ": Birisi beni zorla hareket ettirdi. (noresponse kullanmak önerilir)";
  })
  bot.on('spawn', () => {
    if (userdata.newbot)
      logs[1] = userdata.name + ": Minecraft dünyasına yeni spawn oldum (noresponse kullanmak önerilir)";
    else
      logs[1] = userdata.name + ": Minecraft sunucusuna bağlandım (noresponse kullanmak önerilir)";
  })
  bot.on('health', () => {
    logs[2] = userdata.name + `: ${bot.health}/20 canım ve ${bot.food}/20 açlığım var.`;
  })
  bot.on('death', () => {
    logs[2] = userdata.name + ": Ben öldüm x.x";
  })
  bot.on('kicked', (reason) => { console.log("I am kicked"); })
  bot.on('rain', () => {
    if (bot.isRaining) 
      logs[3] = "Yağmur başladı.";
    else 
      logs[3] = "Yağmur durdu.";
  })
  bot.on('noteHeard', (block, instrument, pitch) => {
    logs[4] = userdata.name + `: Bir nota duydum, enstrüman: ${instrument.name}, ton: ${pitch}`;
  })
  bot.on('chestLidMove', (block, isOpen) => {
    const action = isOpen ? 'open' : 'close'
    logs[5] = `${userdata.name}: Bir sandığın kapağının ${action} olduğunu duydum.`;
  })
  bot.on('playerJoined', (player) => {
    if (player.username !== bot.username) {
      logs[6] = `${player.username} oyuna katıldı.`;
    }
  })
  bot.on('playerLeft', (player) => {
    if (player.username === bot.username) return
    logs[6] = `${player.username} oyundan ayrıldı. (noresponse kullanmak önerilir)`;
  })
  bot.on('playerCollect', (collector, collected) => {
    if (collector.type === 'player') {
      const item = collected.getDroppedItem()
      logs[7] = `${collector.username} topladı ${item.count} adet ${item.displayName}`;
      bot.chat(`${collector.username !== bot.username ? ("I'm so jealous. " + collector.username) : 'I '} collected ${item.count} ${item.displayName}`)
    }
  })
  bot.on('entityEat', (entity) => {
    if (entity.type === 'player' && entity.username !== bot.username) {
      logs[8] = `${entity.username} bir şey yedi. sesini duydum.`;
    }
  })

  bot.on('entityHurt', (entity) => {
    if (entity.type === 'mob') {
      logs[9] = `Bir ${entity.displayName} hasar aldı.`;
    } else if (entity.type === 'player') {
      logs[9] = `${entity.username} hasar aldı.`;
    }
  })
  bot.on('entityCrouch', (entity) => {
    if (entity.username) logs[10] = `${entity.username} çömeldi.`;
  })
  bot.on('entityUncrouch', (entity) => {
    if (entity.username) logs[10] = `${entity.username} çömelmeyi bıraktı.`;
  })
}
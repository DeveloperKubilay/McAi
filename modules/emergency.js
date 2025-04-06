module.exports = async function() {
    
var amiinwater = false;
var goesleep = false;

setInterval(()=>{
    if(!bot.pathfinder.isMoving()){
      if (bot.entity.isInWater) {
          amiinwater = true;
          bot.setControlState('jump', true)
      }else if(amiinwater) {
          amiinwater = false;
          bot.setControlState('jump', false)
      }

      const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30)
      const nearestEntity = bot.nearestEntity()
      const entity = nearestPlayer || nearestEntity
      if (!entity) return
          bot.lookAt(entity.position.offset(0, 1.6, 0))
    }
},100)

bot.on('wake', async () => {
  
 /* if(!bot.time.isDay){
    const response = await ai.chat(global.botname + ": Uyurken nedenini bilmiyorum ama kaldırıldım");
    await ai.think(response);
  }else{*/
   const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30);

    const response = await ai.chat(global.botname + `: Uyandım sabah oldu ${nearestPlayer ? nearestPlayer.name+" yanımda günaydınmı desem?" 
      : '(\"say\" komutunu kullanmak önerilmez)'} `);
    await ai.think(response);   
//  }
})

bot.on('time', async () => {
  if (!bot.time.isDay && !bot.isSleeping && !goesleep) {
    goesleep = true;
    const response = await ai.chat(global.botname + ": Akşam oldu, uyumam gerek. Eve gitmem lazım. (You don't have to use the \"say\" command)"
    );
    await ai.think(response);
  }
})


}
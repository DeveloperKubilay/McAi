module.exports = async function (data) {
  var n = data.replace("```json", "").replace("```", "").trim();
  if (n[0] != "[") n = "[" + n + "]";
  var json;
  try {
    json = JSON.parse(n);
  } catch (error) {
    console.log("Parse Error: ");
   const chat =  await ai.chat(`You have to give it in Json format, don't forget that as an example
- Single Action: [{"action":"<action>","target":"<target>","message":"<message>"}]
- Multiple Actions: [{"action":"<action>","target":"<target>","message":"<message>"},{"action":"<action>","target":"<target>","message":"<message>"}]

Don't make such a mistake again and say what you mean in json !c
Don't write me a message, just write Json, don't write I got it now !
`)
console.log(chat)
await ai.think(chat)
  }
  console.log("----------------------------\n")
  json.forEach(async function (item) {
    const action = item.action;
    console.log(item)   
    if (action == "say") {
      bot.chat(item.message);
    } else if (action == "followplayer")
      global.followSystem(item.type, item.target);
    else if (action == "goto")
      global.followSystem("goto", item.target);
    else if (action == "record") db.push("myrecords", item.message);
    else if (action == "sleep") {
      if (item.type == 1) {
        const bed = bot.findBlock({
          matching: (block) => bot.isABed(block),
        });
        if (bed) {
            try{
                await bot.sleep(bed);
            }catch{
                if(!bot.isRaining && bot.time.isDay) {
                    const response = await ai.chat("System:what are you doing it's morning and it's not raining you can't sleep according to minecraft rules be careful not to make mistakes (Don't use the count command between you and me).");
                    await ai.think(response);
                }else{
                const response = await ai.chat(global.botname + ": Yanımda canavarlar var veya yatak dolu bilmiyorum bir sebepten uyuyamadım");
                await ai.think(response);
              }
            }
        }else {
            const response = await ai.chat(global.botname + ": yatak yokmuş");
            await ai.think(response);
        }
      }else {try{  await bot.wake()}catch{}}
    }
  });
  console.log("----------------------------\n")
};

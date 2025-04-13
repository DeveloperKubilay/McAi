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
    else if (action == "sleep") global.utils.sleep(item);
  });
  console.log("----------------------------\n")
};
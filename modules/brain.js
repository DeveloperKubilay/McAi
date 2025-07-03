const followSystem = require("./follow.js");
const utils = require("./utils.js")();

var bot = null, ai = null, db = null, userdata = null;

module.exports = async function (...args) {
  if (args.length > 2) return [bot, ai, userdata, db] = args;
  const [data, params = {}] = args;

  var n = data.replace("```json", "").replace("```", "").trim();
  if (n[0] != "[") n = "[" + n + "]";
  var json;
  try {
    json = JSON.parse(n);
  } catch (error) {
    console.log("Parse Error: ");
    await ai.chat("You have to give it in Json format, don't forget that as an example\n- Single Action: [{\"action\":\"<action>\",\"target\":\"<target>\",\"message\":\"<message>\"}]\n- Multiple Actions: [{\"action\":\"<action>\",\"target\":\"<target>\",\"message\":\"<message>\"},{\"action\":\"<action>\",\"target\":\"<target>\",\"message\":\"<message>\"}]\n\nDon't make such a mistake again and say what you mean in json !c\nDon't write me a message, just write Json, don't write I got it now !\n")
  }
  console.log("----------------------------\n")
  json.forEach(async function (item) {
    const action = item.action;
    console.log(item)
    if (action == "give") {
      utils.give(item.target, item.item, item.amount || 1);
      if(item.message) item = { action: "say", target: item.target, message: item.message };
    }
    if (action == "say" && !params.sayignore) {
      if(params.whisper) return await bot.whisper(params.whisper, item.message);
      await bot.chat(item.message);
    } else if (action == "followplayer")
      followSystem(item.type, item.target);
    else if (action == "goto")
      followSystem("goto", item.target);
    else if (action == "record") db.push("myrecords", item.message);
    else if (action == "sleep") utils.sleep(item);
    else if (action == "addplayer") utils.addPlayer(item.target, item.message);
  });
  console.log("----------------------------\n")

};

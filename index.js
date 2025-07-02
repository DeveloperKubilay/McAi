require('dotenv').config();
global.c = require('ansi-colors');

async function start(model = "gemini_gemini-2.5-flash", botname = "Bot", token = process.env.GEMINI_API_KEY) {
  const mineflayer = require("mineflayer");
  const kubitdb = require("kubitdb");

  //Database
  const db = new kubitdb("./database/" + botname + ".json");
  if (!db.has("players")) require("./modules/noloadreq/dbsetup.js")(botname, db);
  const basicFunctions = require("./modules/noloadreq/basicFunctions.js")

  const bot = mineflayer.createBot({
    host: "localhost",
    username: botname,
  });

  bot.on("kicked", console.log);
  bot.on("error", console.log);

  await new Promise((resolve) => bot.once("spawn", resolve));

  const userdata = db.get("players").find(z => z.name == botname.toLowerCase())
  if (!userdata) return console.log("User not found in db"), process.exit(1);
  userdata.name = botname;
  userdata.inventory = JSON.stringify(basicFunctions.getinv(bot) || [])
  userdata.equipment = JSON.stringify(basicFunctions.getmyeq(bot) || [])

  const ai = await require("./ai/ai_base.js")({
    type: model,
    userdata: userdata,
    token: token
  });

  fs.readdirSync("./modules/").forEach((file) => {
    if (file.endsWith(".js")) require("./modules/" + file)(bot, ai, userdata, true);
  });

};

start(undefined,"ahmet");
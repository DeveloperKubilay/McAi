require('dotenv').config();
global.c = require('ansi-colors');

async function start(model = "gemini_gemini-2.5-flash", botname = "Bot", token = process.env.GEMINI_API_KEY) {
  const mineflayer = require("mineflayer");
  const kubitdb = require("kubitdb");
  const fs = require("fs");

  //Database
  const db = new kubitdb("./database/" + botname + ".json");
  var itsanewbot = false;
  if (!db.has("players")) itsanewbot=true, require("./modules/noloadreq/dbsetup.js")(botname, db);
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
  userdata.ramdb = {}
  userdata.newbot = itsanewbot;

  const ai = await require("./ai/ai_hub.js")({
    type: model.split("_")[0],
    modelname: model.split("_").slice(1).join("_"),
    userdata: userdata,
    token: token
  });

  fs.readdirSync("./modules/").forEach((file) => {
    if (file.endsWith(".js")) require("./modules/" + file)(bot, ai, userdata, db, true);
  });

};

start("gemma_gemma-3-27b-it","ahmet");
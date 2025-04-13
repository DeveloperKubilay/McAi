require('dotenv').config();
global.botname = process.env.BOTNAME || "Bot"

async function start(){
const mineflayer = require("mineflayer");
const kubitdb = require("kubitdb");
const fs = require("fs");
fs.writeFileSync("log.txt","")
global.c = require('ansi-colors');

//Database
global.db = new kubitdb("worlddata");
if(!db.has("players")) require("./modules/noloadreq/dbsetup.js")();
global.ramdb = require("./modules/noloadreq/ramdbsetup.js")()
global.globalg = require("./modules/noloadreq/globalg.js")

global.bot = mineflayer.createBot({
  host: "localhost",
  username: botname,
});

bot.on("kicked", console.log);
bot.on("error", console.log);


await new Promise((resolve) => bot.once("spawn", resolve));

var aitype = "gemini"
const userdata = db.get("players").find(z=>z.name == botname.toLowerCase()) 
if(!userdata) return console.log("User not found in db"),process.exit(1);
userdata.inventory = JSON.stringify(globalg.getinv() || [])
userdata.equipment = JSON.stringify(globalg.getmyeq() || [])

global.ai = await require("./ai/ai_base.js")({
  type: aitype,
  userdata:userdata
});

fs.readdirSync("./modules/").forEach((file) => {
  if (file.endsWith(".js")) require("./modules/" + file)(bot);
});





};
start();
global.botname = "ahmet"

async function start(){
const mineflayer = require("mineflayer");
const kubitdb = require("kubitdb");
const fs = require("fs");
fs.writeFileSync("log.txt","")
global.c = require('ansi-colors');

//Database
global.db = new kubitdb("worlddata");
if(!db.has("players")) require("./modules/noloadreq/dbsetup.js")();
global.ramdb = require("./modules/noloadreq/ramdbsetup.js")()
global.globalg = require("./modules/noloadreq/globalg.js")

global.bot = mineflayer.createBot({
  host: "localhost",
  username: botname,
});

bot.on("kicked", console.log);
bot.on("error", console.log);


await new Promise((resolve) => bot.once("spawn", resolve));

var aitype = "gemini"
const userdata = db.get("players").find(z=>z.name == botname.toLowerCase()) 
if(!userdata) return console.log("User not found in db"),process.exit(1);
userdata.inventory = JSON.stringify(globalg.getinv() || [])

global.ai = await require("./ai/ai_base.js")({
  type: aitype,
  userdata:userdata
});

fs.readdirSync("./modules/").forEach((file) => {
  if (file.endsWith(".js")) require("./modules/" + file)(bot);
});





};
start();
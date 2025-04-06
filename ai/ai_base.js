const trainer = require("./train.js");
module.exports = async function(data) {
    const model = require("./" + data.type + ".js");
    model.think = require("./ai_think.js");
    await model.createnewchat();
    if(data.type == "gemini"){
      await trainer(model,data);

//console.log("starttext",starttext)
//Your records:${JSON.stringify(db.get("myrecords"))}



    }

    return model;
}
const trainer = require("./old/train.js");
module.exports = async function(data,token) {
    const model = require("./models/" + data.type + ".js")(token);
    model.think = require("./ai_think.js");

    
    await model.createnewchat();
    await trainer(model,data);    //ai model, bot data

    return model;
}
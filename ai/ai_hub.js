const trainer = require("./train.js");
const think = require("../modules/brain.js");
module.exports = async function(data) {
    const model = require("./models/" + data.type + ".js")(data, think);

    await model.createNewChat();
    await trainer(model,data); 
    console.log(data.userdata.name+" trained successfully");

    return model;
}
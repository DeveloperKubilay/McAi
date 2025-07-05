const trainModule = require("./train.js"); // Changed to handle object export
const think = require("../modules/brain.js");
module.exports = async function(data) {
    const objectivePrompt = trainModule.objectivePrompt; // Extract objectivePrompt
    const modelInstance = require("./models/" + data.type + ".js")(data, think, objectivePrompt); // Pass objectivePrompt as third argument

    await modelInstance.createNewChat();
    await trainModule.train(modelInstance, data); // Use the train function from the module
    console.log(data.userdata.name + " trained successfully");

    return modelInstance;
}
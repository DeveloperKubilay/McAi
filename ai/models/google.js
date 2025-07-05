const { GoogleGenAI } = require('@google/genai')
var socket;
const fs = require('fs');

module.exports = function (modelConfig, think, objectivePrompt) { // Added objectivePrompt argument
  const config = {};
  var contents = []

  if (!modelConfig.modelname.includes("gemma")) {
    config.responseSchema = objectivePrompt; // Use passed objectivePrompt
    config.responseMimeType = 'application/json';
    config.thinkingConfig = {
      thinkingBudget: 24576,
    };
  } else {
    contents.push({
      role: 'user',
      parts: [{
        text: `responseSchema: ${JSON.stringify(objectivePrompt)} responseMimeType: 'application/json'`, // Use passed objectivePrompt
      }]
    })
  }


  return {
    createNewChat: async function () {
      fs.writeFileSync("log.txt", "")
      if (!socket) {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        socket = genAI.models
        contents = []
      }
    },
    justAddContent: function (data) {
      contents.push({
        role: 'user',
        parts: [{
          text: data
        }]
      });
    },
    chat: async function (data, params) {
      fs.appendFileSync("log.txt", "USER:" + data + "\n")
      contents.push({
        role: 'user',
        parts: [{
          text: data
        }]
      });
      if (!socket) await this.createNewChat();
      try {
        const result = await socket.generateContent({
          model: modelConfig.modelname, // Use modelConfig for consistency
          config,
          contents: contents
        });
        fs.appendFileSync("log.txt", "AI:" + result.text + "\n")
        return await think(result.text, params);
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await socket.generateContent({
          model: modelConfig.modelname,
          config,
          thinkingConfig: {
            thinkingBudget: 24576,
          },
          responseMimeType: 'application/json',
          contents: contents
        });
        return await think(result.text, params);
      }
    },
    noTrainingReq: true
  }
}
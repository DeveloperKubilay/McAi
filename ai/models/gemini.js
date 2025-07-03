const { GoogleGenAI } = require('@google/genai')
var socket;



const fs = require('fs');

const objectivePrompt = {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "say",
          "goto",
          "sleep",
          "followplayer",
          "give",
          "record",
          "noresponse",
          "addplayer"
        ]
      },
      "target": {
        "type": "string"
      },
      "type": {
        "type": "boolean"
      },
      "item": {
        "type": "string"
      },
      "amount": {
        "type": "integer"
      },
      "message": {
        "type": "string"
      }
    },
    "required": [
      "action",
      "target"
    ]
  }
}

const config = {
  thinkingConfig: {
    thinkingBudget: -1,
  },
  responseMimeType: 'application/json',
  responseSchema: objectivePrompt
};

module.exports = function (model, think) {
  var contents = []
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
          model: model.modelname,
          config,
          contents: contents
        });
        fs.appendFileSync("log.txt", "AI:" + result.text + "\n")
        return await think(result.text, params);
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await socket.generateContent({
          model: model.modelname,
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
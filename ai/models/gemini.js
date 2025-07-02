const { GoogleGenerativeAI } = require('@google/generative-ai')
var socket;

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
  responseMimeType: 'application/json',
  responseSchema: objectivePrompt
};

module.exports = function (model,think) {
  var contents = []
  return {
    createNewChat: async function () {
      if (!socket) {
        const genAI = new GoogleGenerativeAI(model.token);
        socket = genAI.getGenerativeModel({
          model: model.modelname,
          generationConfig: config
        });
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
      contents.push({
        role: 'user',
        parts: [{
          text: data
        }]
      });
      if (!socket) await this.createNewChat();
      try {
        const result = await socket.generateContent({
          contents: contents
        });
        return await think(result.response.text(), params);
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await socket.generateContent({
          contents: contents
        });
        return await think(result.response.text(), params);
      }
    },
    noTrainingReq: true
  }
}
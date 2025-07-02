const { Type,GoogleGenAI } = require('@google/genai')
const fs = require("fs")
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
          "record"
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
    thinkingBudget: 0,
  },
  responseMimeType: 'application/json',
  responseSchema: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      required: ["action", "target"],
      properties: {
        action: {
          type: Type.STRING,
          enum: ["say", "goto", "sleep", "followplayer", "give", "record"],
        },
        target: {
          type: Type.STRING,
        },
        type: {
          type: Type.BOOLEAN,
        },
        item: {
          type: Type.STRING,
        },
        amount: {
          type: Type.INTEGER,
        },
        message: {
          type: Type.STRING,
        },
      },
    },
  },
};


module.exports = function (model) {
  const contents = []
  return {
    createnewchat: async function (token) {
      if (!socket) socket = new GoogleGenAI({
        apiKey: token
      });
    },
    justAddContent: function (data) {
      contents.push({
        role: 'user',
        parts: [{
          text: data
        }]
      });
    },
    chat: async function (data) {
      contents.push({
        role: 'user',
        parts: [{
          text: data
        }]
      });
      if (!socket) await this.createnewchat();
      try {
        return await (await ai.models.generateContent({
          model,
          config,
          contents,
        })).response.text();
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await (await ai.models.generateContent({
          model,
          config,
          contents,
        })).response.text();
      }
    },
    noTrainingReq: true
  }
}
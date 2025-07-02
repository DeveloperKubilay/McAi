const { Ollama } = require('ollama')
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
};

module.exports = function (model) {
  const contents = []
  return {
    createnewchat: async function (host = 'http://localhost:11434') {
      if (!socket) socket = new Ollama({ 
        host: host 
      });
    },
    justAddContent: function (data) {
      contents.push({
        role: 'user',
        content: data
      });
    },
    chat: async function (data) {
      contents.push({
        role: 'user',
        content: data
      });
      if (!socket) await this.createnewchat();
      try {
        const response = await socket.chat({
          model: model,
          messages: contents,
          format: objectivePrompt,
          stream: false
        });
        return response.message.content;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await socket.chat({
          model: model,
          messages: contents,
          format: objectivePrompt,
          stream: false
        });
        return response.message.content;
      }
    },
    noTrainingReq: true
  }
}
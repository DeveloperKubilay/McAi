const OpenAI = require('openai')
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
    createnewchat: async function (apiKey) {
      if (!socket) socket = new OpenAI({
        apiKey: apiKey
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
        const response = await socket.chat.completions.create({
          model: model,
          messages: contents,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "objective_response",
              strict: true,
              schema: objectivePrompt
            }
          }
        });
        return response.choices[0].message.content;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await socket.chat.completions.create({
          model: model,
          messages: contents,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "objective_response",
              strict: true,
              schema: objectivePrompt
            }
          }
        });
        return response.choices[0].message.content;
      }
    },
    noTrainingReq: true
  }
}
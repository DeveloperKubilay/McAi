const axios = require('axios');
const fs = require('fs');

// Add objectivePrompt definition after the require statements
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
          "addplayer",
          "mine"
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

module.exports = function (model, think) {
  var contents = [];

  return {
    createNewChat: async function () {
      contents = []; // Reset message history
      // Add system message to enforce schema-based JSON response
      contents.push({
        role: 'system',
        content: `You are a helpful assistant. Always respond in JSON format according to the following schema: ${JSON.stringify(objectivePrompt)}`
      });
    },
    justAddContent: function (data) {
      contents.push({
        role: 'user',
        content: data
      });
    },
    chat: async function (data, params) {
      fs.appendFileSync("log.txt", "USER:" + data + "\n");
      contents.push({
        role: 'user',
        content: data
      });
      try {
        const response = await axios.post(
          process.env.AZURE_API_URL, // Use env var or fallback to default
          {
            messages: contents,
            max_completion_tokens: 6000,
            temperature: 1,
            top_p: 1,
            model: model.modelname
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AZURE_API_KEY}`
            }
          }
        );
        const aiResponse = response.data.choices[0].message.content; // Extract response text; adjust if API response differs
        fs.appendFileSync("log.txt", "AI:" + aiResponse + "\n");
        return await think(aiResponse, params);
      } catch (error) {
        console.error(error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simple retry with delay
        const response = await axios.post( // Retry the request
          process.env.AZURE_API_URL || "https://mainkt.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview",
          {
            messages: contents,
            max_completion_tokens: 16000,
            temperature: 1,
            top_p: 1,
            model: model.modelname
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AZURE_API_KEY}`
            }
          }
        );
        const aiResponse = response.data.choices[0].message.content;
        fs.appendFileSync("log.txt", "AI:" + aiResponse + "\n");
        return await think(aiResponse, params);
      }
    },
    noTrainingReq: true
  };
};

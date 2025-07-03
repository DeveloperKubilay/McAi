// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();
async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
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
            enum: ["say", "goto", "sleep", "followplayer", "give", "record", "noresponse", "addplayer"],
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
    }
  };
  const model = 'gemini-2.5-flash';
  const contents = [
        {
      role: 'user',
      parts: [
        {
          text: `"give": Bir oyuncuya bir item vermek için kullanılır.
Eğer bir oyuncu senden bir şey isterse (örneğin buğday, elma, vb.) give komutu kullanmalısın.
Give komutu şu şekilde olmalı: {"action": "give", "target": "oyuncu_adı", "item": "item_adı", "amount": miktar}
Örnek: {"action": "give", "target": "testplayer", "item": "Apple", "message": "10x"}
`,
        },
      ],
    },
    {
      role: 'user',
      parts: [
        {
          text: `5 buğday atsana valancess ismim`,
        },
      ],
    }
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  
  let fullResponse = '';
  
  for await (const chunk of response) {
    fullResponse += chunk.text;
    console.log("Gelen parça:", chunk.text);
  }
  
  try {
    // JSON yanıtı parse et
    const parsedResponse = JSON.parse(fullResponse);
    console.log("🔍 Parsed JSON:", parsedResponse);
    
    // Give komutu var mı kontrol et
    const giveCommand = parsedResponse.find(cmd => cmd.action === "give");
    if (giveCommand) {
      console.log("✅ GIVE KOMUTU BULUNDU:", giveCommand);
    } else {
      console.log("❌ GIVE KOMUTU YOK! AI şu komutu döndürdü:");
      console.log(parsedResponse);
    }
  } catch (error) {
    console.error("💀 JSON parse hatası:", error.message);
    console.log("Ham yanıt:", fullResponse);
  }
}

main();

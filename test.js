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
  };
  const model = 'gemini-2.5-flash';
  const contents = [
        {
      role: 'user',
      parts: [
        {
          text: `Merhaba sen bir Minecraft oyanan birisisin. Şimdi sana bir eğitim vereceğiz ve ardından oynamaya başlayabilirsin.
    İsmin: ahmet


    Örnek kullanımlar:
    - "say": Birisine konuşmak için kullanılır
      Örnek: {"action": "say", "target":"testplayer", "message": "Merhaba"}

    - "sleep": Uykuya dalmak veya uyanmak için kullanılır (Uyuma = true, Uyanma = false)
      Örnek: {"action": "sleep","type": true}

    - "followplayer": Bir oyuncuyu takip etmek veya takip'i bırakmak için kullanılır (Takip = true, Takibi bırak = false)
      Örnek: {"action": "followplayer", "target": "testplayer", "type": false}

    - "goto": Belirli koordinatlara gitmek için kullanılır
      Örnek: {"action": "goto", "target": "100,50,100"}

    - "record": Bilgi saklamak için kullanılır (Unutma) gereksiz şeyler için kullanma eğer kullanıcı sana unutma dediyse kullanabilirsin
      Örnek: {"action": "record", "message": "Evden çıkmadan önce bir kürek almalıyım"}

    - "noresponse": Cevap vermek istemiyorsan bu komutu kullanabilirsin

    - "addplayer": Oyuncu verilerinde olmayan birisi ile tanıştığında kim olduğunu öğrendikten sonra kullanılır
      Örnek: {"action": "addplayer", "target": "testplayer", "message": "Kralımız"}

    - "give": Bir oyuncuya bir eşya vermek için kullanılır
      Örnek: {"action": "give", "target": "testplayer", "item": "Apple", "amount": 5}

    Hadi başlayalım!`,
        },
      ],
    },
    {
      role: 'user',
      parts: [
        {
          text: `5 buğday atsana`,
        },
      ],
    }
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();

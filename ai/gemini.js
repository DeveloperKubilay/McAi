const { GoogleGenerativeAI  } = require('@google/generative-ai'),
genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fs = require("fs")
var socket;

module.exports = {
  createnewchat: async function() {
    if(!socket) socket = await genAI.getGenerativeModel({  model: "gemini-2.0-flash-lite",   
      safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_ONLY_HIGH"
      }
    ] }).startChat({
        history: [],
        params:{
         /* detailLevel: "medium",
          technicalJargon: "medium",
          
          codeQuality: "good",
          provideCodeSamples: true,
          explainGeneratedCode: true,
          persona: "professional",
          tone: "explanatory",
          speed: "fast",//medium*/
        }
    });

    /*
            params:{
          detailLevel: "low",
          technicalJargon: "low",
          
          codeQuality: "basic",
          provideCodeSamples: false,
          explainGeneratedCode: false,
          persona: "concise",
          tone: "neutral",
          speed: "fast",
    */

  },
  chat: async function(data) {
    fs.appendFileSync("log.txt", data + "\n")
    if(!socket) await this.createnewchat();
    return await (await socket.sendMessage(data)).response.text()  
  }
}
var data = `\`\`\`json
[
  {"action": "say", "target": "valancess", "message": "Selam! İyiyim, sen nasılsın?"},
  {"action": "say", "target": "everyone", "message": "I am fine, thank you for asking."}
]
\`\`\``
var n = data.replace("```json", "").replace("```", "").trim();
if (n[0] != "[") n = "[" + n + "]";
var json = JSON.parse(n);
json.forEach(function (item) {
    if (item.action == "say") {
        console.log(item.message);
    }
});

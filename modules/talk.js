module.exports = async function (bot, ai, userdata, db) {
    const ramdb = userdata.ramdb;

    bot.on('whisper', (username, message) => msg(username, message, true));
    bot.on("chat", (username, message) => msg(username, message));

    async function msg(username, message, whisper = false) {
        if (username === bot.username) return;
        var promt = ""
        const playerEntity = bot.players[username]?.entity;
        if (playerEntity) {
            const distance = bot.entity.position.distanceTo(playerEntity.position);
            if (distance > 32) return;
            const nowdata = {
                helmet: playerEntity.equipment[5]?.name || null,
                chestplate: playerEntity.equipment[4]?.name || null,
                leggings: playerEntity.equipment[3]?.name || null,
                boots: playerEntity.equipment[2]?.name || null,
                mainhand: playerEntity.equipment[0]?.name || null,
                offhand: playerEntity.equipment[1]?.name || null,
            }
            const olddata = ramdb["parmors" + username] || {}
            const changed = []
            if (nowdata.helmet != olddata.helmet) changed.push({ type: "helmet", name: nowdata.helmet })
            if (nowdata.chestplate != olddata.chestplate) changed.push({ type: "chestplate", name: nowdata.chestplate })
            if (nowdata.leggings != olddata.leggings) changed.push({ type: "leggings", name: nowdata.leggings })
            if (nowdata.boots != olddata.boots) changed.push({ type: "boots", name: nowdata.boots })
            if (nowdata.mainhand != olddata.mainhand) changed.push({ type: "mainhand", name: nowdata.mainhand })
            if (nowdata.offhand != olddata.offhand) changed.push({ type: "offhand", name: nowdata.offhand })
            ramdb["parmors" + username] = nowdata
            if (changed.length > 0) {
                promt = username + `'s items have changed:`
                changed.forEach((item) => promt += `(${item.type}: ${item.name || 'removed'})`);
                promt += `\n`;
            }
            promt += username + "'s Coordinate: " + bot.players[username].entity.position
                + `\n`;

        } else if (!message.includes(bot.username)) return;

        const nearbyMobs = [];
        const maxDistance = 30;
        const botPos = bot.entity.position;

        for (const entity of Object.values(bot.entities)) {
            const distance = entity.position.distanceTo(botPos);
            if (distance <= maxDistance) {
                if (entity.username == bot.username) continue;
                nearbyMobs.push({
                    name: entity.username || entity.displayName + ` (${entity.type},id:${entity.id})`, distance,
                    position: entity.position,
                });
                if (nearbyMobs.length === 10) break;
            }
        }
        nearbyMobs.sort((a, b) => a.distance - b.distance);

        promt += `System:\n` +
            `- Day/Night: ${bot.time.isDay ? "Day" : "Night"} ${bot.isRaining ? "Raining" : ""}, Time: ${bot.time.timeOfDay}\n` +
            `- your Coordinates: ${bot.entity.position}, your Health: ${bot.health}, your Food: ${bot.food}\n` +
            `- Nearby Mobs: [${nearbyMobs.map(mob =>
                `{${mob.name},${Math.round(mob.distance)}m,${Math.round(mob.position.x)},${Math.round(mob.position.y)},${Math.round(mob.position.z)}}`
            ).join(', ') + "\n" || ''}\n`;

        username = username.toLowerCase()
        if (!ramdb["talk" + username]) {
            const targetdata = db.get("players").find(z => z.name == username)
            ramdb["talk" + username] = targetdata;
            const data = JSON.stringify(targetdata)
            if (data) promt += `User infos: ${data}\n`;
        }
        promt += "=>" + username + ": " + message

        await ai.chat(promt, { whisper: whisper ? username : false });
    }

}

var bot = null, ai = null, userdata = null, db = null;

module.exports = function (...args) {
    if (args[4] === true)
        return [bot, ai, userdata, db] = args;

    return {
        sleep: async function (item) {
            if (item.type) {
                const bed = bot.findBlock({
                    matching: (block) => bot.isABed(block),
                });
                if (bed) {
                    try {
                        await bot.sleep(bed);
                    } catch {
                        if (!bot.isRaining && bot.time.isDay) {
                            await ai.chat("System:what are you doing it's morning and it's not raining you can't sleep according to minecraft rules be careful not to make mistakes (Don't use the count command between you and me).");
                        } else {
                            await ai.chat(userdata.name + ": Yanımda canavarlar var veya yatak dolu bilmiyorum bir sebepten uyuyamadım");
                        }
                    }
                } else {
                    await ai.chat(userdata.name + ": yatak yokmuş");
                }
            } else { try { await bot.wake() } catch { } }
        },
        addPlayer: async function (name, message) {
            db.set("players", db.get("players").filter(z => z.name != name));
            db.push("players", {
                name: name,
                message: message
            });
        },
        give: async function (target, item, amount = 1) {
            const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && bot.entity.position.distanceTo(entity.position) <= 30 && entity.username === target);
            if (!nearestPlayer) return await ai.chat("System: Kullanıcı yakınında değil, yanına gelmesini ardından atabileceğini söyleyebilirsin.");
            bot.lookAt(nearestPlayer.position.offset(0, 1.6, 0));

            const itemType = bot.registry.itemsByName[item.split(" ").join("_").toLowerCase()];
            if (!itemType) return await ai.chat("System: I don't know this item, please check the item name.");
            const itemCount = bot.inventory.count(itemType.id);
            if (itemCount >= amount) {
                await bot.toss(itemType.id, null, amount);
            } else {
                return await ai.chat(userdata.name + ": Yeterli " + item + " yok elimde");
            }
        }





    }
}
var bot = null, ai = null, userdata = null;


module.exports = async function (...args) {
    if (args[3] === true) {
        [bot, ai, userdata] = args;
        return;
    }
    const [item] = args;

    if (item.type == 1) {
        const bed = bot.findBlock({
            matching: (block) => bot.isABed(block),
        });
        if (bed) {
            try {
                await bot.sleep(bed);
            } catch {
                if (!bot.isRaining && bot.time.isDay) {
                    const response = await ai.chat("System:what are you doing it's morning and it's not raining you can't sleep according to minecraft rules be careful not to make mistakes (Don't use the count command between you and me).");
                    await ai.think(response);
                } else {
                    const response = await ai.chat(userdata.name + ": Yanımda canavarlar var veya yatak dolu bilmiyorum bir sebepten uyuyamadım");
                    await ai.think(response);
                }
            }
        } else {
            const response = await ai.chat(userdata.name + ": yatak yokmuş");
            await ai.think(response);
        }
    } else { try { await bot.wake() } catch { } }


}
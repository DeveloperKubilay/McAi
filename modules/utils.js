var bot = null, ai = null, userdata = null;


module.exports = async function (...args) {
    if (args[4] === true)
        return [bot, ai, userdata] = args;

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
        }
    }
}
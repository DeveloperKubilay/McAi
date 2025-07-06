var bot = null, ai = null
const Vec3 = require('vec3');
const { GoalBlock, GoalNear } = require('mineflayer-pathfinder').goals;
const MAX_DISTANCE = 50; // Maximum distance threshold for pathfinding attempts

module.exports = async function (...args) {
    if (args[4] === true)  [bot, ai] = args;
    let itemname = args[0];
    itemname = String(itemname || "");
    if (!itemname) return;
    let amountStr = String(args[1] || "1"); // Force conversion to string, default to "1"
    // Parse amount from string, extracting numeric value (e.g., "10x" -> 10)
    let amount = parseInt(amountStr.replace(/\D/g, ''), 10) || 1; // Remove non-digit characters and parse, default to 1 if invalid
    if (amount > 64) amount = 64; // Cap amount at 64 as before
    
    // Modified findBlocksInRadius to include block name in result
    const findBlocksInRadius = async (blockName, radius = 2, minY = null, maxY = null) => {
        const mcData = require('minecraft-data')(bot.version);
        const blockType = mcData.blocksByName[blockName];
        
        if (!blockType) return { status: false, message: `${blockName} diye bir blok bulamadım knk 😕\n\nBazen isim yanlış yazılmış olabiliyor, bi' daha kontrol et. Minecraft blok isimleri için kaynak: https://minecraft.fandom.com/wiki/Biome 🔗` };
        
        try {
            const blocks = bot.findBlocks({
                matching: blockType.id,
                maxDistance: radius,
                count: amount * 10 // Increased count to ensure enough blocks are found for digging
            });
            
            // Filter blocks by y-level if minY and maxY are provided
            let filteredBlocks = blocks;
            if (minY !== null && maxY !== null) {
                filteredBlocks = blocks.filter(pos => pos.y >= minY && pos.y <= maxY);
            }
            
            if (filteredBlocks.length === 0) {
                return { 
                    status: false, 
                    message: `Hiç ${blockName} bulamadım. Başka yere bakmayı dene.` 
                };
            }

            // Find nearest block among filtered blocks
            const botPos = bot.entity.position;
            let minDist = Infinity;
            let nearest = null;
            for (const pos of filteredBlocks) {
                const dist = botPos.distanceTo(new Vec3(pos.x, pos.y, pos.z));
                if (dist < minDist) {
                    minDist = dist;
                    nearest = pos;
                }
            }

            // Compute clusters (unchanged)
            const clusters = findBlockClusters(filteredBlocks);
            
            return {
                status: true,
                message: `Bulundu.`,
                bestLocation: nearest,
                allLocations: clusters,
                count: filteredBlocks.length,
                blocks: filteredBlocks, // Use filtered blocks
                blockName: blockName
            };
        } catch (error) {
            console.log(`❌ Hata oluştu: ${error.message}`);
            return { status: false, message: `Bir hata oldu ya, olmadı bu iş 💀 ${error.message}` };
        }
    };
    
    // Blok kümelerini bul - En yoğun bölgeleri tespit et (no changes, but may be unused now)
    const findBlockClusters = (blockPositions, clusterRadius = 16) => {
        const clusters = [];
        
        // Her bloğu bir kümenin merkezi olarak değerlendir
        blockPositions.forEach(pos => {
            // Bu blok etrafında diğer blokları say
            const nearbyBlocks = blockPositions.filter(other => 
                Math.sqrt(
                    Math.pow(pos.x - other.x, 2) + 
                    Math.pow(pos.y - other.y, 2) + 
                    Math.pow(pos.z - other.z, 2)
                ) <= clusterRadius
            );
            
            clusters.push({
                center: pos,
                blockCount: nearbyBlocks.length,
                blocks: nearbyBlocks  // Added blocks array
            });
        });
        
        // En çok blok içeren kümelere göre sırala
        clusters.sort((a, b) => b.blockCount - a.blockCount);
        
        // Benzer kümeleri birleştir (çok yakın olanları)
        const uniqueClusters = [];
        clusters.forEach(cluster => {
            const isSimilarToExisting = uniqueClusters.some(existingCluster => 
                Math.sqrt(
                    Math.pow(cluster.center.x - existingCluster.center.x, 2) + 
                    Math.pow(cluster.center.y - existingCluster.center.y, 2) + 
                    Math.pow(cluster.center.z - existingCluster.center.z, 2)
                ) < clusterRadius / 2
            );
            
            if (!isSimilarToExisting) {
                uniqueClusters.push(cluster);
            }
        });
        
        return uniqueClusters.slice(0, 5).map(cluster => ({
            x: cluster.center.x,
            y: cluster.center.y,
            z: cluster.center.z,
            count: cluster.blockCount,
            blocks: cluster.blocks,  // Added blocks array
            density: (cluster.blockCount / (4/3 * Math.PI * Math.pow(clusterRadius, 3))).toFixed(5)
        }));
    };
    
    // Biyomlara göre blokların olasılık haritası 🗺️ (no changes)
    const biomeProbabilityMap = {
        'oak_log': ['forest', 'plains', 'sunflower_plains'],
        'spruce_log': ['taiga', 'snowy_taiga', 'old_growth_pine_taiga'],
        'birch_log': ['birch_forest', 'old_growth_birch_forest'],
        'jungle_log': ['jungle', 'sparse_jungle'],
        'acacia_log': ['savanna', 'savanna_plateau'],
        'dark_oak_log': ['dark_forest'],
        'mangrove_log': ['mangrove_swamp'],
        'cherry_log': ['cherry_grove'],
        'diamond_ore': ['underground', 'y-level: -60 to 16'],
        'iron_ore': ['underground', 'y-level: -64 to 320'],
        'coal_ore': ['underground', 'y-level: -64 to 320'],
        'gold_ore': ['underground', 'y-level: -64 to 32', 'badlands (all y levels)']
    };
    
    // İstenilen blok için en iyi lokasyon ve tavsiyeler (modified digBlocks call to pass block name)
    let result = { status: false, message: "" };
    
    if (itemname && (itemname.includes('log') || itemname.includes('wood'))) {
        const specificLog = itemname.split('_')[0] + '_log';
        const biomeSuggestions = biomeProbabilityMap[specificLog] || biomeProbabilityMap['oak_log'];
        
        // Parse y-level if available (logs may not have specific y-levels)
        let minY = null, maxY = null;
        if (biomeProbabilityMap[specificLog] && biomeProbabilityMap[specificLog].some(s => s.includes('y-level:'))) {
            const yLevelStr = biomeProbabilityMap[specificLog].find(s => s.includes('y-level:'));
            if (yLevelStr) {
                const yMatch = yLevelStr.match(/y-level: (-?\d+) to (-?\d+)/);
                if (yMatch) {
                    minY = parseInt(yMatch[1], 10);
                    maxY = parseInt(yMatch[2], 10);
                }
            }
        }
        
        result = await findBlocksInRadius(itemname, 2, minY, maxY); // Pass minY and maxY
        
        if (result.status) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (toplam ${result.count} blok bulundu)`;
            result.message += `\n\nGenelde şu biyomlarda bulunur: ${biomeSuggestions.join(', ')} 🌲`;
            let dug = await digBlocks(bot, result, amount, itemname); // Pass itemname as blockName
            if (dug > 0) {
                result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
            } else {
                result.message += `\nHiç blok kazılamadı. Birden fazla küme denendi.`;
            }
        } else {
            // Fallback: Increase radius and retry with y-level adjustment if possible
            result.message += `\n\nBu blok tipini şu biyomlarda aramayı dene: ${biomeSuggestions.join(', ')} 🔍`;
            if (minY !== null && maxY !== null) {
                result = await findBlocksInRadius(itemname, 64, minY, maxY); // Larger radius retry
                if (result.status) {
                    result.message = `Daha geniş alanda arandı ve bulundu.\n` + result.message;
                    let dug = await digBlocks(bot, result, amount, itemname); // Pass itemname as blockName
                    if (dug > 0) {
                        result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
                    }
                } else {
                    result.message += `\nY-level ${minY} ile ${maxY} arasında başka bir yere gitmeyi dene.`;
                }
            }
            result.status = false; // Ensure status remains false if no blocks found
        }
    } else if (itemname && itemname.includes('ore')) {
        const biomeSuggestions = biomeProbabilityMap[itemname] || ['underground', 'caves'];
        
        // Parse y-level from biomeProbabilityMap
        let minY = null, maxY = null;
        if (biomeProbabilityMap[itemname] && biomeProbabilityMap[itemname].some(s => s.includes('y-level:'))) {
            const yLevelStr = biomeProbabilityMap[itemname].find(s => s.includes('y-level:'));
            if (yLevelStr) {
                const yMatch = yLevelStr.match(/y-level: (-?\d+) to (-?\d+)/);
                if (yMatch) {
                    minY = parseInt(yMatch[1], 10);
                    maxY = parseInt(yMatch[2], 10);
                }
            }
        } else {
            // Default y-range for ores without specific data
            minY = -64;
            maxY = 64; // Minecraft world height, can be adjusted
        }
        
        result = await findBlocksInRadius(itemname, 2, minY, maxY); // Initial search with y-filter
        
        if (result.status) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (toplam ${result.count} blok bulundu)`;
            result.message += `\n\nGenelde şu yerlerde bulunur: ${biomeSuggestions.join(', ')} ⛏️`;
            let dug = await digBlocks(bot, result, amount, itemname); // Pass itemname as blockName
            if (dug > 0) {
                result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
            } else {
                result.message += `\nHiç blok kazılamadı. Birden fazla küme denendi.`;
            }
        } else {
            // Fallback: Increase radius and suggest moving to better y-level
            result.message += `\n\nBu cevheri şuralarda aramayı dene: ${biomeSuggestions.join(', ')} 💎`;
            result = await findBlocksInRadius(itemname, 64, minY, maxY); // Larger radius retry
            if (result.status) {
                result.message = `Daha geniş alanda arandı ve bulundu.\n` + result.message;
                let dug = await digBlocks(bot, result, amount, itemname); // Pass itemname as blockName
                if (dug > 0) {
                    result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
                }
            } else {
                // Otomatik olarak uygun y-level'a git ve dolaş
                if (bot && bot.entity && typeof minY === 'number' && typeof maxY === 'number') {
                    const currentPos = bot.entity.position;
                    // Hedef y-level: minY ile maxY'nin ortası
                    const targetY = Math.floor((minY + maxY) / 2);
                    // X ve Z'yi biraz rastgele değiştirerek dolaşma efekti
                    const randomOffset = () => Math.floor(Math.random() * 10) - 5;
                    const targetX = currentPos.x + randomOffset();
                    const targetZ = currentPos.z + randomOffset();
                    try {
                        await bot.pathfinder.goto(new GoalBlock(targetX, targetY, targetZ));
                        // Dolaşma: 3 kez rastgele yakın bloklara git
                        for (let i = 0; i < 3; i++) {
                            const roamX = targetX + randomOffset();
                            const roamZ = targetZ + randomOffset();
                            await bot.pathfinder.goto(new GoalBlock(roamX, targetY, roamZ));
                        }
                    } catch (err) {
                        // Hedefe gidilemezse hata bastırılır
                    }
                }
                // Mesajı temizle, kullanıcıya mesaj gönderilmesin
                result.message = "";
            }
            result.status = false; // Ensure status remains false if no blocks found
        }
    } else {
        result = await findBlocksInRadius(itemname, 2); // No y-level for non-ore/wood blocks
        
        if (result.status && result.bestLocation) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (toplam ${result.count} blok bulundu)`;
            let dug = await digBlocks(bot, result, amount, itemname); // Pass itemname as blockName
            if (dug > 0) {
                result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
            } else {
                result.message += `\nHiç blok kazılamadı.`;
            }
        }
    }
    
    return result;
}

// Add new helper function for adjacent positions (no changes, can be kept or removed if unused)
function getAdjacentPositions(pos) {
    return [
        new Vec3(pos.x + 1, pos.y, pos.z),
        new Vec3(pos.x - 1, pos.y, pos.z),
        new Vec3(pos.x, pos.y + 1, pos.z),
        new Vec3(pos.x, pos.y - 1, pos.z),
        new Vec3(pos.x, pos.y, pos.z + 1),
        new Vec3(pos.x, pos.y, pos.z - 1)
    ];
}

// Add new helper function for item collection
async function collectDroppedItem(bot, blockPosition) {
    console.log(`[DEBUG] Attempting to collect dropped item near ${blockPosition}.`);
    let collectionAttempts = 0;
    const maxCollectionRetries = 5; // Increased retries for better reliability
    const droppedItem = bot.nearestEntity(e => e.type === 'object' && e.name === 'item' && e.position.distanceTo(blockPosition) < 1.5);
    if (droppedItem) {
        while (collectionAttempts < maxCollectionRetries) {
            try {
                await bot.pathfinder.goto(new GoalNear(droppedItem.position.x, droppedItem.position.y, droppedItem.position.z, 1));
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for auto-pickup
                if (!bot.nearestEntity(e => e.id === droppedItem.id)) {
                    console.log(`[DEBUG] Item collected successfully at ${droppedItem.position}.`);
                    return true; // Item collected
                }
            } catch (err) {
                collectionAttempts++;
                console.log(`[DEBUG] Item collection attempt ${collectionAttempts} failed: ${err.message}`);
            }
        }
        console.log(`[DEBUG] Failed to collect item after max retries.`);
    } else {
        console.log(`[DEBUG] No dropped item found near ${blockPosition}.`);
    }
    return false; // Item not collected or not found
}

// Yeni yardımcı fonksiyon: uygun kazma veya eşya seç
async function equipBestTool(bot, block) {
    if (!block) return;
    const mcData = require('minecraft-data')(bot.version);
    // Blok için en iyi aleti bul
    const tool = bot.pathfinder.bestHarvestTool(block);
    if (tool && bot.inventory.items().some(i => i.type === tool.type)) {
        // Envanterde varsa eline al
        try {
            await bot.equip(tool.type, 'hand');
            return true;
        } catch (e) {
            // Ekipman başarısız, devam et
        }
    } else {
        // Eğer tool yoksa, elmas/altın/kazma türü bir şey varsa onu dene
        const pickaxeIds = [
            mcData.itemsByName['diamond_pickaxe']?.id,
            mcData.itemsByName['netherite_pickaxe']?.id,
            mcData.itemsByName['iron_pickaxe']?.id,
            mcData.itemsByName['golden_pickaxe']?.id,
            mcData.itemsByName['stone_pickaxe']?.id,
            mcData.itemsByName['wooden_pickaxe']?.id
        ].filter(Boolean);
        const invPickaxe = bot.inventory.items().find(i => pickaxeIds.includes(i.type));
        if (invPickaxe) {
            try {
                await bot.equip(invPickaxe, 'hand');
                return true;
            } catch (e) {}
        }
    }
    return false;
}

// Modify digBlocks to use the new collectDroppedItem function
async function digBlocks(bot, blocksResult, amount, blockName) {
    console.log(`[DEBUG] digBlocks started with increased persistence for block ${blockName}.`);
    bot.isDigging = true;
    const botPos = bot.entity.position.floor();
    let blocksDug = 0;
    const maxGlobalAttempts = 20; // Global max attempts to prevent infinite loops
    let globalAttempts = 0;

    // First, check and dig from adjacent positions with path clearing
    while (blocksDug < amount && globalAttempts < maxGlobalAttempts) {
        globalAttempts++;
        const adjacentPositions = getAdjacentPositions(botPos);
        for (const pos of adjacentPositions) {
            if (blocksDug >= amount) {
                console.log(`[DEBUG] Reached dug amount ${blocksDug} in adjacent loop, breaking.`);
                return blocksDug; // Early return if amount reached
            }
            const block = bot.blockAt(pos);
            if (block && block.name === blockName && bot.canDigBlock(block)) {
                // --- Ekle: uygun aleti eline al ---
                await equipBestTool(bot, block);
                // --- Son ---
                let attempts = 0;
                const maxRetries = 7; // Increased for persistence
                let dugSuccessfully = false;
                while (attempts < maxRetries) {
                    try {
                        await bot.pathfinder.goto(new GoalBlock(pos.x, pos.y, pos.z));
                        await bot.lookAt(block.position);
                        await bot.dig(block);
                        blocksDug++;
                        dugSuccessfully = true;
                        console.log(`[DEBUG] Successfully dug adjacent block at ${pos}. Total dug: ${blocksDug}`);
                        await collectDroppedItem(bot, block.position); // Call new function for item collection
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait after dig
                        break; // Success, move to next position
                    } catch (err) {
                        if (err.message.includes('Took too long') && bot.blockAt(pos) && bot.canDigBlock(bot.blockAt(pos))) {
                            // Attempt to dig obstructing block
                            try {
                                await bot.dig(bot.blockAt(pos));
                                console.log(`[DEBUG] Dug obstructing block at ${pos} to clear path.`);
                            } catch (digErr) {
                                console.log(`[DEBUG] Failed to dig obstructing block at ${pos}: ${digErr.message}`);
                            }
                            if (attempts < maxRetries - 1) {
                                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retry
                                continue;
                            }
                        }
                        attempts++;
                        console.log(`[DEBUG] Dig attempt ${attempts} failed for adjacent block at ${pos}: ${err.message}`);
                        if (!err.message.includes('Took too long')) {
                            break; // Non-timeout error, stop retries for this block
                        }
                    }
                }
            }
        }

        if (blocksDug < amount && blocksResult.status) {
            // Fallback to dig from found blocks with path clearing
            const sortedBlocks = blocksResult.blocks.sort((a, b) => botPos.distanceTo(new Vec3(a.x, a.y, a.z)) - botPos.distanceTo(new Vec3(b.x, b.y, b.z)));
            for (const blockPos of sortedBlocks) {
                if (blocksDug >= amount) {
                    console.log(`[DEBUG] Reached dug amount ${blocksDug} in fallback loop, breaking.`);
                    return blocksDug; // Early return if amount reached
                }
                const block = bot.blockAt(blockPos);
                if (block && block.name === blockName && bot.canDigBlock(block)) {
                    // --- Ekle: uygun aleti eline al ---
                    await equipBestTool(bot, block);
                    // --- Son ---
                    let attempts = 0;
                    const maxRetries = 7; // Increased for persistence
                    let dugSuccessfully = false;
                    while (attempts < maxRetries) {
                        try {
                            await bot.pathfinder.goto(new GoalBlock(blockPos.x, blockPos.y, blockPos.z));
                            await bot.lookAt(block.position);
                            await bot.dig(block);
                            blocksDug++;
                            dugSuccessfully = true;
                            console.log(`[DEBUG] Successfully dug block at ${blockPos}. Total dug: ${blocksDug}`);
                            await collectDroppedItem(bot, block.position); // Call new function for item collection
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait after dig
                            break;
                        } catch (err) {
                            if (err.message.includes('Took too long') && bot.blockAt(blockPos) && bot.canDigBlock(bot.blockAt(blockPos))) {
                                // Attempt to dig obstructing block
                                try {
                                    await bot.dig(bot.blockAt(blockPos));
                                    console.log(`[DEBUG] Dug obstructing block at ${blockPos} to clear path.`);
                                } catch (digErr) {
                                    console.log(`[DEBUG] Failed to dig obstructing block at ${blockPos}: ${digErr.message}`);
                                }
                                if (attempts < maxRetries - 1) {
                                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retry
                                    continue;
                                }
                            }
                            attempts++;
                            console.log(`[DEBUG] Dig attempt ${attempts} failed for block at ${blockPos}: ${err.message}`);
                            if (!err.message.includes('Took too long')) {
                                break; // Non-timeout error, stop retries for this block
                            }
                        }
                    }
                }
            }
        } else if (blocksDug < amount) {
            // Further fallback with larger radius search and path clearing
            console.log(`[DEBUG] Falling back to larger radius search for block ${blockName}. Global attempt ${globalAttempts}.`);
            const largerRadiusResult = await findBlocksInRadius(blockName, 64);
            if (largerRadiusResult.status) {
                const sortedNearestBlocks = largerRadiusResult.blocks.sort((a, b) => botPos.distanceTo(new Vec3(a.x, a.y, a.z)) - botPos.distanceTo(new Vec3(b.x, b.y, b.z))).slice(0, amount - blocksDug);
                for (const blockPos of sortedNearestBlocks) {
                    if (blocksDug >= amount) {
                        console.log(`[DEBUG] Reached dug amount ${blocksDug} in nearest block loop, breaking.`);
                        return blocksDug; // Early return if amount reached
                    }
                    const block = bot.blockAt(blockPos);
                    if (block && block.name === blockName && bot.canDigBlock(block) && botPos.distanceTo(blockPos) <= MAX_DISTANCE) {
                        // --- Ekle: uygun aleti eline al ---
                        await equipBestTool(bot, block);
                        // --- Son ---
                        let attempts = 0;
                        const maxRetries = 7; // Increased for persistence
                        let dugSuccessfully = false;
                        while (attempts < maxRetries) {
                            try {
                                await bot.pathfinder.goto(new GoalBlock(blockPos.x, blockPos.y, blockPos.z));
                                await bot.lookAt(block.position);
                                await bot.dig(block);
                                blocksDug++;
                                dugSuccessfully = true;
                                console.log(`[DEBUG] Successfully dug nearest block at ${blockPos}. Total dug: ${blocksDug}`);
                                await collectDroppedItem(bot, block.position); // Call new function for item collection
                                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait after dig
                                break;
                            } catch (err) {
                                if (err.message.includes('Took too long') && bot.blockAt(blockPos) && bot.canDigBlock(bot.blockAt(blockPos))) {
                                    // Attempt to dig obstructing block
                                    try {
                                        await bot.dig(bot.blockAt(blockPos));
                                        console.log(`[DEBUG] Dug obstructing block at ${blockPos} to clear path.`);
                                    } catch (digErr) {
                                        console.log(`[DEBUG] Failed to dig obstructing block at ${blockPos}: ${digErr.message}`);
                                    }
                                    if (attempts < maxRetries - 1) {
                                        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retry
                                        continue;
                                    }
                                }
                                attempts++;
                                console.log(`[DEBUG] Dig attempt ${attempts} failed for nearest block at ${blockPos}: ${err.message}`);
                                if (!err.message.includes('Took too long')) {
                                    break; // Non-timeout error, stop retries
                                }
                            }
                        }
                    }
                }
            } else {
                console.log(`[DEBUG] No blocks found in larger radius search. Global attempt ${globalAttempts}.`);
            }
        }
    }

    bot.isDigging = false;
    console.log(`[DEBUG] digBlocks finished. Total blocks dug: ${blocksDug}. Global attempts: ${globalAttempts}`);
    return blocksDug;
}
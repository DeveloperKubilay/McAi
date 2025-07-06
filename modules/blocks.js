var bot = null, ai = null
const Vec3 = require('vec3');
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const MAX_DISTANCE = 50; // Maximum distance threshold for pathfinding attempts

module.exports = async function (...args) {
    if (args[4] === true)  [bot, ai] = args;
    let itemname = args[0];
    itemname = String(itemname || "");
    if (!itemname) return;
    let amount = args[1] || 1;
    if (amount > 64) amount = 64;
    
    // Modified findBlocksInRadius to return raw block positions
    const findBlocksInRadius = async (blockName, radius = 64) => {
        const mcData = require('minecraft-data')(bot.version);
        const blockType = mcData.blocksByName[blockName];
        
        if (!blockType) return { status: false, message: `${blockName} diye bir blok bulamadım knk 😕\n\nBazen isim yanlış yazılmış olabiliyor, bi' daha kontrol et. Minecraft blok isimleri için kaynak: https://minecraft.fandom.com/wiki/Biome 🔗` };
        
        try {
            const blocks = bot.findBlocks({
                matching: blockType.id,
                maxDistance: radius,
                count: amount * 10 // Increased count to ensure enough blocks are found for digging
            });
            
            if (blocks.length === 0) {
                return { 
                    status: false, 
                    message: `Hiç ${blockName} bulamadım. Başka yere bakmayı dene.` 
                };
            }

            // Find nearest block
            const botPos = bot.entity.position;
            let minDist = Infinity;
            let nearest = null;
            for (const pos of blocks) {
                const dist = botPos.distanceTo(new Vec3(pos.x, pos.y, pos.z));
                if (dist < minDist) {
                    minDist = dist;
                    nearest = pos;
                }
            }

            // Compute clusters for informational purposes
            const clusters = findBlockClusters(blocks);
            
            return {
                status: true,
                message: `Bulundu.`,
                bestLocation: nearest,
                allLocations: clusters,
                count: blocks.length,
                blocks: blocks // Add raw blocks array for digging
            };
        } catch (error) {
            console.log(`❌ Hata oluştu: ${error.message}`);
            return { status: false, message: `Bir hata oldu ya, olmadı bu iş 💀 ${error.message}` };
        }
    };
    
    // Blok kümelerini bul - En yoğun bölgeleri tespit et
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
    
    // Biyomlara göre blokların olasılık haritası 🗺️
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
    
    // İstenilen blok için en iyi lokasyon ve tavsiyeler
    let result = { status: false, message: "" };
    
    if (itemname && (itemname.includes('log') || itemname.includes('wood'))) {
        const specificLog = itemname.split('_')[0] + '_log';
        const biomeSuggestions = biomeProbabilityMap[specificLog] || biomeProbabilityMap['oak_log'];
        
        result = await findBlocksInRadius(itemname, 64);
        
        if (result.status) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (toplam ${result.count} blok bulundu)`;
            result.message += `\n\nGenelde şu biyomlarda bulunur: ${biomeSuggestions.join(', ')} 🌲`;
            let dug = await digBlocks(bot, result, amount);
            if (dug > 0) {
                result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
            } else {
                result.message += `\nHiç blok kazılamadı. Birden fazla küme denendi.`;
            }
        } else {
            result.message += `\n\nBu blok tipini şu biyomlarda aramayı dene: ${biomeSuggestions.join(', ')} 🔍`;
        }
    } else if (itemname && itemname.includes('ore')) {
        const biomeSuggestions = biomeProbabilityMap[itemname] || ['underground', 'caves'];
        
        result = await findBlocksInRadius(itemname, 48);
        
        if (result.status) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (toplam ${result.count} blok bulundu)`;
            result.message += `\n\nGenelde şu yerlerde bulunur: ${biomeSuggestions.join(', ')} ⛏️`;
            let dug = await digBlocks(bot, result, amount);
            if (dug > 0) {
                result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
            } else {
                result.message += `\nHiç blok kazılamadı. Birden fazla küme denendi.`;
            }
        } else {
            result.message += `\n\nBu cevheri şuralarda aramayı dene: ${biomeSuggestions.join(', ')} 💎`;
        }
    } else {
        result = await findBlocksInRadius(itemname, 64);
        
        if (result.status && result.bestLocation) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (toplam ${result.count} blok bulundu)`;
            let dug = await digBlocks(bot, result, amount);
            if (dug > 0) {
                result.message += `\nBaşarıyla ${dug} blok kazıldı.`;
            } else {
                result.message += `\nHiç blok kazılamadı.`;
            }
        }
    }
    
    return result;
}

// Modify collectDroppedItem to add debugging logs for item drop and collection attempts
async function collectDroppedItem(bot, position) {
    return new Promise((resolve) => {
        bot.once('itemDrop', (item) => {
            console.log(`Item dropped detected at position ${item.position}. Checking if near mined position ${position}.`);
            if (item.position.distanceSquared(position) < 1) { // Check if drop is near the mined position
                try {
                    bot.collectEntity(item, () => {
                        console.log(`Successfully collected item at ${item.position}.`);
                        resolve(); // Resolve after successful collection
                    });
                } catch (err) {
                    console.log(`Error collecting entity at position ${position}: ${err.message}. Skipping collection.`);
                    resolve(); // Resolve without action on error
                }
            } else {
                console.log(`Item at ${item.position} is not near mined position ${position}, skipping collection.`);
                resolve(); // If not the correct drop, resolve without action
            }
        });
        // Set a timeout to avoid infinite wait, e.g., 5 seconds
        setTimeout(() => {
            console.log(`Timeout waiting for item collection at position ${position}.`);
            resolve();
        }, 5000);
    });
}

// Modify digBlocks to add fallback for individual block digging if cluster center pathfinding fails
async function digBlocks(bot, blocksResult, amount) {
    bot.isDigging = true; // Set flag to indicate digging is in progress
    if (!blocksResult.status || !blocksResult.allLocations || blocksResult.allLocations.length === 0) {
        bot.isDigging = false; // Clear flag if no blocks to dig
        return 0;
    }
    let blocksDug = 0;
    const botPos = bot.entity.position;
    const sortedClusters = blocksResult.allLocations.slice().sort((a, b) => {
        const distA = botPos.distanceTo(new Vec3(a.x, a.y, a.z));
        const distB = botPos.distanceTo(new Vec3(b.x, b.y, b.z));
        return distA - distB;
    });
    for (const cluster of sortedClusters) {
        if (blocksDug >= amount) break;
        const centerPos = new Vec3(cluster.x, cluster.y, cluster.z);
        if (botPos.distanceTo(centerPos) > MAX_DISTANCE) continue; // Skip if center is too far
        let reachedCenter = false;
        // Attempt to pathfind to cluster center with retries
        let attempts = 0;
        const maxRetries = 3;
        while (attempts < maxRetries) {
            try {
                await bot.pathfinder.goto(new GoalBlock(cluster.x, cluster.y, cluster.z));
                reachedCenter = true;
                break;
            } catch (err) {
                attempts++;
                if (err.message.includes('Took too long')) {
                    console.log(`Pathfinding timeout to cluster center at (${cluster.x}, ${cluster.y}, ${cluster.z}). Attempt ${attempts}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.log(`Failed to pathfind to cluster center: ${err.message}`);
                    break;
                }
            }
        }
        if (reachedCenter) {
            // If center reached, dig blocks from current position
            const currentBotPos = bot.entity.position;
            const clusterBlocks = cluster.blocks.slice().sort((a, b) => {
                const distA = currentBotPos.distanceTo(new Vec3(a.x, a.y, a.z));
                const distB = currentBotPos.distanceTo(new Vec3(b.x, b.y, b.z));
                return distA - distB;
            });
            for (const blockPos of clusterBlocks) {
                if (blocksDug >= amount) break;
                const block = bot.blockAt(blockPos);
                if (!block) continue;
                const dist = currentBotPos.distanceTo(new Vec3(blockPos.x, blockPos.y, blockPos.z));
                if (dist > MAX_DISTANCE) continue;
                if (dist < 1.5) {
                    try {
                        await bot.lookAt(block.position); // Added: Make bot look at the block before digging
                        await bot.dig(block);
                        await collectDroppedItem(bot, blockPos);
                        blocksDug++;
                    } catch (err) {
                        console.log(`Failed to dig adjacent block at ${blockPos}: ${err.message}`);
                    }
                } else {
                    try {
                        await bot.pathfinder.goto(new GoalBlock(blockPos.x, blockPos.y, blockPos.z));
                        await bot.lookAt(block.position); // Added: Make bot look at the block before digging
                        await bot.dig(block);
                        await collectDroppedItem(bot, blockPos);
                        blocksDug++;
                    } catch (err) {
                        console.log(`Failed to dig block at ${blockPos}: ${err.message}`);
                    }
                }
            }
        } else {
            // Fallback: If center pathfinding failed, try digging each block individually with retries
            console.log(`Cluster center unreachable at (${cluster.x}, ${cluster.y}, ${cluster.z}), falling back to individual block digging.`);
            const clusterBlocks = cluster.blocks.slice().sort((a, b) => {
                const distA = botPos.distanceTo(new Vec3(a.x, a.y, a.z));
                const distB = botPos.distanceTo(new Vec3(b.x, b.y, b.z));
                return distA - distB;
            });
            for (const blockPos of clusterBlocks) {
                if (blocksDug >= amount) break;
                const block = bot.blockAt(blockPos);
                if (!block) continue;
                const dist = botPos.distanceTo(new Vec3(blockPos.x, blockPos.y, blockPos.z));
                if (dist > MAX_DISTANCE) continue;
                let blockAttempts = 0;
                const blockMaxRetries = 3;
                while (blockAttempts < blockMaxRetries) {
                    try {
                        await bot.pathfinder.goto(new GoalBlock(blockPos.x, blockPos.y, blockPos.z));
                        await bot.lookAt(block.position); // Added: Make bot look at the block before digging
                        await bot.dig(block);
                        await collectDroppedItem(bot, blockPos);
                        blocksDug++;
                        break; // Success, move to next block
                    } catch (err) {
                        blockAttempts++;
                        if (err.message.includes('Took too long')) {
                            console.log(`Pathfinding timeout for block at ${blockPos}. Attempt ${blockAttempts}`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            console.log(`Failed to dig block at ${blockPos}: ${err.message}`);
                            break; // Non-timeout error, skip block
                        }
                    }
                }
            }
        }
    }
    bot.isDigging = false; // Clear flag after digging is complete
    return blocksDug;
}
var bot = null, ai = null

module.exports = async function (...args) {
    if (args[4] === true)  [bot, ai] = args;
    let itemname = args[0];

    





    itemname = String(itemname || "");
    
    if (!itemname) return { status: false, message: "Yo! Ne aramam gerek söylemedin! 🤔" };
    
    // Biyom bazlı blok analizi 🌳
    const findBlocksInRadius = async (blockName, radius = 64) => {
        const mcData = require('minecraft-data')(bot.version);
        const blockType = mcData.blocksByName[blockName];
        
        if (!blockType) return { status: false, message: `${blockName} diye bir blok bulamadım knk 😕` };
        
        console.log(`🔍 ${blockName} bloklarını arıyorum, ${radius} blok yarıçapında...`);
        
        try {
            // Botu çevreleyen blokları tara
            const blocks = bot.findBlocks({
                matching: blockType.id,
                maxDistance: radius,
                count: 100
            });
            
            if (blocks.length === 0) {
                return { status: false, message: `${radius} blok çevrede hiç ${blockName} bulamadım 😢` };
            }
            
            // Bulunan blokları analiz et ve grupla
            const clusters = findBlockClusters(blocks);
            
            return {
                status: true,
                message: `Toplam ${blocks.length} adet ${blockName} buldum! 🎯`,
                bestLocation: clusters[0],
                allLocations: clusters,
                count: blocks.length
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
                blocks: nearbyBlocks
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
    
    // Özel blok tipleri için tavsiyeler
    if (itemname && (itemname.includes('log') || itemname.includes('wood'))) {
        const specificLog = itemname.split('_')[0] + '_log';
        const biomeSuggestions = biomeProbabilityMap[specificLog] || biomeProbabilityMap['oak_log'];
        
        result = await findBlocksInRadius(itemname, 64);
        
        if (result.status) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (${result.bestLocation.count} blok var burada)`;
            result.message += `\n\nGenelde şu biyomlarda bulunur: ${biomeSuggestions.join(', ')} 🌲`;
        } else {
            result.message += `\n\nBu blok tipini şu biyomlarda aramayı dene: ${biomeSuggestions.join(', ')} 🔍`;
        }
    }
    // Cevher blokları için
    else if (itemname && itemname.includes('ore')) {
        const biomeSuggestions = biomeProbabilityMap[itemname] || ['underground', 'caves'];
        
        result = await findBlocksInRadius(itemname, 48);
        
        if (result.status) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (${result.bestLocation.count} blok var burada)`;
            result.message += `\n\nGenelde şu yerlerde bulunur: ${biomeSuggestions.join(', ')} ⛏️`;
        } else {
            result.message += `\n\nBu cevheri şuralarda aramayı dene: ${biomeSuggestions.join(', ')} 💎`;
        }
    }
    // Diğer tüm blok tipleri için
    else {
        result = await findBlocksInRadius(itemname, 64);
        
        if (result.status && result.bestLocation) {
            result.message += `\n\nEn iyi lokasyon: x=${result.bestLocation.x}, y=${result.bestLocation.y}, z=${result.bestLocation.z} (${result.bestLocation.count} blok var burada) 📍`;
        }
    }
    
    return result;
}
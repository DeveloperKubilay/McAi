module.exports = {
  getinv: function(bot) {
    var inventoryArray = [];
    bot.inventory.items().forEach((item) => {
      inventoryArray.push(`${item.name}x${item.count}`);
    });
    return inventoryArray;
  },
  getmyeq: function(bot) {
    const equipment = {
      mainHand: bot.heldItem ? bot.heldItem.name : 'empty',
      offHand: bot.inventory.slots[45] ? bot.inventory.slots[45].name : 'empty',
      head: bot.inventory.helmet ? bot.inventory.helmet.name : 'empty',
      chest: bot.inventory.chestplate ? bot.inventory.chestplate.name : 'empty',
      legs: bot.inventory.leggings ? bot.inventory.leggings.name : 'empty',
      feet: bot.inventory.boots ? bot.inventory.boots.name : 'empty'
    };
    return equipment;
  },
}
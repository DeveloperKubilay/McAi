module.exports = {
  getinv: function() {
    var inventoryArray = [];
    bot.inventory.items().forEach((item) => {
      inventoryArray.push(`${item.name}x${item.count}`);
    });
    return inventoryArray;
  },
}
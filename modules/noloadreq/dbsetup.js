module.exports = function(botname,db) {
    db.set("players",[{
        "name": botname,
        "message":"blacksmith"
    }])
}
module.exports = function(botname,db) {
    db.set("players",[{
        "name": botname,
        "work": "farmer",
        "itsabot":true
    }])
}
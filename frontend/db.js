const mongo = require("mongodb");
const mongoUrl = 'mongodb://mongo:27017';
const client = mongo.connect( mongoUrl, { useUnifiedTopology: true } );
const db = client.then( client => client.db( "logs" ) )

module.exports = db;
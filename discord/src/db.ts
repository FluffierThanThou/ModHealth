import mongo from "mongodb";
const MONGO_URL = 'mongodb://mongo:27017';
export const client = mongo.connect( MONGO_URL, { useUnifiedTopology: true } );
export const db = client.then( client => client.db( "logs" ) );

const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require("moment");

/* GET home page. */
router.get('/', async function(req, res, next) {
    try{ 
        let modCollection = ( await db ).collection("mods");
        let oneMonthAgo = moment().subtract( 1, "month" ).startOf("day").toDate();
        console.log({oneMonthAgo})
        let mods = await modCollection.aggregate([
            { $match: { 
                // date: { $gte: oneMonthAgo },
                name: { $regex: /vanilla/i } 
            } },
            { $group: {
                _id: "$name",
                data: { $push: { date: "$date", count: "$count" } },
                count: { $sum: "$count" }  
            }},
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]).toArray();
        console.log({mods})

        res.render( "mods/list", {mods, moment} );
    } catch( error ){
        console.error( error );
        res.render("error", {error} );
    }
});

/* GET home page. */
router.get('/:name', async function(req, res, next) {
    
});


module.exports = router;

import moment from "moment";
import { ICommand } from "./index";
import { db } from "./db";
import chrono from "chrono-node";

const MAX_MSG_SIZE = 1900;

const commandRegex = /^!patches\s(?<query>.\S*)(?:\s(?:from|since)\s(?<from>.*?))?(?:\sto\s(?<to>.*))?$/i
export const PatchCommand: ICommand = {
    name: "PatchCommand",
    match: (msg) => commandRegex.test( msg.content ),
    respond: async (msg) => {
        const match = commandRegex.exec( msg.content );
        const query = match?.groups;
        if (!query?.query){
            msg.reply( "Sorry, I didn't understand that command." );
            return
        }       
        
        let from, to;
        const patchCollection = (await db).collection("patches");
        try { 
            from = moment( chrono.parseDate(query?.from) )
            to = moment( chrono.parseDate(query?.to) )
        } catch (error) {
            console.error( `Error parsing times: ${error}` )
        }

        from = from?.isValid() ? from : moment().subtract( 1, "month" );
        to = to?.isValid() ? to : moment();

        console.log( { from: from.toDate(), to: to.toDate() } );

        let patches = await patchCollection.aggregate([
            { 
                $match: {
                    date: {
                        $gte: from.toDate(),
                        $lt: to.toDate()
                    },
                    target: {
                        $regex: query.query
                    }
                } 
            },
            {
                $group: {
                    _id: "$mod",
                    count: { 
                        $sum: "$count"
                    },
                    patches: {
                        $addToSet: {
                            operator: "$operator",
                            target: "$target",
                            method: "$method"
                        }
                    }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]).toArray()    

        let reply = `${patches.length} mod(s) have been logged patching \`${query.query}\``;
        let format = moment(to).subtract( 1, "day" ) < from ? "lll" : "ll";
        if ( to < moment().subtract( 5, "minutes" ) ){
            reply += ` from ${from.format(format)}`
            reply += ` to ${to.format(format)}`
        } else {
            reply += ` since ${from.fromNow()}`
        }
        if( patches.length > 5 ){
            reply += `, showing the most common 5.\n` 
            // reply += `_For a full overview, visit https://test.com/patches/${query.query}?from=${from.toISOString()}&to=${to.toISOString()}_\n`
            patches = patches.slice( 0, 5 );
        }
        if( patches.length > 0 ){
            for ( let patchSet of patches ){
                reply += `\n${patchSet._id ?? "unknown mod(s)"}\n`
                for ( let patch of patchSet.patches ){
                    reply += `\`${patch.target}\` :: \`${patch.operator}\` :: \`${patch.method}\`\n`
                }
            }
        }
        
        let lines = reply.split( "\n" )
        let partial = '';
        for (const line of lines) {
            if ( line.length > MAX_MSG_SIZE ) continue;
            if ( partial.length + line.length > MAX_MSG_SIZE ){
                msg.channel.send( partial );
                partial = line;
            } else {
                partial += "\n" + line;
            }
        }
        if (partial.length > 0 ) msg.channel.send( partial );
    }
}
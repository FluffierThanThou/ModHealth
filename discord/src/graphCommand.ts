import moment, { Moment } from "moment";
import chrono from "chrono-node";
import palette from "google-palette";

import { ICommand } from "./index";
import { db, client } from "./db";
import { CanvasRenderService } from "chartjs-node-canvas";
import Discord, { MessageAttachment, Attachment } from "discord.js";
import { writeFileSync, fstat } from "fs";

interface IGraphQuery {
    query: string
    from: Moment
    to: Moment
}

interface IGraphDatum {
    _id: string,
    data: [{
        date: Date,
        count: number
    }],
    count: number
}

const commandRegex = /^!graph\s(?<query>.+?)(?:\s(?:from|since)\s(?<from>.*?))?(?:\sto\s(?<to>.*))?$/i
export const graphCommand: ICommand = {
    name: "GraphCommand",
    match: ( msg ) => commandRegex.test( msg.content ),
    respond: async ( msg ) => {
        const query = getQuery( msg.content );
        const data = await getData( query );
        const graph = await createGraph( data );
        const attachment = new Attachment( graph, 'graph.png' );
        msg.channel.send( `test`, attachment );
    }
}

function getQuery( msg: string ): IGraphQuery {
    const match = commandRegex.exec( msg );

    let query = match?.groups?.query;
    if (!query) throw "no search query provided"
    if ( query.includes(",") && !query.includes("|")){
        query = query.split(/,\s?/).join("|")
    }

    let from = moment( chrono.parseDate(match?.groups?.from) )
    let to = moment( chrono.parseDate(match?.groups?.to) )
    from = from?.isValid() ? from : moment().subtract( 1, "month" );
    to = to?.isValid() ? to : moment();

    return { query, from, to };
}

async function getData( query: IGraphQuery ){
    return (await db).collection("mods").aggregate([
        { $match: {
            date: {
                $lt: query.to.toDate(),
                $gt: query.from.toDate()
            },
            name: {
                $regex: new RegExp( query.query, "i" )
            }
        }},
        { $group: {
            _id: "$name",
            data: { $push: { date: "$date", count: "$count" } },
            count: { $sum: "$count" }  
        }},
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]).toArray();
}

const canvasRenderService = new CanvasRenderService( 1200, 800, (ChartJS) => {
    ChartJS.plugins.register({
		beforeDraw: (chart, options) => {
			const ctx = chart.ctx;
			ctx!.fillStyle = '#FFF';
			ctx!.fillRect(0, 0, 1200, 800);
		}
	});
 });
async function createGraph( data: IGraphDatum[] ){
    const N = data.length;
    let r = 1;
    let colors: string[] | undefined, n: number = 0;

    while (!colors){
        n = N / r++ | 0 // fancy bitwise or 0 operator to force js to use int
        let _colors = palette( "mpn65", n );
        if (_colors) colors = _colors.map( ( c: string ) => `#${c}`);
    }
    
    const config = {
        data: {
            datasets: data.map(( mod, i ) => {

                let label = mod._id
                let data = mod.data
                    .map( datum => { return { t: moment( datum.date ), y: datum.count } } )
                    .sort( (a,b) => a.t.diff( b.t ) )

                return {
                    label,
                    data,
                    type: "line",
                    fill: false,
                    borderColor: colors![i % n]
                }
            }),
        },
        options: {
            scales: {
                xAxes: [{
                    type: "time",
                    source: "data"
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,                  
                        labelString: "# of logs"
                    }
                }]
            }
        }
    }

    return canvasRenderService.renderToBuffer(config);
}

if (process.argv.length > 2 ){
    (async () => {
        console.log(process.argv)
        const query = getQuery( `!graph ${process.argv[2]}` );
        console.log({query})
        const data = await getData( query );
        (await client).close();
        console.log({data})
        const graph = await createGraph( data );
        console.log({graph})
        writeFileSync("testImage.png", graph);
    })()
}
import { ILogParse } from "./parse";
import mongodb from "mongodb";
import similarity from "string-similarity";

const MONGO_URL = 'mongodb://mongo:27017'
const DB_NAME = "logs";
const client = mongodb.connect( MONGO_URL, { useUnifiedTopology: true } ); //.then( createIndeces );
const db = client.then( client => client.db( DB_NAME ) );

interface IDocument {
    date: Date,
    count: number
}

export interface IMod {
    name: string
    steamIdentifier?: number
}
export interface IModDocument extends IMod, IDocument {}

export interface IAssembly {
    name: string
    mod: string 
    version: string
}
export interface IAssemblyDocument extends IAssembly, IDocument {}

export interface IPatch {
    mod?: string
    target: string
    operator: "pre" | "post" | "trans"
    method: string
}
export interface IPatchDocument extends IPatch, IDocument {}

export interface IHarmonyInstance {
    identifier: string
    version: string
}

export async function resetDb(){
    await (await db).dropDatabase()
}

async function createIndex(collection:string, index: any, options?: mongodb.IndexOptions ){
    await (await db).collection(collection).createIndex(index, options);
}

async function createIndeces() {
    await createIndex( "mods", { name: 1 });
    await createIndex( "mods", { date: 1 });
    await createIndex( "assemblies", { name: 1 })
    await createIndex( "assemblies", { date: 1 })
    await createIndex( "assemblies", { version: 1 })
    await createIndex( "assemblies", { mod: 1 })
    await createIndex( "patches", { method: 1, target: 1, operator: 1 })
    await createIndex( "patches", { mod: 1 })
    await createIndex( "patches", { date: 1 })
}

type PatchCache = { [namespace: string]: string };
export async function dump( log: ILogParse, id: string, verbose = false ) {
    const timestamp = log.time.toDate();
    const date = new Date( timestamp.setUTCHours(0,0,0,0) );
    const assemblies: IAssembly[] = [];
    const patchCache: PatchCache = {};
    const update = { $inc: { count: 1 } };
    await createIndeces();
    
    const modCollection = (await db).collection("mods");
    await modCollection.bulkWrite(log.mods.map( mod => {
        return { 
            updateOne: { 
                filter: { 
                    name: mod.name, 
                    date 
                },
                update,
                upsert: true 
            }
        };
    }), { ordered: false });
    log.mods.map( mod => {
        assemblies.push( ...mod.assemblies.map( a => { return { name: a.assembly, version: a.version, mod: mod.name }; }));
    });

    if (assemblies.length > 0 ){
        const assemblyCollection = (await db).collection("assemblies");
        await assemblyCollection.bulkWrite(assemblies.map( assembly => {
            return { 
                updateOne: { 
                    filter: { 
                        ...assembly,
                        date 
                    },
                    update,
                    upsert: true 
                }
            };
        }), { ordered: false });
    }

    if (log.patches.length > 0 ){
        const patchCollection = (await db).collection("patches");
        await patchCollection.bulkWrite(log.patches.map( patch => {
            let namespace = patch?.method?.split(".")[0] ?? false;
            let mod = namespace ? findMatchingMod( namespace, assemblies, patchCache ) : undefined;
            return { 
                updateOne: { 
                    filter: { 
                        ...patch,
                        date,
                        mod
                    },
                    update,
                    upsert: true 
                }
            };
        }), { ordered: false });
    }
}

function findMatchingMod( namespace: string, assemblies: IAssembly[], cache: PatchCache, threshold: number = 0.8 ){
    if (!namespace || !assemblies || assemblies.length == 0 )
        return undefined;

    if (cache[namespace]){
        return cache[namespace];
    }
    let match = similarity.findBestMatch(namespace, assemblies.map( a => a.name ) );
    
    if ( match?.bestMatch?.rating >= threshold ){
        cache[namespace] = assemblies[match.bestMatchIndex].mod;
        // console.log( `${namespace} :: ${match.bestMatch.target} :: ${match.bestMatch.rating}`);
        return assemblies[match.bestMatchIndex].mod;
    }
    return undefined;
}

export type status = "new" | "working" | "completed" | "error";
export async function getStatus( id: string ): Promise<status> {
    let db = (await client).db(DB_NAME);
    return db.collection( "status" ).findOne({ id: id })
        .then(record => {
            if (record) return record.status;
            return "new";
        }).catch(err => {
            console.error( err );
            return "new";
        })
}

export async function setStatus( id: string, status: status ): Promise<void> {
    let db = (await client).db(DB_NAME);
    await db.collection( "status" ).findOneAndUpdate({id}, { $set: {status} }, {upsert: true});
}

// @ts-ignore
import grammar from "./grammar/grammar.js";
import nearley from "nearley";
import moment, { Moment } from "moment";
import { IAssembly } from "./db.js";

export interface ILogParse {
    time: Moment
    mods: IModParse[]
    patches: IPatchParse[]
    harmony: IHarmonyInstanceParse[]
    platform: string
    content: string[]
}

export interface IModParse {
    name: string
    assemblies: IAssemblyParse[]
}

export interface IAssemblyParse {
    assembly: string
    version: string
}

export interface IPatchParse {
    operator: string
    target: string
    method: string
}

export interface IHarmonyInstanceParse {
    identifier: string
    version: string
}

export async function parse( raw: string, logger = console ): Promise<ILogParse> {
    // remove duplicate log entries
    raw = [...new Set(raw.split("\n\n"))].join("\n\n");

    let parser = new nearley.Parser( grammar );
    let results: ILogParse[];
    try {
        results = parser.feed( raw ).finish();
    } catch (err) {
        throw new Error(`Failed to parse. Original error:\n${err}`);
    }

    if (results.length > 1)
        logger.warn(`Multiple parse results`);
    
    if (results.length == 0)
        throw new Error(`No parsing found.`);

    let result = results[0];
    result.time = moment( result.time, "LLLL" );
    return result;
}

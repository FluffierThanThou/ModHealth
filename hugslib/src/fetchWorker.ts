import Octokit = require("@octokit/rest");
import { getStatus, setStatus, dump } from "./db";
import { parse } from "./parse";
import fetch from "node-fetch";
import fs from "mz/fs";

export async function fetchWorker( gist: Octokit.GistsListPublicForUserResponseItem, callback: any ){
    const status = await getStatus( gist.html_url );
    if (status == "completed")
        return callback();

    try {
        await setStatus(gist.html_url, "working");
        const files = Object.values( gist.files );
        await Promise.all( files.map( f => fetch( f.raw_url ).then( async res => {
            const text = await res.text();
            const result = await parse( text );
            await dump( result, gist.html_url );
        })));
        await setStatus(gist.html_url, "completed");
    } catch ( error ) {
        fs.appendFile("./parse-log.txt", `${gist.html_url}\n${error.message}\n\n`,"utf8");
        process.stdout.write( "x" );
        await setStatus(gist.html_url, "error");
    } finally {
        return callback();
    }
}

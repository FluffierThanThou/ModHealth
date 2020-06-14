import Octokit from "@octokit/rest";
import { Moment } from "moment";
import workerFarm from "worker-farm";
import fs from "mz/fs";

require('dotenv').config()

const octo = new Octokit({
    auth: process.env.GIT_TOKEN,
    userAgent: 'hugslib-log-fetcher',
    timeZone: 'Europe/Amsterdam',
    baseUrl: 'https://api.github.com',
    // log: console
});

export async function getLogs( page = 1, per_page = 100, username: string = "HugsLibRecordKeeper", since?: Moment,  ) {
    // set up worker farm (which is remarkably easy!)
    const farm = workerFarm({ maxConcurrentCallsPerWorker: 4, maxConcurrentWorkers: 4, maxCallTime: 120000, autoStart: true, maxRetries: 5 }, require.resolve("./fetchWorker"), ["fetchWorker"]);
    let completed = 0, retries = 0, failed = 0, start = page;

    // set up git gists API options 
    const opts: Octokit.GistsListPublicForUserParams = {
        username, page, per_page
    }
    if (since) opts.since = since.toISOString();
    let gistOptions = octo.gists.listPublicForUser.endpoint.merge( opts );

    // set up some logging on queue progress
    setInterval( () => {
        process.stdout.write( "\u001b[2J\u001b[0;0H" );
        process.stdout.write( `\r${page} :: completed: ${completed} :: retries: ${retries} :: failed: ${failed} :: queued: ${(page - start) * per_page - completed}\n` ); 
    }, 2000 );

    // start paginating
    octo.paginate( gistOptions, async( gists ) => { 
        gists.data.map( ( gist: Octokit.GistsListPublicForUserResponseItem, i: number ) => farm.fetchWorker( gist, (err: Error) => { 
            if (err) {
                fs.appendFile("./log.txt", `Error fetching ${gist.html_url} :: ${err}\n`,"utf8")
                if (err.name == "ProcessTerminatedError"){
                    failed++;
                    process.stdout.write("!");
                } else {
                    retries++;
                    process.stdout.write("?");
                }
            } else {
                process.stdout.write(".");
                completed++
            }  
        }));
        page++;
    });
}

getLogs( parseInt( process.argv[2] ) || 1 );
# This is a log fetcher for the HugsLib log database
It serves one purpose only, to download all hugslib logs posted.

## How?
By periodically checking the list of public gists created by the HugsLib log keeper account, and fetching the content of any new gists.

To do this, we use the excellent `@octokit/rest` API client, as 
well as the `node-fetch` ... maybe?

## Why?
So we can get an overview of:
- Which mods are people playing?
- Which mods are causing errors?
- What methods are patched by which mods?
- Because I can.

## Where can I see the goodies?
Source code is on GitHub: `<insert link here>`  
Public frontend is here: `<insert link here>` 
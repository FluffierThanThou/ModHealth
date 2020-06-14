const moo = require("moo");
const fs = require("mz/fs");
const path = require("path");

const lexer = moo.states({
    main: {
        timestamp: { match: /Log uploaded on .*?\n/, value: v => v.slice( 16 ).slice( 0, -1 ), lineBreaks: true },
        mods: { match: "Loaded mods:\n", push: "mods", lineBreaks: true },
        patches: { match: "Active Harmony patches:\n", push: "patches", lineBreaks: true },
        harmony: { match: "Harmony versions present: ", push: "harmonyInstances" },
        platform: { match: "Platform information:", push: "platform" },
        content: { match: "Log file contents:\n", push: "contents", lineBreaks: true }
    },
    mods: {
        modName: { match: /^.*: /, value: v => v.slice( 0, -2 ), push: "assembly" },
        comma: { match: /, /, push: "assembly" },
        end: { match: /\n\n/, pop: true, lineBreaks: true },
        br: { match: /\n/, lineBreaks: true }
    },
    assembly: {
        noAssemblies: { match: /\(no assemblies\)/, pop: true },
        assemblyVersion: { match: /\(.+?\)/, value: v => v.trim( ["(", ")" ] ), pop: true },
        assemblyName: { match: /.+?(?=\()/ }
    },
    patches: {
        patchTarget: { 
            match: /[\S]+: /, 
            value: v => v.slice( 0, -2 ), 
            push: "patch" 
        },
        end: { match: /(?=Harmony versions present)/, pop: true, lineBreaks: true },
        br: { match: /\n/, lineBreaks: true }
    },
    patch: {
        patchOperator: {
            match: ["PRE: ", "TRANS: ", "post: "],
            push: "patchSet",
            value: v => v.slice( 0, -2 ).toLowerCase()
        },
        space: { match: / / },
        noPatches: { match: "(no patches)", pop: true },
        end: { match: /\n/, pop: true, lineBreaks: true }
    },
    patchSet: {
        patchMethod: { match: /[^\s,]+/ },
        comma: { match: ", " },
        end: { match: / |(?=\n)/, pop: true, lineBreaks: true }
    },
    harmonyInstances: {
        harmonyVersion: { match: /(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:: |, )?/, value: v => v.slice( 0, -2 ) },
        harmonyInstance: { match: /[^\s:]+:?/ },
        space: { match: / / },
        end: { match: /\n\n/, pop: true, lineBreaks: true }
    },
    platform: {
        line: { match: /.+?\n/, value: v => v.trim(), lineBreaks: true },
        end: { match: /\n+/, pop: true, lineBreaks: true },
    },
    contents: {
        entry: { match: /(?:.+(?:\n|$))+/, value: v => v.trim(), lineBreaks: true },
        br: { match: /\n/, lineBreaks: true }
    }
});

module.exports = lexer;

#!/usr/bin/env node
var builder =  require('./builder')

function main() {
    const src = process.cwd();
    const des = process.argv[2];
    builder.process(src,des);
}

main();

#!/usr/bin/env node
// Convert hex fed into stdin to raw binary data
process.stdin.setEncoding('ascii')
process.stdout.setDefaultEncoding('hex')
process.stdin.pipe(process.stdout)

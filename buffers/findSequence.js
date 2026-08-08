const { Buffer } = require("node:buffer");
const { log } = require("node:console");

/**
 * @param {Buffer} haystack
 * @param {Buffer} needle
 * @returns {number}
 */

function findSequence(haystack, needle){
    if(haystack.length < needle.length) return -1;
    for(let i = 0; i < haystack.length; i++) {
        // Found first byte of needle
        const needleFound = [];
        if(haystack[i] === needle[0]) {
            needleFound.push(i)
            for(let j = 1; j<needle.length; j++) {
                if(needle[j] === haystack[i+j]) {
                    needleFound.push(i+j);
                }
            }
        }
        if(needleFound.length === needle.length) return needleFound[0];
    }  
    return -1
}


const haystack = Buffer.from('GET / HTTP/1.1\r\n\r\nbody');
const needle = Buffer.from('\r\n\r\n');
console.log({ name: 'real HTTP head boundary', expected: 14, actual: findSequence(haystack, needle) });

const haystack2 = Buffer.from('GET / HTTP/1.1\r\n\r'); 
console.log({ name: 'incomplete boundary at buffer end', expected: -1, actual: findSequence(haystack2, needle) });

function runTest(name, haystack, needle, expected) {
    const actual = findSequence(haystack, needle);
    console.log({ name, expected, actual, pass: actual === expected });
}


runTest(
    "simple match, not at start",
    [1, 2, 3, 4, 5],
    [3, 4, 5],
    2
);

runTest(
    "false start before real match",
    [5, 1, 2, 5, 9, 9],
    [5, 9, 9],
    3
);

runTest(
    "needle not present",
    [1, 2, 3],
    [4, 5],
    -1
);

runTest(
    "short needle, short haystack",
    [7, 8, 9],
    [8, 9],
    1
);

runTest(
    "needle at absolute start",
    [9, 9, 9],
    [9, 9, 9],
    0
);

runTest(
    "needle ends exactly at haystack end",
    [1, 2, 3, 4],
    [3, 4],
    2
);


runTest(
    "single-byte needle, present",
    [1, 2, 3],
    [2],
    1
);

runTest(
    "single-byte needle, at last position",
    [5, 6, 7],
    [7],
    2
);

runTest(
    "self-overlapping needle, real match after a near-miss",
    [1, 2, 1, 2, 1, 3],
    [1, 2, 1, 3],
    2
);

runTest(
    "needle first byte repeats right after itself",
    [9, 9, 9, 1, 2],
    [9, 1, 2],
    2
);

runTest(
    "needle equals a repeating single value",
    [4, 4, 4, 4],
    [4, 4],
    0
);

runTest(
    "match only at the very last valid start index",
    [0, 0, 0, 6, 7],
    [6, 7],
    3
);
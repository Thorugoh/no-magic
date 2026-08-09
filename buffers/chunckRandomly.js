

/**
 * @param { Buffer } payload
 * @returns {Array<Buffer>}
 */

function chunkRandomly(payload){
    let acc = 0
    if(!payload.length) return []

    const result = [];
    do {
        const randomChunks = Math.floor(Math.random() * (payload.length - acc)) + 1;
        result.push(payload.subarray(acc, acc+randomChunks));
        acc+=randomChunks;
    } while (acc < payload.length);

    return result;
}

const original = Buffer.from('some test payload here');

function runTest(name, payload) {
    const chunks = chunkRandomly(payload);
    const reconstructed = Buffer.concat(chunks);
    const matchesOriginal = reconstructed.equals(payload);
    const noEmptyChunks = chunks.every(c => c.length > 0);
    console.log({ name, matchesOriginal, noEmptyChunks, chunkCount: chunks.length });
}

runTest("empty payload", Buffer.from(''));
runTest("single byte payload", Buffer.from('a'));
runTest("two byte payload", Buffer.from('ab'));
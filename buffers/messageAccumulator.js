const { chunkRandomly } = require("./chunckRandomly");

const HEADER_LEN = 4;

class MessageAccumulator {
    constructor(){
        /**
         * @type {Buffer}
         * @private
         */
        this.pendingBytes = Buffer.from("");
    }

    /**
     * 
     * @param {Buffer<ArrayBuffer>} data
     */
    push(data) {
        const result = []
        this.pendingBytes = Buffer.concat([this.pendingBytes, data]);
        let finishedReading = false;

        while(this.pendingBytes.length >= HEADER_LEN && !finishedReading) {
            const messageLen = this.pendingBytes
                                        .subarray(0, HEADER_LEN)
                                        .readUInt32BE();
            if(this.pendingBytes.length >= messageLen + HEADER_LEN) {
                result.push(this.pendingBytes
                                .subarray(HEADER_LEN, messageLen + HEADER_LEN)
                );

                this.pendingBytes = this.pendingBytes.subarray(messageLen + HEADER_LEN)
            } else {
                finishedReading = true;
            }

        }

        return result
    }

}

function encodeMessage(payloadString) {
    const payload = Buffer.from(payloadString);
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length, 0);
    return Buffer.concat([header, payload]);
}

function runTest(name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    console.log({ name, expected, actual, pass });
}

// --- Teste 1: mensagem completa chega de uma vez só ---
{
    const acc = new MessageAccumulator();
    const msg = encodeMessage('hello');
    const result = acc.push(msg);
    runTest(
        'single complete message in one push',
        result.map(b => b.toString()),
        ['hello']
    );
}

// --- Teste 2: push sem dados suficientes ainda (só 2 bytes do header) ---
{
    const acc = new MessageAccumulator();
    const msg = encodeMessage('hello');
    const result = acc.push(msg.subarray(0, 2)); // só 2 dos 4 bytes de header
    runTest(
        'incomplete header returns empty array',
        result,
        []
    );
}

// --- Teste 3: mensagem partida entre dois pushes (header inteiro, payload partido) ---
{
    const acc = new MessageAccumulator();
    const msg = encodeMessage('hello world');
    const firstResult = acc.push(msg.subarray(0, 6));  // header completo + parte do payload
    const secondResult = acc.push(msg.subarray(6));    // resto do payload
    runTest('split message - first push returns nothing yet', firstResult, []);
    runTest(
        'split message - second push completes it',
        secondResult.map(b => b.toString()),
        ['hello world']
    );
}

// --- Teste 4: duas mensagens completas chegando juntas num único push ---
{
    const acc = new MessageAccumulator();
    const combined = Buffer.concat([encodeMessage('first'), encodeMessage('second')]);
    const result = acc.push(combined);
    runTest(
        'two complete messages in a single push',
        result.map(b => b.toString()),
        ['first', 'second']
    );
}

// --- Teste 5: mensagem entregue byte a byte (pior caso extremo) ---
{
    const acc = new MessageAccumulator();
    const msg = encodeMessage('x');
    let allResults = [];
    for (let i = 0; i < msg.length; i++) {
        const result = acc.push(msg.subarray(i, i + 1)); // 1 byte por push
        allResults = allResults.concat(result);
    }
    runTest(
        'message delivered one byte at a time',
        allResults.map(b => b.toString()),
        ['x']
    );
}

// --- Teste 6: robustez com chunkRandomly (a prova de fogo) ---
{
    const acc = new MessageAccumulator();
    const originalMessages = ['first message', 'second one', 'a third and final message'];
    const fullStream = Buffer.concat(originalMessages.map(encodeMessage));
    const chunks = chunkRandomly(fullStream); // sua função da Lacuna 2 Exercício A

    let received = [];
    for (const chunk of chunks) {
        const result = acc.push(chunk);
        received = received.concat(result.map(b => b.toString()));
    }

    runTest(
        'random chunking reconstructs all messages in order',
        received,
        originalMessages
    );
}

// Edge case: mensagem com payload de tamanho ZERO, encaixada entre duas mensagens normais
{
    const acc = new MessageAccumulator();
    const empty = (() => {
        const header = Buffer.alloc(4);
        header.writeUInt32BE(0, 0); // tamanho declarado = 0
        return header; // sem payload nenhum depois do header
    })();
    const combined = Buffer.concat([encodeMessage('before'), empty, encodeMessage('after')]);
    const result = acc.push(combined);
    runTest(
        'zero-length payload message between two normal ones',
        result.map(b => b.toString()),
        ['before', '', 'after']
    );
}
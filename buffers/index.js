const { Buffer } = require("node:buffer");
const buf = Buffer.from("R$ 5 🥕", 'utf-8');


const firstHalf = buf.subarray(0, 5);
const corrupted = buf.subarray(5, 10)
console.log(buf)
console.log(firstHalf.toString());
console.log(corrupted.toString())

const char = Buffer.from("�", "utf-8");
console.log(char)
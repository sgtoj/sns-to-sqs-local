const AWS = require("aws-sdk");
const utils = require("./utils");

const SQS_URL = process.env.AWS_SQS_URL;

const sqs = new AWS.SQS({ endpoint: SQS_URL });
let running = false;
let pending = [];

exports.queue = (msg) => {
    pending.push(msg);
    if (!running) startSender();
}

async function send(msg) {
    let params = { QueueUrl: SQS_URL, MessageBody: msg };
    try {
        await sqs.sendMessage(params).promise();
        console.log(`msg send to queue`)
    } catch (err) {
        if (err.errno !== "ECONNREFUSED")
            throw err;
        // add unsent msg to pending list
        pending.push(msg);
        console.log(`queue not ready yet...`);
        console.log(`pending msgs to send: ${pending.length}`);
    }
}

async function startSender() {
    process.on("SIGTERM", () => { running = false; });
    running = true;
    while (running) {
        let msg = pending.pop();
        if (msg) {
            await send(msg);
        }
        await utils.sleep(250);
    }
}




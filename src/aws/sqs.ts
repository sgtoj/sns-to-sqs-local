import AWS from "aws-sdk";
import * as utils from "../common/utils";
import * as config from "../config";


const sqs = new AWS.SQS({ endpoint: config.AWS_SQS_URL });
let running = false;
let pending = [];

export const queue = (msg) => {
    pending.push(msg);
    // tslint:disable-next-line: no-floating-promises
    if (!running) startSender();
};

async function send(msg) {
    let params = { QueueUrl: config.AWS_SQS_URL, MessageBody: msg };
    try {
        await sqs.sendMessage(params).promise();
        console.log(`msg send to queue`);
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




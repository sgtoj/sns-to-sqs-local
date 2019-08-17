import AWS from "aws-sdk";
import { logger } from "../common/logger";
import * as utils from "../common/utils";
import * as config from "../config";


const sqs: AWS.SQS = new AWS.SQS({ endpoint: config.AWS_SQS_URL });
let running: boolean = false;
let pending: string[] = [];

export const queue = (msg: string) => {
    pending.push(msg);
    // tslint:disable-next-line: no-floating-promises
    if (!running) startSender();
};

async function send(msg: string) {
    let params: AWS.SQS.SendMessageRequest = {
        QueueUrl: config.AWS_SQS_URL,
        MessageBody: msg,
    };
    try {
        await sqs.sendMessage(params).promise();
        logger.trace(`msg sent to queue`);
    } catch (err) {
        if (err.errno !== "ECONNREFUSED")
            throw err;
        // add unsent msg to pending list
        pending.push(msg);
        logger.warn(`queue not ready yet...`);
        logger.warn(`pending msgs to send: ${pending.length}`);
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




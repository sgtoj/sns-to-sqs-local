// =============================================================================
//
// This script starts local web server, creates a public tunnel connection it
// via ngrok, and subscribes the public accessible address to a SNS topic. SNS
// messages sent to the web server are forwarded to a SQS queue.
//
// =============================================================================

import * as sns from "./aws/sns";
import * as sqs from "./aws/sqs";
import * as utils from "./common/utils";

const QUEUE_ALL_POST_REQUESTS = process.env.QUEUE_ALL_POST_REQUESTS;

async function handler(req) {
    if (!req.headers["x-amz-sns-topic-arn"] && !QUEUE_ALL_POST_REQUESTS)
        console.log(`rejecting msg: ${req.data}`);
    else if (req.headers["x-amz-sns-topic-arn"])
        await handleSnsMessage(req.data);
    else if (req.method === "POST")
        await handlePostRequest(req.data);
}

async function handleSnsMessage(data) {
    let event = utils.parse(data);
    if (!event) return;

    if (event.Type === "SubscriptionConfirmation") {
        console.log(`confirming subscription: ${event.SubscribeURL}`);
        await utils.request(event.SubscribeURL);
    } else if (event.Type === "Notification") {
        console.log(`${event.Subject || "no-subject"}: ${event.Message}`);
        let msg = JSON.stringify(event);
        sqs.queue(msg);
    } else {
        console.log(`unknown: ${JSON.stringify(event)}`);
    }
}

async function handlePostRequest(data) {
    if (!utils.isString(data) && !utils.isNumber(data))
        data = JSON.stringify(data);
    sqs.queue(data.toString());
}

async function init() {
    try {
        let svr = await utils.startWebServer(handler);
        let url = await utils.startTunnel(svr.options.port);
        await sns.subscribe(`${url}/sns`);
    } catch (err) {
        console.log(`ERROR: ${err}\n${err.stack}`);
    }
}

// tslint:disable-next-line: no-floating-promises
init();


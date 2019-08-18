// =============================================================================
//
// This script starts local web server, creates a public tunnel connection it
// via ngrok, and subscribes the public accessible address to a SNS topic. SNS
// messages sent to the web server are forwarded to a SQS queue.
//
// =============================================================================

import { Context } from "server/typings/common";
import * as sns from "./aws/sns";
import { logger } from "./common/logger";
import * as utils from "./common/utils";
import * as config from "./config";
import queue from "./svcs/queue";

async function handler(req: Context) {
    if (!req.headers["x-amz-sns-topic-arn"] && !config.QUEUE_ALL_POST_REQUESTS)
        logger.warn(`rejecting msg: ${req.data}`);
    else if (req.headers["x-amz-sns-topic-arn"])
        await handleSnsMessage(req.data);
    else if (req.method === "POST")
        await handlePostRequest(req.data);
}

async function handleSnsMessage(data: string) {
    let event = utils.parse(data);
    if (!event) return;

    if (event.Type === "SubscriptionConfirmation") {
        logger.info(`confirming subscription: ${event.SubscribeURL}`);
        await utils.request(event.SubscribeURL);
    } else if (event.Type === "Notification") {
        logger.info(`${event.Subject || "no-subject"}: ${event.Message}`);
        let msg = JSON.stringify(event);
        queue.queue(msg);
    } else {
        logger.warn(`unknown: ${JSON.stringify(event)}`);
    }
}

async function handlePostRequest(data: any) {
    if (!utils.isString(data) && !utils.isNumber(data))
        data = JSON.stringify(data);
    queue.queue(data.toString());
}

async function init() {
    try {
        let svr = await utils.startWebServer(handler);
        let url = await utils.startTunnel(svr.options.port);
        await sns.subscribe(`${url}/sns`);
    } catch (err) {
        logger.error(`ERROR: ${err}\n${err.stack}`);
    }
}

// tslint:disable-next-line: no-floating-promises
init();


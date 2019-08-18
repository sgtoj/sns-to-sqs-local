import { Context } from "server/typings/common";
import * as utils from "../../common/utils";
import logger from "../../svcs/logger";
import queue from "../../svcs/queue";

const SNS_CONFIRMATION = "SubscriptionConfirmation";
const SNS_NOTIFICATION = "Notification";
const SNS_REQUIRED_HEADER = "x-amz-sns-topic-arn";


export async function post(req: Context) {
    if (req.headers[SNS_REQUIRED_HEADER] === undefined)
        throw Error(`Not a SNS request!`);
    await snsEventHandler(req.data);
}

export async function snsEventHandler(serializedEvent: string) {
    let event = utils.deserialize(serializedEvent) || {};
    if (event.Type === SNS_CONFIRMATION)
        await confirmSub(event);
    else if (event.Type === SNS_NOTIFICATION)
        await sendToQueue(event);
}

export async function confirmSub(input: any) {
    logger.info(`confirming subscription: ${input.SubscribeURL}`);
    await utils.request(input.SubscribeURL);
}

export async function sendToQueue(input: any) {
    logger.info(`${input.Subject || "no-subject"}: ${input.Message}`);
    let msg = JSON.stringify(input);
    queue.queue(msg);
}

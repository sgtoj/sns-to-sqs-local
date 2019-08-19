import * as AWS from "aws-sdk";
import logger from "../svcs/logger";

const MSG_VISIBILITY_TIMEOUT = 15;
const MAX_NUM_OF_MSG = 1;
const POLLING_TIMEOUT = 5;

export class SqsQueue {
    readonly client: AWS.SQS;
    readonly url: string;

    constructor(url: string, client?: AWS.SQS) {
        this.client = new AWS.SQS({ endpoint: url }) || client;
        this.url = url;
    }

    public get name(): string {
        return this.url.substring(this.url.lastIndexOf("/") + 1);
    }

    public async send(body: string, delay?: number): Promise<string> {
        delay = delay || 0;
        let params: AWS.SQS.SendMessageRequest = {
            QueueUrl: this.url,
            MessageBody: body,
            DelaySeconds: delay,
        };
        let response = await this.client.sendMessage(params).promise();
        logger.trace(`msg sent to queue`);
        return response.MessageId!;
    }

    public async receive(): Promise<AWS.SQS.Message[]> {
        let params = {
            QueueUrl: this.url,
            MaxNumberOfMessages: MAX_NUM_OF_MSG,
            VisibilityTimeout: MSG_VISIBILITY_TIMEOUT,
            WaitTimeSeconds: POLLING_TIMEOUT,
        };
        let response = await this.client.receiveMessage(params).promise();
        return response.Messages || [];
    }

    public async complete(id: string): Promise<void> {
        let params = {
            QueueUrl: this.url,
            ReceiptHandle: id,
        };
        await this.client.deleteMessage(params).promise();
    }
}

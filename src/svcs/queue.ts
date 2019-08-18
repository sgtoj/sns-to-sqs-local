import { SqsQueue } from "../aws/sqs-queue";
import { logger } from "../common/logger";
import * as utils from "../common/utils";
import * as config from "../config";

export class QueueAsync {
    private client: SqsQueue;
    private pendingMsgs: string[];
    private running: boolean;

    constructor() {
        this.client = new SqsQueue(config.AWS_SQS_URL);
        this.pendingMsgs = [];
        this.running = false;
        const context = this;
        process.on("SIGTERM", () => { context.running = false; });
    }

    public queue(msg: string) {
        this.pendingMsgs.unshift(msg);
        // tslint:disable-next-line: no-floating-promises
        this.loop();
    }

    private async send(msg: string) {
        try {
            await this.client.send(msg);
        } catch (err) {
            if (err.errno !== "ECONNREFUSED") {
                // add unsent msg to pending list
                this.pendingMsgs.push(msg);
                logger.warn(`queue not ready yet: ${this.pendingMsgs.length} pending`);
            } else {
                throw err;
            }
        }
    }

    private async loop() {
        // prevent multiple instances of this while-loop
        if (this.running) return;

        while (this.running) {
            await this.next();
            await utils.sleep(250);
        }
    }

    private async next() {
        let msg = this.pendingMsgs.pop();
        if (msg !== undefined)
            await this.send(msg);
    }

}

export const queue = new QueueAsync();
export default queue;

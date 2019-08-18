import AWS from "aws-sdk";
import { Nullable } from "../common/types";
import * as config from "../config";
import logger from "../svcs/logger";
let sns = new AWS.SNS();


export async function subscribe(url: string) {
    if (!config.AWS_SNS_TOPIC_SUBSCRIBE) {
        logger.debug(`skipping sns topic subscribe as it is disabled`);
        return;
    }

    if (!config.AWS_SNS_TOPIC)
        throw new Error("Environment Variable Not Set: AWS_SNS_TOPIC");

    if (config.AWS_SNS_TOPIC_SEARCH) {
        await autoSubscribe(url, config.AWS_SNS_TOPIC);
    } else {
        await snsSubscribe(url, config.AWS_SNS_TOPIC);
    }
}

async function autoSubscribe(url: string, topicName: string) {
    let topics = new TopicList();
    let done = false;
    let topic = null;

    while (!done) {
        let data = await topics.next();
        done = data.done;
        if (!data.value.includes(topicName))
            continue;
        done = true;
        topic = data.value;
    }

    if (!topic) {
        logger.info(`no matching topic found: ${topicName}`);
    } else {
        logger.info(`auto-subscribe match found: ${topic}`);
        await snsSubscribe(url, topic);
    }
}

async function autoUnsubscribe(topicName: string) {
    let subs = new SubscriptionList(topicName);
    let done = false;

    while (!done) {
        let data = await subs.next();
        done = data.done;
        let sub = data.value;
        if (!sub || sub.SubscriptionArn === "PendingConfirmation")
            continue;
        if (!sub.Endpoint || !sub.Endpoint.includes("ngrok.io/sns"))
            continue;
        logger.info(`auto-unsubscribe from topic: ${sub.SubscriptionArn}`);
        await snsUnsubscribe(sub.SubscriptionArn!);
    }
}

async function snsSubscribe(url: string, topic: string) {
    if (config.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE)
        await autoUnsubscribe(topic);
    let proto = url.indexOf("https:") === 0 ? "https" : "http";
    let params = { Endpoint: url, Protocol: proto, TopicArn: topic };
    logger.info(`subscribing: ${topic} -> ${url}`);
    let sub = await sns.subscribe(params).promise();
    process.on("SIGTERM", async () => {
        if (config.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE_ON_EXIT)
            await snsUnsubscribe(sub.SubscriptionArn!);
    });
}

async function snsUnsubscribe(sub: string) {
    let params = { SubscriptionArn: sub };
    logger.info(`unsubscribing to: ${sub})`);
    await sns.unsubscribe(params).promise();
}

async function snsListTopic(token?: Nullable<string>) {
    let params = <AWS.SNS.ListTopicsInput>{};
    if (token) { params.NextToken = token; }
    logger.debug(`listing topics (token: ${token || "none"})`);
    return await sns.listTopics(params).promise();
}

async function snsListSubscription(topic: string, token?: Nullable<string>) {
    let params = <AWS.SNS.ListSubscriptionsByTopicInput>{ TopicArn: topic };
    if (token) { params.NextToken = token; }
    logger.debug(`listing subscrciptions (token: ${token || "none"})`);
    return await sns.listSubscriptionsByTopic(params).promise();
}

class TopicList {
    isLastPage: boolean;
    topics: AWS.SNS.Topic[];
    token: Nullable<string>;

    constructor() {
        this.isLastPage = false;
        this.topics = [];
        this.token = null;
    }
    get finished() {
        return this.topics.length === 0 && this.isLastPage;
    }
    async next() {
        if (this.topics.length === 0 && !this.finished) {
            let result = await snsListTopic(this.token);
            this.topics = result.Topics!;
            this.token = result.NextToken;
            this.isLastPage = !this.token;
        }
        let topic = this.topics.pop() || {};
        return { value: topic.TopicArn!, done: this.finished };
    }
}

class SubscriptionList {
    isLastPage: boolean;
    subs: AWS.SNS.Subscription[];
    token: string | null | undefined;
    topic: string;

    constructor(topic: string) {
        this.isLastPage = false;
        this.subs = [];
        this.token = null;
        this.topic = topic;
    }
    get finished() {
        return this.subs.length === 0 && this.isLastPage;
    }
    async next() {
        if (this.subs.length === 0 && !this.finished) {
            let result = await snsListSubscription(this.topic, this.token);
            this.subs = result.Subscriptions!;
            this.token = result.NextToken;
            this.isLastPage = !this.token;
        }
        let sub = this.subs.pop() || {};
        return { value: sub, done: this.finished };
    }
}

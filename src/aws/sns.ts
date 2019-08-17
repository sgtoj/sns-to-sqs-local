import AWS from "aws-sdk";
import * as config from "../config";
let sns = new AWS.SNS();

export async function subscribe(url) {
    if (!config.AWS_SNS_TOPIC_SUBSCRIBE) {
        console.log(`skipping sns topic subscribe as it is disabled`);
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

async function autoSubscribe(url, topicName) {
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
        console.log(`no matching topic found: ${topicName}`);
    } else {
        console.log(`auto-subscribe match found: ${topic}`);
        await snsSubscribe(url, topic);
    }
}

async function autoUnsubscribe(topicName) {
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
        console.log(`auto-unsubscribe from topic: ${sub.SubscriptionArn}`);
        await snsUnsubscribe(sub.SubscriptionArn);
    }
}

async function snsSubscribe(url, topic) {
    if (config.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE)
        await autoUnsubscribe(topic);
    let proto = url.indexOf("https:") === 0 ? "https" : "http";
    let params = { Endpoint: url, Protocol: proto, TopicArn: topic };
    console.log(`subscribing: ${topic} -> ${url}`);
    let sub = await sns.subscribe(params).promise();
    process.on("SIGTERM", async () => {
        if (config.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE_ON_EXIT)
            await snsUnsubscribe(sub.SubscriptionArn);
    });
}

async function snsUnsubscribe(sub) {
    let params = { SubscriptionArn: sub };
    console.log(`unsubscribing to: ${sub})`);
    await sns.unsubscribe(params).promise();
}

async function snsListTopic(token) {
    let params = {} as any;
    if (token) { params.NextToken = token; }
    console.log(`listing topics (token: ${token || "none"})`);
    return await sns.listTopics(params).promise();
}

async function snsListSubscription(topic, token) {
    let params = { TopicArn: topic } as any;
    if (token) { params.NextToken = token; }
    console.log(`listing subscrciptions (token: ${token || "none"})`);
    return await sns.listSubscriptionsByTopic(params).promise();
}

class TopicList {
    isLastPage: boolean;
    topics: any[];
    token: any;

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
            this.topics = result.Topics;
            this.token = result.NextToken;
            this.isLastPage = !this.token;
        }
        let topic = this.topics.pop() || {};
        return { value: topic.TopicArn, done: this.finished };
    }
}

class SubscriptionList {
    isLastPage: boolean;
    subs: any[];
    token: any;
    topic: any;

    constructor(topic) {
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
            this.subs = result.Subscriptions;
            this.token = result.NextToken;
            this.isLastPage = !this.token;
        }
        let sub = this.subs.pop() || {};
        return { value: sub, done: this.finished };
    }
}

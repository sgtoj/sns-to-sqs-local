/*
// central source of truth for all environment variables
*/

// basic app configs
export const APP_NAME = process.env.APP_NAME;

// logging configs
export const APP_LOG_LEVEL = (process.env.APP_LOG_LEVEL || "info").toLocaleLowerCase();
export const APP_LOG_INCLUDE_TIMESTAMP = (process.env.APP_LOG_INCLUDE_TIMESTAMP || "true") === "true";

// subscriber configs
export const PORT = process.env.PORT!;
export const QUEUE_ALL_POST_REQUESTS = process.env.QUEUE_ALL_POST_REQUESTS!;
export const AWS_SNS_TOPIC = process.env.AWS_SNS_TOPIC!;
export const AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE = Number(process.env.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE!);
export const AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE_ON_EXIT = Number(process.env.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE_ON_EXIT!);
export const AWS_SNS_TOPIC_SEARCH = Number(process.env.AWS_SNS_TOPIC_SEARCH!);
export const AWS_SNS_TOPIC_SUBSCRIBE = Number(process.env.AWS_SNS_TOPIC_SUBSCRIBE!);
export const AWS_SQS_URL = process.env.AWS_SQS_URL!;

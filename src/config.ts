/*
// central source of truth for all environment variables
*/

export const PORT = process.env.PORT;
export const QUEUE_ALL_POST_REQUESTS = process.env.QUEUE_ALL_POST_REQUESTS;
export const AWS_SNS_TOPIC = process.env.AWS_SNS_TOPIC;
export const AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE = parseInt(process.env.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE);
export const AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE_ON_EXIT = parseInt(process.env.AWS_SNS_TOPIC_AUTO_UNSUBSCRIBE_ON_EXIT);
export const AWS_SNS_TOPIC_SEARCH = parseInt(process.env.AWS_SNS_TOPIC_SEARCH);
export const AWS_SNS_TOPIC_SUBSCRIBE = parseInt(process.env.AWS_SNS_TOPIC_SUBSCRIBE);
export const AWS_SQS_URL = process.env.AWS_SQS_URL;

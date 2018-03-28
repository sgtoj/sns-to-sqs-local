//=============================================================================
//
// This script starts local web server, creates a public tunnel connection it
// via ngrok, and subscribes the public accessible address to a SNS topic. SNS
// messages sent to the web server are forwarded to a SQS queue. It is meant to
// be used during development to prevent any dependences of remote services.
//
//=============================================================================

const utils = require("./lib/utils");
const sns = require("./lib/sns");
const sqs = require("./lib/sqs");

async function handler(req) {
    let data = utils.parse(req.data);
    if (!data) return;

    if (data.Type === "SubscriptionConfirmation") {
        console.log(`confirming subscription: ${data.SubscribeURL}`);
        await utils.request(data.SubscribeURL);
    } else if (data.Type === "Notification") {
        console.log(`${data.Subject || "no-subject"}: ${data.Message}`);
        sqs.queue(data.Message);
    } else {
        console.log(`unknown: ${data}`);
    }
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

init();


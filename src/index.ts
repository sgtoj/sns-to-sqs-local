// =============================================================================
//
// This script starts local web server, creates a public tunnel connection it
// via ngrok, and subscribes the public accessible address to a SNS topic. SNS
// messages sent to the web server are forwarded to a SQS queue.
//
// =============================================================================

import { App } from "./app/app";

(async () => {
    const app = new App();
    await app.launch();
});

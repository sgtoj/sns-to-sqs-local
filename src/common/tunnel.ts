import ngrok from "ngrok";
import logger from "../svcs/logger";


export async function open(localport?: number) {
    const url = await ngrok.connect(localport);
    logger.info(`public web endpoint: ${url}`);
    return url;
}



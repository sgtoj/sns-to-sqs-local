import ngrok from "ngrok";
import server from "server";
import { status } from "server/reply";
import * as config from "../config";


export async function startWebServer(handler) {
    const port = config.PORT || 80;
    const options = { port: port, security: false } as any;
    const svr = await server(options, wrapHandler(handler));
    console.log(`server attached to port: ${svr.options.port}`);
    // process.on("SIGTERM", () => { svr.close(); });
    return svr;
}

export async function startTunnel(localport) {
    const url = await ngrok.connect(localport);
    console.log(`public web endpoint: ${url}`);
    return url;
}

export function wrapHandler(handler) {
    return async (ctx) => {
        try {
            await handler(ctx);
            return status(200);
        } catch (e) {
            console.log(`WEB SERVER ERROR: ${e}\n${e.stack}`);
            return status(500);
        }
    };
}

export function parse(data) {
    let parsed = null;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        console.log(`Not Valid JSON: ${parsed}`);
    }
    return parsed;
}

export async function request(url) {
    let proto = url.indexOf("https:") === 0 ? "https" : "http";
    const http = require(proto);
    return new Promise((resolve, reject) => {
        http.get(url, resp => {
            let data = "";
            resp.on("data", (chunk) => { data += chunk; });
            resp.on("end", () => resolve(data));
        }).on("error", err => { reject(err); });
    });
}

export async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms || 1000);
    });
}

export { isNumber, isString } from "util";


import ngrok from "ngrok";
import server, { reply } from "server";
import { Context } from "server/typings/common";
import { Options } from "server/typings/options";
import * as config from "../config";
import logger from "../svcs/logger";


export async function startWebServer(handler: Function) {
    const port = Number(config.PORT || 80);
    const options = <Options>{ port: port, security: false };
    const svr = await server(options, wrapHandler(handler));
    logger.info(`server attached to port: ${svr.options.port}`);
    // process.on("SIGTERM", () => { svr.close(); });
    return svr;
}

export async function startTunnel(localport?: number) {
    const url = await ngrok.connect(localport);
    logger.info(`public web endpoint: ${url}`);
    return url;
}

export function wrapHandler(handler: Function) {
    return async (ctx: Context) => {
        try {
            await handler(ctx);
            return reply.status(200);
        } catch (e) {
            logger.error(`WEB SERVER ERROR: ${e}\n${e.stack}`);
            return reply.status(500);
        }
    };
}

export function parse(data: any) {
    let parsed = null;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        logger.debug(`Not Valid JSON: ${parsed}`);
    }
    return parsed;
}

export async function request(url: string) {
    let proto = url.indexOf("https:") === 0 ? "https" : "http";
    const http: any = require(proto);
    return new Promise((resolve, reject) => {
        http.get(url, (resp: any) => {
            let data = "";
            resp.on("data", (chunk: any) => { data += chunk; });
            resp.on("end", () => resolve(data));
        }).on("error", (err: Error) => { reject(err); });
    });
}

export async function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms || 1000);
    });
}

export function isNumber(value: any): boolean {
    return typeof value === "number";
}

export function isString(value: any): boolean {
    return typeof value === "string";
}



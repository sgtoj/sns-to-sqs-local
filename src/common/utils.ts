import logger from "../svcs/logger";


export function deserialize(data: any) {
    try {
        return JSON.parse(data);
    } catch (e) {
        logger.debug(`Not Valid JSON: ${data}`);
    }
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



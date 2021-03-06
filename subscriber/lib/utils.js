const isString = require("util").isString;
const isNumber = require("util").isNumber;
const ngrok = require("ngrok");
const server = require("server");
const status = require("server/reply").status;

const PORT = process.env.PORT;

async function startWebServer(handler) {
    const port = PORT || 80;
    const options = { port: port, security: false };
    const svr = await server(options, wrapHandler(handler));
    console.log(`server attached to port: ${svr.options.port}`);
    process.on("SIGTERM", () => { svr.close() });
    return svr;
}

async function startTunnel(localport) {
    const url = await ngrok.connect(localport);
    console.log(`public web endpoint: ${url}`);
    return url;
}

function wrapHandler(handler) {
    return async (ctx) => {
        try {
            await handler(ctx)
            return status(200);
        } catch (e) {
            console.log(`WEB SERVER ERROR: ${e}\n${e.stack}`);
            return status(500);
        }
    }
}

function parse(data) {
    let parsed = null;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        console.log(`Not Valid JSON: ${parsed}`);
    }
    return parsed;
}

async function request(url) {
    let proto = url.indexOf("https:") === 0 ? "https" : "http";
    const http = require(proto);
    return new Promise((resolve, reject) => {
        http.get(url, resp => {
            let data = "";
            resp.on("data", (chunk) => { data += chunk; })
            resp.on("end", () => resolve(data));
        }).on("error", err => { reject(err) });
    });
}

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms || 1000);
    });
}


exports.isNumber = isNumber
exports.isString = isString
exports.parse = parse;
exports.request = request;
exports.sleep = sleep;
exports.startWebServer = startWebServer;
exports.startTunnel = startTunnel;


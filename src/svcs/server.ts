import server, { reply } from "server";
import { error } from "server/router";
import { Context, LogLevel, Middleware } from "server/typings/common";
import { Options } from "server/typings/options";
import { Nullable } from "../common/types";
import * as config from "../config";
import logger from "./logger";


export class Server {
    public readonly options: Options;
    private svr: Nullable<Context>;
    private routes: Middleware[];

    constructor(routes?: Middleware[]) {
        this.options = {
            port: Number(config.PORT || 80),
            security: false, // disable session tokens requirement
            log: {
                level: <LogLevel>config.APP_LOG_LEVEL,
                report: (content, type) => { logger[type](content); },
            },
        };
        this.routes = routes || [];
        // add error default handler
        this.routes.push(error(String(), (ctx: Context) => {
            const e = ctx.error;
            logger.error(`WEB SERVER ERROR: ${e}\n${e.stack}`);
            return reply.status(500);
        }));
    }

    public async start() {
        this.svr = await server(this.options, this.routes);
        const port = this.svr.options.port;
        logger.info(`server attached to port: ${port}`);
    }
}

export default new Server();

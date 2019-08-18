import { post } from "server/router";
import { Middleware } from "server/typings/common";
import * as sns from "../aws/sns";
import * as tunnel from "../common/tunnel";
import { Server } from "../svcs/server";
import * as snsCtrl from "./ctrls/sns";

export class App {
    public readonly server: Server;

    constructor(routes?: Middleware[]) {
        routes = routes || [
            post("/sns", snsCtrl.post),
        ];
        this.server = new Server(routes);
    }

    public async launch() {
        const localServerPort = this.server.options.port;
        await this.server.start();
        const publicEndpoint = await tunnel.open(localServerPort);
        await sns.subscribe(`${publicEndpoint}/sns`);
    }
}

import pino from "pino";
import * as env from "../config";

export interface Logger {
    trace(msg: string, ...args: any[]): void;
    trace(obj: object, msg?: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]): void;
    debug(obj: object, msg?: string, ...args: any[]): void;
    info(msg: string, ...args: any[]): void;
    info(obj: object, msg?: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    warn(obj: object, msg?: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    error(obj: object, msg?: string, ...args: any[]): void;
    fatal(msg: string, ...args: any[]): void;
    fatal(obj: object, msg?: string, ...args: any[]): void;
}

const LOGGER_OPTIONS: pino.LoggerOptions = {
    base: {
        pid: undefined,
        hostname: undefined,
    },
    name: env.APP_NAME,
    level: env.APP_LOG_LEVEL,
    timestamp: env.APP_LOG_INCLUDE_TIMESTAMP as any,
    useLevelLabels: true,
};

export const logger = pino(LOGGER_OPTIONS);

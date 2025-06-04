import { IIoEventHandler } from '../types';
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export class IoEventHandler implements IIoEventHandler {
    logger: any;
    private config: any;

    constructor(config: any) {
        this.config = config;
        this.logger = aioLogger(this.constructor.name, { level: config.logLevel || "info" });
    }

    /*******
     * handleEvent - should be overloaded by the implementation class
     * 
     * @param event 
     * @returns 
     *******/
    async handleEvent(event: any): Promise<any> {
        throw new Error('handleEvent method must be overloaded by implementation class');
    }
}
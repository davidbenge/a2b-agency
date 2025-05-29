export interface IIoEventHandler {
    logger: any;
    handleEvent(event: any): Promise<any>;
} 
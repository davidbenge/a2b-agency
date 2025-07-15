import { CloudEvent } from "cloudevents";

export interface IIoEventHandler {
    logger: any;
    handleEvent(event: any): Promise<any>;
}

export interface IBrand {
    bid: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string; // Base64 encoded logo image
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date;
}

export interface IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): boolean;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}
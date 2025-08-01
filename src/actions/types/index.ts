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

// NEW: Adobe Developer Console interfaces
export interface IAdobeOrg {
    id: string;
    name: string;
    ims_org_id: string;
}

export interface IAdobeWorkspace {
    id: string;
    name: string;
    title: string;
    description: string;
    action_url: string;
    app_url: string;
    details: {
        credentials: any[];
        services: any[];
        runtime: {
            namespaces: any[];
        };
        events: {
            registrations: any[];
        };
        mesh: any;
    };
    endpoints: any;
}

export interface IAdobeProject {
    id: string;
    name: string;
    title: string;
    description: string;
    org: IAdobeOrg;
    workspace: IAdobeWorkspace;
}

// NEW: Enhanced event data interface
export interface IEventData {
    // Brand information
    bid: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date;
    
    // NEW: Adobe Developer Console context
    adobeProject?: IAdobeProject;
    imsId?: string;
    imsOrgName?: string;
    primaryWorkspaceId?: string;
    
    // NEW: Event metadata
    eventType?: string;
    eventTimestamp?: Date;
    eventSource?: string;
    
    // Additional event payload
    [key: string]: any;
}

export interface IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: IEventData;
    id: string;
    validate(): boolean;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}
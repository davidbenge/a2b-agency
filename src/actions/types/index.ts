import { CloudEvent } from "cloudevents";

export interface IIoEventHandler {
    logger: any;
    handleEvent(event: any): Promise<any>;
}

export interface IBrand {
    brandId: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string; // Base64 encoded logo image
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date | null;
    /**
     * Send an IO event payload to this brand's target endpoint
     */
    sendIoEventToEndpoint?: (event: IIoEvent) => Promise<any>;
}

export interface IApplicationRuntimeInfo {
    consoleId: string;
    projectName: string;
    workspace: string;
    actionPackageName: string;
    app_name: string;
}

export interface IValidationResult {
    valid: boolean;
    message?: string;
    missing?: string[];
}

export interface IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

export interface IBrandEventPostResponse {
    eventType: string;
    message: string;
}

export interface IS2SAuthenticationCredentials {
    clientId: string;
    clientSecret: string;
    scopes: string;
    orgId: string;
}
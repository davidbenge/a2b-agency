import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "./Brand";
import { BRAND_FILE_STORE_DIR } from "../constants";
import { IApplicationRuntimeInfo, Ia2bEvent, IS2SAuthenticationCredentials } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { getServer2ServerToken } from "../utils/adobeAuthUtils";

export class IoCustomEventManager {
    private logger: any;
    private s2sAuthenticationCredentials: IS2SAuthenticationCredentials;
    private applicationRuntimeInfo: any;
    
    /*******
     * constructor - constructor for the IoCustomEventManager
     * 
     * @param logLevel: string
     * @param s2sAuthenticationCredentials: IS2SAuthenticationCredentials from action
     * @param applicationRuntimeInfo: object containing runtime information
     *******/
    constructor(logLevel: string, s2sAuthenticationCredentials: IS2SAuthenticationCredentials, applicationRuntimeInfo: IApplicationRuntimeInfo) {
        this.logger = aioLogger("IoCustomEventManager", { level: logLevel || "info" });
        this.logger.debug('IoCustomEventManager constructor');

        // Validate S2S credentials
        if (s2sAuthenticationCredentials.clientId && s2sAuthenticationCredentials.clientSecret && s2sAuthenticationCredentials.scopes && s2sAuthenticationCredentials.orgId) {
            this.logger.debug('IoCustomEventManager constructor params', s2sAuthenticationCredentials);
            this.s2sAuthenticationCredentials = s2sAuthenticationCredentials;
        } else {
            const missing: string[] = [];
            if (!s2sAuthenticationCredentials.clientId) missing.push('S2S_CLIENT_ID');
            if (!s2sAuthenticationCredentials.clientSecret) missing.push('S2S_CLIENT_SECRET');
            if (!s2sAuthenticationCredentials.scopes) missing.push('S2S_SCOPES');
            if (!s2sAuthenticationCredentials.orgId) missing.push('ORG_ID');
            const message = `IoCustomEventManager:constructor: missing required S2S parameter(s): ${missing.join(', ')}`;
            this.logger.error(message, s2sAuthenticationCredentials);
            throw new Error(message);
        }

        // Validate application runtime info
        if (!applicationRuntimeInfo || typeof applicationRuntimeInfo !== 'object') {
            throw new Error('IoCustomEventManager:constructor: missing applicationRuntimeInfo');
        }
        const missingRuntimeFields: string[] = [];
        if (!('consoleId' in applicationRuntimeInfo) || !applicationRuntimeInfo.consoleId) missingRuntimeFields.push('consoleId');
        if (!('projectName' in applicationRuntimeInfo) || !applicationRuntimeInfo.projectName) missingRuntimeFields.push('projectName');
        if (!('workspace' in applicationRuntimeInfo) || !applicationRuntimeInfo.workspace) missingRuntimeFields.push('workspace');
        if (missingRuntimeFields.length > 0) {
            throw new Error(`IoCustomEventManager:constructor: applicationRuntimeInfo missing field(s): ${missingRuntimeFields.join(', ')}`);
        }
        this.applicationRuntimeInfo = applicationRuntimeInfo; // application runtime information for event isolation
    }

    /*******
     * publishToAdobeIOEvents - Publish an internal custom event to Adobe I/O Events
     * 
     * This publishes events to the Adobe I/O Events service for internal event distribution.
     * This is NOT for sending events to external brand endpoints (use Brand.sendCloudEventToEndpoint for that).
     * 
     * @param event: Ia2bEvent - The event to publish
     * @returns Promise<void>
     *******/
    async publishToAdobeIOEvents(event: Ia2bEvent): Promise<void> {
        this.logger.debug('IoCustomEventManager:publishToAdobeIOEvents starting');

        // add the application runtime info to the event data
        if (event.data) {
            event.data.app_runtime_info = {
                "consoleId": this.applicationRuntimeInfo.consoleId,
                "projectName": this.applicationRuntimeInfo.projectName,
                "workspace": this.applicationRuntimeInfo.workspace,
                "app_name": this.applicationRuntimeInfo.app_name,
                "action_package_name": this.applicationRuntimeInfo.actionPackageName
            };
        }
        
        if(event.validate()){
            this.logger.debug('Event is valid', event);
        }else{
            this.logger.error('Event is not valid', event);
            throw new Error('Event is not valid');
        }

        await this.publishEventToAdobeEventHub(event);
    }

    /*******
     * publishEventToAdobeEventHub - publish the event to the Adobe Event Hub
     * 
     * @param event: any
     * @returns Promise<void>
     *******/
    async publishEventToAdobeEventHub(event: any): Promise<void> {
        // publish the event
        const eventSdk = require('@adobe/aio-lib-events');

        // get the token
        let token = "";
        try{
            token = await getServer2ServerToken(this.s2sAuthenticationCredentials, this.logger);
        }catch(error){
            this.logger.error('IoCustomEventManager:publishEventToAdobeEventHub: Error getting server2server token', error);
            throw new Error('Error getting server2server token');
        }

        // initialize the event client
        //This class provides methods to call your Adobe I/O Events APIs. Before calling any method initialize the instance by calling the init method on it with valid values for organizationId, apiKey, accessToken and optional http options such as timeout and max number of retries
        const eventClient = await eventSdk.init(this.s2sAuthenticationCredentials.orgId, this.s2sAuthenticationCredentials.clientId, token);

        const cloudEventToSend = event.toCloudEvent();
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub cloudEvent to publish toJSON',event.toJSON());
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub cloudEvent to publish',cloudEventToSend);
        const eventSendResult = await eventClient.publishEvent(cloudEventToSend);

        if(eventSendResult === 'OK'){  
            this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub: Event sent', eventSendResult);
        }else{
            this.logger.error('IoCustomEventManager:publishEventToAdobeEventHub: Error sending event', eventSendResult);
            throw new Error('Error sending event');
        }
    }
}
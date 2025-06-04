import * as aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "./Brand";
import { BRAND_FILE_STORE_DIR } from "../constants";
import { IIoEvent } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { getServer2ServerToken } from "../utils/adobeAuthUtils";

export class IoCustomEventManager {
    private logger: any;
    private providerId: string;
    private serviceApiKey: string;
    private s2sClientSecret: string;
    private s2sScopes: string;
    private orgId: string;

    /*******
     * constructor - constructor for the IoCustomEventManager
     * 
     * @param logLevel: string
     * @param params: any from action
     *******/
    constructor(logLevel: string, params: any) {
        this.logger = aioLogger("IoCustomEventManager", { level: logLevel || "info" });
        this.logger.debug('IoCustomEventManager constructor');

        //check that the params object has the data we need
        if(params.AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID && params.SERVICE_API_KEY && params.S2S_CLIENT_SECRET && params.S2S_SCOPES && params.ORG_ID){
            this.logger.debug('IoCustomEventManager constructor params', params);
        }else{
            this.logger.error('IoCustomEventManager constructor params missing', params);
            throw new Error('IoCustomEventManager constructor params missing. We need AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID, SERVICE_API_KEY, S2S_CLIENT_SECRET, S2S_SCOPES, and ORG_ID');
        }
        this.providerId = params.AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID;
        this.serviceApiKey = params.SERVICE_API_KEY;
        this.s2sClientSecret = params.S2S_CLIENT_SECRET;
        let scopesCleaned = JSON.parse(params.S2S_SCOPES);
        this.s2sScopes = scopesCleaned.join(',');
        this.orgId = params.ORG_ID;
    }

    /*******
     * publishEvent - publish the event to the Adobe Event Hub
     * 
     * @param event: IIoEvent
     * @returns Promise<void>
     *******/
    async publishEvent(event: IIoEvent): Promise<void> {
        this.logger.debug('IoCustomEventManager:publishEvent starting');

        event.id = uuidv4(); // set the id
        event.source = `urn:uuid:${this.providerId}`; // set the source
        
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
        const token = await this.getServer2ServerToken();

        // initialize the event client
        //This class provides methods to call your Adobe I/O Events APIs. Before calling any method initialize the instance by calling the init method on it with valid values for organizationId, apiKey, accessToken and optional http options such as timeout and max number of retries
        const eventClient = await eventSdk.init(this.orgId, this.serviceApiKey, token);
        const providerMetadata = await eventClient.getProviderMetadata();
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub providerMetadata', providerMetadata);
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub eventClient', eventClient);

        const cloudEventToSend = event.toCloudEvent();
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub cloudEvent to publish',cloudEventToSend);
        const eventSendResult = await eventClient.publishEvent(cloudEventToSend);

        if(eventSendResult === 'OK'){  
            this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub: Event sent', eventSendResult);
        }else{
            this.logger.error('IoCustomEventManager:publishEventToAdobeEventHub: Error sending event', eventSendResult);
            throw new Error('Error sending event');
        }
    }

    /*******
     * getServer2ServerToken - get the server2server token
     * 
     * @returns Promise<string>
     *******/
    async getServer2ServerToken(): Promise<string> {
        //TODO: put in some caching here
        const token = await getServer2ServerToken(this.serviceApiKey, this.s2sClientSecret, this.orgId, this.s2sScopes, this.logger);
        
        if(!token){
            this.logger.error('IoCustomEventManager Error getting server2server token');
            throw new Error(' IoCustomEventManager: Error getting server2server token');
        }
        
        return token;
    }
}
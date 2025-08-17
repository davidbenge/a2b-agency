import { config } from "dotenv";
import { IIoEvent, IS2SAuthenticationCredentials, IApplicationRuntimeInfo } from "../types";
import { BrandManager } from "./BrandManager";
import { IoCustomEventManager } from "./IoCustomEventManager";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export class EventManager {
    private s2sAuthenticationCredentials: IS2SAuthenticationCredentials;
    private logLevel: string;
    private ioCustomEventManager: IoCustomEventManager;
    private logger: any;
    private brandManager: BrandManager;

    /****
     * @param logLevel - the log level to use
     * @param s2sAuthenticationCredentials - the s2s authentication credentials 
     * @param applicationRuntimeInfo - the application runtime information
     */
    constructor(logLevel: string, s2sAuthenticationCredentials: IS2SAuthenticationCredentials, applicationRuntimeInfo: any) {
        this.logger = aioLogger("EventManager", { level: logLevel || "info" });
        if (s2sAuthenticationCredentials.clientId && s2sAuthenticationCredentials.clientSecret && s2sAuthenticationCredentials.scopes && s2sAuthenticationCredentials.orgId) {
            this.s2sAuthenticationCredentials = s2sAuthenticationCredentials;
        } else {
            const missing: string[] = [];
            if (!s2sAuthenticationCredentials.clientId) missing.push('clientId');
            if (!s2sAuthenticationCredentials.clientSecret) missing.push('clientSecret');
            if (!s2sAuthenticationCredentials.scopes) missing.push('scopes');
            if (!s2sAuthenticationCredentials.orgId) missing.push('orgId');
            const message = `EventManager:constructor: s2sAuthenticationCredentials missing required field(s): ${missing.join(', ')}`;
            this.logger.error(message);
            throw new Error(message);
        }

        this.brandManager = new BrandManager(logLevel);

        if(!applicationRuntimeInfo){
            const missing2: string[] = [];
            if(!applicationRuntimeInfo) missing2.push('applicationRuntimeInfo');
            const message2 = `EventManager:constructor: missing required field(s): ${missing2.join(', ')}`;
            this.logger.error(message2);
            throw new Error(message2);
        }else{
            this.ioCustomEventManager = new IoCustomEventManager(logLevel, this.s2sAuthenticationCredentials, applicationRuntimeInfo);
        }
        this.logLevel = logLevel;
    }

    /****
     * @param event - the IIoEvent to publish
     * 
     * @returns void
     */
    async publishEvent(event: IIoEvent): Promise<void> {
        this.logger.debug('EventManager:publishEvent: event', event.toJSON());

        // Validate event with informative response
        const validation = event.validate();
        if(!validation.valid){
            const msg = `EventManager:publishEvent: event is not valid${validation.message ? ` - ${validation.message}` : ''}`;
            this.logger.error(msg);
            throw new Error(msg);
        }

        // send the LOCAL custom event to IO
        try{
            await this.ioCustomEventManager.publishEvent(event);
        }catch(error){
            this.logger.error('EventManager:publishEvent: error publishing event', error);
            throw new Error('EventManager:publishEvent: error publishing event');
        }
       
        // TODO: check and see if event needs to go to brand if so send it. some day that will be in the Brand config
        // get brand data 
        //this.logger.debug('EventManager:publishEvent: brandId pre getting the brand data for event call backs', event.data.brandId);
        const brand = await this.brandManager.getBrand(event.data.brandId); // this is dumb on Reg events but lets fetch it anyway
        this.logger.debug('EventManager:publishEvent: brand from get from brand manager', brand);

        // if external get the Brand it needs to be sent to and the end point url and auth. use brand manager
        if(brand.enabled){
            if(brand.endPointUrl){
                // route the event to the correct receivers. send the event to the correct receivers with the auth in the header
                try {
                    this.logger.error(`Sending event to brand at ${brand.endPointUrl}`);
                    const response = await fetch(brand.endPointUrl, {
                        method: 'POST',
                        body: JSON.stringify(event),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    this.logger.error(`Sent event to brand at ${brand.endPointUrl}`, response);
                } catch (error) {
                    this.logger.error('EventManager:publishEvent: error sending event to brand', error);
                }
            }else{
                this.logger.error('EventManager:publishEvent: brand is enabled but does not have an end point url', brand);
                throw new Error('EventManager:publishEvent: brand is enabled but does not have an end point url');
            }
        }
    }

    /***
     * @param params - the parameters object from an action invoke
     * 
     * @returns the s2s authentication credentials
     */
    static getS2sAuthenticationCredentials(params: any): IS2SAuthenticationCredentials {
        //check for missing params and build a descriptive error message
        const missing: string[] = [];
        if (!params.S2S_CLIENT_ID) missing.push('S2S_CLIENT_ID');
        if (!params.S2S_CLIENT_SECRET) missing.push('S2S_CLIENT_SECRET');
        if (!params.S2S_SCOPES) missing.push('S2S_SCOPES');
        if (!params.ORG_ID) missing.push('ORG_ID');
        if (missing.length > 0) {
            throw new Error(`EventManager:getS2sAuthenticationCredentials: missing required parameter(s): ${missing.join(', ')}`);
        }
        
        // clean up the meta scopes
        // they are in the .env like ["AdobeID","openid","read_organizations","additional_info.projectedProductContext","additional_info.roles","adobeio_api","read_client_secret","manage_client_secrets"]
        let metaScopes = JSON.parse(params.S2S_SCOPES);
        metaScopes = metaScopes.join(',');

        const s2sAuthenticationCredentials = {
            clientId: params.S2S_CLIENT_ID,
            clientSecret: params.S2S_CLIENT_SECRET,
            scopes: metaScopes,
            orgId: params.ORG_ID
        } as IS2SAuthenticationCredentials;

        console.log("EventManager:getS2sAuthenticationCredentials: s2sAuthenticationCredentials", s2sAuthenticationCredentials);

        return s2sAuthenticationCredentials;
    }

    /***
     * @param params - the parameters object from an action invoke
     * 
     * @returns the asset sync provider ID
     */
    static getAssetSyncProviderId(params: any): string {
        const key = 'AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID';
        const value = params[key];
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(
                `EventManager:getAssetSyncProviderId: missing parameter ${key}. Ensure it is defined in your .env and mapped in app.config.yaml inputs.`
            );
        }
        return value;
    }

    /***
     * @param params - the parameters object from an action invoke
     * 
     * @returns the new brand registration provider ID
     */
    static getRegistrationProviderId(params: any): string {
        const key = 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID';
        const value = params[key];
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(
                `EventManager:getRegistrationProviderId: missing parameter ${key}. Ensure it is defined in your .env and mapped in app.config.yaml inputs.`
            );
        }
        return value;
    }

    /***
     * getApplicationRuntimeInfo
     * 
     * @param params - the parameters object from an action invoke
     * 
     * @returns the application runtime information or undefined
     */
    static getApplicationRuntimeInfo(params: any): IApplicationRuntimeInfo | undefined {
        // Parse and process APPLICATION_RUNTIME_INFO if provided
        if (params.APPLICATION_RUNTIME_INFO) {
            try {
                const runtimeInfo = JSON.parse(params.APPLICATION_RUNTIME_INFO);
                if (runtimeInfo.namespace && runtimeInfo.app_name) {
                    // Split namespace into consoleId, projectName, and workspace (expected format: consoleId-projectName-workspace)
                    const namespaceParts = String(runtimeInfo.namespace).split('-');
                    if (namespaceParts.length >= 3) {
                        const applicationRuntimeInfo: IApplicationRuntimeInfo = {
                            consoleId: namespaceParts[0],
                            projectName: namespaceParts[1],
                            workspace: namespaceParts[2],
                            actionPackageName: runtimeInfo.action_package_name,
                            app_name: runtimeInfo.app_name
                        };
                        return applicationRuntimeInfo;
                    }
                }
            } catch (error) {
                console.warn('Failed to parse APPLICATION_RUNTIME_INFO:', error);
            }
        }
        return undefined;
    }
}
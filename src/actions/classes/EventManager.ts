import { config } from "dotenv";
import { Ia2bEvent, IS2SAuthenticationCredentials, IApplicationRuntimeInfo } from "../types";
import { BrandManager } from "./BrandManager";
import { IoCustomEventManager } from "./IoCustomEventManager";
import aioLogger from "@adobe/aio-lib-core-logging";

export class EventManager {
    private s2sAuthenticationCredentials: IS2SAuthenticationCredentials;
    private logLevel: string;
    private ioCustomEventManager: IoCustomEventManager;
    private logger: any;
    private brandManager: BrandManager;

    /****
     * @param logLevel - the log level to use
     * @param s2sAuthenticationCredentials - the s2s authentication credentials 
     * @param applicationRuntimeInfo - the application runtime information (validated below)
     */
    constructor(logLevel: string, s2sAuthenticationCredentials: IS2SAuthenticationCredentials, applicationRuntimeInfo: IApplicationRuntimeInfo) {
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
     * @param event - the Ia2bEvent to publish
     * 
     * @returns void
     */
    async publishEvent(event: Ia2bEvent): Promise<void> {
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
}
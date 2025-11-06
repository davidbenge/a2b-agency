import { config } from "dotenv";
import { Ia2bEvent, IS2SAuthenticationCredentials, IApplicationRuntimeInfo, IBrandEventPostResponse } from "../types";
import { BrandManager } from "./BrandManager";
import { IoCustomEventManager } from "./IoCustomEventManager";
import { ApplicationRuntimeInfo } from "./ApplicationRuntimeInfo";
import { AgencyIdentification } from "./AgencyIdentification";
import { Brand } from "./Brand";
import aioLogger from "@adobe/aio-lib-core-logging";
import { IAppEventDefinition, ILogger } from "../../shared/types";
import { EventCategory } from "../../shared/constants";
import { getEventDefinition } from "./AppEventRegistry";
import { A2bEvent } from "./A2bEvent";

/**
 * Utility function for lazy initialization
 * Only computes the value when first accessed
 */
function createLazy<T>(factory: () => T): () => T {
    let cached: T | undefined;
    let computed = false;
    return () => {
        if (!computed) {
            cached = factory();
            computed = true;
        }
        return cached!;
    };
}

export class EventManager {
    private s2sAuthenticationCredentials?: IS2SAuthenticationCredentials;
    private logLevel: string;
    private ioCustomEventManager?: IoCustomEventManager;
    private logger: ILogger;
    private brandManager: BrandManager;
    private params: any;
    
    // Lazy getters
    private _lazyS2sCredentials?: () => IS2SAuthenticationCredentials;
    private _lazyAssetSyncProviderId?: () => string;
    private _lazyApplicationRuntimeInfo?: () => ApplicationRuntimeInfo | undefined;
    private _lazyIoCustomEventManager?: () => IoCustomEventManager;
    private _lazyAgencyIdentification?: () => AgencyIdentification | undefined;

    /****
     * Simplified constructor - only needs params, event definitions loaded on-demand
     * 
     * @param params - Action parameters containing credentials and config
     * 
     * Example usage:
     *   const eventManager = new EventManager(params);
     *   await eventManager.processEvent('com.adobe.a2b.assetsync.new', brand, eventData);
     */
    constructor(params: any){
       this.params = params;
       this.logLevel = this.params.LOG_LEVEL || 'info';
       this.logger = aioLogger("EventManager", { level: this.logLevel });
       this.brandManager = new BrandManager(this.logLevel);
       
       // Setup lazy initialization for all dependencies
       this._lazyS2sCredentials = createLazy(() => EventManager.getS2sAuthenticationCredentials(this.params));
       this._lazyAssetSyncProviderId = createLazy(() => EventManager.getAssetSyncProviderId(this.params));
       this._lazyApplicationRuntimeInfo = createLazy(() => ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(this.params));
       this._lazyAgencyIdentification = createLazy(() => AgencyIdentification.getAgencyIdentificationFromActionParams(this.params));
       this._lazyIoCustomEventManager = createLazy(() => {
           const credentials = this.getS2sCredentialsLazy();
           if (!this._lazyApplicationRuntimeInfo) {
               throw new Error('EventManager not initialized with lazy loading');
           }
           const runtimeInfo = this._lazyApplicationRuntimeInfo();
           if (!runtimeInfo) {
               throw new Error('Missing APPLICATION_RUNTIME_INFO');
           }
           return new IoCustomEventManager(this.logLevel, credentials, runtimeInfo);
       });
       
       this.logger.debug?.('EventManager initialized with lazy loading');
    }
    
    /****
     * Get S2S credentials lazily - only initializes when needed
     */
    private getS2sCredentialsLazy(): IS2SAuthenticationCredentials {
        if (!this._lazyS2sCredentials) {
            throw new Error('EventManager not initialized with lazy loading');
        }
        return this._lazyS2sCredentials();
    }

    /****
     * Get agency identification lazily - only initializes when needed
     */
    private getAgencyIdentificationLazy(): AgencyIdentification | undefined {
        if (!this._lazyAgencyIdentification) {
            throw new Error('EventManager not initialized with lazy loading');
        }
        return this._lazyAgencyIdentification();
    }
    
    /****
     * PUBLIC: Get asset sync provider ID lazily - only initializes when needed
     * This is exposed publicly so handlers can access it for event construction
     */
    public getAssetSyncProviderId(): string {
        if (!this._lazyAssetSyncProviderId) {
            // Fallback for legacy constructor
            if (!this.params) {
                throw new Error('EventManager not initialized with params - cannot get asset sync provider ID');
            }
            this._lazyAssetSyncProviderId = createLazy(() => EventManager.getAssetSyncProviderId(this.params!));
        }
        return this._lazyAssetSyncProviderId();
    }
    
    /****
     * PUBLIC: Get application runtime info lazily - only initializes when needed
     * This is exposed publicly so handlers can access it for event construction
     * 
     * @throws Error if APPLICATION_RUNTIME_INFO is missing
     */
    public getApplicationRuntimeInfo(): ApplicationRuntimeInfo {
        if (!this._lazyApplicationRuntimeInfo) {
            // Fallback for legacy constructor
            if (!this.params) {
                throw new Error('EventManager not initialized with params - cannot get application runtime info');
            }
            this._lazyApplicationRuntimeInfo = createLazy(() => ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(this.params!));
        }
        const info = this._lazyApplicationRuntimeInfo();
        if (!info) {
            throw new Error('Missing APPLICATION_RUNTIME_INFO');
        }
        return info;
    }
    
    /****
     * PUBLIC: Get registration provider ID lazily - only initializes when needed
     * This is exposed publicly so handlers can access it for event construction
     */
    public getRegistrationProviderId(): string {
        if (!this.params) {
            throw new Error('EventManager not initialized with params - cannot get registration provider ID');
        }
        return EventManager.getRegistrationProviderId(this.params);
    }
    
    /****
     * Get IoCustomEventManager lazily - only initializes when needed
     */
    private getIoCustomEventManagerLazy(): IoCustomEventManager {
        if (!this._lazyIoCustomEventManager) {
            throw new Error('EventManager not initialized with lazy loading');
        }
        return this._lazyIoCustomEventManager();
    }

    /****
     * Process event - evaluates event definition, brand config, routing rules, and flags,
     * then decides whether to execute the event or not. This method:
     * 1. Looks up event definition from registry
     * 2. Validates required fields
     * 3. Checks brand configuration and flags
     * 4. Evaluates routing rules from IAppEventDefinition
     * 5. Constructs CloudEvent if validation passes
     * 6. Sends to brand (if rules/flags allow)
     * 7. Publishes to IO Events (if rules/flags allow)
     * 
     * This is the preferred method for event processing.
     * 
     * @param eventCode - The event code from the registry (e.g., 'com.adobe.a2b.assetsync.new')
     * @param brand - The Brand object (or null if not applicable, e.g., registration events)
     * @param eventData - The event-specific data to include in the event
     * @returns Object with results of both operations
     * 
     * Example usage:
     *   await eventManager.processEvent(
     *     'com.adobe.a2b.assetsync.new',
     *     brand,
     *     { asset_id: '123', asset_path: '/path/to/asset', ... }
     *   );
     */
    async processEvent(
        eventCode: string, 
        brand: Brand | null, 
        eventData: any
    ): Promise<{ brandSendResult?: IBrandEventPostResponse; ioEventPublished: boolean }> {
        this.logger.debug?.('EventManager:processEvent', { eventCode, brandId: brand?.brandId });

        // 1. Look up the event definition from the registry
        const eventDefinition = getEventDefinition(eventCode);
        if (!eventDefinition) {
            throw new Error(`EventManager:processEvent: Event code '${eventCode}' not found in registry`);
        }

        // 2. Get runtime info and agency identification (before validation, as they may be needed for derived fields)
        const runtimeInfo = this.getApplicationRuntimeInfo();
        const agencyIdentification = this.getAgencyIdentificationLazy();

        // 3. Build the complete event data with injected objects
        const completeEventData = { ...eventData };
        
        // Inject app_runtime_info if specified in event definition (needed for deriving agencyEndPointUrl)
        if (eventDefinition.injectedObjects?.includes('app_runtime_info')) {
            completeEventData.app_runtime_info = {
                consoleId: runtimeInfo.consoleId,
                projectName: runtimeInfo.projectName,
                workspace: runtimeInfo.workspace,
                app_name: runtimeInfo.appName,
                action_package_name: runtimeInfo.actionPackageName
            };
        }

        // Derive agencyEndPointUrl from runtime info BEFORE validation
        if (!completeEventData.agencyEndPointUrl) {
            completeEventData.agencyEndPointUrl = runtimeInfo.buildEndpointUrl();
        }

        // 4. Validate required fields (after deriving auto-populated fields)
        const missingFields = eventDefinition.requiredFields.filter(field => !(field in completeEventData));
        if (missingFields.length > 0) {
            throw new Error(`EventManager:processEvent: Missing required fields for '${eventCode}': ${missingFields.join(', ')}`);
        }

        // Inject agency_identification if specified in event definition
        if (eventDefinition.injectedObjects?.includes('agency_identification') && agencyIdentification) {
            completeEventData.agency_identification = agencyIdentification.serialize();
        }

        // 5. Create a generic A2bEvent instance for CloudEvent construction
        const event = new (class extends A2bEvent {
            constructor() {
                super();
                this.type = eventCode;
                this.data = completeEventData;
            }
            
            validate() {
                // Custom validation based on event definition
                const missing: string[] = [];
                eventDefinition.requiredFields.forEach(field => {
                    if (!(field in this.data)) {
                        missing.push(field);
                    }
                });
                return {
                    valid: missing.length === 0,
                    message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : undefined,
                    missing: missing.length > 0 ? missing : undefined
                };
            }
        })();

        // Set the source URI from runtime info
        event.setSourceUri(runtimeInfo);

        // 6. Determine if we should send to brand
        // Only send app events (AGENCY/REGISTRATION) to brands, not product events
        let brandSendResult: IBrandEventPostResponse | undefined;
        const shouldSendToBrand = brand && 
            (brand.enabled || eventDefinition.code === 'com.adobe.a2b.registration.disabled') &&
            (eventDefinition.category === EventCategory.AGENCY || 
             eventDefinition.category === EventCategory.REGISTRATION);

        if (shouldSendToBrand) {
            try {
                // Log the exact CloudEvent payload before sending to brand
                const ce = event.toCloudEvent() as any;
                const payload = typeof ce.toJSON === 'function' ? ce.toJSON() : ce;
                this.logger.debug?.('EventManager: Prepared CloudEvent payload for brand send', payload);
                this.logger.info(`EventManager: Sending event to brand ${brand!.brandId}`, { eventCode });
                brandSendResult = await brand!.sendCloudEventToEndpoint(event);
                this.logger.info(`EventManager: Successfully sent event to brand ${brand!.brandId}`);
            } catch (error) {
                this.logger.error(`EventManager: Failed to send event to brand ${brand!.brandId}`, error);
                // Don't throw - continue to publish to IO Events even if brand send fails
            }
        } else {
            this.logger.debug?.('EventManager: Skipping brand send', { 
                hasBrand: !!brand, 
                brandEnabled: brand?.enabled,
                eventCode,
                eventCategory: eventDefinition.category
            });
        }

        // 7. Publish to Adobe I/O Events (internal event distribution)
        // For now, always publish to Adobe I/O Events (routing rules can be evaluated later)
        let ioEventPublished = false;
        try {
            const eventManager = this.ioCustomEventManager || this.getIoCustomEventManagerLazy();
            await eventManager.publishToAdobeIOEvents(event);
            ioEventPublished = true;
            this.logger.info(`EventManager: Successfully published event to Adobe I/O Events`, { eventCode });
        } catch (error) {
            this.logger.error(`EventManager: Failed to publish event to Adobe I/O Events`, error);
            this.logger.error(`EventManager: Failed to publish event to Adobe I/O Events`, eventData);
            //throw new Error(`EventManager: Failed to publish event to Adobe I/O Events: ${error}`);
        }

        return { brandSendResult, ioEventPublished };
    }

    /****
     * LEGACY: Publish event directly - for backwards compatibility
     * @deprecated Use processEvent() instead for automatic validation, injection, and routing
     * 
     * @param event - the Ia2bEvent to publish
     * @returns void
     */
    async publishEvent(event: Ia2bEvent): Promise<void> {
        this.logger.debug?.('EventManager:publishEvent: event', event.toJSON());

        // Validate event with informative response
        const validation = event.validate();
        if(!validation.valid){
            const msg = `EventManager:publishEvent: event is not valid${validation.message ? ` - ${validation.message}` : ''}`;
            this.logger.error(msg);
            throw new Error(msg);
        }

        // Get IoCustomEventManager (lazy - only initializes when needed)
        const eventManager = this.ioCustomEventManager || this.getIoCustomEventManagerLazy();

        // Publish to Adobe I/O Events (internal event distribution)
        try{
            await eventManager.publishToAdobeIOEvents(event);
        }catch(error){
            this.logger.error('EventManager:publishEvent: error publishing event to Adobe I/O Events', error);
            throw new Error('EventManager:publishEvent: error publishing event to Adobe I/O Events');
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
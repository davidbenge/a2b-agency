import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "./Brand";
import { IBrand } from "../types";
import { BRAND_STATE_PREFIX, BRAND_FILE_STORE_DIR, BRAND_SECRET_INDEX_PREFIX } from "../constants";

export class BrandManager {
    private logger: any;
    private stateStore: any;
    private fileStore: any;

    constructor(logLevel: string) {
        this.logger = aioLogger("BrandManager", { level: logLevel || "info" });
    }

    /**
     * Factory method to create a Brand from JSON data
     * @param json JSON object containing brand data
     * @returns new Brand instance
     * @throws Error if JSON is invalid or missing required properties
     */
    static getBrandFromJson(json: any): Brand {
        if (!json || typeof json !== 'object') {
            throw new Error('Invalid JSON: Input must be a valid JSON object');
        }

        const missingProps: string[] = [];
        if (!json.brandId) missingProps.push('brandId');
        if (!json.secret) missingProps.push('secret');
        if (!json.name) missingProps.push('name');
        if (!json.endPointUrl) missingProps.push('endPointUrl');

        if (missingProps.length > 0) {
            throw new Error(`Invalid Brand data: Missing required properties: ${missingProps.join(', ')}`);
        }

        return new Brand({
            brandId: json.brandId,
            secret: json.secret,
            name: json.name,
            endPointUrl: json.endPointUrl,
            enabled: json.enabled,
            logo: json.logo,
            imsOrgName: json.imsOrgName,
            imsOrgId: json.imsOrgId,
            routingRules: json.routingRules,
            createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
            updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
            enabledAt: json.enabledAt ? new Date(json.enabledAt) : null,
            workfrontServerUrl: json.workfrontServerUrl,
            workfrontCompanyId: json.workfrontCompanyId,
            workfrontCompanyName: json.workfrontCompanyName,
            workfrontGroupId: json.workfrontGroupId,
            workfrontGroupName: json.workfrontGroupName,
            workfrontEventSubscriptions: json.workfrontEventSubscriptions
        });
    }

    /**
     * Factory method to create a new Brand
     * @param data Partial brand data
     * @returns new Brand instance
     */
    static createBrand(data: Partial<IBrand>): Brand {
        const now = new Date();
        return new Brand({
            brandId: data.brandId || this.generateBrandId(),
            secret: data.secret || this.generateSecret(),
            name: data.name || '',
            endPointUrl: data.endPointUrl || '',
            enabled: data.enabled ?? false,
            logo: data.logo,
            imsOrgName: data.imsOrgName,
            imsOrgId: data.imsOrgId,
            routingRules: data.routingRules,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
            enabledAt: data.enabledAt ?? null,
            workfrontServerUrl: data.workfrontServerUrl,
            workfrontCompanyId: data.workfrontCompanyId,
            workfrontCompanyName: data.workfrontCompanyName,
            workfrontGroupId: data.workfrontGroupId,
            workfrontGroupName: data.workfrontGroupName,
            workfrontEventSubscriptions: data.workfrontEventSubscriptions
        });
    }

    private static generateBrandId(): string {
        return `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private static generateSecret(): string {
        return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
    }

    /****
     * Get the state store
     * @returns Promise<any> - The state store
     */
    async getStateStore(): Promise<any> {
        if (!this.stateStore) {
            try {
                const stateLib = require('@adobe/aio-lib-state');
                this.logger.debug('State store imported');
                this.stateStore = await stateLib.init();
                this.logger.debug('State store initialized');
                return this.stateStore;
            } catch (error) {
                this.logger.error(`Error initializing state store: ${error}`);
                throw new Error(`Error initializing state store: ${error}`);
            }
        }else{
            this.logger.debug('State store already initialized');
            return this.stateStore;
        }
    }

    /****
     * Get the file store
     * @returns Promise<any> - The file store
     */
   async getFileStore(): Promise<any> {
        if (!this.fileStore) {
            try {
                const filesLib = require('@adobe/aio-lib-files');
                this.logger.debug('File store not initialized');
                this.fileStore = await filesLib.init();
                this.logger.debug('File store initialized');
                return this.fileStore;
            } catch (error) {
                this.logger.error(`Error initializing file store: ${error}`);
                throw new Error(`Error initializing file store: ${error}`);
            }
        }else{
            this.logger.debug('File store already initialized');
            return this.fileStore;
        }
   }

    /**
     * Get a brand by its ID
     * @param brandId : string - The brand id to get
     * @returns Promise<Brand | undefined> - The brand
     */
    async getBrand(brandId: string): Promise<Brand | undefined> {
        let brandStateFetch: any = undefined;
        
        try{
            brandStateFetch = await this.getBrandFromStateStore(brandId);
        }catch(error){
            //thats ok, we will check the file store for the brand
            this.logger.info(`Error getting brand from state store ${brandId}.`);
        }

        if (!brandStateFetch) {
            this.logger.debug(`brand ${brandId} not found in state store, checking file store`);
            // lets check the file store for the brand
            try {
                const brand = await this.getBrandFromFileStoreByBrandId(brandId);

                if(brand){
                    this.logger.debug(`brand ${brandId} found in file store, storing in state store`);
                    await this.storeBrandInStateStore(brand);
                    return brand;
                }else{
                    this.logger.debug(`Brand not found in state store or file store for brandId ${brandId}`);
                    return undefined;
                }
            } catch (error) {
                this.logger.error(`Brand not found in state store or file store for brandId ${brandId}: ${error}`);
                return undefined;
            }
        }else{
            return brandStateFetch;
        }
    }

    /**
     * Save the brand to the state store and file store
     * 
     * @param brand - The brand to save
     * 
     * @returns brand : Brand
     */
    async saveBrand(brand: Brand): Promise<Brand> {
        this.logger.debug(`Saving brand ${brand.brandId} to state store and file store`);
        // save to state store
        const stateStore = await this.getStateStore();
        const stateStoreKey = `${BRAND_STATE_PREFIX}${brand.brandId}`;
        this.logger.debug(`Saving brand ${brand.brandId} to state store with key ${stateStoreKey}`);
        
        await stateStore.put(stateStoreKey, brand.toJSONString());
        this.logger.debug(`Saved brand ${brand.brandId} to state store`);

        // save to file store
        const fileStore = await this.getFileStore();
        await fileStore.write(`${BRAND_FILE_STORE_DIR}/${brand.brandId}.json`, brand.toJSONString());
        this.logger.debug(`Saving brand ${brand.brandId} to file store`);

        // Save secret index
        await this.saveSecretIndex(brand.secret, brand.brandId);

        return brand;
    }

    /**
     * Delete the brand from the state store and file store
     * 
     * @param brandId : string - The brand id to delete
     */
    async deleteBrand(brandId: string): Promise<void> {
        // Get the brand first to get the secret for index cleanup
        const brand = await this.getBrand(brandId);
        
        // delete from state store
        try {
            const stateStore = await this.getStateStore();
            await stateStore.delete(`${BRAND_STATE_PREFIX}${brandId}`);
        } catch (error) {
            this.logger.warn(`Error deleting brand ${brandId} from state store: ${error}`);
        }

        // delete from file store
        try {
            const fileStore = await this.getFileStore();
            await fileStore.delete(`${BRAND_FILE_STORE_DIR}/${brandId}.json`);
        } catch (error) {
            this.logger.error(`Error deleting brand ${brandId} from file store: ${error}`);
        }

        // Delete secret index if brand had a secret
        if (brand && brand.secret) {
            await this.deleteSecretIndex(brand.secret);
        }
    }

    /**
     * Get all brands from the state store
     * 
     * @returns Promise<Brand[]> - The brands
     */
    async getAllBrands(): Promise<Brand[]> {
        const fileStore = await this.getFileStore();
        const brandList: Brand[] = [];
        const brands = await fileStore.list(`${BRAND_FILE_STORE_DIR}/`);
        this.logger.debug(`Found ${brands.length} brands in file store at path ${BRAND_FILE_STORE_DIR}/`);

        for (const fileData of brands) {
            this.logger.debug(`Reading brand from file store`,fileData);

            try {
                let brand = await this.getBrandFromStateStoreByFileName(fileData.name);
                if(!brand){
                    this.logger.warn(`Brand not found in file store ${fileData.name}`);
                    brand = await this.getBrandFromFileStoreByFileName(fileData.name);
                    if(brand){
                        await this.storeBrandInStateStore(brand);
                        brandList.push(brand);
                    }else{
                        this.logger.warn(`Brand not found in file store ${fileData.name}`);
                    }
                }else{
                    brandList.push(brand);
                }
            } catch (error) {
                this.logger.warn(`Error parsing brand from file store ${fileData.name}: ${error}`);
            }
        }
        return brandList;
    }

    /****
     * Get a brand from the file store by brand id
     * @param brandId - The brand id to get
     * @returns Promise<Brand> - The brand
     */
    async getBrandFromFileStoreByBrandId(brandId: string): Promise<Brand | undefined> {
        const fileDataName = `${BRAND_FILE_STORE_DIR}/${brandId}.json`;
        const brand = await this.getBrandFromFileStoreByFileName(fileDataName);
        return brand;
    }

    /****
     * Get a brand from the file store by file name
     * @param fileDataName - The file name to get
     * @returns Promise<Brand> - The brand
     */
    async getBrandFromFileStoreByFileName(fileDataName: string): Promise<Brand | undefined> {
        var buffer: any;
        try {
            const fileStore = await this.getFileStore();

            buffer = await fileStore.read(fileDataName);
            this.logger.debug(`Brand found in file store ${fileDataName}: ${buffer.toString()}`);
        } catch (error) {
            this.logger.warn(`Error reading brand from file store ${fileDataName}: ${error}`);
            return undefined;
        }

        if (!buffer) {
            this.logger.warn(`No buffer returned from file store for ${fileDataName}`);
            return undefined;
        }

        var brandJson: any;
        try{
            brandJson = JSON.parse(buffer.toString());
            this.logger.debug(`Brand JSON imported from file store ${fileDataName}`,brandJson);
        } catch (error) {
            this.logger.warn(`Error parsing brand from file store ${fileDataName}: ${error}`);
            return undefined;
        }

        try {
            const brand = BrandManager.getBrandFromJson(brandJson);
            return brand;
        } catch (error) {
            this.logger.warn(`Error parsing brand from file store ${fileDataName}: ${error}`);
            return undefined;
        }
    }

    /****
     * Get a brand from the state store by file name
     * @param fileDataName - The file name to get
     * @returns Promise<Brand> - The brand
     */
    async getBrandFromStateStoreByFileName(fileDataName: string): Promise<Brand | undefined> {
        const brandId = this.extractBrandIdFromFileDataName(fileDataName);
        if(!brandId){
            this.logger.warn(`Could not extract brandId from fileDataName: ${fileDataName}`);
            return undefined;
        }

        return await this.getBrandFromStateStore(brandId);
    }

    /****
     * Get a brand from the state store by brand id
     * @param brandId - The brand id to get
     * @returns Promise<Brand> - The brand
     */
    async getBrandFromStateStore(brandId: string): Promise<Brand | undefined> {
        try{
            const stateStore = await this.getStateStore();   
            this.logger.debug(`Attempting to get brand ${brandId} from state store ${BRAND_STATE_PREFIX}${brandId}`);
            const brandStateFetch = await stateStore.get(`${BRAND_STATE_PREFIX}${brandId}`);
            const brandString = brandStateFetch?.value as string;
            if(typeof brandString !== 'string' || brandString.length < 2){
                this.logger.debug(`brand ${brandId} not found in state store`);
                return undefined;
            }else{
                this.logger.debug(`brand ${brandId} found in state store`);
                const brandJson = JSON.parse(brandString);
                const brand = BrandManager.getBrandFromJson(brandJson);
                return brand;
            }
        }catch(error){
            this.logger.info(`Error getting brand from state store ${brandId}.`);
            return undefined;
        }
    }

    /****
     * Store a brand in the state store
     * @param brand - The brand to store
     * @returns Promise<void>
     */
    async storeBrandInStateStore(brand: Brand): Promise<void> {
        try{
            const stateStore = await this.getStateStore();
            this.logger.debug(`Storing brand ${brand.brandId} in state store ${BRAND_STATE_PREFIX}${brand.brandId}`);
            await stateStore.put(`${BRAND_STATE_PREFIX}${brand.brandId}`, brand.toJSONString());
        }catch(error){
            this.logger.info(`Error storing brand ${brand.brandId} in state store.`);
            throw new Error(`Error storing brand ${brand.brandId} in state store.`);
        }
    }

    /***
     * Extracts the brandId from a file data path like `brand/<brandId>.json`.
     * Returns `undefined` if the input doesn't match the expected pattern.
     */
    extractBrandIdFromFileDataName(fileDataName: string): string | undefined {
        try{
            const escapedDir = BRAND_FILE_STORE_DIR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(?:^|/)${escapedDir}/([^/]+)\\.json$`);
            const match = fileDataName.match(pattern);
            if (match && match[1]) {
                return match[1];
            }

            const lastSegment = fileDataName.split('/').pop();
            if (lastSegment && lastSegment.endsWith('.json')) {
                return lastSegment.slice(0, -5);
            }

            this.logger.debug(`Could not extract brandId from fileDataName: ${fileDataName}`);
            return undefined;
        }catch(error){
            this.logger.warn(`Error extracting brandId from fileDataName ${fileDataName}: ${error}`);
            return undefined;
        }
    }

    /**
     * Save a secret index entry mapping secret to brand ID
     * @param secret - The secret to index
     * @param brandId - The brand ID
     */
    private async saveSecretIndex(secret: string, brandId: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const indexKey = `${BRAND_SECRET_INDEX_PREFIX}${secret}`;
            await stateStore.put(indexKey, brandId);
            this.logger.debug(`Saved secret index for brand ${brandId}`);
        } catch (error) {
            this.logger.error(`Error saving secret index for brand ${brandId}: ${error}`);
            throw error;
        }
    }

    /**
     * Get brand ID by secret from the index
     * @param secret - The secret to look up
     * @returns Promise<string | undefined> - The brand ID or undefined if not found
     */
    private async getBrandIdBySecret(secret: string): Promise<string | undefined> {
        try {
            const stateStore = await this.getStateStore();
            const indexKey = `${BRAND_SECRET_INDEX_PREFIX}${secret}`;
            const result = await stateStore.get(indexKey);
            
            if (!result || !result.value) {
                this.logger.debug(`No brand found for secret in index`);
                return undefined;
            }

            return result.value as string;
        } catch (error) {
            this.logger.error(`Error getting brand ID by secret: ${error}`);
            return undefined;
        }
    }

    /**
     * Delete a secret index entry
     * @param secret - The secret to remove from index
     */
    private async deleteSecretIndex(secret: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const indexKey = `${BRAND_SECRET_INDEX_PREFIX}${secret}`;
            await stateStore.delete(indexKey);
            this.logger.debug(`Deleted secret index for secret`);
        } catch (error) {
            this.logger.warn(`Error deleting secret index: ${error}`);
        }
    }

    /**
     * Get a brand by its secret (fast lookup using index)
     * @param secret - The secret to look up
     * @returns Promise<Brand | undefined> - The brand or undefined if not found
     */
    async getBrandBySecret(secret: string): Promise<Brand | undefined> {
        // Use the secret index to find the brand ID
        const brandId = await this.getBrandIdBySecret(secret);
        
        if (!brandId) {
            this.logger.debug(`No brand found for provided secret`);
            return undefined;
        }

        // Get the full brand object
        const brand = await this.getBrand(brandId);
        
        if (!brand) {
            this.logger.warn(`Brand ${brandId} found in index but not in storage`);
            return undefined;
        }

        // Validate that the secret actually matches (double-check)
        if (brand.secret !== secret) {
            this.logger.warn(`Secret mismatch for brand ${brandId}`);
            return undefined;
        }

        return brand;
    }

    // ============================================================================
    // Brand-Specific Event Definition Management
    // ============================================================================
    // BRAND-SPECIFIC ROUTING RULES (App Events Only)
    // OPTIMIZED: Embedded in brand object to reduce state store reads/writes
    // ============================================================================

    /**
     * Get routing rules for a brand-specific app event
     * OPTIMIZED: Rules are embedded in brand object (single read vs. N+1 reads)
     * @param brandId - The brand ID
     * @param eventCode - The app event code
     * @returns Promise<IRoutingRule[]>
     */
    async getBrandRoutingRules(brandId: string, eventCode: string): Promise<any[]> {
        try {
            const brand = await this.getBrand(brandId);
            if (!brand) {
                this.logger.debug(`Brand ${brandId} not found`);
                return [];
            }

            const rules = brand.routingRules?.[eventCode] || [];
            this.logger.debug(`Retrieved ${rules.length} routing rules for brand ${brandId}, event: ${eventCode}`);
            return rules;
        } catch (error: unknown) {
            this.logger.error(`Error getting brand routing rules for ${brandId}, event ${eventCode}:`, error as any);
            return [];
        }
    }

    /**
     * Add a single routing rule to a brand-specific app event
     * OPTIMIZED: Updates brand object (single write vs. separate write)
     * @param brandId - The brand ID
     * @param eventCode - The app event code
     * @param rule - The routing rule to add
     * @returns Promise<void>
     */
    async addBrandRoutingRule(brandId: string, eventCode: string, rule: any): Promise<void> {
        const brand = await this.getBrand(brandId);
        if (!brand) {
            throw new Error(`Brand with ID ${brandId} not found`);
        }

        const routingRules = { ...brand.routingRules };
        const existingRules = routingRules[eventCode] || [];
        
        // Check if rule with same ID already exists
        const existingIndex = existingRules.findIndex((r: any) => r.id === rule.id);
        if (existingIndex >= 0) {
            throw new Error(`Rule with ID ${rule.id} already exists for brand ${brandId}, event ${eventCode}`);
        }

        existingRules.push(rule);
        routingRules[eventCode] = existingRules;

        // Update brand with new routing rules
        const updatedBrand = BrandManager.createBrand({
            ...brand.toJSON(),
            routingRules,
            updatedAt: new Date()
        });

        await this.saveBrand(updatedBrand);
        
        this.logger.info(`Added routing rule ${rule.id} for brand ${brandId}, event: ${eventCode}`);
    }

    /**
     * Update a routing rule for a brand-specific app event
     * OPTIMIZED: Updates brand object (single write vs. separate write)
     * @param brandId - The brand ID
     * @param eventCode - The app event code
     * @param ruleId - The rule ID to update
     * @param updates - Partial updates to apply
     * @returns Promise<void>
     */
    async updateBrandRoutingRule(brandId: string, eventCode: string, ruleId: string, updates: any): Promise<void> {
        const brand = await this.getBrand(brandId);
        if (!brand) {
            throw new Error(`Brand with ID ${brandId} not found`);
        }

        const routingRules = { ...brand.routingRules };
        const existingRules = [...(routingRules[eventCode] || [])];
        
        const ruleIndex = existingRules.findIndex((r: any) => r.id === ruleId);
        if (ruleIndex < 0) {
            throw new Error(`Rule with ID ${ruleId} not found for brand ${brandId}, event ${eventCode}`);
        }

        existingRules[ruleIndex] = {
            ...existingRules[ruleIndex],
            ...updates,
            id: ruleId, // Ensure ID doesn't change
            updatedAt: new Date()
        };

        routingRules[eventCode] = existingRules;

        // Update brand with modified routing rules
        const updatedBrand = BrandManager.createBrand({
            ...brand.toJSON(),
            routingRules,
            updatedAt: new Date()
        });

        await this.saveBrand(updatedBrand);
        
        this.logger.info(`Updated routing rule ${ruleId} for brand ${brandId}, event: ${eventCode}`);
    }

    /**
     * Delete a routing rule from a brand-specific app event
     * OPTIMIZED: Updates brand object (single write vs. separate write)
     * @param brandId - The brand ID
     * @param eventCode - The app event code
     * @param ruleId - The rule ID to delete
     * @returns Promise<void>
     */
    async deleteBrandRoutingRule(brandId: string, eventCode: string, ruleId: string): Promise<void> {
        const brand = await this.getBrand(brandId);
        if (!brand) {
            throw new Error(`Brand with ID ${brandId} not found`);
        }

        const routingRules = { ...brand.routingRules };
        const existingRules = routingRules[eventCode] || [];
        
        const filteredRules = existingRules.filter((r: any) => r.id !== ruleId);

        if (filteredRules.length === existingRules.length) {
            throw new Error(`Rule with ID ${ruleId} not found for brand ${brandId}, event ${eventCode}`);
        }

        if (filteredRules.length === 0) {
            // Remove the event code key if no rules left
            delete routingRules[eventCode];
        } else {
            routingRules[eventCode] = filteredRules;
        }

        // Update brand with modified routing rules
        const updatedBrand = BrandManager.createBrand({
            ...brand.toJSON(),
            routingRules,
            updatedAt: new Date()
        });

        await this.saveBrand(updatedBrand);
        
        this.logger.info(`Deleted routing rule ${ruleId} for brand ${brandId}, event: ${eventCode}`);
    }

    /**
     * Get all app event codes that have brand-specific routing rules
     * OPTIMIZED: Reads from brand object (single read vs. listing all keys)
     * @param brandId - The brand ID
     * @returns Promise<string[]>
     */
    async getBrandEventCodesWithRoutingRules(brandId: string): Promise<string[]> {
        try {
            const brand = await this.getBrand(brandId);
            if (!brand) {
                this.logger.debug(`Brand ${brandId} not found`);
                return [];
            }

            const eventCodes = Object.keys(brand.routingRules || {});
            this.logger.debug(`Found ${eventCodes.length} app events with routing rules for brand ${brandId}`);
            return eventCodes;
        } catch (error: unknown) {
            this.logger.error(`Error listing brand event codes with routing rules for ${brandId}:`, error as any);
            return [];
        }
    }
}
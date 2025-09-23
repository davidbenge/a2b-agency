import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "./Brand";
import { IBrand } from "../types";
import { BRAND_STATE_PREFIX, BRAND_FILE_STORE_DIR } from "../constants";

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
            createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
            updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
            enabledAt: json.enabledAt ? new Date(json.enabledAt) : null
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
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
            enabledAt: data.enabledAt ?? null
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

        return brand;
    }

    /**
     * Delete the brand from the state store and file store
     * 
     * @param brandId : string - The brand id to delete
     */
    async deleteBrand(brandId: string): Promise<void> {
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
}
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "./Brand";
import { BRAND_STATE_PREFIX, BRAND_FILE_STORE_DIR } from "../constants";

export class BrandManager {
    private logger: any;
    private stateStore: any;
    private fileStore: any;

    constructor(logLevel: string) {
        this.logger = aioLogger("BrandManager", { level: logLevel || "info" });
        this.logger.debug('BrandManager constructor');
    }

    async getStateStore(): Promise<any> {
        if (!this.stateStore) {
            this.logger.debug('Storage lib imported');
            const stateLib = require('@adobe/aio-lib-state');
            try {
                this.stateStore = await stateLib.init();
                this.logger.debug('State store initialized');
            } catch (error) {
                this.logger.error(`Error initializing state store: ${error}`);
                throw new Error(`Error initializing state store: ${error}`);
            }
        }
        return this.stateStore;
    }

   async getFileStore(): Promise<any> {
        if (!this.fileStore) {
            this.logger.debug('File store not initialized');
            const filesLib = require('@adobe/aio-lib-files');
            try {
                this.fileStore = await filesLib.init();
                this.logger.debug('File store initialized');
            } catch (error) {
                this.logger.error(`Error initializing file store: ${error}`);
                throw new Error(`Error initializing file store: ${error}`);
            }
        }
        return this.fileStore;
   }

    /**
     * Get a brand by its ID
     * @param brandId : string - The brand id to get
     * @returns Promise<Brand> - The brand
     */
    async getBrand(brandId: string): Promise<Brand> {
        this.logger.debug(`Getting brand ${brandId}.  Gettting state store`);
        const stateStore = await this.getStateStore();
        this.logger.debug(`Getting brand ${brandId} from state store`);
        const brandStateFetch = await stateStore.get(`${BRAND_STATE_PREFIX}${brandId}`);

        let brandString;
        if(!brandStateFetch.value){
            this.logger.debug(`brand ${brandId} not found in state store, checking file store`);
        }else{
            brandString = brandStateFetch.value;
        }

        if (!brandString) {
            this.logger.debug(`brand ${brandId} not found in state store, checking file store`);
            // lets check the file store for the brand
            const fileStore = await this.getFileStore();
            try {
                const buffer = await fileStore.read(`${BRAND_FILE_STORE_DIR}/${brandId}.json`);
                const brandJson = JSON.parse(buffer.toString());
                this.logger.debug(`Brand found in file store for brandId ${brandId}: ${buffer.toString()}`);
                const foundBrand = Brand.fromJSON(brandJson);
                //load the Brand to state store
                await stateStore.put(`${BRAND_STATE_PREFIX}${brandId}`, foundBrand.toJSONString());

                return foundBrand;
            } catch (error) {
                this.logger.error(`Brand not found in state store or file store for brandId ${brandId}: ${error}`);
                throw new Error(`Brand not found in state store or file store for brandId ${brandId}: ${error}`);
            }
        }else{
            this.logger.debug(`brand ${brandId} found in state store, parsing to brand object. the type of brandstring is ${typeof brandString}`,brandString);
            const brandJson = JSON.parse(brandString);
            this.logger.debug(`brand ${brandId} parsed to brand object`, brandJson);
            const brand = Brand.fromJSON(brandJson);
            this.logger.debug(`brand ${brandId} parsed to brand object`, brand);
            return brand;
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
        const brandList = [];
        const brands = await fileStore.list(`${BRAND_FILE_STORE_DIR}/`);
        this.logger.debug(`Found ${brands.length} brands in file store at path ${BRAND_FILE_STORE_DIR}/`);

        for (const fileData of brands) {
            this.logger.debug(`Reading brand from file store`,fileData);
            var buffer: any;
            try {
                buffer = await fileStore.read(fileData.name);
                this.logger.debug(`Brand found in file store ${fileData.name}: ${buffer.toString()}`);
            } catch (error) {
                this.logger.warn(`Error reading brand from file store ${fileData.name}: ${error}`);
            }

            var brandJson: any;
            try{
                brandJson = JSON.parse(buffer.toString());
                this.logger.debug(`Brand JSON imported from file store ${fileData.name}`,brandJson);
            } catch (error) {
                this.logger.warn(`Error parsing brand from file store ${fileData.name}: ${error}`);
            }

            try {
                const brand = Brand.fromJSON(brandJson);
                brandList.push(brand);
            } catch (error) {
                this.logger.warn(`Error parsing brand from file store ${fileData.name}: ${error}`);
            }
        }
        return brandList;
    }
}
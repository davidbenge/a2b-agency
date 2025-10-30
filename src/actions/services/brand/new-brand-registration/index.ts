/**
 * new client registration
 *
 * todo:// add in a custom event and throw it when the brand trys to register
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../../../classes/Brand";
import { BRAND_STATE_PREFIX } from "../../../constants";
import { BrandManager } from "../../../classes/BrandManager";
import * as randomstring from 'randomstring';
import { v4 as uuidv4 } from 'uuid';
import { EventManager } from "../../../classes/EventManager";
import { ApplicationRuntimeInfo } from "../../../classes/ApplicationRuntimeInfo";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("new-brand-registration", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    
    // Extract brand data from params.data
    const brandData = params.data || {};
    
    const requiredParams : string[] = ['name', 'endPointUrl']
    const requiredHeaders : string[] = []
    const errorMessage = checkMissingRequestInputs(brandData, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // Build brand object from data
    brandData.brandId = uuidv4();
    brandData.secret = randomstring.generate(32);
    brandData.enabled = false;
    brandData.createdAt = new Date();
    brandData.updatedAt = new Date();
    brandData.enabledAt = null;
    
    // IMS org fields are optional - pass through if provided
    // brandData.imsOrgName and brandData.imsOrgId are already in brandData if sent by brand

    let savedBrand: Brand;
    try{
      const brand = BrandManager.getBrandFromJson(brandData);
      logger.info('Creating brand registration', {
        name: brand.name,
        brandId: brand.brandId,
        enabled: brand.enabled,
        imsOrgName: brand.imsOrgName,
        imsOrgId: brand.imsOrgId
      });
      logger.debug('Brand',JSON.stringify(brand, null, 2));
      logger.debug('Brand stringify',brand.toJSON());

      const brandManager = new BrandManager(params.LOG_LEVEL);
      savedBrand = await brandManager.saveBrand(brand);

    }catch(error: unknown){
      logger.error('Error saving brand', error as any);
      return errorResponse(500, 'Error saving brand', logger);
    }

    // We dont want to block the brand registration if the event fails to send.
    try {
      logger.debug('new-brand-registration starting event processing');
      logger.debug('new-brand-registration params keys', Object.keys(params));
      
      // Get runtime info from action params (from .env/config for this action)
      const applicationRuntimeInfoLocal = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
      
      // Get runtime info from event data (from the brand's API call)
      const applicationRuntimeInfoEvent = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(params);
      
      if (!applicationRuntimeInfoLocal) {
        throw new Error('Missing APPLICATION_RUNTIME_INFO Local (from action config)');
      }
      if (!applicationRuntimeInfoEvent) {
        throw new Error('Missing app_runtime_info in event data (from brand API call)');
      }
      
      const eventManager = new EventManager(params);
      
      // Prepare event data - brand registration.received event
      const eventData = {
        name: savedBrand.name,
        endPointUrl: savedBrand.endPointUrl,
        brandId: savedBrand.brandId,
        agencyName: params.AGENCY_NAME // Include agency name for brand to store
      };
      
      // Process the registration.received event (no brand object yet, since we just created it)
      const result = await eventManager.processEvent(
        'com.adobe.a2b.registration.received',
        null,  // No brand yet for received event
        eventData
      );
      
      logger.info('Registration event processed', {
        ioPublished: result.ioEventPublished
      });

    } catch (error: unknown) {
      logger.error('Error processing event', error as any);
      return errorResponse(500, 'Error handling event', logger);
    }
    
    return {
      statusCode: 200,
      body: {
        message: `Brand registration processed successfully for brand id ${savedBrand.brandId}`,
        ...savedBrand.toSafeJSON() // Include brand data WITHOUT secret (follows security rule)
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error processing new client registration',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
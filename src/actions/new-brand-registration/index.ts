/**
 * new client registration
 *
 * todo:// add in a custom event and throw it when the brand trys to register
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BRAND_STATE_PREFIX } from "../constants";
import { BrandManager } from "../classes/BrandManager";
import * as randomstring from 'randomstring';
import { v4 as uuidv4 } from 'uuid';
import { NewBrandRegistrationEvent } from "../classes/io_events/NewBrandRegistrationEvent";
import { EventManager } from "../classes/EventManager";
import { IS2SAuthenticationCredentials } from "../types";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("new-brand-registration", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams : string[] = ['name', 'endPointUrl']
    const requiredHeaders : string[] = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    params.brandId = uuidv4();
    params.secret = randomstring.generate(32);
    params.enabled = true;
    params.createdAt = new Date();
    params.updatedAt = new Date();
    params.enabledAt = new Date();

    let savedBrand: Brand;
    try{
      const brand = Brand.fromJSON(params);
      logger.debug('Brand',JSON.stringify(brand, null, 2));
      logger.debug('Brand stringify',brand.toJSON());

      const brandManager = new BrandManager(params.LOG_LEVEL);
      savedBrand = await brandManager.saveBrand(brand);

    }catch(error){
      logger.error('Error saving brand', error);
      return errorResponse(500, 'Error saving brand', logger);
    }

    // We dont want to block the brand registration if the event fails to send.
    //TODO: We should make a manager or util to make this all much simpler
    try {
      logger.debug('new-brand-registration starting cloud event construction');
      logger.debug('new-brand-registration params keys', Object.keys(params));
      const currentS2sAuthenticationCredentials = EventManager.getS2sAuthenticationCredentials(params);
      const registrationProviderId = EventManager.getRegistrationProviderId(params);
      const applicationRuntimeInfo = EventManager.getApplicationRuntimeInfo(params);
      const eventManager = new EventManager(params.LOG_LEVEL, currentS2sAuthenticationCredentials, applicationRuntimeInfo);

      // publish the event
      await eventManager.publishEvent(new NewBrandRegistrationEvent(savedBrand,registrationProviderId));

    } catch (error) {
      logger.error('Error sending event', error);
      return errorResponse(500, 'Error handling event', logger);
    }
    
    return {
      statusCode: 200,
      body: {
        message: `Brand registration processed successfully for brand id ${savedBrand.brandId}`,
        data: savedBrand
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
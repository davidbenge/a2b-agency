/**
 * new client registration
 *
 * todo:// add in a custom event and throw it when the brand trys to register
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../Brand";
import { BRAND_STATE_PREFIX } from "../constants";
import { BrandManager } from "../BrandManager";
import * as randomstring from 'randomstring';
import { v4 as uuidv4 } from 'uuid';

export async function main(params: any): Promise<any> {
  const logger = aioLogger("new-brand-registration", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = ['name', 'endPointUrl']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    params.bid = uuidv4();
    params.secret = randomstring.generate(32);
    params.enabled = false;
    params.createdAt = new Date();
    params.updatedAt = new Date();
    params.enabledAt = null;

    const brand = Brand.fromJSON(params);
    logger.debug('Brand',JSON.stringify(brand, null, 2));
    logger.debug('Brand stringify',brand.toJSON());

    const brandManager = new BrandManager(params.LOG_LEVEL);
    const savedBrand = await brandManager.saveBrand(brand);

    // We dont want to block the brand registration if the event fails to send.
    try {
      const { CloudEvent } = require('cloudevents')
      // Create cloud event for the given payload
      const eventCode = 'com.adobe.a2b.registration.received';
      const cloudEvent = new CloudEvent(params.AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID, eventCode, savedBrand.toJSON());
      
      const eventSdk = require('@adobe/aio-lib-events');
      const eventClient = await eventSdk.init(params.ORG_ID, params.SERVICE_API_KEY)
      //const eventClient = await eventSdk.init(params.ORG_ID, params.SERVICE_API_KEY, '<valid auth token>', '<options>')
      // not sure why it wants a valid auth token, but it does. We may have to build one and cache it in the state store.
      // We should be able to build one off the service account if needed 
      const eventSendResult = await eventClient.publishEvent(cloudEvent)
      logger.debug('Event sent', eventSendResult);
    } catch (error) {
      logger.error('Error sending event', error);
    }

    return {
      statusCode: 200,
      body: {
        message: `Brand registration processed successfully for brand id ${brand.bid}`,
        brand: savedBrand
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
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
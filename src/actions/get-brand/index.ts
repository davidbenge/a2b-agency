/**
 * Get a single brand by ID
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("get-brand", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = ['bid']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const brandManager = new BrandManager(params.LOG_LEVEL);
    const brand = await brandManager.getBrand(params.bid);
    logger.debug('Brand', JSON.stringify(brand, null, 2));

    return {
      statusCode: 200,
      body: {
        "message": `Brand ${params.bid} fetched successfully`,
        "data": brand
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error getting brand',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 
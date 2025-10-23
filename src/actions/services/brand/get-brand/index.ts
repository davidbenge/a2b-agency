/**
 * Get a single brand by ID
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../../../classes/Brand";
import { BrandManager } from "../../../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("get-brand", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams: string[] = ['brandId']
    const requiredHeaders: string[] = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const brandManager = new BrandManager(params.LOG_LEVEL);
    const brand = await brandManager.getBrand(params.brandId);
    
    if (!brand) {
      return errorResponse(404, `Brand ${params.brandId} not found`, logger);
    }
    
    logger.debug('Brand', JSON.stringify(brand, null, 2));

    // Return brand without secret for security
    return {
      statusCode: 200,
      body: {
        "message": `Brand ${params.brandId} fetched successfully`,
        "data": brand.toSafeJSON()
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
/**
 * Get all brands
 * todo:// lock down the api to only allow access with adobe auth
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("get-brands", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams: string[] = []
    const requiredHeaders: string[] = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const brandManager = new BrandManager(params.LOG_LEVEL);
    const brands = await brandManager.getAllBrands();
    logger.debug('Brands',JSON.stringify(brands, null, 2));

    // Return brands without secrets for security
    return {
      statusCode: 200,
      body: {
        "message": `${brands.length} brands fetched successfully`,
        "data": brands.map(brand => brand.toSafeJSON())
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error getting brands',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
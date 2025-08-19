/**
 * Update an existing brand
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("update-brand", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams : string[] = ['brandId']
    const requiredHeaders : string[] = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const brandManager = new BrandManager(params.LOG_LEVEL);
    
    // Get the existing brand
    const existingBrand = await brandManager.getBrand(params.brandId);
    
    // Update the brand with new data
    if(!existingBrand){
      return errorResponse(404, `Brand ${params.brandId} not found`, logger);
    }

    const updatedBrand = new Brand({
      ...existingBrand.toJSON(),
      ...params,
      brandId: params.brandId, // Ensure brandId doesn't change
      updatedAt: new Date()
    });

    // Save the updated brand
    const savedBrand = await brandManager.saveBrand(updatedBrand);
    logger.debug('Updated Brand', JSON.stringify(savedBrand, null, 2));

    return {
      statusCode: 200,
      body: {
        "message": `Brand ${params.brandId} updated successfully`,
        "data": savedBrand
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error updating brand',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 
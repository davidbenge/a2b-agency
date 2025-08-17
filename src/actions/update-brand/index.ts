/**
 * Update an existing brand
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("update-brand", { level: params.LOG_LEVEL || "info" });

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
    
    // Get the existing brand
    const existingBrand = await brandManager.getBrand(params.bid);
    
    // Update the brand with new data
    const updatedBrand = new Brand({
      ...existingBrand.toJSON(),
      ...params,
      bid: params.bid, // Ensure bid doesn't change
      updatedAt: new Date()
    });

    // Save the updated brand
    const savedBrand = await brandManager.saveBrand(updatedBrand);
    logger.debug('Updated Brand', JSON.stringify(savedBrand, null, 2));

    return {
      statusCode: 200,
      body: {
        "message": `Brand ${params.bid} updated successfully`,
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
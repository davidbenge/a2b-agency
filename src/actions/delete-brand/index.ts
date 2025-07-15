/**
 * Delete a brand by ID
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("delete-brand", { level: params.LOG_LEVEL || "info" });

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
    await brandManager.deleteBrand(params.bid);
    logger.debug(`Brand ${params.bid} deleted successfully`);

    return {
      statusCode: 200,
      body: {
        "message": `Brand ${params.bid} deleted successfully`,
        "data": true
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error deleting brand',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 
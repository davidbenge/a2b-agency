/**
 * Delete a brand by ID
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("delete-brand", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams : string[] = ['brandId']
    const requiredHeaders : string[] = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    try {
      const brandManager = new BrandManager(params.LOG_LEVEL);
      await brandManager.deleteBrand(params.brandId);
    } catch (error: unknown) {
      logger.error('Error deleting brand', error as any);
      return errorResponse(500, `Error deleting brand ${params.brandId}`, logger);
    }

    return {
      statusCode: 200,
      body: {
        "message": `${params.brandId} deleted successfully`,
        "data":{}
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

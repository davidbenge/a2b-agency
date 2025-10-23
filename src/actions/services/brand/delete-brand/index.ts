/**
 * Delete a brand by ID
 * Sends a registration.disabled event to the brand before deletion
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { BrandManager } from "../../../classes/BrandManager";
import { EventManager } from "../../../classes/EventManager";

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
      
      // Get the brand before deleting so we can send event
      const brand = await brandManager.getBrand(params.brandId);
      
      if (!brand) {
        return errorResponse(404, `Brand ${params.brandId} not found`, logger);
      }

      // Send registration.disabled event before deletion
      logger.info(`Sending registration.disabled event before deleting brand ${params.brandId}`);
      
      try {
        const eventManager = new EventManager(params);
        
        // Prepare event data
        const eventData = {
          brandId: brand.brandId,
          enabled: false,
          endPointUrl: brand.endPointUrl
        };
        
        // Process event - special handling allows sending even if brand is disabled
        const result = await eventManager.processEvent(
          'com.adobe.a2b.registration.disabled',
          brand,
          eventData
        );
        
        logger.info('Successfully sent registration.disabled event before deletion', { 
          brandId: brand.brandId,
          brandSent: !!result.brandSendResult,
          ioPublished: result.ioEventPublished
        });
      } catch (eventError: unknown) {
        const err = eventError as Error;
        logger.error('Failed to send registration.disabled event before deletion', { 
          error: err.message, 
          stack: err.stack 
        });
        // Don't fail the deletion if event sending fails - log and continue
      }

      // Now delete the brand
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

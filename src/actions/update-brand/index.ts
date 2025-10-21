/**
 * Update an existing brand
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BrandManager } from "../classes/BrandManager";
import { EventManager } from "../classes/EventManager";

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

    // Check if we're enabling or disabling the brand
    const wasEnabled = existingBrand.enabled;
    const willBeEnabled = params.enabled !== undefined ? params.enabled : wasEnabled;
    const isEnablingBrand = !wasEnabled && willBeEnabled;
    const isDisablingBrand = wasEnabled && !willBeEnabled;

    // Ensure secret exists if enabling
    let secret = existingBrand.secret;
    if (isEnablingBrand && !secret) {
      logger.info('Generating secret for brand enablement');
      secret = BrandManager.createBrand({ brandId: params.brandId }).secret;
    }

    const now = new Date();
    
    // Create update data, excluding secret from params for security
    // Secret can only be generated internally, never passed from client
    const { secret: _ignoredSecret, ...safeParams } = params;
    
    const updatedBrand = BrandManager.createBrand({
      ...existingBrand.toJSON(),
      ...safeParams,
      brandId: params.brandId, // Ensure brandId doesn't change
      secret: secret, // Use existing or newly generated secret (never from params)
      updatedAt: now,
      enabledAt: isEnablingBrand ? now : (isDisablingBrand ? null : existingBrand.enabledAt)
    });

    // Save the updated brand
    const savedBrand = await brandManager.saveBrand(updatedBrand);
    logger.debug('Updated Brand', JSON.stringify(savedBrand, null, 2));

    // Send registration.enabled event if brand was just enabled
    if (isEnablingBrand) {
      logger.info(`Brand ${params.brandId} was enabled, sending registration.enabled event`);
      
      try {
        const eventManager = new EventManager(params);
        
        // Prepare event data
        const eventData = {
          brandId: savedBrand.brandId,
          secret: savedBrand.secret,
          enabled: true,
          name: savedBrand.name,
          endPointUrl: savedBrand.endPointUrl,
          enabledAt: savedBrand.enabledAt || now
        };
        
        // Process event - handles validation, injection, brand send, and IO Events publish
        const result = await eventManager.processEvent(
          'com.adobe.a2b.registration.enabled',
          savedBrand,
          eventData
        );
        
        logger.info('Successfully sent registration.enabled event to brand', { 
          brandId: savedBrand.brandId,
          brandSent: !!result.brandSendResult,
          ioPublished: result.ioEventPublished
        });
      } catch (eventError: unknown) {
        const err = eventError as Error;
        logger.error('Failed to send registration.enabled event to brand', { 
          error: err.message, 
          stack: err.stack 
        });
        // Don't fail the whole operation, just log the error
      }
    }

    // Send registration.disabled event if brand was just disabled
    if (isDisablingBrand) {
      logger.info(`Brand ${params.brandId} was disabled, sending registration.disabled event`);
      
      try {
        const eventManager = new EventManager(params);
        
        // Prepare event data
        const eventData = {
          brandId: savedBrand.brandId,
          enabled: false,
          endPointUrl: savedBrand.endPointUrl
        };
        
        // Process event - special handling allows sending even when disabled
        const result = await eventManager.processEvent(
          'com.adobe.a2b.registration.disabled',
          savedBrand,
          eventData
        );
        
        logger.info('Successfully sent registration.disabled event to brand', { 
          brandId: savedBrand.brandId,
          brandSent: !!result.brandSendResult,
          ioPublished: result.ioEventPublished
        });
      } catch (eventError: unknown) {
        const err = eventError as Error;
        logger.error('Failed to send registration.disabled event to brand', { 
          error: err.message, 
          stack: err.stack 
        });
        // Don't fail the whole operation, just log the error
      }
    }

    // Return brand without secret for security
    return {
      statusCode: 200,
      body: {
        "message": `Brand ${params.brandId} updated successfully`,
        "data": savedBrand.toSafeJSON(),
        "eventSent": isEnablingBrand ? 'registration.enabled' : (isDisablingBrand ? 'registration.disabled' : 'none')
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
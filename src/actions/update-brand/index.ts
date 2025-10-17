/**
 * Update an existing brand
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "../classes/Brand";
import { BrandManager } from "../classes/BrandManager";
import { RegistrationEnabledEvent } from "../classes/a2b_events/RegistrationEnabledEvent";
import { RegistrationDisabledEvent } from "../classes/a2b_events/RegistrationDisabledEvent";
import { getApplicationRuntimeInfo } from "../utils/applicationRuntimeInfo";

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
        const event = new RegistrationEnabledEvent(
          savedBrand.brandId,
          savedBrand.secret,
          savedBrand.name,
          savedBrand.endPointUrl,
          savedBrand.enabledAt || now
        );

        // Set the source from application runtime info
        const appRuntimeInfo = getApplicationRuntimeInfo(params);
        if (appRuntimeInfo) {
          event.setSourceUri(appRuntimeInfo);
          event.data.app_runtime_info = appRuntimeInfo;
        } else {
          logger.warn('Could not extract application runtime info for event source');
        }

        // savedBrand is already enabled (we just saved it with enabled: true)
        // so we can send the event directly
        const response = await savedBrand.sendCloudEventToEndpoint(event);
        logger.info('Successfully sent registration.enabled event to brand', { 
          brandId: savedBrand.brandId, 
          response 
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
        const event = new RegistrationDisabledEvent(
          savedBrand.brandId,
          savedBrand.name,
          savedBrand.endPointUrl
        );

        // Set the source from application runtime info
        const appRuntimeInfo = getApplicationRuntimeInfo(params);
        if (appRuntimeInfo) {
          event.setSourceUri(appRuntimeInfo);
          event.data.app_runtime_info = appRuntimeInfo;
        } else {
          logger.warn('Could not extract application runtime info for event source');
        }

        // For disabled event, we can send it before marking as disabled
        const response = await existingBrand.sendCloudEventToEndpoint(event);
        logger.info('Successfully sent registration.disabled event to brand', { 
          brandId: savedBrand.brandId, 
          response 
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
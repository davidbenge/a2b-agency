/**
 * brand-event-handler
 *
 * This action handles all incoming events from brands and routes them to appropriate
 * internal OpenWhisk event handlers based on the event type.
 * 
 * Required event structure:
 * - type: string (event type)
 * - data.app_runtime_info: object (runtime information for the target action)
 */

import aioLogger from "@adobe/aio-lib-core-logging";
import { checkMissingRequestInputs, errorResponse, stripOpenWhiskParams } from '../../utils/common';
import { BrandManager } from '../../classes/BrandManager';
import { getEventDefinition } from "../../classes/AppEventRegistry";
import { sanitizeEventForLogging } from '../../utils/eventSanitizer';

export async function main(params: any): Promise<any> {
  const ACTION_NAME = 'agency:brand-event-handler';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  // Log sanitized incoming event
  logger.info(`${ACTION_NAME}: Received event`, sanitizeEventForLogging(params));

  // handle IO webhook challenge
  if(params.challenge){
    const response = {
      statusCode: 200,
      body: {challenge: params.challenge}
    }
    return response
  }
  
  // Check for required params
  const requiredParams: string[] = ['type', 'data']
  const requiredHeaders: string[] = []
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
  if (errorMessage) {
    // return and log client errors
    return errorResponse(400, errorMessage, logger)
  }

  // Check for required data structure
  if (!params.data || !params.data.app_runtime_info) {
    logger.error(`${ACTION_NAME}: Missing required data.app_runtime_info in event`);
    return errorResponse(400, 'Missing required data.app_runtime_info in event', logger);
  }

  // Extract brand ID from app_runtime_info (brand's consoleId identifies the brand)
  const brandId = params.data.app_runtime_info?.consoleId;
  if (!brandId) {
    logger.error(`${ACTION_NAME}: Missing consoleId in app_runtime_info`);
    return errorResponse(400, 'Missing consoleId in app_runtime_info', logger);
  }

  // Validate secret header for all events EXCEPT registration events
  // Registration events (b2a.registration.*) don't require secret validation
  // because the brand doesn't have the secret yet during registration
  const isRegistrationEvent = params.type?.startsWith('com.adobe.b2a.registration.');
  
  let brand;
  if (!isRegistrationEvent) {
    const headers = params.__ow_headers || {};
    const agencySecret = headers['x-a2b-agency-secret'];
    
    if (!agencySecret) {
      logger.error(`${ACTION_NAME}: Missing X-A2B-Agency-Secret header for event type ${params.type}`);
      return {
        statusCode: 401,
        body: 'Missing X-A2B-Agency-Secret header'
      };
    }

    // Validate the secret against the stored brand
    try {
      const brandManager = new BrandManager(params.LOG_LEVEL || 'info');
      brand = await brandManager.getBrand(brandId);
      
      if (!brand) {
        logger.error(`${ACTION_NAME}: Brand not found: ${brandId}`);
        return {
          statusCode: 401,
          body: 'Brand not found or not registered'
        };
      }

      if (!brand.validateSecret(agencySecret)) {
        logger.error(`${ACTION_NAME}: Invalid agency secret for brand: ${brandId}`);
        return {
          statusCode: 401,
          body: 'Invalid agency secret'
        };
      }

      logger.info(`${ACTION_NAME}: Secret validated successfully for brand: ${brandId}`);
    } catch (error: unknown) {
      logger.error(`${ACTION_NAME}: Error validating brand secret`, error as any);
      return {
        statusCode: 500,
        body: 'Error validating brand credentials'
      };
    }
  } else {
    logger.info(`${ACTION_NAME}: Skipping secret validation for registration event: ${params.type}`);
  }

  try {
    logger.info(`${ACTION_NAME}: Brand Event Handler called with type: ${params.type} from brand: ${brandId}`);

    // Route events based on type
    const eventDefinition = getEventDefinition(params.type);    
    if (!eventDefinition || !eventDefinition.handlerActionName) {
      logger.warn(`${ACTION_NAME}: Event definition not found for type: ${params.type}`);
      return {
        statusCode: 400,
        body: {
          message: `Event definition not found for type: ${params.type}`,
          error: 'Event type not supported'
        }
      }
    }
    logger.info(`${ACTION_NAME}: Routing ${params.type} to ${eventDefinition.handlerActionName}`);
    return await routeToInternalHandler(eventDefinition.handlerActionName, params, logger);

  } catch (error: unknown) {
    logger.error(`${ACTION_NAME}: Error processing event`, error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing brand event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Route the event to an internal OpenWhisk action
 * @param actionName - The name of the internal action to invoke
 * @param eventData - The event data to pass to the internal action
 * @param logger - Logger instance
 * @returns Promise<any> - Response from the internal action
 */
async function routeToInternalHandler(actionName: string, eventData: any, logger: any): Promise<any> {
  try {
    logger.debug(`${actionName}: Invoking internal action with data`, eventData);
    
    // Import the OpenWhisk client
    const openwhisk = require('openwhisk');
    
    // Initialize the OpenWhisk client
    const ow = openwhisk();

    // Prepare the parameters for the internal action
    const actionParams = stripOpenWhiskParams(eventData);

    logger.debug(`${actionName}: Action parameters`, actionParams);

    // Invoke the internal action
    const result = await ow.actions.invoke({
      name: actionName,
      params: actionParams,
      blocking: true,
      result: true
    });

    logger.info(`${actionName}: Internal action completed successfully`);
    
    return {
      statusCode: 200,
      body: {
        message: `Event ${eventData.type} processed successfully by ${actionName}`,
        data: result
      }
    };

  } catch (error: unknown) {
    logger.error(`${actionName}: Error invoking internal action`, error as any);
    throw new Error(`Failed to invoke internal action ${actionName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}


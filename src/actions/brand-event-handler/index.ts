/**
 * brand-event-handler
 *
 * This action handles all incoming events from the agency and routes them to appropriate
 * internal OpenWhisk event handlers based on the event type.
 * 
 * Required event structure:
 * - type: string (event type)
 * - data.app_runtime_info: object (runtime information for the target action)
 */

import * as aioLogger from "@adobe/aio-lib-core-logging";
import { checkMissingRequestInputs, errorResponse, stripOpenWhiskParams } from '../utils/common';

export async function main(params: any): Promise<any> {
  const ACTION_NAME = 'agency:brand-event-handler';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  // handle IO webhook challenge
  if(params.challenge){
    const response = {
      statusCode: 200,
      body: {challenge: params.challenge}
    }
    return response
  }
  
  // Check for required params
  const requiredParams = ['type', 'data']
  const requiredHeaders = []
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

  try {
    logger.info(`${ACTION_NAME}: Brand Event Handler called with type: ${params.type}`);

    // Route events based on type
    switch(params.type) {
      case "com.adobe.b2a.assetsync.new":
      case "com.adobe.b2a.assetsync.updated":
      case "com.adobe.b2a.assetsync.deleted":
        logger.info(`${ACTION_NAME}: Routing ${params.type} to agency-assetsync-internal-handler`);
        return await routeToInternalHandler('agency-assetsync-internal-handler', params, logger);
      
      default:
        logger.warn(`${ACTION_NAME}: Unhandled event type: ${params.type}`);
        return {
          statusCode: 400,
          body: {
            message: `Unhandled event type: ${params.type}`,
            error: 'Event type not supported'
          }
        }
    }

  } catch (error) {
    logger.error(`${ACTION_NAME}: Error processing event`, error);
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
    const ow = openwhisk({
      apihost: eventData.AIO_runtime_apihost || 'https://adobeioruntime.net',
      api_key: eventData.AIO_runtime_auth,
      namespace: eventData.AIO_runtime_namespace
    });

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

  } catch (error) {
    logger.error(`${actionName}: Error invoking internal action`, error);
    throw new Error(`Failed to invoke internal action ${actionName}: ${error.message}`);
  }
} 
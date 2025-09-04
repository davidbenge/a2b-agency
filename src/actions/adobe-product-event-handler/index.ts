/**
 * Adobe Product Event Handler
 *
 * This action handles events from Adobe products (AEM, Creative Cloud, etc.)
 * and routes them to the appropriate internal event handlers based on event type.
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any, openwhiskClient?: any): Promise<any> {
  const logger = aioLogger("adobe-product-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    const requiredParams: string[] = [];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // handle IO webhook challenge
    if(params.challenge){
      const response = {
        statusCode: 200,
        body: {challenge: params.challenge}
      }
      return response
    }

    // Process the Adobe product event
    logger.info("Processing Adobe product event", params);

    if(!params.type) {
      logger.warn("No event type provided, cannot route event");
      return {
        statusCode: 400,
        body: {
          message: 'No event type provided',
          error: 'Event type is required for routing'
        }
      }
    }

    logger.info(`Event type: ${params.type}`);
    
    // Route events to appropriate internal handlers based on event type
    let routingResult;
    switch(params.type) {
      //case 'aem.assets.asset.created':
      //case 'aem.assets.asset.updated':
      //case 'aem.assets.asset.deleted':
      case 'aem.assets.asset.metadata_updated':
        logger.info(`Routing AEM metadata update event to agency-assetsync-internal-handler-metadata-updated: ${params.type}`);
        routingResult = await routeToMetadataUpdateHandler(params, logger, openwhiskClient);
        break;
      case 'aem.assets.asset.processing_completed':
        logger.info(`Routing AEM processing completed event to agency-assetsync-internal-handler-process-complete: ${params.type}`);
        routingResult = await routeToProcessCompleteHandler(params, logger, openwhiskClient);
        break;
      
      default:
        logger.warn(`Unhandled event type: ${params.type}`);
        return {
          statusCode: 200,
          body: {
            message: `Adobe product event processed - unhandled type`,
            eventType: params.type,
            note: 'Event type not configured for routing'
          }
        }
    }

    return {
      statusCode: 200,
      body: {
        message: `Adobe product event processed successfully`,
        eventType: params.type,
        routingResult: routingResult
      }
    }
  } catch (error: unknown) {
    logger.error('Error processing Adobe product event', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing Adobe product event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Route AEM processing completed events to the agency-assetsync-internal-handler-process-complete
 */
async function routeToProcessCompleteHandler(params: any, logger: any, openwhiskClient?: any): Promise<any> {
  try {
    // Initialize OpenWhisk client
    const ow = openwhiskClient || require("openwhisk")();

    logger.debug('routeToProcessCompleteHandler incoming params', JSON.stringify(params, null, 2));
    
    // Prepare the parameters for the asset sync handler
    //const assetSyncParams = stripOpenWhiskParams(params);

    logger.debug('Invoking agency-assetsync-internal-handler-process-complete with params:', JSON.stringify(params, null, 2));

    // Invoke the agency-assetsync-internal-handler-process-complete action
    // we pass in the params as a single object so that the internal handler can access the params and we label it routerParams so on the internal handler we can access the params as routerParams.routerParams
    // if we see params.routerParams we know that the params are coming from the adobe-product-event-handler and we can merge down. this way the internal handler can access the params and we can access the params as routerParams.routerParams
    // can stand as standalone or as part of a larger orchestration
    const result = await ow.actions.invoke({
      name: 'a2b-agency/agency-assetsync-internal-handler-process-complete',
      params: {
        routerParams: params
      },
      blocking: true,
      result: true
    });

    logger.info('agency-assetsync-internal-handler-process-complete invocation successful:', result);
    return {
      success: true,
      handler: 'adobe-product-event-handler agency-assetsync-internal-handler-process-complete',
      result: result
    };

  } catch (error: unknown) {
    logger.error('Error invoking agency-assetsync-internal-handler-process-complete:', error as any);
    return {
      success: false,
      handler: 'adobe-product-event-handler agency-assetsync-internal-handler-process-complete',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Route AEM metadata updated events to the agency-assetsync-internal-handler-metadata-updated
 */
async function routeToMetadataUpdateHandler(params: any, logger: any, openwhiskClient?: any): Promise<any> {
  try {
    // Initialize OpenWhisk client
    const ow = openwhiskClient || require("openwhisk")();

    logger.debug('routeToMetadataUpdateHandler incoming params', JSON.stringify(params, null, 2));
    
    // Prepare the parameters for the asset sync handler
    //const assetSyncParams = stripOpenWhiskParams(params);

    logger.debug('Invoking agency-assetsync-internal-handler-metadata-updated with params:', JSON.stringify(params, null, 2));

    // Invoke the agency-assetsync-internal-handler-metadata-updated action
    // we pass in the params as a single object so that the internal handler can access the params and we label it routerParams so on the internal handler we can access the params as routerParams.routerParams
    // if we see params.routerParams we know that the params are coming from the adobe-product-event-handler and we can merge down. this way the internal handler can access the params and we can access the params as routerParams.routerParams
    // can stand as standalone or as part of a larger orchestration
    const result = await ow.actions.invoke({
      name: 'a2b-agency/agency-assetsync-internal-handler-metadata-updated',
      params: {
        routerParams: params
      },
      blocking: true,
      result: true
    });

    logger.info('agency-assetsync-internal-handler-metadata-updated invocation successful:', result);
    return {
      success: true,
      handler: 'adobe-product-event-handler agency-assetsync-internal-handler-metadata-updated',
      result: result
    };

  } catch (error: unknown) {
    logger.error('Error invoking agency-assetsync-internal-handler-metadata-updated:', error as any);
    return {
      success: false,
      handler: 'adobe-product-event-handler agency-assetsync-internal-handler-metadata-updated',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * TODO: Add more routing functions for other Adobe product event types
 * 
 * Example:
 * async function routeToCreativeCloudHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for Creative Cloud events
 * }
 * 
 * async function routeToDocumentCloudHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for Document Cloud events
 * }
 */ 
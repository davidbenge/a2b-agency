/**
 * agency-assetsync-internal-handler-process-complete
 *
 * This handler specifically processes aem.assets.asset.processing_completed events.
 * It determines if the asset needs to be synced and sends appropriate events to brands.
 * 
 */

import aioLogger from "@adobe/aio-lib-core-logging";
import { checkMissingRequestInputs, errorResponse, mergeRouterParams } from '../../../utils/common';
import { EventManager } from '../../../classes/EventManager';
import { getAemAssetData, getAemAuth } from '../../../utils/aemCscUtils';
import { BrandManager } from "../../../classes/BrandManager";
import { normalizeCustomersToArray } from "../../../utils/normalizers";
import { sanitizeEventForLogging } from '../../../utils/eventSanitizer';


export async function main(params: any): Promise<any> {
  const ACTION_NAME = 'agency:agency-assetsync-internal-handler-process-complete';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  // Log sanitized incoming event (before merging router params)
  logger.info(`${ACTION_NAME}: Received event`, sanitizeEventForLogging(params));

  logger.debug(`${ACTION_NAME} incoming params`, JSON.stringify(params, null, 2));
  // Normalize the params using shared helper
  params = mergeRouterParams(params);
  logger.debug(`${ACTION_NAME} incoming params post merge`, JSON.stringify(params, null, 2));
  
  // Create EventManager with lazy initialization built-in
  // All credentials, runtime info, and provider IDs are lazily loaded internally
  // Only initialized when actually needed (e.g., when publishEvent is called)
  const eventManager = new EventManager(params);

  // Check for required params
  const requiredParams: string[] = []
  const requiredHeaders: string[] = [] // TODO: Add security required headers
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
  if (errorMessage) {
    // return and log client errors
    return errorResponse(400, errorMessage, logger)
  }

  // Any errors during lazy initialization will be caught at call sites below
  
  try {
    logger.info(`${ACTION_NAME}:Asset ${params.type} Event Handler called`);

    // Validate that this handler only processes processing_completed events
    if (params.type !== 'aem.assets.asset.processing_completed') {
      throw new Error(`This handler only processes aem.assets.asset.processing_completed events, received: ${params.type}`);
    }

    logger.info(`${ACTION_NAME}:${params.type} event being handled`, params);

    /*  Import and use the AemCscUtils class
    * @param {string} aemHost aem host
    * @param {string} aemAssetPath aem asset path
    * @param {object} params action input parameters.
    * @param {object} logger logger object
    */
    const aemHostFqdn = params.data.repositoryMetadata["repo:repositoryId"];
    const aemHostHostOnly = aemHostFqdn.replace(/\.adobeaemcloud\.com$/i, '');
    const aemHostUrl = `https://${aemHostFqdn}`;
    const aemAssetPath = params.data.repositoryMetadata["repo:path"];
    // todo: should make this more in alignment and pass in a AEM Auth object we build off the params like we do with the s2s auth
    const aemAssetData = await getAemAssetData(aemHostUrl, aemAssetPath, params, logger);
    logger.info(`${ACTION_NAME}: aemAssetData from aemCscUtils getAemAssetData`, aemAssetData);
    logger.info(`${ACTION_NAME}: aemAssetData from aemCscUtils getAemAssetData TYPE`, (typeof aemAssetData));

    // does the asset have a the metadata for the brand?
    // a2b__sync_on_change
    // a2d__customers
    if (aemAssetData["jcr:content"] && aemAssetData["jcr:content"].metadata) {
      const metadata = aemAssetData["jcr:content"].metadata;
      logger.info(`${ACTION_NAME}: metadata`, metadata);

      if (metadata["a2b__sync_on_change"] && (metadata["a2b__sync_on_change"] === true || metadata["a2b__sync_on_change"] === "true") && metadata["a2b__customers"]) {
        // loop over brands and send an event for each brand
        const customers = metadata["a2b__customers"];
        const sourceProviderId = eventManager.getAssetSyncProviderId();
        const presignedUrl = await fetchPresignedReadUrl(aemHostHostOnly, aemAssetPath, params, logger, ACTION_NAME);
        const brandManager = new BrandManager(params.LOG_LEVEL);

        // Normalize customers to string[] using reusable utility
        let customersArray: string[] = [];
        try {
          customersArray = normalizeCustomersToArray(customers);
        } catch (e) {
          logger.warn("AssetSyncEventHandler customers is not in expected format", customers);
          return {
            statusCode: 400,
            body: {
              message: 'Invalid customers format',
            }
          };
        }

        // loop over customers and send an event for each customer subscribed to the asset
        for (const customer of customersArray) {
          // set the brand id
          logger.info(`brand id ${customer} in customersArray`);
          const brandId = customer;

          // has the asset been synced before?
          if (aemAssetData["jcr:content"].metadata["a2b__last_sync"]) {
            // update event
            logger.info(`${ACTION_NAME}: Processing asset sync update event`);
            
            // Get the brand 
            const brand = await brandManager.getBrand(brandId);
            
            if(brand && brand.enabled){
              try{
                // Prepare event data
                const eventData = {
                  asset_id: aemAssetData["jcr:uuid"],
                  asset_path: aemAssetPath,
                  metadata: metadata,
                  brandId: brandId,
                  asset_presigned_url: presignedUrl
                };
                
                // Process event - handles validation, injection, brand send, and IO Events publish
                logger.info(`${ACTION_NAME}: sending update event to brand url <${brand.endPointUrl}>`);
                const result = await eventManager.processEvent(
                  'com.adobe.a2b.assetsync.update',
                  brand,
                  eventData
                );
                
                logger.info(`${ACTION_NAME}: Asset sync update complete`, {
                  brandSent: !!result.brandSendResult,
                  ioPublished: result.ioEventPublished
                });
              }catch(error: unknown){
                logger.error(`${ACTION_NAME}: error processing update event`, error as string);
                //don't fail the action if the brand endpoint fails
              }
            } else {
              logger.info(`${ACTION_NAME}: brand not found or not enabled for brandId: ${brandId}`);
            }

          } else {
            // new event  
            logger.info(`${ACTION_NAME}: Processing asset sync new event`);
            
            //get the brand 
            const brand = await brandManager.getBrand(brandId);
            
            if(brand && brand.enabled){
              try{
                // Prepare event data
                const eventData = {
                  asset_id: aemAssetData["jcr:uuid"],
                  asset_path: aemAssetPath,
                  metadata: metadata,
                  brandId: brandId,
                  asset_presigned_url: presignedUrl
                };
                
                // Process event - handles validation, injection, brand send, and IO Events publish
                logger.info(`${ACTION_NAME}: sending new event to brand url <${brand.endPointUrl}>`);
                const result = await eventManager.processEvent(
                  'com.adobe.a2b.assetsync.new',
                  brand,
                  eventData
                );
                
                logger.info(`${ACTION_NAME}: Asset sync new complete`, {
                  brandSent: !!result.brandSendResult,
                  ioPublished: result.ioEventPublished
                });
              }catch(error: unknown){
                // Error objects stringify to {}, so extract meaningful fields and any embedded JSON details
                const safeError: any = (error instanceof Error)
                  ? { name: error.name, message: error.message, stack: error.stack }
                  : error;
                let embeddedDetails: any = undefined;
                if (safeError && typeof safeError.message === 'string') {
                  const msg: string = safeError.message;
                  const jsonStart = msg.indexOf('{');
                  if (jsonStart >= 0) {
                    try { embeddedDetails = JSON.parse(msg.slice(jsonStart)); } catch { /* ignore parse issues */ }
                  }
                }
                logger.error(
                  `${ACTION_NAME}: error processing new event to brand url <${brand.endPointUrl}>`,
                  { error: safeError, details: embeddedDetails }
                );
              }
            }else{
              logger.warn(`${ACTION_NAME}: brand is not enabled or does not exist`, brandId);
            }

            // update todo: the last sync date in AEM data
            //eventData.metadate["a2d__last_sync"] = new Date().toISOString();
          }

          // TODO: delete handle 
        }

      } else {
        logger.warn(`${ACTION_NAME}: asset metadata a2b__ properties not found`, aemAssetPath);
      }

    } else {
      logger.warn(`${ACTION_NAME}: asset metadata property not found`, aemAssetPath);
    }

    return {
      statusCode: 200,
      body: {
        message: 'Asset event processed successfully',
      }
    }
  } catch (error: unknown) {
    return {
      statusCode: 500,
      body: {
        message: 'Error processing IO event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Fetch a presigned read URL for an AEM asset using Adobe internal endpoint.
 * Kept local to this handler for reuse and testability.
 */
async function fetchPresignedReadUrl(
  aemHostHostOnly: string,
  aemAssetPath: string,
  params: any,
  logger: any,
  actionName: string
): Promise<string> {
  const presignedUrlEndpoint = params.ADOBE_INTERNAL_URL_ENDPOINT + "/aem-getPresignedReadUrl";
  const aemAuth = await getAemAuth(params, logger);
  const adobeInternalCallHeaders = {
    "Content-Type": "application/json",
    "x-api-key": params.AEM_AUTH_CLIENT_ID,
    "Authorization": `Bearer ${aemAuth}`,
  };
  const presignedCallBody = JSON.stringify({
    host: aemHostHostOnly,
    path: aemAssetPath
  });

  logger.debug(`${actionName}: presignedUrlEndpoint`, presignedUrlEndpoint);
  logger.debug(`${actionName}: presignedCallBody`, presignedCallBody);

  const response = await fetch(presignedUrlEndpoint, {
    method: 'POST',
    headers: adobeInternalCallHeaders,
    body: presignedCallBody,
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: any = await response.json();
  const presignedUrl = data.data.presignedUrl as string;
  logger.info(`${actionName}: Getting presigned URL from Adobe internal endpoint: ${presignedUrlEndpoint} got presigned url: ${presignedUrl}`);
  return presignedUrl;
}
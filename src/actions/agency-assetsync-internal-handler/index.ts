/**
 * agency-assetsync-internal-handler
 *
 * we use this to handle the asset events that are sent to the action and then we will
 * determine if the asset needs to be processed.  If it does we will then call the asset-sync-event-handler and others
 * 
 */

import * as aioLogger from "@adobe/aio-lib-core-logging";
import { checkMissingRequestInputs, errorResponse, mergeRouterParams } from '../utils/common';
import { createLazy } from '../utils/lazy';
import { EventManager } from '../classes/EventManager';
import { getAemAssetData, getAemAuth } from '../utils/aemCscUtils';
import { AssetSyncUpdateEvent } from '../classes/io_events/AssetSyncUpdateEvent';
import { AssetSyncNewEvent } from '../classes/io_events/AssetSyncNewEvent';

export async function main(params: any): Promise<any> {
  const ACTION_NAME = 'agency:agency-assetsync-internal-handler';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  logger.debug(`${ACTION_NAME} incoming params`, JSON.stringify(params, null, 2));
  // Normalize the params using shared helper
  params = mergeRouterParams(params);
  logger.debug(`${ACTION_NAME} incoming params post merge`, JSON.stringify(params, null, 2));
  
  // Lazily compute inputs independently so each is only created when needed
  const getS2sAuthenticationCredentials = createLazy(() => EventManager.getS2sAuthenticationCredentials(params));
  const getAssetSyncProviderId = createLazy(() => EventManager.getAssetSyncProviderId(params));
  const getApplicationRuntimeInfo = createLazy(() => EventManager.getApplicationRuntimeInfo(params));

  const getEventManager = createLazy(() => {
    const currentS2sAuthenticationCredentials = getS2sAuthenticationCredentials();
    const assetSyncProviderId = getAssetSyncProviderId();
    const applicationRuntimeInfo = getApplicationRuntimeInfo();
    return new EventManager(
      params.LOG_LEVEL,
      currentS2sAuthenticationCredentials,
      applicationRuntimeInfo
    );
  });

  // Check for required params
  const requiredParams = []
  const requiredHeaders = [] // TODO: Add security required headers
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
  if (errorMessage) {
    // return and log client errors
    return errorResponse(400, errorMessage, logger)
  }

  // Any errors during lazy initialization will be caught at call sites below
  
  try {
    logger.info(`${ACTION_NAME}:Asset Sync Event Handler called`);

    // todo:// look to see if we need to handle the event 
    if (params.type === 'aem.assets.asset.deleted') {
      logger.info(`${ACTION_NAME}:Asset deleted event`, params);

      // Publish the event to the Adobe Event Hub
      //await ioCustomEventManager.publishEvent(new AssetSyncDeleteEvent({}));
    } else if (params.type === 'aem.assets.asset.metadata_updated') {
      logger.info(`${ACTION_NAME}:Asset metadata updated event`, params);

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
          const sourceProviderId = getAssetSyncProviderId();
          const presignedUrlEndpoint = params.ADOBE_INTERNAL_URL_ENDPOINT + "/aem-getPresignedReadUrl";
          const aemAuth = await getAemAuth(params, logger);
          const adobeInternalCallHeaders = {
            "Content-Type": "application/json",
            "x-api-key": params.AEM_AUTH_CLIENT_ID,
            "Authorization": `Bearer ${aemAuth}`,
          }
          let presignedUrl = "";
          const presignedCallBody = JSON.stringify({
            "host": aemHostHostOnly,
            "path": aemAssetPath
          });

          logger.debug(`${ACTION_NAME}: presignedUrlEndpoint`, presignedUrlEndpoint);
          logger.debug(`${ACTION_NAME}: presignedCallBody`, presignedCallBody);

          // Get presigned URL for the asset using Adobe internal endpoint
          try {
            // need to pass in host and path to the asset
            const response = await fetch(presignedUrlEndpoint, {
              method: 'POST',
              headers: adobeInternalCallHeaders,
              body: presignedCallBody,
              redirect: "follow"
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            presignedUrl = data.data.presignedUrl;

            logger.info(`${ACTION_NAME}: Getting presigned URL from Adobe internal endpoint: ${presignedUrlEndpoint} got presigned url: ${presignedUrl}`);

          } catch (error) {
            logger.error(`${ACTION_NAME}: Error getting presigned URL:`, error);
            throw new Error(`${ACTION_NAME}: Error getting presigned URL: ${error}`);
          }
  
          // Handle customers as either an array, object, or string
          let customersArray: string[] = [];

          if (Array.isArray(customers)) {
            // If it's already an array, use it directly
            customersArray = customers.map(customer => String(customer));
          } else if (typeof customers === 'object' && customers !== null) {
            // If it's an object, extract values (assuming it's an object with customer IDs as keys or values)
            customersArray = Object.values(customers).map(customer => String(customer));
          } else if (typeof customers === 'string') {
            // If it's a string, split by comma
            customersArray = customers.split(",").map(customer => customer.trim());
          } else {
            logger.warn("AssetSyncEventHandler customers is not in expected format", customers);
            return {
              statusCode: 400,
              body: {
                message: 'Invalid customers format',
              }
            };
          }

          let eventData = {
            "asset_id": aemAssetData["jcr:uuid"],
            "asset_path": aemAssetPath,
            "metadata": metadata,
            "asset_presigned_url": presignedUrl
          };

          // loop over customers and send an event for each customer subscribed to the asset
          for (const customer of customersArray) {
            // set the brand id
            logger.info(`brand id ${customer} in customersArray`);
            const brandId = customer;

            eventData["brandId"] = brandId;

            // has the asset been synced before?
            if (aemAssetData["jcr:content"].metadata["a2b__last_sync"]) {
              // update event
              logger.info(`assetSyncEventUpdate`, eventData);
              //TODO: send out an update event

            } else {
              // new event  
              logger.info(`assetSyncEventNew`, eventData.asset_id, eventData.asset_path, eventData.metadata, eventData.asset_presigned_url, brandId);
              
              const assetSyncEventNew = new AssetSyncNewEvent(
                eventData.asset_id,
                eventData.asset_path,
                eventData.metadata,
                eventData.asset_presigned_url,
                brandId,
                sourceProviderId
              );
              await getEventManager().publishEvent(assetSyncEventNew);
              logger.info(`assetSyncEventNew complete`);

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
    } else {
      logger.info(`${ACTION_NAME}: event not handled`, params);
    }

    return {
      statusCode: 200,
      body: {
        message: 'Asset event processed successfully',
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error processing IO event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
/**
 * agency-assetsync-internal-handler
 *
 * we use this to handle the asset events that are sent to the action and then we will
 * determine if the asset needs to be processed.  If it does we will then call the asset-sync-event-handler and others
 * 
 */

import aioLogger from "@adobe/aio-lib-core-logging";
import { checkMissingRequestInputs, errorResponse, mergeRouterParams } from '../utils/common';
import { createLazy } from '../utils/lazy';
import { EventManager } from '../classes/EventManager';
import { getAemAssetData, getAemAuth } from '../utils/aemCscUtils';
import { AssetSyncUpdateEvent } from '../classes/io_events/AssetSyncUpdateEvent';
import { AssetSyncNewEvent } from '../classes/io_events/AssetSyncNewEvent';
import { BrandManager } from "../classes/BrandManager";
import { normalizeCustomersToArray } from "../utils/normalizers";


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
    if (!applicationRuntimeInfo) {
      throw new Error('Missing APPLICATION_RUNTIME_INFO');
    }
    return new EventManager(
      params.LOG_LEVEL,
      currentS2sAuthenticationCredentials,
      applicationRuntimeInfo
    );
  });

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
          const presignedUrl = await fetchPresignedReadUrl(aemHostHostOnly, aemAssetPath, params, logger, ACTION_NAME);
  
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
              logger.info(`assetSyncEventUpdate`);
              //TODO: send out an update event

            } else {
              // new event  
              const assetSyncEventNew = new AssetSyncNewEvent(
                aemAssetData["jcr:uuid"],
                aemAssetPath,
                metadata,
                presignedUrl,
                brandId,
                sourceProviderId
              );

              //get the brand 
              const brandManager = new BrandManager(params.LOG_LEVEL);
              const brand = await brandManager.getBrand(brandId);
              if(brand && brand.enabled){
                //send the event to the brand
                const brandSendResponse = await brand.sendIoEventToEndpoint(assetSyncEventNew);
                logger.info(`assetSyncEventNew complete`, brandSendResponse);

                //publish the event to the event manager
                await getEventManager().publishEvent(assetSyncEventNew);
                logger.info(`assetSyncEventNew complete`);
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
    } else {
      logger.info(`${ACTION_NAME}: event not handled`, params);
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
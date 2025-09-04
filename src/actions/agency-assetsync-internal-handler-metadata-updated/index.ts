/**
 * agency-assetsync-internal-handler-metadata-updated
 *
 * This handler specifically processes aem.assets.asset.metadata_updated events.
 * It determines if the asset needs to be synced and sends appropriate events to brands.
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
import { IApplicationRuntimeInfo, IBrandEventPostResponse } from "../types";
import { ApplicationRuntimeInfo } from "../classes/ApplicationRuntimeInfo";


export async function main(params: any): Promise<any> {
  const ACTION_NAME = 'agency:agency-assetsync-internal-handler-metadata-updated';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  logger.debug(`${ACTION_NAME} incoming params`, JSON.stringify(params, null, 2));
  // Normalize the params using shared helper
  params = mergeRouterParams(params);
  logger.debug(`${ACTION_NAME} incoming params post merge`, JSON.stringify(params, null, 2));
  
  // Lazily compute inputs independently so each is only created when needed
  const getS2sAuthenticationCredentials = createLazy(() => EventManager.getS2sAuthenticationCredentials(params));
  const getAssetSyncProviderId = createLazy(() => EventManager.getAssetSyncProviderId(params));
  const getApplicationRuntimeInfo = createLazy(() => ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params));

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
    logger.info(`${ACTION_NAME}:Asset ${params.type} Event Handler called`);

    // Validate that this handler only processes metadata_updated events
    if (params.type !== 'aem.assets.asset.metadata_updated') {
      throw new Error(`This handler only processes aem.assets.asset.metadata_updated events, received: ${params.type}`);
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
    console.log(`${ACTION_NAME}: DEBUG - Checking aemAssetData structure:`, {
      hasJcrContent: !!aemAssetData["jcr:content"],
      hasMetadata: !!(aemAssetData["jcr:content"] && aemAssetData["jcr:content"].metadata)
    });
    
    if (aemAssetData["jcr:content"] && aemAssetData["jcr:content"].metadata) {
      const metadata = aemAssetData["jcr:content"].metadata;
      logger.info(`${ACTION_NAME}: metadata`, metadata);

      console.log(`${ACTION_NAME}: DEBUG - Checking sync conditions:`, {
        hasSyncOnChange: !!metadata["a2b__sync_on_change"],
        syncOnChangeValue: metadata["a2b__sync_on_change"],
        hasCustomers: !!metadata["a2b__customers"],
        customersValue: metadata["a2b__customers"]
      });

      if (metadata["a2b__sync_on_change"] && (metadata["a2b__sync_on_change"] === true || metadata["a2b__sync_on_change"] === "true") && metadata["a2b__customers"]) {
        console.log(`${ACTION_NAME}: DEBUG - Sync conditions met, entering brand processing loop`);
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
        console.log(`${ACTION_NAME}: DEBUG - Starting brand loop with customers:`, customersArray);
        for (const customer of customersArray) {
          // set the brand id
          console.log(`${ACTION_NAME}: DEBUG - Processing brand: ${customer}`);
          logger.info(`brand id ${customer} in customersArray`);
          const brandId = customer;

          // has the asset been synced before?
          console.log(`${ACTION_NAME}: DEBUG - Checking if asset has been synced before:`, !!aemAssetData["jcr:content"].metadata["a2b__last_sync"]);
          if (aemAssetData["jcr:content"].metadata["a2b__last_sync"]) {
            // update event
            console.log(`${ACTION_NAME}: DEBUG - Creating update event for brand: ${brandId}`);
            logger.info(`assetSyncEventUpdate`);
            
            // Get application runtime info
            const appRtInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
            if (!appRtInfo) throw new Error('Missing APPLICATION_RUNTIME_INFO');
            
            // Create update event data
            const updateEventData = {
              app_runtime_info: appRtInfo.serialize(),
              asset_id: aemAssetData["jcr:uuid"],
              asset_path: aemAssetPath,
              metadata: metadata,
              brandId: brandId,
              asset_presigned_url: presignedUrl
            };
            
            const assetSyncEventUpdate = new AssetSyncUpdateEvent(updateEventData);
            
            // Get the brand 
            const brandManager = new BrandManager(params.LOG_LEVEL);
            const brand = await brandManager.getBrand(brandId);
            console.log(`${ACTION_NAME}: DEBUG - Retrieved brand for ${brandId}:`, { brand: !!brand, enabled: brand?.enabled });
            let brandSendResponse: IBrandEventPostResponse;
            if(brand && brand.enabled){
              console.log(`${ACTION_NAME}: DEBUG - Brand ${brandId} is enabled, sending event`);
              try{
                // Send the event to the brand
                console.log(`${ACTION_NAME}: DEBUG - About to call sendCloudEventToEndpoint for brand ${brandId}`);
                console.log(`${ACTION_NAME}: DEBUG - Brand sendCloudEventToEndpoint method:`, typeof brand.sendCloudEventToEndpoint);
                logger.info(`${ACTION_NAME}: sending update event to brand url <${brand.endPointUrl}>`);
                logger.info(`${ACTION_NAME}: sending update event to brand this cloud event <${assetSyncEventUpdate.toCloudEvent()}>`);
                brandSendResponse = await brand.sendCloudEventToEndpoint(assetSyncEventUpdate);
                logger.info(`${ACTION_NAME}: brandSendResponse`, JSON.stringify(brandSendResponse, null, 2));

                // Publish the event to the event manager
                assetSyncEventUpdate.setSource(getAssetSyncProviderId()); // update to IO event provider id
                await getEventManager().publishEvent(assetSyncEventUpdate);
                logger.info(`assetSyncEventUpdate complete`);
              }catch(error: unknown){
                logger.error(`${ACTION_NAME}: error sending update event to brand`, error as string);
                //don't fail the action if the brand endpoint fails
              }
            } else {
              logger.info(`${ACTION_NAME}: brand not found or not enabled for brandId: ${brandId}`);
            }

          } else {
            // new event  
            console.log(`${ACTION_NAME}: DEBUG - Creating new event for brand: ${brandId}`);
            // todo: almost think a factory would be better here to build Events easier
            const appRtInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
            if (!appRtInfo) throw new Error('Missing APPLICATION_RUNTIME_INFO');
            const assetSyncEventNew = new AssetSyncNewEvent(
              appRtInfo,
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
            let brandSendResponse: IBrandEventPostResponse;
            if(brand && brand.enabled){
              try{
                //send the event to the brand
                logger.info(`${ACTION_NAME}: sending event to brand url <${brand.endPointUrl}>`);
                logger.info(`${ACTION_NAME}: sending event to brand this cloud event <${assetSyncEventNew.toCloudEvent()}>`);
                brandSendResponse = await brand.sendCloudEventToEndpoint(assetSyncEventNew);
                logger.info(`${ACTION_NAME}: brandSendResponse`, JSON.stringify(brandSendResponse, null, 2));

                //publish the event to the event manager
                assetSyncEventNew.setSource(getAssetSyncProviderId()); // update to IO event provider id
                await getEventManager().publishEvent(assetSyncEventNew);
                logger.info(`assetSyncEventNew complete`);
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
                  `${ACTION_NAME}: error sending event to brand url <${brand.endPointUrl}>`,
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
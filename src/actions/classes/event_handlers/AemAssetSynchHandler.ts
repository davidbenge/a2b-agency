/**
 * onAemProcComplete
 *
 * Used to filter all events down to just the asset events we want to evaluate.
 * After filtering we set state varibles to capture the AEM asset data.  We then request a presigned url for the target aem asset.
 * The last step is we kick off a asynchronous request to get the target assets psd manifest data
 *
 * we subscribe this action to the Assets processing complete event in Adobe IO developer console.
 *
 */

import * as stateLib from "@adobe/aio-lib-state";
import { IoEventHandler } from '../IoEventHandler';
import { IoCustomEventManager } from "../IoCustomEventManager";
import { AssetSynchDeleteEvent } from "../io_events/AssetSynchDeleteEvent";
import { AssetSynchUpdateEvent } from "../io_events/AssetSynchUpdateEvent";
import { AssetSynchNewEvent } from "../io_events/AssetSynchNewEvent";
import { getAemAssetData } from "../../utils/aemCscUtils";
import { extractAdobeProjectFromEvent } from "../../utils/adobeConsoleUtils";
import { IAdobeProject } from "../../types/index";

export class AssetSynchEventHandler extends IoEventHandler {
  /*******
   * handleEvent - handle the event and see if the asset needs to be processed
   * 
   * @param event: any 
   * @returns Promise<any>
   *******/
  async handleEvent(event: any): Promise<any> {
    this.logger.info("Asset Synch Event Handler called",event);
    
    // Extract Adobe Developer Console data from event if available
    let adobeProject: IAdobeProject | undefined;
    if (event.adobeProject) {
      adobeProject = event.adobeProject;
    }
    
    const ioCustomEventManager = new IoCustomEventManager(event.AIO_AGENCY_EVENTS_AEM_ASSET_SYNCH_PROVIDER_ID,event.LOG_LEVEL, event);
  
    // todo:// look to see if we need to handle the event 
    if(event.type === 'aem.assets.asset.deleted'){
      this.logger.info("Asset deleted event",event);

      // Publish the event to the Adobe Event Hub with Adobe Developer Console context
      await ioCustomEventManager.publishEvent(new AssetSynchDeleteEvent({}, adobeProject));
    }else if(event.type === 'aem.assets.asset.metadata_updated'){
      this.logger.info("Asset metadata updated event",event);

      /*  Import and use the AemCscUtils class
      * @param {string} aemHost aem host
      * @param {string} aemAssetPath aem asset path
      * @param {object} params action input parameters.
      * @param {object} logger logger object
      */
      const aemHost = `https://${event.data.repositoryMetadata["repo:repositoryId"]}`;
      const aemAssetPath = event.data.repositoryMetadata["repo:path"];
      const aemAssetData = await getAemAssetData(aemHost,aemAssetPath,event,this.logger);
      this.logger.info("AssetSynchEventHandler aemAssetData from aemCscUtils getAemAssetData",aemAssetData);

      // has the asset been synched before?
      await ioCustomEventManager.publishEvent(new AssetSynchNewEvent({}, adobeProject));

      // Publish the event to the Adobe Event Hub with Adobe Developer Console context
      await ioCustomEventManager.publishEvent(new AssetSynchUpdateEvent({}, adobeProject));
    }else{
      this.logger.info("Asset event not handled",event);
    }

    return {
      statusCode: 200,
      body: {
        message: 'Asset event processed successfully',
      }
    }
  }
}